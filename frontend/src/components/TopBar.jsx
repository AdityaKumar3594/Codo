import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { HiFolder } from "react-icons/hi2";
import { HiOutlineCodeBracket, HiOutlineEye } from "react-icons/hi2";
import { motion } from "motion/react";

export default function TopBar({
    activeView = "code",
    setActiveView,
    showPreview,
    setShowPreview,
}) {
    const { currentProject } = useSelector((state) => state.project);
    const [internalView, setInternalView] = useState("code");

    // Support both activeView/setActiveView and showPreview/setShowPreview props, or fallback to internal state
    const currentView = setActiveView
        ? activeView
        : setShowPreview
        ? showPreview
            ? "preview"
            : "code"
        : internalView;

    const handleViewChange = (view) => {
        if (setActiveView) {
            setActiveView(view);
        } else if (setShowPreview) {
            setShowPreview(view === "preview");
        } else {
            setInternalView(view);
        }
    };

    return (
        <header className="relative flex h-12 w-full items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-[#0c0c0f]/90 px-4 backdrop-blur-xl z-40 transition-colors select-none">
            {/* Left: Codo brand + Divider + Folder Icon + Project Name */}
            <div className="flex items-center gap-2.5 min-w-0">
                <Link
                    to="/"
                    className="text-sm font-bold tracking-tight text-gray-950 dark:text-white hover:opacity-80 transition-opacity shrink-0"
                >
                    Codo
                </Link>

                <span className="text-gray-300 dark:text-white/20 select-none text-xs">/</span>

                <div className="flex items-center gap-1.5 min-w-0">
                    <HiFolder className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
                        {currentProject?.name || "project"}
                    </span>
                </div>
            </div>

            {/* Right: Code & Show Preview Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                {/* Code View Toggle */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewChange("code")}
                    title="Code View"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        currentView === "code"
                            ? "bg-white dark:bg-white/[0.12] text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                >
                    <HiOutlineCodeBracket className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Code</span>
                </motion.button>

                {/* Preview View Toggle */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewChange("preview")}
                    title="Preview View"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        currentView === "preview"
                            ? "bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30 shadow-sm"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                >
                    <HiOutlineEye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                </motion.button>
            </div>
        </header>
    );
}