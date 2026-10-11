import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

function ActivityIcon({ icon: Icon, label, active, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div className="relative flex items-center">
            {/* Active indicator bar */}
            <AnimatePresence>
                {active && (
                    <motion.div
                        layoutId="active-indicator"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-400 rounded-r-full origin-center"
                    />
                )}
            </AnimatePresence>

            <motion.button
                onClick={onClick}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`
                    relative flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer
                    ${active
                        ? "text-blue-400 bg-white/[0.08]"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    }
                `}
                aria-label={label}
            >
                <motion.span
                    animate={active ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                >
                    <Icon className="w-5 h-5" />
                </motion.span>

                {/* Active glow */}
                {active && (
                    <motion.div
                        layoutId="active-glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-lg bg-blue-400/10 pointer-events-none"
                    />
                )}
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-full ml-3 z-50 pointer-events-none"
                    >
                        <div className="bg-[#1e1e2e] border border-white/[0.1] text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap">
                            {label}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ActivityBar = ({ items = [], activeItem, onItemClick, bottomItems = [] }) => {
    return (
        <motion.div
            initial={{ x: -56, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            className="flex w-14 shrink-0 flex-col items-center border-r border-white/[0.06] bg-[#0d0d14] py-2"
        >
            {/* Top icons — all tightly stacked */}
            <div className="flex flex-col items-center gap-0.5">
                {items.map(({ id, icon, label }, index) => (
                    <motion.div
                        key={id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.07, type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <ActivityIcon
                            icon={icon}
                            label={label}
                            active={activeItem === id}
                            onClick={() => onItemClick?.(id)}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Bottom icons */}
            {bottomItems.length > 0 && (
                <div className="flex flex-col items-center gap-0.5 mt-auto">
                    {bottomItems.map(({ id, icon, label }, index) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.07, type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <ActivityIcon
                                icon={icon}
                                label={label}
                                active={activeItem === id}
                                onClick={() => onItemClick?.(id)}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default ActivityBar;
