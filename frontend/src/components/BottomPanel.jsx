import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LuSquareTerminal, LuX } from "react-icons/lu";

// ─── constants ────────────────────────────────────────────────────────────────
const DEFAULT_HEIGHT = 220;
const MIN_HEIGHT     = 100;
const MAX_HEIGHT     = 600;

const PROMPT = "$ ";

// ─── BottomPanel ──────────────────────────────────────────────────────────────
// Props:
//   open       – boolean, controlled from ProjectPage (terminal ActivityBar btn)
//   onClose    – called when the × is clicked
//   projectId  – (future use: attach websocket terminal session)
export default function BottomPanel({ open, onClose, projectId }) {
    const [height,  setHeight]  = useState(DEFAULT_HEIGHT);
    const [lines,   setLines]   = useState([
        { type: "info", text: "Welcome to Codo terminal." },
        { type: "info", text: "Type a command and press Enter." },
    ]);
    const [input,   setInput]   = useState("");
    const [history, setHistory] = useState([]); // command history
    const [histIdx, setHistIdx] = useState(-1); // history navigation index

    const inputRef   = useRef(null);
    const bottomRef  = useRef(null);
    const dragging   = useRef(false);
    const dragStartY = useRef(0);
    const dragStartH = useRef(0);

    // Auto-scroll to bottom on new output
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [lines]);

    // Focus input when panel opens
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 120);
    }, [open]);

    // ── drag-to-resize ─────────────────────────────────────────────────────
    // Store handlers in refs so the cleanup useEffect always removes the
    // exact same function references that were added.
    const onDragMoveRef = useRef(null);
    const onDragEndRef  = useRef(null);

    const onDragStart = (e) => {
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

    // Clean up any stray listeners if the component unmounts mid-drag
    useEffect(() => {
        return () => {
            if (onDragMoveRef.current) document.removeEventListener("mousemove", onDragMoveRef.current);
            if (onDragEndRef.current)  document.removeEventListener("mouseup",   onDragEndRef.current);
        };
    }, []);

    // ── fake command runner ────────────────────────────────────────────────
    const runCommand = (cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;

        // echo the input line
        setLines((prev) => [...prev, { type: "input", text: PROMPT + trimmed }]);
        setHistory((prev) => [trimmed, ...prev]);
        setHistIdx(-1);

        // simple built-ins
        const [name, ...args] = trimmed.split(/\s+/);

        switch (name) {
            case "clear":
                setLines([]);
                break;
            case "help":
                setLines((prev) => [
                    ...prev,
                    { type: "output", text: "Available commands: clear, help, echo, date" },
                ]);
                break;
            case "echo":
                setLines((prev) => [
                    ...prev,
                    { type: "output", text: args.join(" ") },
                ]);
                break;
            case "date":
                setLines((prev) => [
                    ...prev,
                    { type: "output", text: new Date().toString() },
                ]);
                break;
            default:
                setLines((prev) => [
                    ...prev,
                    { type: "error", text: `bash: ${name}: command not found` },
                ]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            runCommand(input);
            setInput("");
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHistIdx((i) => {
                const next = Math.min(i + 1, history.length - 1);
                setInput(history[next] ?? "");
                return next;
            });
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setHistIdx((i) => {
                const next = Math.max(i - 1, -1);
                setInput(next === -1 ? "" : history[next] ?? "");
                return next;
            });
        }
    };

    // ── line colours ──────────────────────────────────────────────────────
    const lineColor = (type) => {
        if (type === "input")  return "text-gray-200";
        if (type === "error")  return "text-red-400";
        if (type === "info")   return "text-gray-500";
        return "text-emerald-400"; // output
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="bottom-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex flex-col shrink-0 border-t border-white/[0.06] bg-[#111113] overflow-hidden"
                >
                    {/* ── Drag handle ───────────────────────────────────── */}
                    <div
                        onMouseDown={onDragStart}
                        className="h-1 w-full cursor-row-resize bg-transparent hover:bg-blue-500/40 transition-colors shrink-0"
                        title="Drag to resize"
                    />

                    {/* ── Header ────────────────────────────────────────── */}
                    <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
                        <div className="flex items-center gap-1.5">
                            <LuSquareTerminal
                                size={13}
                                className="relative text-gray-400"
                            />
                            <span className="relative text-[11px] font-semibold tracking-wide uppercase text-gray-400 select-none">
                                Terminal
                            </span>
                        </div>

                        <button
                            onClick={onClose}
                            title="Close panel"
                            className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <LuX size={14} />
                        </button>
                    </div>

                    {/* ── Output area ───────────────────────────────────── */}
                    <div
                        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                        onClick={() => inputRef.current?.focus()}
                    >
                        {lines.map((line, i) => (
                            <div key={i} className={`whitespace-pre-wrap break-all ${lineColor(line.type)}`}>
                                {line.text}
                            </div>
                        ))}

                        {/* ── Input row ─────────────────────────────── */}
                        <div className="flex items-center gap-0">
                            <span className="text-gray-400 select-none">{PROMPT}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                                autoComplete="off"
                                className="flex-1 bg-transparent text-gray-200 outline-none caret-emerald-400 font-mono text-xs"
                            />
                        </div>
                        <div ref={bottomRef} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
