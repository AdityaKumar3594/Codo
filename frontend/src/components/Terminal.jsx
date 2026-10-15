import { useEffect, useRef, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { io } from "socket.io-client";
import "@xterm/xterm/css/xterm.css";

const TERMINAL_URL = import.meta.env.VITE_TERMINAL_URL || "http://localhost:8005";

// ─── xterm theme — matches IDE dark palette ───────────────────────────────────
const XTERM_THEME = {
    background:          "#111113",
    foreground:          "#d4d4d4",
    cursor:              "#60a5fa",
    cursorAccent:        "#111113",
    selectionBackground: "rgba(255,255,255,0.15)",
    black:               "#1e1e1e",
    red:                 "#f87171",
    green:               "#4ade80",
    yellow:              "#facc15",
    blue:                "#60a5fa",
    magenta:             "#c084fc",
    cyan:                "#22d3ee",
    white:               "#d4d4d4",
    brightBlack:         "#4b5563",
    brightRed:           "#fca5a5",
    brightGreen:         "#86efac",
    brightYellow:        "#fde68a",
    brightBlue:          "#93c5fd",
    brightMagenta:       "#d8b4fe",
    brightCyan:          "#67e8f9",
    brightWhite:         "#f9fafb",
};

// ─── Terminal ─────────────────────────────────────────────────────────────────
// Props:
//   projectId — string, required. Forwarded to terminal:init so the backend
//               syncs project files into a tmp workspace and cds into it.
//   isOpen    — boolean. Re-fits xterm 220ms after the panel open animation.
export default function Terminal({ projectId, isOpen, onTreeChange }) {
    const userData = useSelector((s) => s.user.userData);

    // "idle" | "connecting" | "ready" | "reconnecting" | "error" | "disconnected"
    const [status, setStatus] = useState("idle");

    const containerRef  = useRef(null);
    const xtermRef      = useRef(null);
    const fitAddonRef   = useRef(null);
    const socketRef     = useRef(null);
    // Guards against calling setState / term.write after the effect has cleaned up
    const mountedRef    = useRef(false);

    // ── safe helpers ─────────────────────────────────────────────────────────
    const safeSetStatus = useCallback((s) => {
        if (mountedRef.current) setStatus(s);
    }, []);

    const safeWrite = useCallback((term, data) => {
        // term.dispose() sets _isDisposed; writing to a disposed terminal throws
        if (mountedRef.current && term && !term._isDisposed) {
            try { term.write(data); } catch { /* ignore */ }
        }
    }, []);

    const safeWriteln = useCallback((term, data) => {
        if (mountedRef.current && term && !term._isDisposed) {
            try { term.writeln(data); } catch { /* ignore */ }
        }
    }, []);

    // ── fit + notify backend of new dimensions ────────────────────────────────
    const fitAndResize = useCallback(() => {
        const fit    = fitAddonRef.current;
        const term   = xtermRef.current;
        const socket = socketRef.current;
        if (!fit || !term || !socket?.connected) return;
        try {
            fit.fit();
            socket.emit("terminal:resize", { cols: term.cols, rows: term.rows });
        } catch {
            // container may have zero dimensions — ignore
        }
    }, []);

    // ── mount once per projectId / userId ─────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || !projectId || !userData?._id) return;

        mountedRef.current = true;
        safeSetStatus("connecting");

        // ── xterm ─────────────────────────────────────────────────────────────
        const term = new XTerm({
            theme:             XTERM_THEME,
            fontFamily:        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize:          12.5,
            lineHeight:        1.45,
            cursorBlink:       true,
            cursorStyle:       "bar",
            scrollback:        5000,
            allowTransparency: false,
            convertEol:        true,
            allowProposedApi:  true, // required for onBinary
        });

        const fitAddon      = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const unicodeAddon  = new Unicode11Addon();

        term.loadAddon(unicodeAddon);
        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.open(containerRef.current);
        term.unicode.activeVersion = "11";

        xtermRef.current    = term;
        fitAddonRef.current = fitAddon;

        try { fitAddon.fit(); } catch { /* ignore zero-dim on first render */ }

        // ── socket.io-client ──────────────────────────────────────────────────
        const socket = io(TERMINAL_URL, {
            transports:           ["websocket"],
            withCredentials:      true,
            reconnectionAttempts: 5,
            reconnectionDelay:    2000,
            reconnectionDelayMax: 8000,
            // Don't auto-connect — we start it manually so we control the lifecycle
            autoConnect:          false,
        });
        socketRef.current = socket;

        // ── socket events ─────────────────────────────────────────────────────

        // Fires on initial connect AND every successful reconnect (socket.io v4)
        socket.on("connect", () => {
            safeSetStatus("connecting");
            safeWriteln(term, "\x1b[90m[connected — syncing project...]\x1b[0m");
            socket.emit("terminal:init", {
                projectId,
                userId: String(userData._id),
                cols:   term.cols,
                rows:   term.rows,
            });
        });

        // PTY shell is live — resize to actual panel dimensions and focus
        socket.on("terminal:ready", () => {
            safeSetStatus("ready");
            try { fitAddon.fit(); } catch { /* ignore */ }
            fitAndResize();
            if (!term._isDisposed) term.focus();
        });

        // Raw PTY output — write directly to xterm
        socket.on("terminal:data", (data) => {
            safeWrite(term, data);
        });

        // Connection attempt failed (network error, service down, etc.)
        socket.on("connect_error", (err) => {
            safeSetStatus("error");
            safeWriteln(term, `\r\n\x1b[31m[connection error: ${err.message}]\x1b[0m`);
        });

        // Socket disconnected — distinguish intentional vs transport drop
        socket.on("disconnect", (reason) => {
            safeSetStatus("idle");
            safeWriteln(term, `\r\n\x1b[90m[disconnected: ${reason}]\x1b[0m`);
        });

        // All reconnection attempts exhausted
        socket.on("reconnect_failed", () => {
            safeSetStatus("error");
            safeWriteln(term, `\r\n\x1b[31m[reconnection failed — terminal service unreachable]\x1b[0m`);
        });

        // terminal:tree_changed → backend detected a filesystem change and synced
        // it back to the file service DB — tell the Explorer to refresh
        socket.on("terminal:tree_changed", () => {
            onTreeChange?.();
        });

        // ── terminal input → socket ───────────────────────────────────────────

        // Text input (normal keystrokes)
        term.onData((data) => {
            if (socket.connected) socket.emit("terminal:write", data);
        });

        // Binary input (function keys, arrow keys in some shells/modes)
        term.onBinary((data) => {
            if (socket.connected) socket.emit("terminal:write", data);
        });

        // ── resize observer ───────────────────────────────────────────────────
        const ro = new ResizeObserver(() => fitAndResize());
        ro.observe(containerRef.current);

        // Now connect (autoConnect: false means we control exactly when this happens)
        socket.connect();

        // ── cleanup on unmount / dep change ───────────────────────────────────
        return () => {
            // Mark as unmounted FIRST so no in-flight callbacks touch React state
            // or write to the disposed terminal after this point
            mountedRef.current = false;

            ro.disconnect();

            // Disconnect socket — this triggers "disconnect" on the server side
            // which kills the PTY session (backend handles this in socket.on("disconnect"))
            socket.disconnect();

            // Dispose xterm — frees DOM listeners, canvas, etc.
            term.dispose();

            xtermRef.current    = null;
            fitAddonRef.current = null;
            socketRef.current   = null;

            setStatus("idle");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, userData?._id]);

    // ── re-fit after panel open animation finishes ────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const id = setTimeout(fitAndResize, 220);
        return () => clearTimeout(id);
    }, [isOpen, fitAndResize]);

    // ── status overlay ────────────────────────────────────────────────────────
    const overlay = (() => {
        if (status === "connecting")
            return { dot: "animate-ping bg-emerald-400", text: "Syncing project...", color: "text-gray-400" };
        if (status === "reconnecting")
            return { dot: "animate-ping bg-yellow-400",  text: "Reconnecting...",   color: "text-yellow-400" };
        if (status === "error")
            return { dot: "bg-red-400",                  text: "Terminal service unreachable", color: "text-red-400" };
        if (status === "disconnected")
            return { dot: "bg-gray-500",                 text: "Session ended",     color: "text-gray-500" };
        return null;
    })();

    return (
        <div className="relative h-full w-full overflow-hidden"
             style={{ background: XTERM_THEME.background }}>

            {/* xterm mount target */}
            <div ref={containerRef} className="h-full w-full" />

            {/* Status overlay — shown for all non-ready, non-idle states */}
            {overlay && (
                <div className="pointer-events-none absolute inset-0 flex items-end justify-start p-2">
                    <div className="flex items-center gap-1.5 rounded-md bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${overlay.dot}`} />
                        <span className={`text-[10px] font-mono ${overlay.color}`}>{overlay.text}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
