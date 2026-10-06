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

export default function Dashboard() {
    const [loginLoading, setLoginLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("projects");
    const [modalOpen, setModalOpen] = useState(false);

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
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="bg-[#1a1a1a] rounded-2xl p-10 w-full max-w-md flex flex-col items-center gap-6 shadow-2xl">
                    {/* Logo */}
                    <div className="bg-white rounded-xl w-14 h-14 flex items-center justify-center shadow-md">
                        <span className="text-black font-bold text-lg tracking-tight">AI</span>
                    </div>

                    {/* Heading */}
                    <div className="text-center">
                        <h1 className="text-white text-2xl font-bold mb-2">Welcome to Codo</h1>
                        <p className="text-gray-400 text-sm">
                            Sign in to access your projects and continue building.
                        </p>
                    </div>

                    {/* Google Button */}
                    <button
                        onClick={handleLogin}
                        disabled={loginLoading}
                        className="w-full bg-white hover:bg-gray-100 transition-colors text-gray-800 font-medium text-sm py-3 px-5 rounded-lg flex items-center justify-center gap-3 shadow-sm cursor-pointer disabled:opacity-60"
                    >
                        {loginLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <g fill="none" fillRule="evenodd">
                                        <path
                                            d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                                            fill="#EA4335"
                                        />
                                    </g>
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    <p className="text-gray-600 text-xs text-center">
                        By continuing you agree to our{" "}
                        <span className="underline cursor-pointer hover:text-gray-400 transition-colors">
                            Terms &amp; Privacy Policy
                        </span>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-[#07070c]">
            {/* Ambient blur orbs */}
            <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-[700px] w-[700px] rounded-full bg-white/[0.04] blur-[140px] dark:block" />
            <div className="pointer-events-none absolute right-0 top-1/3 hidden h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-[130px] dark:block" />

            {/* Top Navigation */}
            <NavBar />

            {/* Main Workspace Body */}
            <div className="relative flex min-h-0 flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-10 py-8">
                    {/* Welcome Header */}
                    <div className="flex items-start justify-between gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                                <span>Welcome Back, {firstName}</span>
                                <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                            className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                            <HiPlus className="w-4 h-4" />
                            <span>New Project</span>
                        </motion.button>
                    </div>

                    {/* Section Title */}
                    <div className="mt-8 mb-5">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            {activeTab === "starred" ? "Starred Projects" : "Recent Projects"}
                        </h2>
                    </div>

                    {/* Content Section: Skeletons, Empty State, or Grid */}
                    <AnimatePresence mode="wait">
                        {fetchingProjects ? (
                            <motion.div
                                key="skeletons"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
                                className="w-full rounded-3xl border border-black/[0.06] dark:border-white/[0.06] bg-white/[0.4] dark:bg-white/[0.015] p-20 flex flex-col items-center justify-center text-center min-h-[320px]"
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
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
