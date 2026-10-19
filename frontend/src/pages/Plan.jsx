import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import {
    HiArrowLeft,
    HiBolt,
    HiCheck,
    HiSparkles,
    HiOutlineSparkles,
    HiXMark,
} from "react-icons/hi2";
import { LuCrown, LuConstruction } from "react-icons/lu";
import { getPlans } from "../features/payment";

const DEFAULT_PLANS = {
    free: {
        id: "free",
        name: "Free",
        tagline: "For trying out the VertexAI IDE.",
        price: "₹0",
        period: "/month",
        creditsText: "100 AI credits",
        credits: 100,
        buttonText: "Current Plan",
        isCurrent: true,
        popular: false,
        icon: HiBolt,
        iconBg: "bg-gray-100 dark:bg-white/[0.08] text-gray-700 dark:text-gray-300",
        features: [
            "100 AI credits",
            "AI code generation",
            "Project editor",
            "HTML / CSS / JS preview",
            "React preview",
            "Basic project management",
        ],
    },
    pro: {
        id: "pro",
        name: "Pro",
        tagline: "For developers who build regularly.",
        price: "₹299",
        period: "/month",
        creditsText: "500 AI credits",
        credits: 500,
        buttonText: "Upgrade to Pro",
        isCurrent: false,
        popular: true,
        icon: HiSparkles,
        iconBg: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
        features: [
            "500 AI credits",
            "Everything in Free",
            "Priority AI generation",
            "Larger projects",
            "Unlimited projects",
            "Advanced AI coding",
            "Priority support",
        ],
    },
    team: {
        id: "team",
        name: "Team",
        tagline: "For teams building products together.",
        price: "₹799",
        period: "/month",
        creditsText: "2,000 AI credits",
        credits: 2000,
        buttonText: "Upgrade to Team",
        isCurrent: false,
        popular: false,
        icon: LuCrown,
        iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        features: [
            "2,000 AI credits",
            "Everything in Pro",
            "Team collaboration",
            "Shared projects",
            "Higher AI limits",
            "Priority processing",
            "Team support",
        ],
    },
};

