import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiXMark } from "react-icons/hi2";

export default function NewProjectModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Project name is required");
            return;
        }

        try {
            setLoading(true);
            setError("");
            await onCreate({ name: name.trim(), description: description.trim() });
            setName("");
            setDescription("");
            onClose();
        } catch (err) {
            setError(err?.message || "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError("");
            setName("");
            setDescription("");
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#121218] border border-black/[0.08] dark:border-white/[0.08] p-6 shadow-2xl z-10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Create New Project
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Start a new coding workspace
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors disabled:opacity-40"
                            >
                                <HiXMark className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Project Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    disabled={loading}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. My Nextjs App"
                                    autoFocus
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white/20 transition-all placeholder:text-gray-400 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={description}
                                    disabled={loading}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of what you're building..."
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white/20 transition-all placeholder:text-gray-400 resize-none disabled:opacity-60"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 mt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={loading ? {} : { scale: 1.02 }}
                                    whileTap={loading ? {} : { scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <span>Create Project</span>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
