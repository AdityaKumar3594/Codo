import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { LuX, LuSendHorizontal } from "react-icons/lu";
import { PiSparkle, PiRobotLight } from "react-icons/pi";
import { HiBolt } from "react-icons/hi2";
import {
    LuFilePlus2,
    LuFilePen,
    LuFileX2,
    LuFolderPlus,
    LuFolderTree,
    LuFile,
    LuWrench,
} from "react-icons/lu";
import { isFileOp, streamChat } from "../features/ai";
import { updateUserCredits } from "../redux/userSlice";

// ─── Tool badge metadata ───────────────────────────────────────────────────────
const TOOL_META = {
    file_created:   { icon: LuFilePlus2,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Created" },
    file_updated:   { icon: LuFilePen,    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     label: "Updated" },
    file_deleted:   { icon: LuFileX2,     color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         label: "Deleted" },
    folder_created: { icon: LuFolderPlus, color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20",         label: "Folder"  },
    tree_fetched:   { icon: LuFolderTree, color: "text-gray-400",    bg: "bg-white/[0.04] border-white/[0.08]",     label: "Read tree" },
    file_fetched:   { icon: LuFile,       color: "text-gray-400",    bg: "bg-white/[0.04] border-white/[0.08]",     label: "Read file" },
};

function ToolBadge({ op, onFileClick }) {
    const meta = TOOL_META[op.type] ?? {
        icon: LuWrench,
        color: "text-gray-400",
        bg: "bg-white/[0.04] border-white/[0.08]",
        label: op.type,
    };
    const Icon = meta.icon;
    const name = op.name || meta.label;
    const clickable = !!op.file && !!onFileClick;

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            onClick={clickable ? () => onFileClick(op.file) : undefined}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium ${meta.color} ${meta.bg}
                ${clickable ? "cursor-pointer hover:brightness-125 active:scale-95 transition-all" : "cursor-default"}`}
            title={clickable ? `Open ${name}` : op.type}
        >
            <Icon className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate max-w-[120px]">{name}</span>
        </motion.span>
    );
}

// ─── Message ──────────────────────────────────────────────────────────────────
function Message({ msg, onFileClick, onUpgradeClick }) {
    const isUser = msg.role === "user";
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
            {!isUser && (
                <div className="shrink-0 w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center mt-0.5">
                    <PiRobotLight className="w-3.5 h-3.5 text-violet-400" />
                </div>
            )}
            <div className={`max-w-[82%] flex flex-col gap-1.5`}>
                <div
                    className={`rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words
                        ${isUser
                            ? "bg-blue-600/80 text-white rounded-tr-sm"
                            : msg.isCreditError
                            ? "bg-rose-500/15 text-rose-200 rounded-tl-sm border border-rose-500/30"
                            : "bg-white/[0.06] text-gray-200 rounded-tl-sm border border-white/[0.05]"
                        }`}
                >
                    {msg.text}
                    {msg.isCreditError && (
                        <button
                            onClick={onUpgradeClick}
                            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-[11px] shadow-sm transition-all cursor-pointer"
                        >
                            <HiBolt className="w-3 h-3 text-amber-300" />
                            <span>Upgrade Plan</span>
                        </button>
                    )}
                </div>

                {/* Tool operation badges */}
                {!isUser && msg.ops?.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-0.5">
                        {msg.ops.map((op, i) => (
                            <ToolBadge key={i} op={op} onFileClick={onFileClick} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function Typing({ label, toolName }) {
    return (
        <div className="flex gap-2">
            <div className="shrink-0 w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
                <PiRobotLight className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="bg-white/[0.06] border border-white/[0.05] rounded-2xl rounded-tl-sm px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gray-500"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                        />
                    ))}
                </div>
                {toolName ? (
                    <ToolBadge op={{ type: toolName, name: toolName.replaceAll("_", " ") }} />
                ) : label ? (
                    <span className="text-[10px] text-gray-500">{label}</span>
                ) : null}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIChat({
    projectId,
    onClose,
    activeTab,
    fileState = {},
    onFileOp,
    onFileClick,
}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.user);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [status, setStatus] = useState("");
    const [activeTool, setActiveTool] = useState(""); // tool currently running
    const [msgCounter, setMsgCounter] = useState(0);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing, status]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 150);
        return () => abortRef.current?.abort();
    }, []);

    // Helper: append an op badge to a specific assistant message
    const appendOp = (msgId, op) => {
        setMessages((prev) =>
            prev.map((m) =>
                m.id === msgId
                    ? { ...m, ops: [...(m.ops ?? []), op] }
                    : m
            )
        );
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || typing) return;
        if (!projectId) {
            setMessages((prev) => [
                ...prev,
                { id: Date.now(), role: "assistant", text: "Missing projectId — cannot talk to AI.", ops: [] },
            ]);
            return;
        }

        const userKey = msgCounter;
        const assistantKey = userKey + 1;
        setMsgCounter((c) => c + 2);

        const history = messages.map((msg) => ({
            role: msg.role,
            content: msg.text,
        }));

        setMessages((prev) => [...prev, { id: userKey, role: "user", text }]);
        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        setTyping(true);
        setStatus("Thinking...");
        setActiveTool("");

        const fileContent = activeTab ? (fileState[activeTab._id]?.content ?? "") : "";
        const prompt = activeTab
            ? `${text}\n\nCurrent file: ${activeTab.name}\n\n${fileContent.slice(0, 800)}`
            : text;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        let assistantText = "";
        let sawFileOp = false;

        try {
            await streamChat({
                projectId,
                message: prompt,
                history,
                signal: controller.signal,
                onEvent: (eventType, data) => {
                    if (eventType === "start") {
                        if (data?.credits !== undefined) {
                            dispatch(updateUserCredits(data.credits));
                        }
                        setStatus("Thinking...");
                        return;
                    }

                    if (eventType === "tool_start") {
                        const name = data?.tool_name || "tool";
                        setActiveTool(name);
                        setStatus(`Running ${name}...`);
                        return;
                    }

                    if (eventType === "message") {
                        assistantText = data?.content || assistantText;
                        setActiveTool("");
                        setStatus("");
                        setMessages((prev) => {
                            const existing = prev.find((m) => m.id === assistantKey);
                            const withoutDraft = prev.filter((m) => m.id !== assistantKey);
                            return [
                                ...withoutDraft,
                                {
                                    id: assistantKey,
                                    role: "assistant",
                                    text: assistantText,
                                    ops: existing?.ops ?? [],
                                },
                            ];
                        });
                        return;
                    }

                    if (isFileOp(eventType)) {
                        sawFileOp = true;
                        setActiveTool("");
                        setStatus("");

                        // File object — only present for file ops (not folder/tree)
                        const fileObj = data?.file ?? null;
                        const fileName =
                            fileObj?.name ||
                            data?.folder?.name ||
                            (eventType === "tree_fetched" ? "project tree" : null);

                        // Upsert the assistant message and append the op badge
                        setMessages((prev) => {
                            const existing = prev.find((m) => m.id === assistantKey);
                            const withoutDraft = prev.filter((m) => m.id !== assistantKey);
                            // Attach file only for actual file ops so badge becomes clickable
                            const newOp = {
                                type: eventType,
                                name: fileName,
                                file: fileObj?.type === "file" ? fileObj : null,
                            };
                            return [
                                ...withoutDraft,
                                {
                                    id: assistantKey,
                                    role: "assistant",
                                    text: existing?.text ?? "",
                                    ops: [...(existing?.ops ?? []), newOp],
                                },
                            ];
                        });

                        onFileOp?.(eventType, data);
                        return;
                    }

                    if (eventType === "error") {
                        assistantText = data?.message || "AI request failed";
                        setMessages((prev) => {
                            const existing = prev.find((m) => m.id === assistantKey);
                            const withoutDraft = prev.filter((m) => m.id !== assistantKey);
                            return [
                                ...withoutDraft,
                                {
                                    id: assistantKey,
                                    role: "assistant",
                                    text: assistantText,
                                    ops: existing?.ops ?? [],
                                },
                            ];
                        });
                        return;
                    }

                    if (eventType === "done") {
                        if (data?.credits !== undefined) {
                            dispatch(updateUserCredits(data.credits));
                        }
                        return;
                    }
                },
            });

            if (!assistantText) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === assistantKey && m.text)) return prev;
                    return prev.map((m) =>
                        m.id === assistantKey
                            ? { ...m, text: sawFileOp ? "Done." : "Done." }
                            : m
                    ).concat(
                        prev.some((m) => m.id === assistantKey)
                            ? []
                            : [{ id: assistantKey, role: "assistant", text: sawFileOp ? "Done." : "Done.", ops: [] }]
                    );
                });
            }
        } catch (err) {
            if (err && err.name === "AbortError") return;
            const failText = (err && err.message) || "AI request failed";
            const isCredit = failText.toLowerCase().includes("credit");
            setMessages((prev) => {
                const withoutDraft = prev.filter((m) => m.id !== assistantKey);
                return [
                    ...withoutDraft,
                    {
                        id: assistantKey,
                        role: "assistant",
                        text: isCredit
                            ? "You have insufficient AI credits. Please upgrade your plan to continue building with AI."
                            : failText,
                        isCreditError: isCredit,
                        ops: [],
                    },
                ];
            });
        } finally {
            setTyping(false);
            setStatus("");
            setActiveTool("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0d0d10] overflow-hidden">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-violet-600/30 border border-violet-500/20 flex items-center justify-center">
                        <PiSparkle className="w-3 h-3 text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-200 select-none">Codo AI Chat</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/plans")}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-[11px] font-semibold text-violet-300 transition-colors cursor-pointer"
                        title="AI Credits — Click to view plans"
                    >
                        <HiBolt className="w-3 h-3 text-amber-400" />
                        <span>{userData?.credits ?? 0}</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Close"
                    >
                        <LuX className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── Messages ───────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 && !typing ? (
                    <div className="flex flex-1 h-full flex-col items-center justify-center gap-4 text-center select-none">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                            <PiSparkle className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-200 mb-1.5">
                                What do you want to build?
                            </p>
                            <p className="text-xs text-gray-500">
                                Ask me to create or modify files.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <Message
                                    key={msg.id}
                                    msg={msg}
                                    onFileClick={onFileClick}
                                    onUpgradeClick={() => navigate("/plans")}
                                />
                            ))}
                        </AnimatePresence>
                        {typing && <Typing label={status} toolName={activeTool} />}
                    </>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Input ──────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-white/[0.08] bg-[#0a0a0d] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask AI to build something..."
                        className="flex-1 resize-none bg-transparent text-base sm:text-xs text-gray-200 placeholder-gray-600 outline-none leading-5 scrollbar-none"
                        style={{ minHeight: "20px", maxHeight: "96px" }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || typing}
                        className="shrink-0 w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-400 disabled:opacity-30 disabled:cursor-default flex items-center justify-center transition-colors"
                        title="Send"
                    >
                        <LuSendHorizontal className="w-3.5 h-3.5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
