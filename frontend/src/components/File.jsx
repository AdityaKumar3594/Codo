import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiOutlinePencil, HiOutlineTrash, HiOutlineEllipsisHorizontal } from "react-icons/hi2";
import { getFileIcon } from "../utils/explorerUtils";
import { deleteFile, updateFile } from "../features/file";

// ─── InlineInput ──────────────────────────────────────────────────────────────
function InlineInput({ defaultValue = "", onConfirm, onCancel }) {
    const ref       = useRef(null);
    const committed = useRef(false);

    useEffect(() => {
        if (!ref.current) return;
        ref.current.focus();
        const val = ref.current.value;
        const dot = val.lastIndexOf(".");
        ref.current.setSelectionRange(0, dot > 0 ? dot : val.length);
    }, []);

    const commit = () => {
        if (committed.current) return;
        committed.current = true;
        const val = ref.current?.value?.trim();
        val ? onConfirm(val) : onCancel();
    };

    return (
        <input
            ref={ref}
            defaultValue={defaultValue}
            onClick={(e) => e.stopPropagation()}
            onBlur={commit}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    committed.current = true;
                    onCancel();
                }
            }}
            className="w-full bg-[#1a1a2e] border border-blue-500/60 rounded px-1.5 py-0.5 text-xs text-white outline-none"
        />
    );
}

// ─── ContextMenu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, onRename, onDelete, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", down);
        return () => document.removeEventListener("mousedown", down);
    }, [onClose]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1,  y: 0 }}
            exit={{ opacity: 0,  scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            style={{ top: y, left: x, position: "fixed", zIndex: 9999 }}
            className="min-w-[148px] rounded-xl border border-white/[0.08] bg-[#18181f] shadow-2xl py-1 overflow-hidden"
        >
            <button
                onClick={(e) => { e.stopPropagation(); onRename(); onClose(); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.07] hover:text-white transition-colors"
            >
                <HiOutlinePencil className="w-3.5 h-3.5 shrink-0" />
                Rename
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
                <HiOutlineTrash className="w-3.5 h-3.5 shrink-0" />
                Delete
            </button>
        </motion.div>
    );
}

// ─── File row ─────────────────────────────────────────────────────────────────
// node shape: { _id, name, type:"file", extension, language, content, size,
//               parentId, projectId, owner, isDeleted, createdAt, updatedAt }
// children[] is NOT present on file nodes (only folders get it from buildTree)
export default function FileRow({ node, depth, onRefresh, onFileClick, activeFileId }) {
    const [renaming, setRenaming] = useState(false);
    const [menu,     setMenu]     = useState(null); // { x, y } | null

    const isActive = activeFileId === node._id;
    const indent   = depth * 12;

    const handleRename = async (newName) => {
        await updateFile({ id: node._id, name: newName });
        setRenaming(false);
        onRefresh();
    };

    const handleDelete = async () => {
        await deleteFile({ id: node._id });
        onRefresh();
    };

    const openMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenu({ x: e.clientX, y: e.clientY });
    };

    return (
        <>
            <div
                onContextMenu={openMenu}
                onClick={() => !renaming && onFileClick?.(node)}
                style={{ paddingLeft: `${indent + 22}px` }}
                className={`group flex items-center gap-1.5 py-[3px] pr-2 rounded-md cursor-pointer transition-colors duration-100
                    ${isActive
                        ? "bg-white/[0.1] text-white"
                        : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-200"
                    }`}
            >
                {/* spacer aligns with folder chevron width */}
                <span className="w-3.5 shrink-0" />

                {(() => {
                    const { icon: Icon, color } = getFileIcon(node.name);
                    return <Icon className={`w-4 h-4 shrink-0 ${color}`} />;
                })()}

                <div className="flex-1 min-w-0">
                    {renaming ? (
                        <InlineInput
                            defaultValue={node.name}
                            onConfirm={handleRename}
                            onCancel={() => setRenaming(false)}
                        />
                    ) : (
                        <span className="block truncate text-xs font-medium">{node.name}</span>
                    )}
                </div>

                {!renaming && (
                    <div
                        className="flex items-center gap-0.5 ml-auto shrink-0 opacity-0 group-hover:opacity-100 max-md:opacity-70 transition-opacity duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            title="File options"
                            onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenu({ x: Math.min(rect.left, window.innerWidth - 160), y: rect.bottom + 4 });
                            }}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors max-md:block md:hidden"
                        >
                            <HiOutlineEllipsisHorizontal className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {menu && (
                    <ContextMenu
                        x={menu.x}
                        y={menu.y}
                        onRename={() => setRenaming(true)}
                        onDelete={handleDelete}
                        onClose={() => setMenu(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
