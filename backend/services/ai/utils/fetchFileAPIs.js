import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ─── axios instance pointed at the file service ───────────────────────────────
const fileAPI = axios.create({
    baseURL: process.env.FILE_SERVICE_URL || "http://localhost:8003",
    headers: { "Content-Type": "application/json" },
});

// Attach x-user-id to every request — per-call so concurrent requests are safe
const withUser = (userId) => ({ headers: { "x-user-id": String(userId) } });

// Normalise axios error into a plain message
const errMsg = (error) =>
    error?.response?.data?.message || error?.response?.data?.detail || error.message;

// ─── File service API wrappers ────────────────────────────────────────────────

/**
 * GET /tree/:projectId
 * Returns the full nested file tree for a project.
 * Each node: { _id, name, type, extension, content, size, children[] }
 */
export const getTree = async ({ projectId, userId }) => {
    try {
        const { data } = await fileAPI.get(`/tree/${projectId}`, withUser(userId));
        return data;
    } catch (error) {
        console.error("getTree error:", errMsg(error));
        return null;
    }
};

/**
 * GET /:id
 * Returns a single file document including its full content.
 */
export const getFile = async ({ fileId, userId }) => {
    try {
        const { data } = await fileAPI.get(`/${fileId}`, withUser(userId));
        return data;
    } catch (error) {
        console.error("getFile error:", errMsg(error));
        return null;
    }
};

/**
 * POST /create-root-folder
 * Initialises a workspace by creating the top-level root folder.
 */
export const createRootFolder = async ({ projectId, projectName, userId }) => {
    try {
        const { data } = await fileAPI.post(
            "/create-root-folder",
            { projectId, projectName },
            withUser(userId)
        );
        return data;
    } catch (error) {
        console.error("createRootFolder error:", errMsg(error));
        return null;
    }
};

/**
 * POST /create-folder
 * Creates a sub-folder inside an existing parent folder.
 */
export const createFolder = async ({ projectId, parentId, name, userId }) => {
    try {
        const { data } = await fileAPI.post(
            "/create-folder",
            { projectId, parentId, name },
            withUser(userId)
        );
        return data;
    } catch (error) {
        console.error("createFolder error:", errMsg(error));
        return null;
    }
};

/**
 * POST /create-file
 * Creates a file with optional initial content.
 */
export const createFile = async ({
    projectId,
    userId,
    name,
    parentId,
    content = "",
    language = "plaintext",
}) => {
    try {
        const { data } = await fileAPI.post(
            "/create-file",
            { projectId, parentId, name, content, language },
            withUser(userId)
        );
        return data;
    } catch (error) {
        console.error("createFile error:", errMsg(error));
        return null;
    }
};

/**
 * POST /update/:id
 * Updates a file's name and/or content. Pass only the fields to change.
 */
export const updateFile = async ({ fileId, userId, name, content } = {}) => {
    try {
        const { data } = await fileAPI.post(
            `/update/${fileId}`,
            { name, content },
            withUser(userId)
        );
        return data;
    } catch (error) {
        console.error("updateFile error:", errMsg(error));
        return null;
    }
};

/**
 * DELETE /:id
 * Soft-deletes a file or folder (cascades to all children).
 */
export const deleteFile = async ({ fileId, userId }) => {
    try {
        const { data } = await fileAPI.delete(`/${fileId}`, withUser(userId));
        return data;
    } catch (error) {
        console.error("deleteFile error:", errMsg(error));
        return null;
    }
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

/**
 * Recursively collect all file nodes (type === "file") from a tree.
 * Useful for building the full project context sent to the AI model.
 */
export const flattenFiles = (tree = []) => {
    const result = [];
    const walk = (nodes) => {
        for (const node of nodes) {
            if (node.type === "file") result.push(node);
            if (node.children?.length) walk(node.children);
        }
    };
    walk(tree);
    return result;
};

/**
 * Convert a tree into a compact string for AI prompt context.
 *
 * Example:
 *   my-project/
 *     src/
 *       index.js  (javascript, 142 bytes)
 *     index.html  (html, 320 bytes)
 */
export const treeToText = (tree = [], indent = 0) => {
    let out = "";
    const pad = "  ".repeat(indent);
    for (const node of tree) {
        if (node.type === "folder") {
            out += `${pad}${node.name}/\n`;
            if (node.children?.length) out += treeToText(node.children, indent + 1);
        } else {
            const size = node.size ?? (node.content?.length ?? 0);
            const lang = node.language ?? node.extension ?? "text";
            out += `${pad}${node.name}  (${lang}, ${size} bytes)\n`;
        }
    }
    return out;
};
