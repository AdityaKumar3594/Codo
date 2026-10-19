import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiOutlineChevronRight, HiOutlineChevronDown } from "react-icons/hi";
import {
    HiOutlineFolder,
    HiOutlineFolderOpen,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineDocumentPlus,
    HiFolderPlus,
    HiOutlineEllipsisHorizontal,
} from "react-icons/hi2";
import { folderColor } from "../utils/explorerUtils";
import { createFile, createFolder, deleteFile, updateFile } from "../features/file";
import FileRow from "./File";

// ─── InlineInput ──────────────────────────────────────────────────────────────
// Used for both "create" (blank) and "rename" (pre-filled) operations.
function InlineInput({ defaultValue = "", placeholder = "", onConfirm, onCancel }) {
    const ref       = useRef(null);
    const committed = useRef(false); // guard: Enter fires onKeyDown then onBlur — only run once

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
            placeholder={placeholder}
            onClick={(e) => e.stopPropagation()}
            onBlur={commit}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    committed.current = true; // prevent onBlur from committing after cancel
                    onCancel();
                }
            }}
            className="w-full bg-[#1a1a2e] border border-blue-500/60 rounded px-1.5 py-0.5 text-xs text-white outline-none"
        />
    );
}

// ─── ContextMenu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, onNewFile, onNewFolder, onRename, onDelete, onClose }) {
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", down);
        return () => document.removeEventListener("mousedown", down);
    }, [onClose]);

    const Item = ({ icon: Icon, label, onClick, danger = false }) => (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); onClose(); }}
            className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-xs transition-colors
                ${danger
                    ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    : "text-gray-300 hover:bg-white/[0.07] hover:text-white"
                }`}
        >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
        </button>
    );

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1,  y: 0 }}
            exit={{ opacity: 0,  scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            style={{ top: y, left: x, position: "fixed", zIndex: 9999 }}
            className="min-w-[160px] rounded-xl border border-white/[0.08] bg-[#18181f] shadow-2xl py-1 overflow-hidden"
        >
            <Item icon={HiOutlineDocumentPlus} label="New File"   onClick={onNewFile} />
            <Item icon={HiFolderPlus}          label="New Folder" onClick={onNewFolder} />
            <div className="my-1 border-t border-white/[0.06]" />
            <Item icon={HiOutlinePencil} label="Rename" onClick={onRename} />
            <Item icon={HiOutlineTrash}  label="Delete" onClick={onDelete} danger />
        </motion.div>
    );
}

// ─── Folder ───────────────────────────────────────────────────────────────────
// node shape (from buildTree):
//   { _id, name, type:"folder", parentId, projectId, owner,
//     extension, language, content, size, isDeleted, createdAt, updatedAt,
//     children: [ ...same shape... ] }
export default function Folder({ node, depth, projectId, onRefresh, onFileClick, activeFileId, onRootRename }) {
    const [open,     setOpen]     = useState(depth === 0); // root starts expanded
    const [creating, setCreating] = useState(null);        // "file" | "folder" | null
    const [renaming, setRenaming] = useState(false);
    const [menu,     setMenu]     = useState(null);        // { x, y } | null
    const [hovered,  setHovered]  = useState(false);

    const isRoot = depth === 0;
    const indent = depth * 12;
    const color  = folderColor(node.name);

    // ── API actions ───────────────────────────────────────────────────────────
    const handleCreate = async (name, type) => {
        const fn = type === "file" ? createFile : createFolder;
        await fn({ projectId, parentId: node._id, name });
        setCreating(null);
        setOpen(true);
        onRefresh();
    };

    const handleRename = async (newName) => {
        await updateFile({ id: node._id, name: newName });
        setRenaming(false);
        // If this is the root folder, notify parent to sync project name
        if (isRoot) onRootRename?.(newName);
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

    // ── sorted children: folders first, then files, both alpha ───────────────
    const children = [...(node.children ?? [])].sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <>
            {/* ── Row ─────────────────────────────────────────────────── */}
            <div
                onContextMenu={openMenu}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => !renaming && setOpen((o) => !o)}
                style={{ paddingLeft: `${indent + 6}px` }}
                className="group flex items-center gap-1.5 py-[3px] pr-1.5 rounded-md cursor-pointer text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors duration-100"
            >
                {/* chevron */}
                <span className="flex items-center justify-center w-3.5 h-3.5 shrink-0">
                    {open
                        ? <HiOutlineChevronDown  className="w-3 h-3 text-gray-500" />
                        : <HiOutlineChevronRight className="w-3 h-3 text-gray-500" />
                    }
                </span>

                {/* folder icon */}
                {open
                    ? <HiOutlineFolderOpen className={`w-4 h-4 shrink-0 ${color}`} />
                    : <HiOutlineFolder     className={`w-4 h-4 shrink-0 ${color}`} />
                }

                {/* name / rename input */}
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

                {/* ── Action buttons ─────────────────────────────── */}
                {!renaming && (
                    <div
                        className={`flex items-center gap-0.5 ml-auto shrink-0 transition-opacity duration-150 ${
                            hovered ? "opacity-100" : "opacity-0 md:opacity-0 group-hover:opacity-100 max-md:opacity-70"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            title="New File"
                            onClick={() => { setCreating("file"); setOpen(true); }}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                        >
                            <HiOutlineDocumentPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            title="New Folder"
                            onClick={() => { setCreating("folder"); setOpen(true); }}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                        >
                            <HiFolderPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            title="Folder options"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenu({ x: Math.min(rect.left, window.innerWidth - 180), y: rect.bottom + 4 });
                            }}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/[0.1] transition-colors max-md:block md:hidden"
                        >
                            <HiOutlineEllipsisHorizontal className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Inline create input ─────────────────────────────────── */}
            <AnimatePresence>
                {creating && (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.13 }}
                        style={{ paddingLeft: `${indent + 28}px` }}
                        className="pr-2 py-0.5 overflow-hidden"
                    >
                        <InlineInput
                            placeholder={creating === "file" ? "filename.js" : "folder-name"}
                            onConfirm={(name) => handleCreate(name, creating)}
                            onCancel={() => setCreating(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Children ────────────────────────────────────────────── */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="children"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        {children.map((child) =>
                            child.type === "folder" ? (
                                <Folder
                                    key={child._id}
                                    node={child}
                                    depth={depth + 1}
                                    projectId={projectId}
                                    onRefresh={onRefresh}
                                    onFileClick={onFileClick}
                                    activeFileId={activeFileId}
                                />
                            ) : (
                                <FileRow
                                    key={child._id}
                                    node={child}
                                    depth={depth + 1}
                                    onRefresh={onRefresh}
                                    onFileClick={onFileClick}
                                    activeFileId={activeFileId}
                                />
                            )
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Context menu ────────────────────────────────────────── */}
            <AnimatePresence>
                {menu && (
                    <ContextMenu
                        x={menu.x}
                        y={menu.y}
                        onNewFile={() => { setCreating("file");   setOpen(true); }}
                        onNewFolder={() => { setCreating("folder"); setOpen(true); }}
                        onRename={() => setRenaming(true)}
                        onDelete={handleDelete}
                        onClose={() => setMenu(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
