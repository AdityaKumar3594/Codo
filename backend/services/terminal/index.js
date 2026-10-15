import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import os from "os";
import path from "path";
import fs from "fs/promises";
import pty from "node-pty";
import chokidar from "chokidar";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8005;

app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Terminal service is running" }));
app.get("/health", (req, res) => res.json({ success: true, service: "terminal" }));

// Debug: inspect what the file service returns for a project
// GET /debug/tree/:projectId?userId=xxx
app.get("/debug/tree/:projectId", async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: "userId query param required" });
        const tree = await getTree(projectId, userId);
        // Show name + type + content length for each node
        const summarize = (nodes) => nodes.map((n) => ({
            name: n.name,
            type: n.type,
            contentLength: n.content?.length ?? null,
            contentType: typeof n.content,
            children: n.children?.length ? summarize(n.children) : undefined,
        }));
        res.json({ count: tree.length, tree: summarize(tree) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const server = http.createServer(app);

const fileServiceUrl = process.env.FILE_SERVICE_URL || "http://localhost:8003";
const WORKSPACE_ROOT = path.join(os.tmpdir(), "CodoAI");
const SHELL = process.platform === "win32" ? "powershell.exe" : "bash";

const io = new Server(server, {
    cors: { origin: true, credentials: true },
});

// ── per-socket session ─────────────────────────────────────────────────────────
// { projectId, userId, cwd, ptyProcess, watcher }
const sessions = new Map();

// ── helpers ───────────────────────────────────────────────────────────────────
const send = (socket, data) => {
    if (socket.connected) socket.emit("terminal:data", String(data || ""));
};

const safeName = (name) => {
    if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\"))
        throw new Error(`Invalid name: ${name}`);
    return name;
};

const workspace = (projectId) => path.join(WORKSPACE_ROOT, String(projectId));

const normalizeCols = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(20, Math.min(Math.floor(n), 500)) : 80;
};
const normalizeRows = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(5, Math.min(Math.floor(n), 500)) : 30;
};

// ── file service API calls ────────────────────────────────────────────────────
const fileHeaders = (userId) => ({
    "Content-Type": "application/json",
    "x-user-id": String(userId),
});

const fileGet = async (url, userId) => {
    const res = await fetch(url, { headers: fileHeaders(userId) });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!res.ok) throw new Error(data?.message || `File service ${res.status}`);
    return data;
};

const filePost = async (url, userId, body) => {
    const res = await fetch(url, {
        method: "POST",
        headers: fileHeaders(userId),
        body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!res.ok) throw new Error(data?.message || `File service ${res.status}`);
    return data;
};

const fileDelete = async (url, userId) => {
    const res = await fetch(url, { method: "DELETE", headers: fileHeaders(userId) });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!res.ok) throw new Error(data?.message || `File service ${res.status}`);
    return data;
};

// ── fetch full flat tree from file service ────────────────────────────────────
const getTree = async (projectId, userId) => {
    const data = await fileGet(`${fileServiceUrl}/tree/${projectId}`, userId);
    return Array.isArray(data) ? data : [];
};

// Directories and files that should never be synced to/from the DB
const IGNORED_DIRS  = new Set([
    "node_modules", ".git", ".svn", "dist", "build",
    ".next", ".nuxt", ".cache", ".vite", "coverage",
    "__pycache__", ".pytest_cache", "venv", ".venv",
]);
const IGNORED_FILES = new Set([
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    ".DS_Store", "Thumbs.db",
]);
const shouldIgnore = (name) =>
    IGNORED_DIRS.has(name) || IGNORED_FILES.has(name) || name.startsWith(".");

// ── write tree nodes to local disk ────────────────────────────────────────────
const writeNodes = async (nodes, directory) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
        // Skip node_modules, .git, lock files etc — never write these from DB to disk
        if (shouldIgnore(node.name)) continue;
        try {
            const targetPath = path.join(directory, safeName(node.name));
            if (node.type === "folder") {
                await fs.mkdir(targetPath, { recursive: true });
                await writeNodes(node.children || [], targetPath);
            } else if (node.type === "file") {
                await fs.mkdir(path.dirname(targetPath), { recursive: true });
                // Coerce content to string — MongoDB may return null, undefined,
                // or (rarely) an object if the AI stored malformed data
                const raw = node.content;
                const content = raw == null
                    ? ""
                    : typeof raw === "string"
                        ? raw
                        : JSON.stringify(raw, null, 2);
                await fs.writeFile(targetPath, content, "utf-8");
            }
        } catch (err) {
            // Log but continue — one bad file should not abort the rest
            console.error(`writeNodes: skipping "${node.name}": ${err.message}`);
        }
    }
};

