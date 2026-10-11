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
import Preview from "../components/Preview.jsx";
import BottomPanel from "../components/BottomPanel.jsx";
import AIChat from "../components/AIChat.jsx";
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
    const [view,            setView]            = useState("code");
    const [activePanel,     setActivePanel]     = useState("explorer");
    const [mobilePane,      setMobilePane]      = useState("explorer");
    const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
    const [aiChatOpen,      setAiChatOpen]      = useState(false);

    // ── tab / open-files state (shared between Explorer + Editor) ─────────────
    const [openTabs,   setOpenTabs]   = useState([]);
    const [activeTab,  setActiveTab]  = useState(null);

    // ── tree + fileState for Preview ──────────────────────────────────────────
    // fileState is useState (not a ref) so Preview re-renders on every keystroke
    const [tree,      setTree]      = useState([]);
    const [fileState, setFileState] = useState({});

    // Stable callback passed to Editor — doesn't change between renders
    const handleFileStateChange = useCallback((fs) => {
        setFileState(fs);
    }, []);

    // ── open a file (adds tab if not already open, makes it active) ───────────
    const handleFileClick = useCallback((file) => {
        setOpenTabs((prev) => {
            const already = prev.find((t) => t._id === file._id);
            return already ? prev : [...prev, file];
        });
        setActiveTab(file);
        setMobilePane("editor"); // auto-switch on mobile
    }, []);

    // ── close a tab (from Explorer sidebar or Editor tab bar) ────────────────
    // Also cleans fileState to prevent memory leak
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
        // Remove cached content for the closed file
        setFileState((prev) => {
            if (!prev[fileId]) return prev;
            const copy = { ...prev };
            delete copy[fileId];
            return copy;
        });
    }, []);

    // ── project + tree fetch ──────────────────────────────────────────────────
    const handleGetProject = async () => {
        const data = await getProjectById({ id });
        dispatch(setCurrentProject(data));
    };

    // Called by Explorer via onTreeChange prop when it refreshes
    // Keeps ProjectPage.tree in sync for Preview without a separate fetch
    const handleTreeChange = useCallback((freshTree) => {
        if (Array.isArray(freshTree)) setTree(freshTree);
    }, []);

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
        onTreeChange:  handleTreeChange, // keeps ProjectPage.tree fresh for Preview
    };

    // ── shared editor props ───────────────────────────────────────────────────
    const editorProps = {
        openTabs,
        activeTab,
        setOpenTabs,
        setActiveTab: (file) => {
            setActiveTab(file);
            if (!file) return;
            setOpenTabs((prev) =>
                prev.find((t) => t._id === file._id) ? prev : [...prev, file]
            );
        },
        onFileStateChange: handleFileStateChange,
    };

    // ── preview props ─────────────────────────────────────────────────────────
    const previewProps = {
        tree,
        fileState,
        openTabs,
    };

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-[#07070c]">
            {/* Ambient orbs */}
            <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-[140px]" />
            <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />

            {/* TopBar */}
            <TopBar activeView={view} setActiveView={setView} />

            {/* ── Desktop layout (md+) ─────────────────────────────────────── */}
            <div className="hidden md:flex flex-1 flex-col overflow-hidden">
                {/* Main row: ActivityBar + side panel + editor/preview */}
                <div className="flex flex-1 overflow-hidden">
                <ActivityBar
                    items={ACTIVITY_ITEMS}
                    bottomItems={[]}
                    activeItem={bottomPanelOpen ? "terminal" : aiChatOpen ? "ai" : activePanel}
                    onItemClick={(panelId) => {
                        if (panelId === "terminal") {
                            setBottomPanelOpen((o) => !o);
                            return;
                        }
                        if (panelId === "ai") {
                            setAiChatOpen((o) => !o);
                            return;
                        }
                        setActivePanel((prev) => (prev === panelId ? null : panelId));
                    }}
                />

                {/* Side panel — Explorer only now */}
                <AnimatePresence mode="wait">
                    {activePanel === "explorer" && (
                        <Explorer key="explorer" {...explorerProps} />
                    )}
                </AnimatePresence>

                {/* Editor / Preview + Terminal + AI Chat — right column */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Editor/Preview + Terminal — takes remaining space */}
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <AnimatePresence mode="wait">
                            {view === "code" ? (
                                <motion.div
                                    key="editor"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-1 overflow-hidden"
                                >
                                    <Editor {...editorProps} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-1 overflow-hidden"
                                >
                                    <Preview {...previewProps} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <BottomPanel
                            open={bottomPanelOpen}
                            onClose={() => setBottomPanelOpen(false)}
                            projectId={id}
                        />
                    </div>

                    {/* AI Chat sidebar — slides in from right, editor stays visible */}
                    <AnimatePresence>
                        {aiChatOpen && (
                            <motion.div
                                key="ai-sidebar"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 340, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="flex flex-col shrink-0 overflow-hidden border-l border-white/[0.06]"
                                style={{ width: 340 }}
                            >
                                <AIChat
                                    onClose={() => setAiChatOpen(false)}
                                    activeTab={activeTab}
                                    fileState={fileState}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                </div> {/* end main row */}
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
                            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col overflow-hidden">
                                <AIChat
                                    onClose={() => setMobilePane("editor")}
                                    activeTab={activeTab}
                                    fileState={fileState}
                                />
                            </motion.div>
                        )}
                        {mobilePane === "terminal" && (
                            <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col overflow-hidden bg-[#111113]">
                                <BottomPanel
                                    open={true}
                                    onClose={() => setMobilePane("editor")}
                                    projectId={id}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <MobileTabBar activePane={mobilePane} onSelect={setMobilePane} />
            </div>
        </div>
    );
}
