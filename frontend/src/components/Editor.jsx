import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import MonacoEditor from "@monaco-editor/react";
import { HiOutlineXMark, HiOutlineCloudArrowUp, HiOutlineDocument } from "react-icons/hi2";
import { getFileIcon } from "../utils/explorerUtils";
import { getFile, updateFile } from "../features/file";

// ─── map file extension → Monaco language ID ──────────────────────────────────
const EXT_LANG = {
    js: "javascript", mjs: "javascript", cjs: "javascript",
    jsx: "javascript",
    ts: "typescript", tsx: "typescript",
    css: "css", scss: "scss", less: "less",
    html: "html", htm: "html",
    json: "json",
    yaml: "yaml", yml: "yaml",
    md: "markdown", mdx: "markdown",
    py: "python",
    sh: "shell", bash: "shell",
    rb: "ruby",
    php: "php",
    java: "java",
    rs: "rust",
    go: "go",
    cpp: "cpp", c: "c", h: "c", hpp: "cpp",
    sql: "sql",
    xml: "xml", svg: "xml",
    graphql: "graphql", gql: "graphql",
    prisma: "prisma",
    toml: "ini",
    txt: "plaintext",
};

function getLang(name = "") {
    const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    return EXT_LANG[ext] ?? "plaintext";
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
function Tab({ file, active, dirty, onActivate, onClose }) {
    const { icon: Icon, color } = getFileIcon(file.name);
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            onClick={onActivate}
            className={`group flex items-center gap-1.5 h-full px-3 border-r border-white/[0.06] cursor-pointer shrink-0 select-none transition-colors
                ${active
                    ? "bg-[#1e1e2e] text-white border-t-2 border-t-blue-500"
                    : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 border-t-2 border-t-transparent"
                }`}
        >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
            <span className="text-xs font-medium truncate max-w-[120px]">{file.name}</span>

            {/* unsaved dot or close button */}
            <span
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-4 h-4 flex items-center justify-center rounded-sm ml-0.5 hover:bg-white/10 transition-colors"
                title={dirty ? "Unsaved changes" : "Close"}
            >
                {dirty
                    ? <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:hidden" />
                    : null
                }
                <HiOutlineXMark className={`w-3 h-3 ${dirty ? "hidden group-hover:block" : ""}`} />
            </span>
        </motion.div>
    );
}

// ─── Editor ───────────────────────────────────────────────────────────────────
// Props:
//   openTabs      – array of file objects currently open
//   activeTab     – the active file object (or null)
//   setOpenTabs   – setter
//   setActiveTab  – setter
export default function Editor({ openTabs, activeTab, setOpenTabs, setActiveTab, onFileStateChange }) {
    // per-file content cache: { [fileId]: { content, loading, dirty } }
    const [fileState, setFileState] = useState({});
    const [saving, setSaving] = useState(false);

    // Notify parent (ProjectPage) when fileState changes so Preview stays in sync.
    // onFileStateChange is a stable arrow function defined once in ProjectPage.
    useEffect(() => {
        onFileStateChange?.(fileState);
    }, [fileState, onFileStateChange]);

    // ── load file content when active tab changes ──────────────────────────
    useEffect(() => {
        if (!activeTab) return;
        const id = activeTab._id;
        if (fileState[id]) return; // already loaded

        setFileState((prev) => ({ ...prev, [id]: { content: "", loading: true, dirty: false } }));

        getFile({ id }).then((data) => {
            setFileState((prev) => ({
                ...prev,
                [id]: { content: data?.content ?? "", loading: false, dirty: false },
            }));
        });
    }, [activeTab?._id]);

    // ── Ctrl+S / Cmd+S save ───────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!activeTab) return;
        const id = activeTab._id;
        const state = fileState[id];
        if (!state || !state.dirty) return;

        setSaving(true);
        await updateFile({ id, content: state.content });
        setFileState((prev) => ({ ...prev, [id]: { ...prev[id], dirty: false } }));
        setSaving(false);
    }, [activeTab, fileState]);

    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleSave]);

    // ── close a tab ────────────────────────────────────────────────────────
    const closeTab = (fileId) => {
        const idx = openTabs.findIndex((t) => t._id === fileId);
        const next = openTabs.filter((t) => t._id !== fileId);
        setOpenTabs(next);
        if (activeTab?._id === fileId) {
            setActiveTab(next[Math.min(idx, next.length - 1)] ?? null);
        }
        setFileState((prev) => {
            const copy = { ...prev };
            delete copy[fileId];
            return copy;
        });
    };

    // ── content change ─────────────────────────────────────────────────────
    const handleChange = (value) => {
        if (!activeTab) return;
        setFileState((prev) => ({
            ...prev,
            [activeTab._id]: { ...prev[activeTab._id], content: value ?? "", dirty: true },
        }));
    };

    const current = activeTab ? fileState[activeTab._id] : null;

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0a0c]">

            {/* ── Tab bar ─────────────────────────────────────────────── */}
            <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/[0.06] bg-[#111113]/90 scrollbar-none">
                <AnimatePresence initial={false}>
                    {openTabs.map((tab) => (
                        <Tab
                            key={tab._id}
                            file={tab}
                            active={activeTab?._id === tab._id}
                            dirty={!!fileState[tab._id]?.dirty}
                            onActivate={() => setActiveTab(tab)}
                            onClose={() => closeTab(tab._id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Breadcrumb row: active filename + Save button ───────── */}
            {activeTab && (
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] bg-[#0d0d10] shrink-0">
                    {(() => {
                        const { icon: Icon, color } = getFileIcon(activeTab.name);
                        return <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />;
                    })()}
                    <span className="text-xs text-gray-300 font-medium">{activeTab.name}</span>

                    {/* Save button — always visible, disabled when clean */}
                    <button
                        onClick={handleSave}
                        disabled={!fileState[activeTab._id]?.dirty || saving}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-400 disabled:opacity-30 disabled:cursor-default text-white text-[11px] font-semibold transition-colors select-none"
                    >
                        <HiOutlineCloudArrowUp className="w-3.5 h-3.5" />
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            )}

            {/* ── Monaco editor / states ───────────────────────────────── */}
            <div className="flex-1 overflow-hidden relative">
                {!activeTab ? (
                    /* Empty state */
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                            <HiOutlineDocument className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-600">Open a file from the Explorer</p>
                    </div>
                ) : current?.loading ? (
                    /* Loading skeleton */
                    <div className="flex flex-col gap-3 px-8 pt-8">
                        {[60, 80, 45, 70, 55, 65, 40].map((w, i) => (
                            <div
                                key={i}
                                className="h-3 rounded bg-white/[0.04] animate-pulse"
                                style={{ width: `${w}%`, marginLeft: i % 3 !== 0 ? "24px" : 0 }}
                            />
                        ))}
                    </div>
                ) : (
                    <MonacoEditor
                        height="100%"
                        language={getLang(activeTab.name)}
                        value={current?.content ?? ""}
                        theme="vs-dark"
                        onChange={handleChange}
                        options={{
                            automaticLayout: true,
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                            fontLigatures: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            tabSize: 2,
                            renderLineHighlight: "line",
                            smoothScrolling: true,
                            cursorBlinking: "phase",
                            cursorSmoothCaretAnimation: "on",
                            padding: { top: 12, bottom: 12 },
                            lineNumbersMinChars: 3,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
