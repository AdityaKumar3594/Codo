import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiOutlineStar, HiStar, HiOutlineTrash } from "react-icons/hi2";

export default function ProjectCard({
    project,
    onToggleStar,
    onDelete,
    isStarring = false,
    isDeleting = false,
}) {
    const [confirming, setConfirming] = useState(false);
    const [localDeleting, setLocalDeleting] = useState(false);

    const handleConfirmDelete = async (e) => {
        e.stopPropagation();
        setLocalDeleting(true);
        try {
            await onDelete(project._id);
        } finally {
            setLocalDeleting(false);
            setConfirming(false);
        }
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setConfirming(false);
    };

    const deletingState = isDeleting || localDeleting;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: deletingState ? 0.5 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            whileHover={deletingState ? {} : { y: -2 }}
            transition={{ duration: 0.2 }}
            className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-white/70 dark:bg-[#111116] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all shadow-sm min-h-[140px] ${
                deletingState ? "pointer-events-none" : ""
            }`}
        >
            {/* Top row: Name & Star */}
            <div>
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-1">
                        {project.name}
                    </h3>

                    {/* Star icon with loading indicator */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isStarring && !deletingState) {
                                onToggleStar(project._id);
                            }
                        }}
                        disabled={isStarring || deletingState}
                        className="p-1 rounded-lg text-gray-400 hover:text-amber-400 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                        title={project.starred ? "Unstar project" : "Star project"}
                    >
                        {isStarring ? (
                            <div className="w-5 h-5 flex items-center justify-center">
                                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : project.starred ? (
                            <HiStar className="w-5 h-5 text-amber-400 fill-amber-400" />
                        ) : (
                            <HiOutlineStar className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {project.description || "No description provided"}
                </p>
            </div>

            {/* Divider & Bottom row: Delete approval */}
            <div className="mt-5 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-end min-h-[32px]">
                <AnimatePresence mode="wait">
                    {confirming ? (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: 6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="text-xs font-medium text-rose-500 dark:text-rose-400">
                                Delete?
                            </span>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleConfirmDelete}
                                disabled={deletingState}
                                className="px-2.5 py-1 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
                            >
                                {deletingState ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Deleting</span>
                                    </>
                                ) : (
                                    "Yes"
                                )}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancelDelete}
                                disabled={deletingState}
                                className="px-2.5 py-1 text-xs font-medium bg-black/[0.06] dark:bg-white/[0.1] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-black/[0.1] dark:hover:bg-white/[0.16] transition-colors cursor-pointer"
                            >
                                No
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.button
                            key="trash"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirming(true);
                            }}
                            disabled={deletingState}
                            className="p-1 rounded-lg text-rose-500 dark:text-rose-400/90 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete project"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