export default function Plan() {
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.user);

    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const loadPlans = async () => {
            const backendPlans = await getPlans();
            if (backendPlans) {
                setPlans((prev) => ({
                    free: {
                        ...prev.free,
                        credits: backendPlans.free?.credits ?? prev.free.credits,
                    },
                    pro: {
                        ...prev.pro,
                        price: backendPlans.pro?.amount ? `₹${backendPlans.pro.amount}` : prev.pro.price,
                        credits: backendPlans.pro?.credits ?? prev.pro.credits,
                        features: backendPlans.pro?.features || prev.pro.features,
                    },
                    team: {
                        ...prev.team,
                        price: backendPlans.team?.amount ? `₹${backendPlans.team.amount}` : prev.team.price,
                        credits: backendPlans.team?.credits ?? prev.team.credits,
                        features: backendPlans.team?.features || prev.team.features,
                    },
                }));
            }
        };
        loadPlans();
    }, []);

    const handleUpgradeClick = (plan) => {
        if (plan.id === "free") return;
        setSelectedPlan(plan);
        setModalOpen(true);
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafc] dark:bg-[#08080c] text-gray-900 dark:text-gray-100 transition-colors duration-300 relative overflow-x-hidden">
            {/* Subtle radial background glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />

            {/* Top Bar Navigation */}
            <header className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between relative z-10 gap-2">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#121218] border border-gray-200 dark:border-white/[0.08] shadow-xs text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer shrink-0"
                >
                    <HiArrowLeft className="w-4 h-4 text-gray-500" />
                    <span>Back</span>
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                    {userData && (
                        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-700 dark:text-violet-300">
                            <HiBolt className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{userData.credits ?? 100}</span>
                            <span className="hidden sm:inline">credits available</span>
                            <span className="sm:hidden">credits</span>
                        </div>
                    )}
                    <span className="text-xs sm:text-sm font-semibold tracking-tight text-gray-900 dark:text-white shrink-0">
                        Vertex AI
                    </span>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-14 sm:pb-20 relative z-10">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 text-violet-700 dark:text-violet-300 text-xs font-medium mb-5 shadow-xs"
                    >
                        <HiOutlineSparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        <span>Simple pricing for developers</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-950 dark:text-white leading-tight mb-4"
                    >
                        Build more.{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600">
                            Ship faster.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-lg"
                    >
                        Choose a plan that gives you the AI credits you need to build and iterate faster.
                    </motion.p>
                </div>

                {/* 3 Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {Object.values(plans).map((plan, index) => {
                        const Icon = plan.icon;
                        const isPro = plan.popular;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                                    isPro
                                        ? "bg-white dark:bg-[#111118] border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-900/20"
                                        : "bg-white dark:bg-[#111118] border border-gray-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-md"
                                }`}
                            >
                                {/* Most Popular Badge */}
                                {isPro && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                                        <span className="bg-[#4f46e5] text-white text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-full uppercase shadow-md">
                                            MOST POPULAR
                                        </span>
                                    </div>
                                )}

                                <div>
                                    {/* Icon */}
                                    <div
                                        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${plan.iconBg}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Plan Title & Tagline */}
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                        {plan.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 min-h-[32px]">
                                        {plan.tagline}
                                    </p>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                            {plan.price}
                                        </span>
                                        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                                            {plan.period}
                                        </span>
                                    </div>

                                    {/* Credits Pill Banner */}
                                    <div className="mb-6 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                                        <HiBolt className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                        <span>{plan.creditsText}</span>
                                    </div>

                                    {/* Action Button */}
                                    {plan.isCurrent ? (
                                        <button
                                            disabled
                                            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500 font-semibold text-xs cursor-default text-center"
                                        >
                                            {plan.buttonText}
                                        </button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleUpgradeClick(plan)}
                                            className={`w-full py-3 rounded-xl font-semibold text-xs cursor-pointer shadow-sm transition-all text-center ${
                                                isPro
                                                    ? "bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-indigo-500/25"
                                                    : "bg-[#111827] hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white"
                                            }`}
                                        >
                                            {plan.buttonText}
                                        </motion.button>
                                    )}

                                    {/* Divider & Features Label */}
                                    <div className="mt-7 mb-4">
                                        <span className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                                            INCLUDES
                                        </span>
                                    </div>

                                    {/* Features List */}
                                    <ul className="flex flex-col gap-3">
                                        {plan.features.map((feat, i) => (
                                            <li
                                                key={i}
                                                className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-300"
                                            >
                                                <HiCheck className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* Work in progress modal */}
            <AnimatePresence>
                {modalOpen && selectedPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#13131a] border border-gray-200 dark:border-white/[0.1] shadow-2xl p-5 sm:p-6 relative overflow-hidden mx-4"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setModalOpen(false)}
                                className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                            >
                                <HiXMark className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <LuConstruction className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="inline-block text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase mb-0.5">
                                        Work In Progress
                                    </span>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Online Payments Coming Soon
                                    </h3>
                                </div>
                            </div>

                            {/* Body description */}
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                Payment gateway integration is currently in progress. Subscriptions for the{" "}
                                <strong className="text-gray-900 dark:text-white">{selectedPlan.name} Plan</strong> will be
                                available soon once payment processing goes live.
                            </p>

                            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] mb-4">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-gray-500 dark:text-gray-400">Selected Plan:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {selectedPlan.name} ({selectedPlan.price}/month)
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Included Credits:</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                        <HiBolt className="w-3.5 h-3.5" />
                                        {selectedPlan.creditsText}
                                    </span>
                                </div>
                            </div>

                            {/* Free Credits Reminder Box */}
                            <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/30 mb-5">
                                <div className="flex items-start gap-2 text-xs text-violet-700 dark:text-violet-300">
                                    <HiSparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>100 Free Credits Included:</strong> Every developer gets 100 free AI credits on sign in to build, preview, and test projects.
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setModalOpen(false)}
                                className="w-full py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer text-center"
                            >
                                Got it
                            </motion.button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
