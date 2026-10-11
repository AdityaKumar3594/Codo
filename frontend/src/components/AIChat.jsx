import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LuX, LuSendHorizontal } from "react-icons/lu";
import { PiSparkle, PiRobotLight } from "react-icons/pi";

// ─── Message bubble ───────────────────────────────────────────────────────────
function Message({ msg }) {
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
            <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words
                    ${isUser
                        ? "bg-blue-600/80 text-white rounded-tr-sm"
                        : "bg-white/[0.06] text-gray-200 rounded-tl-sm border border-white/[0.05]"
                    }`}
            >
                {msg.text}
            </div>
        </motion.div>
    );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function Typing() {
    return (
        <div className="flex gap-2">
            <div className="shrink-0 w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
                <PiRobotLight className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="bg-white/[0.06] border border-white/[0.05] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-500"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── AIChat ───────────────────────────────────────────────────────────────────
// Desktop: wrapped in AnimatePresence + motion.div for slide-in from right.
// Mobile:  rendered directly inside a motion.div managed by ProjectPage.
//
// Props:
//   open       – controls the AnimatePresence (desktop only)
//   onClose    – called when × is clicked
//   activeTab  – current open file node
//   fileState  – { [fileId]: { content } } from Editor
//   fullHeight – when true (mobile), fills parent without fixed width
export default function AIChat({ onClose, activeTab, fileState = {} }) {
    const [messages, setMessages] = useState([]);
    const [input,    setInput]    = useState("");
    const [typing,   setTyping]   = useState(false);
    const [msgCounter, setMsgCounter] = useState(0); // stable key counter
    const bottomRef = useRef(null);
    const inputRef  = useRef(null); // single ref for the textarea

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing]);

    // Focus input on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 150);
    }, []);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || typing) return;

        const userKey = msgCounter;
        setMsgCounter((c) => c + 2);
        setMessages((prev) => [...prev, { id: userKey, role: "user", text }]);
        setInput("");
        // reset textarea height
        if (inputRef.current) inputRef.current.style.height = "auto";
        setTyping(true);

        // Context: pass current file name + first 800 chars of content
        const fileContent = activeTab ? (fileState[activeTab._id]?.content ?? "") : "";
        const ctx = activeTab
            ? `File: ${activeTab.name}\n\n${fileContent.slice(0, 800)}`
            : "";

        // Simulated response — replace with real AI API call
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
        setTyping(false);

        const reply = ctx
            ? `I can see you're working on \`${activeTab.name}\`.\n\nThis is a placeholder — connect a real AI API (OpenAI, Gemini, etc.) to get actual code suggestions and modifications.`
            : "I'm your AI coding assistant. Open a file in the editor and I can help you understand, modify, or generate code.";

        setMessages((prev) => [...prev, { id: userKey + 1, role: "assistant", text: reply }]);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const content = (
        <div className="flex flex-col h-full w-full bg-[#0d0d10] overflow-hidden">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-violet-600/30 border border-violet-500/20 flex items-center justify-center">
                        <PiSparkle className="w-3 h-3 text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-200 select-none">Codo AI Chat</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Close"
                >
                    <LuX className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* ── Messages ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 && !typing ? (
                    /* Empty state */
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
                                <Message key={msg.id} msg={msg} />
                            ))}
                        </AnimatePresence>
                        {typing && <Typing />}
                    </>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ── Input bar ───────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-white/[0.08] bg-[#0a0a0d] px-3 py-2">
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
                        className="flex-1 resize-none bg-transparent text-xs text-gray-200 placeholder-gray-600 outline-none leading-5 scrollbar-none"
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

    // Parent (ProjectPage) owns the motion wrapper, sizing, and animation.
    // AIChat just renders its content filling whatever space it's given.
    return content;
}
