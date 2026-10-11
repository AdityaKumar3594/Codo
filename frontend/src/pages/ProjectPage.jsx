import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion } from "motion/react";
import { setCurrentProject, patchCurrentProject } from "../redux/projectSlice";
import { getProjectById, updateProject } from "../features/project";
import TopBar from "../components/TopBar.jsx";
import ActivityBar from "../components/ActivityBar.jsx";
import Explorer from "../components/Explorer.jsx";
import Editor from "../components/Editor.jsx";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { PiRobotLight } from "react-icons/pi";
import { LuSquareTerminal, LuCode } from "react-icons/lu";

// ─── activity items ────────────────────────────────────────────────────────────
const ACTIVITY_ITEMS = [
    { id: "explorer", icon: HiOutlineDocumentDuplicate, label: "Explorer" },
    { id: "ai",       icon: PiRobotLight,               label: "AI Chat" },
    { id: "terminal", icon: LuSquareTerminal,           label: "Terminal" },
];

const MOBILE_TABS = [
    { id: "explorer", icon: HiOutlineDocumentDuplicate, label: "Files" },
    { id: "editor",   icon: LuCode,                    label: "Editor" },
    { id: "ai",       icon: PiRobotLight,               label: "AI" },
    { id: "terminal", icon: LuSquareTerminal,           label: "Terminal" },
];

// ─── placeholders ──────────────────────────────────────────────────────────────
function AiPlaceholder() {
    return (
        <div className="flex flex-col flex-1 items-center justify-center text-gray-500 text-xs gap-2 bg-[#0a0a0c]">
            <PiRobotLight className="w-8 h-8 text-gray-600" />
            AI Chat coming soon
        </div>
    );
}
function TerminalPlaceholder() {
    return (
        <div className="flex flex-col flex-1 items-center justify-center text-gray-500 text-xs gap-2 bg-[#0a0a0c]">
            <LuSquareTerminal className="w-8 h-8 text-gray-600" />
            Terminal coming soon
        </div>
    );
}

// ─── mobile bottom tab bar ─────────────────────────────────────────────────────
function MobileTabBar({ activePane, onSelect }) {
    return (
        <nav className="relative flex shrink-0 border-t border-white/[0.06] bg-[#0d0d14]">
            {MOBILE_TABS.map(({ id, icon: Icon, label }) => {
                const active = activePane === id;
                return (
                    <button
                        key={id}
                        onClick={() => onSelect(id)}
                        className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors
                            ${active ? "text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        <Icon className="w-5 h-5" />
                        {label}
                        {active && (
                            <motion.div
                                layoutId="mobile-active-bar"
                                className="absolute top-0 w-8 h-0.5 rounded-full bg-blue-400"
                            />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}

// ─── page ──────────────────────────────────────────────────────────────────────
export default function ProjectPage() {
    const { id } = useParams();
    const dispatch = useDispatch();

    // layout
    const [view,        setView]        = useState("code");
    const [activePanel, setActivePanel] = useState("explorer");
    const [mobilePane,  setMobilePane]  = useState("explorer");

    // ── tab / open-files state (shared between Explorer + Editor) ─────────────
    const [openTabs,   setOpenTabs]   = useState([]);  // array of file nodes
    const [activeTab,  setActiveTab]  = useState(null); // currently visible file

    // ── open a file (adds tab if not already open, makes it active) ───────────
    const handleFileClick = useCallback((file) => {
        setOpenTabs((prev) => {
            const already = prev.find((t) => t._id === file._id);
            return already ? prev : [...prev, file];
        });
        setActiveTab(file);
        setMobilePane("editor"); // auto-switch on mobile
    }, []);

    // ── close a tab ───────────────────────────────────────────────────────────
    const handleTabClose = useCallback((fileId) => {
        setOpenTabs((prev) => {
            const idx  = prev.findIndex((t) => t._id === fileId);
            const next = prev.filter((t) => t._id !== fileId);
            setActiveTab((cur) => {
                if (cur?._id !== fileId) return cur;
                return next[Math.min(idx, next.length - 1)] ?? null;
            });
            return next;
        });
    }, []);

    // ── project fetch ─────────────────────────────────────────────────────────
    const handleGetProject = async () => {
        const data = await getProjectById({ id });
        dispatch(setCurrentProject(data));
    };

    const handleRootRename = async (newName) => {
        await updateProject({ id, name: newName });
        dispatch(patchCurrentProject({ name: newName }));
    };

    useEffect(() => {
        handleGetProject();
        return () => dispatch(setCurrentProject(null));
    }, [id]);

    // ── shared explorer props ─────────────────────────────────────────────────
    const explorerProps = {
        projectId:    id,
        onFileClick:  handleFileClick,
        activeFileId: activeTab?._id,
        onRootRename: handleRootRename,
        openTabs,
        activeTab,
        onTabActivate: setActiveTab,
        onTabClose:    handleTabClose,
    };

    // ── shared editor props ───────────────────────────────────────────────────
    const editorProps = {
        openTabs,
        activeTab,
        setOpenTabs,
        setActiveTab: (file) => {
            setActiveTab(file);
            if (!file) return;
            // ensure it's in the open list (edge case: set from outside)
            setOpenTabs((prev) =>
                prev.find((t) => t._id === file._id) ? prev : [...prev, file]
            );
        },
    };

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-[#07070c]">
            {/* Ambient orbs */}
            <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-[140px]" />
            <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />

            {/* TopBar */}
            <TopBar activeView={view} setActiveView={setView} />

            {/* ── Desktop layout (md+) ─────────────────────────────────────── */}
            <div className="hidden md:flex flex-1 overflow-hidden">
                <ActivityBar
                    items={ACTIVITY_ITEMS}
                    bottomItems={[]}
                    activeItem={activePanel}
                    onItemClick={(panelId) =>
                        setActivePanel((prev) => (prev === panelId ? null : panelId))
                    }
                />

                {/* Side panel (Explorer / AI / Terminal) */}
                <AnimatePresence mode="wait">
                    {activePanel === "explorer" && (
                        <Explorer key="explorer" {...explorerProps} />
                    )}
                    {activePanel === "ai" && (
                        <motion.div
                            key="ai"
                            initial={{ opacity: 0, x: -8, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 288 }}
                            exit={{ opacity: 0, x: -8, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col border-r border-white/[0.06]"
                            style={{ minWidth: 288, maxWidth: 288 }}
                        >
                            <AiPlaceholder />
                        </motion.div>
                    )}
                    {activePanel === "terminal" && (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0, x: -8, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 288 }}
                            exit={{ opacity: 0, x: -8, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col border-r border-white/[0.06]"
                            style={{ minWidth: 288, maxWidth: 288 }}
                        >
                            <TerminalPlaceholder />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Monaco editor — always mounted on desktop */}
                <Editor {...editorProps} />
            </div>

            {/* ── Mobile layout (<md) ──────────────────────────────────────── */}
            <div className="flex md:hidden flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {mobilePane === "editor" && (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-1 overflow-hidden"
                            >
                                <Editor {...editorProps} />
                            </motion.div>
                        )}
                        {mobilePane === "explorer" && (
                            <motion.div
                                key="explorer"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-1 overflow-hidden"
                            >
                                <Explorer {...explorerProps} fullWidth />
                            </motion.div>
                        )}
                        {mobilePane === "ai" && (
                            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1">
                                <AiPlaceholder />
                            </motion.div>
                        )}
                        {mobilePane === "terminal" && (
                            <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1">
                                <TerminalPlaceholder />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <MobileTabBar activePane={mobilePane} onSelect={setMobilePane} />
            </div>
        </div>
    );
}
