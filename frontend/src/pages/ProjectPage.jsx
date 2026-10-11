import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AnimatePresence } from "motion/react";
import { setCurrentProject, patchCurrentProject } from "../redux/projectSlice";
import { getProjectById, updateProject } from "../features/project";
import TopBar from "../components/TopBar.jsx";
import ActivityBar from "../components/ActivityBar.jsx";
import Explorer from "../components/Explorer.jsx";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { PiRobotLight } from "react-icons/pi";
import { LuSquareTerminal } from "react-icons/lu";

const ACTIVITY_ITEMS = [
    { id: "explorer", icon: HiOutlineDocumentDuplicate, label: "Explorer" },
    { id: "ai",       icon: PiRobotLight,               label: "AI Chat" },
    { id: "terminal", icon: LuSquareTerminal,           label: "Terminal" },
];

const ACTIVITY_BOTTOM_ITEMS = [];

export default function ProjectPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [view, setView] = useState("code"); // "code" | "preview"
    const [activePanel, setActivePanel] = useState("explorer");
    const [activeFile, setActiveFile] = useState(null);

    const handleGetProject = async () => {
        const data = await getProjectById({ id });
        dispatch(setCurrentProject(data));
    };

    // When the root folder is renamed in the Explorer, keep the project name in sync
    const handleRootRename = async (newName) => {
        await updateProject({ id, name: newName });
        dispatch(patchCurrentProject({ name: newName }));
    };

    useEffect(() => {
        handleGetProject();
        // Clear stale project on unmount
        return () => dispatch(setCurrentProject(null));
    }, [id]);

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-[#07070c]">
            {/* Ambient blur orbs */}
            <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/10 blur-[140px]" />
            <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/10 blur-[140px]" />

            {/* TopBar */}
            <TopBar activeView={view} setActiveView={setView} />

            <div className="flex flex-1 overflow-hidden">
                {/* Activity bar */}
                <ActivityBar
                    items={ACTIVITY_ITEMS}
                    bottomItems={ACTIVITY_BOTTOM_ITEMS}
                    activeItem={activePanel}
                    onItemClick={(panelId) =>
                        setActivePanel((prev) => (prev === panelId ? null : panelId))
                    }
                />

                {/* Side panels */}
                <AnimatePresence mode="wait">
                    {activePanel === "explorer" && (
                        <Explorer
                            key="explorer"
                            projectId={id}
                            onFileClick={(file) => setActiveFile(file)}
                            activeFileId={activeFile?._id}
                            onRootRename={handleRootRename}
                        />
                    )}
                    {/* AI Chat panel — placeholder for later */}
                    {activePanel === "ai" && (
                        <div
                            key="ai"
                            className="flex flex-col items-center justify-center border-r border-white/[0.06] bg-[#111113]/90 text-gray-500 text-xs"
                            style={{ minWidth: 288, maxWidth: 288 }}
                        >
                            AI Chat coming soon
                        </div>
                    )}
                </AnimatePresence>

                {/* Main editor area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {activeFile ? (
                        <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-500 text-sm">
                            {/* Editor will go here */}
                            <span>{activeFile.name}</span>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-500 text-sm select-none">
                            Select a file to start editing
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
