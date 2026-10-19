import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlineFolder, HiOutlineStar, HiBolt, HiXMark } from "react-icons/hi2";

export default function Sidebar({ activeTab, setActiveTab, mobileOpen = false, onCloseMobile }) {
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.user);

    const navItems = [
        {
            id: "projects",
            label: "Projects",
            icon: HiOutlineFolder,
        },
        {
            id: "starred",
            label: "Starred",
            icon: HiOutlineStar,
        },
    ];

    const handleSelectTab = (id) => {
        setActiveTab(id);
        if (onCloseMobile) onCloseMobile();
    };

    const handleUpgrade = () => {
        if (onCloseMobile) onCloseMobile();
        navigate("/plans");
    };

    const content = (
        <div className="flex flex-col justify-between h-full p-4 select-none">
            {/* Top Navigation */}
            <div className="flex flex-col gap-1.5">
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-black/[0.06] dark:border-white/[0.06] md:hidden">
                    <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
                        Menu
                    </span>
                    <button
                        onClick={onCloseMobile}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                        aria-label="Close menu"
                    >
                        <HiXMark className="w-5 h-5" />
                    </button>
                </div>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectTab(item.id)}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-black/[0.06] text-gray-950 dark:bg-white/[0.08] dark:text-white"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.03] dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/[0.03]"
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-gray-950 dark:text-white" : "text-gray-400 dark:text-gray-400"}`} />
                            <span>{item.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Bottom Upgrade Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl p-4 bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex flex-col gap-2"
            >
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Upgrade Plan
                        </span>
                        {userData && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 flex items-center gap-1">
                                <HiBolt className="w-3 h-3 text-amber-500" />
                                {userData.credits ?? 100}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Upgrade to Pro for more credits
                    </span>
                </div>

                <motion.button
                    onClick={handleUpgrade}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-1 w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                    <HiBolt className="w-3.5 h-3.5 text-amber-500 dark:text-amber-600" />
                    <span>Upgrade Now</span>
                </motion.button>
            </motion.div>
        </div>
    );

    return (
        <>
            {/* Desktop persistent sidebar */}
            <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between border-r border-black/[0.06] dark:border-white/[0.06]">
                {content}
            </aside>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onCloseMobile}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />

                        {/* Slide-out Panel */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-72 max-w-[85vw] h-full bg-slate-50 dark:bg-[#0d0d12] border-r border-black/[0.08] dark:border-white/[0.08] shadow-2xl z-10"
                        >
                            {content}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
