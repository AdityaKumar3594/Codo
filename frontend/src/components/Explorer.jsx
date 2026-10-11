import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSelector } from "react-redux";
import { HiArrowPath, HiOutlinePlus } from "react-icons/hi2";
import { PiTreeStructureLight } from "react-icons/pi";
import { getTree, createRootFolder } from "../features/file";
import Folder from "./Folder";
import FileRow from "./File";

// getTree returns: bare array of root nodes, each node has the full model
// fields + children:[]. An empty project returns [].
// getTree returns null on network error.

export default function Explorer({ projectId, onFileClick, activeFileId, onRootRename }) {
    const { currentProject } = useSelector((s) => s.project);

    const [tree, setTree]         = useState([]);
    const [loading, setLoading]   = useState(false);
    const [hasRoot, setHasRoot]   = useState(false);
    const [initBusy, setInitBusy] = useState(false);

    const loadTree = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        const data = await getTree({ projectId });
        // data is null on error, [] on empty, array of nodes when populated
        if (Array.isArray(data) && data.length > 0) {
            setTree(data);
            setHasRoot(true);
        } else {
            setTree([]);
            setHasRoot(false);
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
            animate={{ opacity: 1, x: 0, width: 288 }}
            exit={{ opacity: 0, x: -16, width: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col overflow-hidden border-r border-white/[0.06] bg-[#0f0f12] select-none"
            style={{ minWidth: 288, maxWidth: 288 }}
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
            </div>
        </motion.div>
    );
}