// ── sync DB → disk ────────────────────────────────────────────────────────────
// Clears the workspace first so stale files from a previous session don't linger,
// then writes the full current DB tree to disk.
const syncProject = async (projectId, userId) => {
    const tree = await getTree(projectId, userId);
    const root = workspace(projectId);

    // Wipe and recreate the workspace so we start clean
    try {
        await fs.rm(root, { recursive: true, force: true });
    } catch { /* ignore — may not exist yet */ }
    await fs.mkdir(root, { recursive: true });

    console.log(`syncProject: writing ${JSON.stringify(tree.map(n => n.name))} to ${root}`);

    if (tree.length === 1 && tree[0]?.type === "folder") {
        await writeNodes(tree[0].children || [], root);
    } else {
        await writeNodes(tree, root);
    }

    // Log what ended up on disk for debugging
    try {
        const written = await fs.readdir(root, { recursive: true });
        console.log(`syncProject: disk contents:`, written);
    } catch { /* ignore */ }

    return { root, tree };
};

// ─────────────────────────────────────────────────────────────────────────────
// Build a flat path→dbNode map from the tree for reverse-lookup
// ─────────────────────────────────────────────────────────────────────────────
const buildPathMap = (nodes, basePath, map = new Map()) => {
    for (const node of nodes) {
        const fullPath = path.join(basePath, node.name);
        map.set(fullPath, node);
        if (node.children?.length) buildPathMap(node.children, fullPath, map);
    }
    return map;
};

// ── get the DB node at a given absolute disk path ─────────────────────────────
// Returns null if not found in current tree snapshot
const getNodeAtPath = (pathMap, absPath) => pathMap.get(absPath) ?? null;

