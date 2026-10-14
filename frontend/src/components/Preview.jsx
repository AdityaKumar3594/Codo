import { useMemo, useRef, useState } from "react";
import { HiOutlineArrowPath, HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";
import { TbWorldWww } from "react-icons/tb";
import { SiVite, SiReact } from "react-icons/si";

// ─── Detect bundler / framework projects that can't run in a plain iframe ─────
// Returns true if the project requires a build step (React, Vite, Vue, etc.)
function requiresBuildStep(nodes = []) {
    const fileNames = [];
    const walk = (items) => {
        for (const node of items) {
            if (node.type === "file") fileNames.push(node.name?.toLowerCase() ?? "");
            if (node.children?.length) walk(node.children);
        }
    };
    walk(nodes);

    // Presence of config files → definitely needs a bundler
    if (
        fileNames.includes("vite.config.js") ||
        fileNames.includes("vite.config.ts") ||
        fileNames.includes("webpack.config.js") ||
        fileNames.includes("next.config.js") ||
        fileNames.includes("nuxt.config.js") ||
        fileNames.includes("svelte.config.js") ||
        fileNames.includes("tsconfig.json")
    ) return true;

    // JSX or TSX files → React, needs a bundler
    if (fileNames.some((n) => n.endsWith(".jsx") || n.endsWith(".tsx") || n.endsWith(".ts")))
        return true;

    return false;
}

// ─── Walk the file tree and collect files by type ─────────────────────────────
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
                else if (ext === "js" || ext === "mjs") js.push(node);
                // .jsx/.tsx are intentionally excluded — they need a bundler
            }
            if (node.children?.length) walk(node.children);
        }
    };

    walk(nodes);
    return { html, css, js };
}

// ─── Strip external resource tags from the HTML entry ────────────────────────
// Removes <script src="..."> and <link rel="stylesheet" href="..."> tags that
// reference external paths (relative or absolute). These files are inlined
// by buildSrcDoc, so the original tags would cause broken 404/CORS loads.
function stripExternalResourceTags(html) {
    // Remove <script src="..."></script> (with or without closing tag on same line)
    let out = html.replace(/<script[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*>\s*<\/script>/gi, "");
    out = out.replace(/<script[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*\/?\s*>/gi, "");
    // Remove <link rel="stylesheet" href="..."> / <link href="..." rel="stylesheet">
    out = out.replace(/<link[^>]*\brel\s*=\s*["']stylesheet["'][^>]*\/?>/gi, "");
    out = out.replace(/<link[^>]*\bhref\s*=\s*["'][^"']*\.css["'][^>]*\/?>/gi, "");
    return out;
}

// ─── Build a single srcdoc string from the collected files ────────────────────
function buildSrcDoc(html, css, js) {
    const entry = html.find((f) => f.name.toLowerCase() === "index.html") ?? html[0];

    if (!entry) {
        if (!css.length && !js.length) return "";
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
${css.map((f) => f.content ?? "").join("\n\n")}
</style>
</head>
<body>
<script>
${js.map((f) => f.content ?? "").join("\n\n")}
</script>
</body>
</html>`;
    }

    // Start from the entry HTML, strip external <script src> and <link> tags
    // since we'll inline all CSS/JS directly
    let doc = stripExternalResourceTags(entry.content ?? "");

    // Inject CSS files into <head>
    if (css.length) {
        const styleBlock = css
            .map((f) => `<style>/* ${f.name} */\n${f.content ?? ""}</style>`)
            .join("\n");
        doc = doc.includes("</head>")
            ? doc.replace("</head>", `${styleBlock}\n</head>`)
            : styleBlock + doc;
    }

    // Inject JS files before </body>
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

// ─── "Can't preview" placeholder ─────────────────────────────────────────────
function NoBuildPreview() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0a0a0c] text-center px-6">
            <div className="flex items-center gap-3 text-gray-600">
                <SiReact className="w-8 h-8" />
                <span className="text-2xl text-gray-700">+</span>
                <SiVite className="w-7 h-7" />
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-300 mb-1">
                    Can't preview this project
                </p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                    This project requires a build step (React, Vite, TypeScript, etc.)
                    and can't be previewed directly in the browser.
                </p>
                <p className="mt-3 text-xs text-gray-600">
                    Run <code className="text-gray-400 bg-white/[0.06] px-1.5 py-0.5 rounded">npm install && npm run dev</code> in a terminal to preview it.
                </p>
            </div>
        </div>
    );
}

// ─── Preview ──────────────────────────────────────────────────────────────────
export default function Preview({ tree = [], fileState = {}, openTabs = [] }) {
    const iframeRef = useRef(null);
    const [key, setKey] = useState(0);

    // Merge saved tree content with unsaved editor content
    const mergedTree = useMemo(() => {
        const mergeNode = (node) => {
            const unsaved = openTabs.find((t) => t._id === node._id);
            const liveContent =
                unsaved && fileState[node._id]
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

    // Detect if this project needs a bundler before computing srcDoc
    const needsBuild = useMemo(() => requiresBuildStep(mergedTree), [mergedTree]);

    const srcDoc = useMemo(() => {
        if (needsBuild) return "";
        const { html, css, js } = collectFiles(mergedTree);
        return buildSrcDoc(html, css, js);
    }, [mergedTree, needsBuild]);

    const handleRefresh = () => setKey((k) => k + 1);

    const handleOpenTab = () => {
        if (!srcDoc) return;
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
                        disabled={needsBuild || !srcDoc}
                        className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-default"
                    >
                        <HiOutlineArrowPath className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleOpenTab}
                        title="Open in new tab"
                        disabled={needsBuild || !srcDoc}
                        className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-default"
                    >
                        <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── Content area ─────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 bg-white">
                {needsBuild ? (
                    <NoBuildPreview />
                ) : !srcDoc ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0a0a0c] text-center">
                        <TbWorldWww className="w-10 h-10 text-gray-600" />
                        <p className="text-xs text-gray-500">
                            No HTML file found in the project.
                            <br />
                            Add an{" "}
                            <span className="text-gray-300 font-medium">index.html</span> to
                            see a preview.
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
