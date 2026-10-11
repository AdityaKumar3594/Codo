import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSelector } from "react-redux";
import { HiArrowPath, HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import { PiTreeStructureLight } from "react-icons/pi";
import { getTree, createRootFolder } from "../features/file";
import { getFileIcon } from "../utils/explorerUtils";
import Folder from "./Folder";
import FileRow from "./File";

// getTree returns: bare array of root nodes, each node has the full model
// fields + children:[]. An empty project returns [].
// getTree returns null on network error.

// ─── Open Files section ───────────────────────────────────────────────────────
function OpenFiles({ openTabs, activeTab, onActivate, onClose }) {
    if (!openTabs.length) return null;
    return (
        <div className="shrink-0 border-b border-white/[0.05]">
            <div className="px-3 py-1.5">
                <span className="text-[9px] font-semibold tracking-widest uppercase text-gray-600">
                    Open Files
                </span>
            </div>
            <div className="pb-1">
                {openTabs.map((file) => {
                    const active = activeTab?._id === file._id;
                    const { icon: Icon, color } = getFileIcon(file.name);
                    return (
                        <div
                            key={file._id}
                            onClick={() => onActivate(file)}
                            className={`group flex items-center gap-1.5 px-3 py-[3px] cursor-pointer transition-colors duration-100
                                ${active
                                    ? "bg-white/[0.08] text-white"
                                    : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
                                }`}
                        >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                            <span className="flex-1 truncate text-xs font-medium">{file.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(file._id); }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all"
                                title="Close"
                            >
                                <HiOutlineXMark className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Explorer({ projectId, onFileClick, activeFileId, onRootRename, fullWidth = false, openTabs = [], activeTab = null, onTabActivate, onTabClose, onTreeChange }) {
    const { currentProject } = useSelector((s) => s.project);

    const [tree, setTree]         = useState([]);
    const [loading, setLoading]   = useState(false);
    const [hasRoot, setHasRoot]   = useState(false);
    const [initBusy, setInitBusy] = useState(false);

    const loadTree = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        const data = await getTree({ projectId });
        if (data === null) {
            // Network error — keep existing tree visible, don't show "Empty Workspace"
            setLoading(false);
            return;
        }
        if (Array.isArray(data) && data.length > 0) {
            setTree(data);
            setHasRoot(true);
            onTreeChange?.(data);
        } else if (Array.isArray(data)) {
            setTree([]);
            setHasRoot(false);
            onTreeChange?.([]);
        }
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        loadTree();
    }, [loadTree]);

    const handleInitWorkspace = async () => {
        if (!projectId || !currentProject?.name) return;
        setInitBusy(true);
        const result = await createRootFolder({ projectId, projectName: currentProject.name });
        if (result) await loadTree();
        setInitBusy(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -16, width: 0 }}
            animate={{ opacity: 1, x: 0, width: fullWidth ? "100%" : 288 }}
            exit={{ opacity: 0, x: -16, width: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col overflow-hidden border-r border-white/[0.06] bg-[#0f0f12] select-none"
            style={fullWidth ? { width: "100%", minWidth: 0, maxWidth: "100%" } : { minWidth: 288, maxWidth: 288 }}
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-2 shrink-0 border-b border-white/[0.05]">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">
                    Explorer
                </span>
                <button
                    onClick={loadTree}
                    title="Refresh"
                    disabled={loading}
                    className="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                >
                    <HiArrowPath className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 overflow-hidden">

                {/* Open Files */}
                <OpenFiles
                    openTabs={openTabs}
                    activeTab={activeTab}
                    onActivate={onTabActivate}
                    onClose={onTabClose}
                />

                {/* Scrollable tree area */}
                <div className="flex-1 overflow-y-auto py-1 px-1">

                {/* Loading skeleton — only shown on first load */}
                {loading && tree.length === 0 && (
                    <div className="flex flex-col gap-2 px-3 pt-3">
                        {[75, 55, 65, 45, 70].map((w, i) => (
                            <div
                                key={i}
                                className="h-2.5 rounded-full bg-white/[0.06] animate-pulse"
                                style={{ width: `${w}%`, marginLeft: i > 0 ? "14px" : 0 }}
                            />
                        ))}
                    </div>
                )}

                {/* Empty / no-root state */}
                {!loading && !hasRoot && (
                    <div className="flex flex-col items-center justify-center gap-3 px-4 pt-16 text-center">
                        <PiTreeStructureLight className="w-9 h-9 text-gray-600" />
                        <p className="text-xs text-gray-500">Empty WorkSpace</p>
                        <button
                            onClick={handleInitWorkspace}
                            disabled={initBusy}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                        >
                            <HiOutlinePlus className="w-3.5 h-3.5" />
                            {initBusy ? "Initializing…" : "Initialize Workspace"}
                        </button>
                    </div>
                )}

                {/* Tree — only when loaded and has root */}
                {!loading && hasRoot && (
                    <AnimatePresence initial={false}>
                        {tree.map((node) =>
                            node.type === "folder" ? (
                                <Folder
                                    key={node._id}
                                    node={node}
                                    depth={0}
                                    projectId={projectId}
                                    onRefresh={loadTree}
                                    onFileClick={onFileClick}
                                    activeFileId={activeFileId}
                                    onRootRename={onRootRename}
                                />
                            ) : (
                                <FileRow
                                    key={node._id}
                                    node={node}
                                    depth={0}
                                    onRefresh={loadTree}
                                    onFileClick={onFileClick}
                                    activeFileId={activeFileId}
                                />
                            )
                        )}
                    </AnimatePresence>
                )}
                </div> {/* end scrollable tree area */}
            </div>   {/* end body */}
        </motion.div>
    );
}
