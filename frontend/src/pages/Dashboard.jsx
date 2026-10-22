import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { login } from "../features/login";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import {
    setProjects,
    addProject,
    toggleStarProject,
    removeProject,
    setProjectLoading,
    setCreatingProject,
    setActionLoading,
} from "../redux/projectSlice";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import NewProjectModal from "../components/NewProjectModal";
import ProjectCard from "../components/ProjectCard";
import {
    getProjects,
    createProject as createProjectApi,
    toggleStar as toggleStarApi,
    deleteProject as deleteProjectApi,
} from "../features/project";
import { motion, AnimatePresence } from "motion/react";
import { HiOutlineFolder, HiOutlineStar, HiPlus } from "react-icons/hi2";
import LandingPage from "./LandingPage";

export default function Dashboard() {
    const [loginLoading, setLoginLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("projects");
    const [modalOpen, setModalOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.user);
    const { projects, loading: fetchingProjects, actionLoading } = useSelector(
        (state) => state.project
    );

    const handleLogin = async () => {
        try {
            setLoginLoading(true);
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            const data = await login(token);
            dispatch(setUserData(data));
        } catch (error) {
            console.error("Login error:", error);
        } finally {
            setLoginLoading(false);
        }
    };

    const fetchProjectsList = async () => {
        if (!userData) return;
        dispatch(setProjectLoading(true));
        try {
            const data = await getProjects();
            const list = Array.isArray(data) ? data : data?.projects || [];
            dispatch(setProjects(list));
        } catch (error) {
            console.error("Fetch projects error:", error);
            dispatch(setProjects([]));
        } finally {
            dispatch(setProjectLoading(false));
        }
    };

    useEffect(() => {
        if (userData) {
            fetchProjectsList();
        }
    }, [userData]);

    const handleCreateProject = async ({ name, description }) => {
        dispatch(setCreatingProject(true));
        try {
            const newProj = await createProjectApi({ name, description });
            if (newProj) {
                dispatch(addProject(newProj));
            }
        } finally {
            dispatch(setCreatingProject(false));
        }
    };

    const handleToggleStar = async (id) => {
        dispatch(setActionLoading({ id, type: "starring" }));
        dispatch(toggleStarProject(id));
        try {
            const res = await toggleStarApi({ id });
            if (!res) {
                fetchProjectsList();
            }
        } catch (error) {
            console.error("Toggle star error:", error);
            fetchProjectsList();
        } finally {
            dispatch(setActionLoading({ id, type: null }));
        }
    };

    const handleDeleteProject = async (id) => {
        dispatch(setActionLoading({ id, type: "deleting" }));
        try {
            const res = await deleteProjectApi({ id });
            if (res) {
                dispatch(removeProject(id));
            } else {
                fetchProjectsList();
            }
        } catch (error) {
            console.error("Delete project error:", error);
            fetchProjectsList();
        } finally {
            dispatch(setActionLoading({ id, type: null }));
        }
    };

    // Filter projects based on active tab
    const displayedProjects =
        activeTab === "starred" ? projects.filter((p) => p.starred) : projects;

    // User first name
    const firstName = userData?.name ? userData.name.split(" ")[0] : "User";

    if (!userData) {
        return <LandingPage />;
    }

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-[#07070c]">
            {/* Ambient blur orbs */}
            <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-[700px] w-[700px] rounded-full bg-white/[0.04] blur-[140px] dark:block" />
            <div className="pointer-events-none absolute right-0 top-1/3 hidden h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[130px] dark:block" />

            {/* Top Navigation */}
            <NavBar
                onToggleSidebar={() => setMobileMenuOpen((prev) => !prev)}
                isSidebarOpen={mobileMenuOpen}
            />

            {/* Main Workspace Body */}
            <div className="relative flex min-h-0 flex-1 overflow-hidden">
                {/* Left Sidebar (Desktop persistent + Mobile slide-out drawer) */}
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    mobileOpen={mobileMenuOpen}
                    onCloseMobile={() => setMobileMenuOpen(false)}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
                    {/* Welcome Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                                <span>Welcome Back, {firstName}</span>
                                <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {activeTab === "starred"
                                    ? "Your starred and favorite projects"
                                    : "Ready to build something amazing today?"}
                            </p>
                        </motion.div>

                        {/* + New Project Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
                        >
                            <HiPlus className="w-4 h-4" />
                            <span>New Project</span>
                        </motion.button>
                    </div>

                    {/* Mobile Segmented Tab Switcher (Visible on <md) */}
                    <div className="flex md:hidden items-center gap-2 mt-5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                        <button
                            onClick={() => setActiveTab("projects")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                                activeTab === "projects"
                                    ? "bg-white dark:bg-white/[0.12] text-gray-900 dark:text-white shadow-xs"
                                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            }`}
                        >
                            <HiOutlineFolder className="w-4 h-4" />
                            <span>Projects</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.06] dark:bg-white/[0.1]">
                                {projects.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("starred")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                                activeTab === "starred"
                                    ? "bg-white dark:bg-white/[0.12] text-gray-900 dark:text-white shadow-xs"
                                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            }`}
                        >
                            <HiOutlineStar className="w-4 h-4 text-amber-400" />
                            <span>Starred</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.06] dark:bg-white/[0.1]">
                                {projects.filter((p) => p.starred).length}
                            </span>
                        </button>
                    </div>

                    {/* Section Title */}
                    <div className="mt-6 sm:mt-8 mb-4 sm:mb-5 flex items-center justify-between">
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                            {activeTab === "starred" ? "Starred Projects" : "Recent Projects"}
                        </h2>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            {displayedProjects.length} {displayedProjects.length === 1 ? "project" : "projects"}
                        </span>
                    </div>

                    {/* Content Section: Skeletons, Empty State, or Grid */}
                    <AnimatePresence mode="wait">
                        {fetchingProjects ? (
                            <motion.div
                                key="skeletons"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="p-5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] animate-pulse flex flex-col justify-between min-h-[140px]"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <div className="h-5 w-32 bg-gray-200 dark:bg-white/[0.08] rounded-md" />
                                                <div className="h-5 w-5 bg-gray-200 dark:bg-white/[0.08] rounded-md" />
                                            </div>
                                            <div className="h-3 w-48 bg-gray-100 dark:bg-white/[0.04] rounded-md mt-3" />
                                        </div>
                                        <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex justify-end">
                                            <div className="h-4 w-4 bg-gray-100 dark:bg-white/[0.04] rounded" />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : displayedProjects.length === 0 ? (
                            <motion.div
                                key={`empty-${activeTab}`}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.25 }}
                                className="w-full rounded-3xl border border-black/[0.06] dark:border-white/[0.06] bg-white/[0.4] dark:bg-white/[0.015] p-8 sm:p-16 md:p-20 flex flex-col items-center justify-center text-center min-h-[260px] sm:min-h-[320px]"
                            >
                                {/* Contextual Icon */}
                                <div className="w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center mb-4">
                                    {activeTab === "starred" ? (
                                        <HiOutlineStar className="w-7 h-7 text-amber-400" />
                                    ) : (
                                        <HiOutlineFolder className="w-7 h-7 text-gray-400 dark:text-gray-300" />
                                    )}
                                </div>

                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
                                    {activeTab === "starred" ? "No starred projects yet" : "No projects yet"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                                    {activeTab === "starred"
                                        ? "Star your favorite projects to quickly access them here!"
                                        : "Create your first project and start building something amazing!"}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`grid-${activeTab}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {displayedProjects.map((project) => (
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                        onToggleStar={handleToggleStar}
                                        onDelete={handleDeleteProject}
                                        isStarring={actionLoading?.[project._id] === "starring"}
                                        isDeleting={actionLoading?.[project._id] === "deleting"}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Modal for creating a new project */}
            <NewProjectModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreate={handleCreateProject}
            />
        </div>
    );
}
