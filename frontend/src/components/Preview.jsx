import { useMemo, useRef, useState } from "react";
import { HiOutlineArrowPath, HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";
import { TbWorldWww } from "react-icons/tb";

// ─── Walk the file tree and collect files by type ─────────────────────────────
// tree is the bare array returned by getTree — each node has
// { _id, name, type, extension, content, children }
function collectFiles(nodes = []) {
    const html = [];
    const css  = [];
    const js   = [];

    const walk = (items) => {
        for (const node of items) {
            if (node.type === "file") {
                const ext = node.extension?.toLowerCase() ?? "";
                if (ext === "html" || ext === "htm") html.push(node);
                else if (ext === "css" || ext === "scss") css.push(node);
                else if (["js", "mjs", "jsx"].includes(ext)) js.push(node);
            }
            if (node.children?.length) walk(node.children);
        }
    };

    walk(nodes);
    return { html, css, js };
}

// ─── Build a single srcdoc string from the collected files ────────────────────
function buildSrcDoc(html, css, js) {
    // Find the entry HTML file — prefer index.html, fallback to first
    const entry = html.find((f) => f.name.toLowerCase() === "index.html") ?? html[0];

    if (!entry) {
        // No HTML file — render JS/CSS in a minimal shell
        if (!css.length && !js.length) return "";
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
${css.map((f) => f.content ?? "").join("\n\n")}
</style>
</head>
<body>
<script type="module">
${js.map((f) => f.content ?? "").join("\n\n")}
</script>
</body>
</html>`;
    }

    let doc = entry.content ?? "";

    // Inject all CSS files into <head> (before </head>)
    if (css.length) {
        const styleBlock = css
            .map((f) => `<style>/* ${f.name} */\n${f.content ?? ""}</style>`)
            .join("\n");
        doc = doc.includes("</head>")
            ? doc.replace("</head>", `${styleBlock}\n</head>`)
            : styleBlock + doc;
    }

    // Inject all JS files before </body>
    if (js.length) {
        const scriptBlock = js
            .map((f) => `<script>/* ${f.name} */\n${f.content ?? ""}</script>`)
            .join("\n");
        doc = doc.includes("</body>")
            ? doc.replace("</body>", `${scriptBlock}\n</body>`)
            : doc + scriptBlock;
    }

    return doc;
}

// ─── Preview ──────────────────────────────────────────────────────────────────
// Props:
//   tree – bare array from getTree (nodes with children[])
//           If not provided, uses fileState from Editor (openTabs content)
//   fileState – { [fileId]: { content } } from Editor (unsaved edits)
//   openTabs  – array of open file objects
export default function Preview({ tree = [], fileState = {}, openTabs = [] }) {
    const iframeRef  = useRef(null);
    const [key, setKey] = useState(0); // increment to force iframe reload

    // Merge saved tree content with unsaved editor content
    // Unsaved edits take priority over what's in the tree
    const mergedTree = useMemo(() => {
        const mergeNode = (node) => {
            const unsaved = openTabs.find((t) => t._id === node._id);
            const liveContent = unsaved && fileState[node._id]
                ? fileState[node._id].content
                : node.content;
            return {
                ...node,
                content: liveContent,
                children: (node.children ?? []).map(mergeNode),
            };
        };
        return tree.map(mergeNode);
    }, [tree, fileState, openTabs]);

    const srcDoc = useMemo(() => {
        const { html, css, js } = collectFiles(mergedTree);
        return buildSrcDoc(html, css, js);
    }, [mergedTree]);

    const handleRefresh = () => setKey((k) => k + 1);

    const handleOpenTab = () => {
        const blob = new Blob([srcDoc], { type: "text/html" });
        const url  = URL.createObjectURL(blob);
        window.open(url, "_blank");
    };

    return (
        <div className="flex h-full w-full flex-col bg-white dark:bg-[#0a0a0c]">

            {/* ── Header bar ───────────────────────────────────────────── */}
            <div className="flex h-9 shrink-0 items-center justify-between bg-[#111113] border-b border-white/[0.06] px-3">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-zinc-300 font-medium">Preview</span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        title="Refresh preview"
                        className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
                    >
                        <HiOutlineArrowPath className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleOpenTab}
                        title="Open in new tab"
                        className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
                    >
                        <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── iframe ───────────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 bg-white">
                {!srcDoc ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0a0a0c] text-center">
                        <TbWorldWww className="w-10 h-10 text-gray-600" />
                        <p className="text-xs text-gray-500">
                            No HTML file found in the project.
                            <br />
                            Add an <span className="text-gray-300 font-medium">index.html</span> to see a preview.
                        </p>
                    </div>
                ) : (
                    <iframe
                        key={key}
                        ref={iframeRef}
                        title="Project Preview"
                        srcDoc={srcDoc}
                        sandbox="allow-scripts allow-forms allow-modals allow-popups"
                        className="h-full w-full border-0"
                    />
                )}
            </div>
        </div>
    );
}
