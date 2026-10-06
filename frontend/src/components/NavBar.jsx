import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../redux/themeSlice";
import { clearUserData, setUserData } from "../redux/userSlice";
import { logout as logoutApi } from "../features/logout";
import { HiMoon, HiSun, HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { HiArrowRightOnRectangle } from "react-icons/hi2";

export default function NavBar() {
    const dispatch = useDispatch();
    const { isDark } = useSelector((state) => state.theme);
    const { userData } = useSelector((state) => state.user);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logoutApi();
            if (clearUserData) {
                dispatch(clearUserData());
            } else {
                dispatch(setUserData(null));
            }
        } catch (error) {
            console.error("Logout failed:", error);
            dispatch(setUserData(null));
        }
    };

    // Calculate user initials
    const getInitials = (name) => {
        if (!name) return "U";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const initials = getInitials(userData?.name);

    return (
        <nav className="flex items-center justify-between px-7 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] backdrop-blur-md bg-white/70 dark:bg-[#07070c]/70 sticky top-0 z-50 transition-colors duration-300">
            {/* Logo */}
            <div className="flex items-center gap-2 select-none">
                <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Codo
                </span>
            </div>

            {/* Right section: theme toggle + user profile */}
            <div className="flex items-center gap-5">
                {/* Theme toggle */}
                <button
                    onClick={() => dispatch(toggleTheme())}
                    aria-label="Toggle dark mode"
                    className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
                >
                    {isDark ? (
                        <HiSun className="w-5 h-5 text-amber-400" />
                    ) : (
                        <HiMoon className="w-5 h-5 text-gray-600" />
                    )}
                </button>

                {/* User dropdown */}
                {userData && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors focus:outline-none"
                        >
                            {/* Avatar Badge */}
                            <div className="w-8 h-8 rounded-full bg-white text-black font-semibold text-xs flex items-center justify-center shadow-sm border border-gray-200 dark:border-white/20 select-none">
                                {initials}
                            </div>

                            {/* User Name */}
                            <span className="text-sm font-medium text-gray-800 dark:text-white select-none">
                                {userData?.name || "User"}
                            </span>

                            {/* Chevron */}
                            {dropdownOpen ? (
                                <HiChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                            ) : (
                                <HiChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                            )}
                        </button>

                        {/* Dropdown Card */}
                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#111116] border border-gray-200 dark:border-white/[0.08] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                                {/* User Info Header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center shrink-0 shadow-sm border border-gray-200 dark:border-white/20 select-none">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {userData?.name || "User"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {userData?.email || ""}
                                        </p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="my-3 border-t border-gray-100 dark:border-white/[0.08]" />

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-medium cursor-pointer"
                                >
                                    <HiArrowRightOnRectangle className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
