import { motion } from "motion/react";
import { HiOutlineFolder, HiOutlineStar, HiBolt } from "react-icons/hi2";

export default function Sidebar({ activeTab, setActiveTab }) {
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

    return (
        <aside className="w-64 shrink-0 flex flex-col justify-between p-4 border-r border-black/[0.06] dark:border-white/[0.06] select-none">
            {/* Top Navigation */}
            <div className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(item.id)}
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
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Upgrade Plan
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Upgrade to Pro for more credits
                    </span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-1 w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                    <HiBolt className="w-3.5 h-3.5 text-amber-500 dark:text-amber-600" />
                    <span>Upgrade Now</span>
                </motion.button>
            </motion.div>
        </aside>
    );
}