// ── find the DB parent node for a disk path ───────────────────────────────────
const getParentNode = (pathMap, absPath, root) => {
    const parentDisk = path.dirname(absPath);
    if (parentDisk === root) return null; // direct child of workspace root → use root folder id
    return pathMap.get(parentDisk) ?? null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Start a chokidar watcher on the project workspace.
// On any change, sync it back to the file service and emit terminal:tree_changed
// to the frontend so Explorer refreshes.
// ─────────────────────────────────────────────────────────────────────────────
const startWatcher = (socket, projectId, userId, root, initialTree) => {
    // Build initial path→node map from tree snapshot
    // The tree root node represents the root folder in DB
    const rootNode = initialTree.length === 1 && initialTree[0]?.type === "folder"
        ? initialTree[0]
        : null;
    const rootNodeId = rootNode?._id?.toString() ?? null;

    // pathMap maps absolute disk paths → DB file/folder nodes
    let pathMap = buildPathMap(
        rootNode ? (rootNode.children || []) : initialTree,
        root,
    );

    // Debounce tree_changed events so rapid file creation doesn't spam the client
    let notifyTimer = null;
    const notifyChanged = () => {
        if (notifyTimer) clearTimeout(notifyTimer);
        notifyTimer = setTimeout(() => {
            if (socket.connected) socket.emit("terminal:tree_changed");
        }, 400);
    };

    // Rebuild pathMap after every sync so subsequent events use fresh IDs
    const refreshPathMap = async () => {
        try {
            const tree = await getTree(projectId, userId);
            const rn = tree.length === 1 && tree[0]?.type === "folder" ? tree[0] : null;
            pathMap = buildPathMap(rn ? (rn.children || []) : tree, root);
        } catch {
            // non-fatal — pathMap stays stale, next event will retry
        }
    };

    const watcher = chokidar.watch(root, {
        ignored: (filePath) => {
            const rel   = path.relative(root, filePath);
            if (!rel)   return false; // root itself — never ignore
            const parts = rel.split(path.sep);
            return parts.some((p) => shouldIgnore(p));
        },
        persistent:     true,
        ignoreInitial:  true,
        awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
        depth:          10,
    });

    // ── folder created ────────────────────────────────────────────────────────
    watcher.on("addDir", async (absPath) => {
        if (absPath === root) return; // workspace root itself
        try {
            const existing = getNodeAtPath(pathMap, absPath);
            if (existing) return; // already in DB

            const parentNode = getParentNode(pathMap, absPath, root);
            const parentId   = parentNode?._id?.toString() ?? rootNodeId;
            if (!parentId) return;

            const name = path.basename(absPath);
            await filePost(`${fileServiceUrl}/create-folder`, userId, {
                projectId, parentId, name,
            });
            await refreshPathMap();
            notifyChanged();
        } catch (err) {
            console.error("watcher addDir error:", err.message);
        }
    });

    // ── file created ──────────────────────────────────────────────────────────
    watcher.on("add", async (absPath) => {
        try {
            const existing = getNodeAtPath(pathMap, absPath);
            if (existing) return;

            const parentNode = getParentNode(pathMap, absPath, root);
            const parentId   = parentNode?._id?.toString() ?? rootNodeId;
            if (!parentId) return;

            const name    = path.basename(absPath);
            const content = await fs.readFile(absPath, "utf-8").catch(() => "");
            await filePost(`${fileServiceUrl}/create-file`, userId, {
                projectId, parentId, name, content,
            });
            await refreshPathMap();
            notifyChanged();
        } catch (err) {
            console.error("watcher add error:", err.message);
        }
    });

    // ── file changed ──────────────────────────────────────────────────────────
    watcher.on("change", async (absPath) => {
        try {
            const node = getNodeAtPath(pathMap, absPath);
            if (!node?._id) return; // not tracked — ignore

            const content = await fs.readFile(absPath, "utf-8").catch(() => "");
            await filePost(`${fileServiceUrl}/update/${node._id}`, userId, { content });
            notifyChanged();
        } catch (err) {
            console.error("watcher change error:", err.message);
        }
    });

    // ── file deleted ──────────────────────────────────────────────────────────
    watcher.on("unlink", async (absPath) => {
        try {
            const node = getNodeAtPath(pathMap, absPath);
            if (!node?._id) return;

            await fileDelete(`${fileServiceUrl}/${node._id}`, userId);
            await refreshPathMap();
            notifyChanged();
        } catch (err) {
            console.error("watcher unlink error:", err.message);
        }
    });

    // ── folder deleted ────────────────────────────────────────────────────────
    watcher.on("unlinkDir", async (absPath) => {
        if (absPath === root) return;
        try {
            const node = getNodeAtPath(pathMap, absPath);
            if (!node?._id) return;

            await fileDelete(`${fileServiceUrl}/${node._id}`, userId);
            await refreshPathMap();
            notifyChanged();
        } catch (err) {
            console.error("watcher unlinkDir error:", err.message);
        }
    });

    watcher.on("error", (err) => console.error("watcher error:", err.message));

    return watcher;
};

// ─────────────────────────────────────────────────────────────────────────────
// Socket.IO
// ─────────────────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
    console.log("Terminal connected:", socket.id);

    socket.on("terminal:init", async ({ projectId, userId, rows = 30, cols = 80 }) => {
        try {
            projectId = String(projectId);
            userId    = String(userId);

            if (!projectId || !userId)
                throw new Error("projectId and userId are required");

            // Kill + clean up any existing session for this socket
            const existing = sessions.get(socket.id);
            if (existing) {
                try { existing.ptyProcess.kill(); } catch { /* ignore */ }
                try { await existing.watcher?.close(); } catch { /* ignore */ }
                sessions.delete(socket.id);
            }

            cols = normalizeCols(cols);
            rows = normalizeRows(rows);

            const { root, tree } = await syncProject(projectId, userId);

            // Spawn PTY shell
            const ptyProcess = pty.spawn(SHELL, [], {
                name: "xterm-256color",
                cols,
                rows,
                cwd:  root,
                env:  { ...process.env, FORCE_COLOR: "1" },
            });

            ptyProcess.onData((data) => send(socket, data));
            ptyProcess.onExit(({ exitCode }) => {
                send(socket, `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`);
                const s = sessions.get(socket.id);
                if (s?.ptyProcess === ptyProcess) sessions.delete(socket.id);
            });

            // Start filesystem watcher — syncs disk changes → DB → Explorer
            const watcher = startWatcher(socket, projectId, userId, root, tree);

            sessions.set(socket.id, { projectId, userId, cwd: root, ptyProcess, watcher });

            socket.emit("terminal:ready", { cols, rows });
        } catch (err) {
            console.error("terminal:init error:", err);
            send(socket, `\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`);
        }
    });

    socket.on("terminal:write", (data) => {
        const s = sessions.get(socket.id);
        if (s) s.ptyProcess.write(data);
    });

    socket.on("terminal:resize", ({ rows, cols }) => {
        const s = sessions.get(socket.id);
        if (!s) return;
        s.ptyProcess.resize(normalizeCols(cols), normalizeRows(rows));
    });

    socket.on("disconnect", async () => {
        console.log("Terminal disconnected:", socket.id);
        const s = sessions.get(socket.id);
        if (s) {
            try { s.ptyProcess.kill(); } catch { /* ignore */ }
            try { await s.watcher?.close(); } catch { /* ignore */ }
            sessions.delete(socket.id);
        }
    });
});

server.listen(PORT, () => {
    connectDB();
    console.log(`Terminal service running on port ${PORT}`);
});
