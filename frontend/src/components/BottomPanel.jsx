import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LuSquareTerminal, LuX } from "react-icons/lu";
import Terminal from "./Terminal";

// ─── constants ────────────────────────────────────────────────────────────────
const DEFAULT_HEIGHT = 260;
const MIN_HEIGHT     = 120;
const MAX_HEIGHT     = 600;

// ─── BottomPanel ──────────────────────────────────────────────────────────────
// Props:
//   open        – boolean, controlled from ProjectPage
//   onClose     – called when × is clicked
//   projectId   – forwarded to Terminal for shell session init
//   fullHeight  – if true, fills parent container (for mobile terminal tab)
export default function BottomPanel({ open, onClose, projectId, onTreeChange, fullHeight = false }) {
    const [height, setHeight] = useState(DEFAULT_HEIGHT);

    const dragging   = useRef(false);
    const dragStartY = useRef(0);
    const dragStartH = useRef(0);
    const onDragMoveRef = useRef(null);
    const onDragEndRef  = useRef(null);

    // ── drag-to-resize ────────────────────────────────────────────────────────
    const onDragStart = (e) => {
        if (fullHeight) return;
        dragging.current   = true;
        dragStartY.current = e.clientY;
        dragStartH.current = height;

        onDragMoveRef.current = (ev) => {
            if (!dragging.current) return;
            const delta = dragStartY.current - ev.clientY;
            const newH  = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartH.current + delta));
            setHeight(newH);
        };

        onDragEndRef.current = () => {
            dragging.current = false;
            document.removeEventListener("mousemove", onDragMoveRef.current);
            document.removeEventListener("mouseup",   onDragEndRef.current);
        };

        document.addEventListener("mousemove", onDragMoveRef.current);
        document.addEventListener("mouseup",   onDragEndRef.current);
        e.preventDefault();
    };

    // Clean up stray listeners on unmount
    useEffect(() => {
        return () => {
            if (onDragMoveRef.current) document.removeEventListener("mousemove", onDragMoveRef.current);
            if (onDragEndRef.current)  document.removeEventListener("mouseup",   onDragEndRef.current);
        };
    }, []);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="bottom-panel"
                    initial={fullHeight ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={fullHeight ? { opacity: 1 } : { height, opacity: 1 }}
                    exit={fullHeight ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`flex flex-col border-t border-white/[0.06] bg-[#111113] overflow-hidden ${
                        fullHeight ? "flex-1 h-full min-h-0" : "shrink-0"
                    }`}
                >
                    {/* ── Drag handle ───────────────────────────────────── */}
                    {!fullHeight && (
                        <div
                            onMouseDown={onDragStart}
                            className="h-1 w-full cursor-row-resize bg-transparent hover:bg-blue-500/40 transition-colors shrink-0"
                            title="Drag to resize"
                        />
                    )}

                    {/* ── Header ────────────────────────────────────────── */}
                    <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
                        <div className="flex items-center gap-1.5">
                            <LuSquareTerminal size={13} className="text-gray-400" />
                            <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 select-none">
                                Terminal
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            title="Close terminal"
                            className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <LuX size={14} />
                        </button>
                    </div>

                    {/* ── Terminal ──────────────────────────────────────── */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <Terminal projectId={projectId} isOpen={open} onTreeChange={onTreeChange} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
