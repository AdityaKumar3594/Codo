import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { login } from "../features/login";
import { setUserData } from "../redux/userSlice";

/* ─────────────────────────────────────────────────────────────────────────────
   CODO LANDING PAGE
   Aesthetic: Obsidian dark mode · Crimson & Rose accents · Kinetic typography
   Core concept: The agent's real file operations & terminal stream in your browser
   ───────────────────────────────────────────────────────────────────────────── */

const GITHUB_URL = "https://github.com/AdityaKumar3594/Codo";

const AGENT_TICKER = [
    { op: "folder_created", file: "src/", icon: "📁", color: "#fb7185" },
    { op: "file_created", file: "index.html", icon: "🌐", color: "#38bdf8" },
    { op: "file_created", file: "package.json", icon: "📦", color: "#facc15" },
    { op: "file_created", file: "src/main.jsx", icon: "⚡", color: "#818cf8" },
    { op: "file_created", file: "src/App.jsx", icon: "⚛️", color: "#60a5fa" },
    { op: "file_created", file: "src/index.css", icon: "🎨", color: "#f472b6" },
    { op: "file_updated", file: "src/App.jsx", icon: "✏️", color: "#4ade80" },
    { op: "terminal_sync", file: "git status", icon: "💻", color: "#a78bfa" },
];

const WORKFLOW_STAGES = [
    {
        id: "describe",
        badge: "01 · Describe",
        headline: "Speak plain English. The agent drafts the architecture.",
        desc: "Give Codo a concept, a bug report, or a full app spec. It reasons about dependencies, file structure, and design patterns before touching your code.",
        samplePrompt: "Build an interactive retro Pomodoro timer with sound effects, task lists, and daily streak tracking.",
    },
    {
        id: "inspect",
        badge: "02 · Inspect",
        headline: "The agent reads your tree with get_tree.",
        desc: "Unlike standard chatbots that guess your files, Codo connects directly to your workspace. It inspects existing files, reads package configs, and plans non-destructive edits.",
        samplePrompt: "Reading project directory /pomodoro-app...",
    },
    {
        id: "stream",
        badge: "03 · Stream",
        headline: "Watch files materialize in real-time.",
        desc: "Files stream into Monaco Editor with live syntax highlighting. Folders create themselves, scripts hook together, and updates patch seamlessly.",
        samplePrompt: "Created index.html, style.css, and app.js",
    },
    {
        id: "preview",
        badge: "04 · Run & Ship",
        headline: "Instant browser preview and connected terminal.",
        desc: "Watch HTML, CSS, and JS execute instantly in an embedded sandbox. Open the real integrated shell to run npm scripts, install packages, and manage git.",
        samplePrompt: "Local preview running on port 3000",
    },
];

const FEATURES = [
    {
        tag: "Virtual File System",
        title: "Real File Architecture",
        desc: "Every project has a persistent file tree. The AI uses tools like get_tree, create_folder, create_file, and update_file so changes reflect instantly in Monaco Editor.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        ),
    },
    {
        tag: "Interactive Shell",
        title: "Full Terminal Synchronization",
        desc: "A genuine shell session executes right in your browser. Install dependencies, run build scripts, or edit via nano. All workspace modifications sync bidirectionally.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        tag: "Instant Rendering",
        title: "Zero-Latency Live Preview",
        desc: "Single-page web applications render the moment HTML and CSS are saved. For full-stack and Vite applications, run npm run dev from the shell to preview.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
    },
    {
        tag: "Fair Billing",
        title: "10 Credits Per Prompt",
        desc: "Sign up with Google and immediately receive 100 free AI credits. If an AI request disconnects or fails before completing, your credits are refunded automatically.",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

const PLANS = [
    {
        name: "Starter",
        price: "Free",
        sub: "Forever free for builders",
        credits: "100 Free Credits",
        prompts: "10 AI Prompts included",
        highlight: false,
        features: [
            "100 AI credits on sign-in",
            "Monaco code editor with IntelliSense",
            "Integrated terminal shell",
            "Real-time live preview",
            "Auto credit refund on stream failure",
        ],
        cta: "Start Free",
    },
    {
        name: "Pro",
        price: "₹299",
        sub: "Most popular for solo developers",
        credits: "500 AI Credits",
        prompts: "50 AI Prompts (~₹6 / prompt)",
        highlight: true,
        tag: "Recommended",
        features: [
            "Everything in Starter",
            "500 AI credits",
            "Priority LangGraph agent queue",
            "Unlimited workspace projects",
            "Fast model inference with Gemini & Sonnet",
            "Dedicated community support",
        ],
        cta: "Get Pro Plan",
    },
    {
        name: "Team",
        price: "₹799",
        sub: "For power creators and teams",
        credits: "2,000 AI Credits",
        prompts: "200 AI Prompts (~₹4 / prompt)",
        highlight: false,
        features: [
            "Everything in Pro",
            "2,000 AI credits",
            "Fastest execution tier",
            "Extended terminal runtime limits",
            "High concurrency generation",
            "Early access to new agent tools",
        ],
        cta: "Get Team Plan",
    },
];

const FAQS = [
    {
        q: "What makes Codo different from ordinary AI code generators?",
        a: "Standard AI assistants give you loose code blocks you have to manually copy and paste. Codo is an end-to-end browser IDE powered by an autonomous LangGraph agent. It reads your file directory, creates folders and files, writes code, and lets you test immediately in an active browser preview and terminal.",
    },
    {
        q: "How does credit deduction work?",
        a: "Every account receives 100 free credits upon signing in. Each AI prompt costs 10 credits. If a network interruption or model error occurs before output is generated, the AI service automatically restores your credits.",
    },
    {
        q: "Can I manually code and collaborate with the AI?",
        a: "Absolutely. Codo embeds the industry-standard Monaco Editor (the heart of VS Code). You can edit any file manually, run terminal commands, and ask the AI agent to refactor or build further from where you left off.",
    },
    {
        q: "What types of applications can I run?",
        a: "You can create vanilla HTML/CSS/JavaScript apps, React, Vite, Node APIs, Python utilities, and more. HTML/JS apps preview automatically, and full-stack projects can be run with commands like npm run dev right inside the integrated terminal.",
    },
    {
        q: "Where is my project data stored?",
        a: "All your project files, directory hierarchies, and code versions are securely stored in the cloud under your authenticated account so you can pick up from any device.",
    },
];

export default function LandingPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.user);

    const [loading, setLoading] = useState(false);
    const [activeStage, setActiveStage] = useState(0);
    const [openFaq, setOpenFaq] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    // Track scroll for sticky navbar blur
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Google Sign-In Handler
    const handleAuth = async () => {
        if (userData) {
            navigate("/");
            return;
        }
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();
            const data = await login(token);
            if (data) {
                dispatch(setUserData(data));
                navigate("/");
            }
        } catch (error) {
            console.error("Sign-in error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="codo-page">
            <style>{PAGE_STYLES}</style>

            {/* ── Background Ambient Glow ──────────────────────────────────── */}
            <div className="ambient-glow glow-top" />
            <div className="ambient-glow glow-bottom" />

            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <header className={`codo-nav ${scrolled ? "nav-scrolled" : ""}`}>
                <div className="nav-container">
                    <a href="#top" className="brand-logo">
                        <span className="logo-badge">AI</span>
                        <span className="brand-text">Codo</span>
                    </a>

                    <nav className="nav-links">
                        <a href="#demo" className="nav-link">Workflow</a>
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#pricing" className="nav-link">Pricing</a>
                        <a href="#faq" className="nav-link">FAQ</a>
                        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="nav-link nav-gh">
                            GitHub
                            <span className="gh-star-pill">★ Star</span>
                        </a>
                    </nav>

                    <div className="nav-actions">
                        <button
                            onClick={handleAuth}
                            disabled={loading}
                            className="btn-primary btn-sm"
                        >
                            {loading ? (
                                <span className="btn-spinner" />
                            ) : userData ? (
                                "Open Workspace"
                            ) : (
                                "Start Free"
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Hero Section ────────────────────────────────────────────── */}
            <section className="hero-section" id="top">
                <div className="hero-content">
                    {/* Announcement pill */}
                    <div className="hero-pill">
                        <span className="pill-pulse" />
                        <span className="pill-tag">New</span>
                        <span>Autonomous LangGraph IDE Agent with Live Tree & Shell</span>
                    </div>

                    <h1 className="hero-title">
                        Describe your app.
                        <br />
                        <span className="hero-gradient-text">Watch the files appear.</span>
                    </h1>

                    <p className="hero-subtitle">
                        Codo is an autonomous, in-browser AI IDE. It reads your codebase, generates genuine
                        directory structures, executes terminal commands, and streams live code changes into Monaco.
                    </p>

                    {/* CTAs */}
                    <div className="hero-cta-group">
                        <button
                            onClick={handleAuth}
                            disabled={loading}
                            className="btn-primary btn-lg"
                        >
                            {loading ? (
                                <>
                                    <span className="btn-spinner" />
                                    <span>Connecting...</span>
                                </>
                            ) : userData ? (
                                <>
                                    <span>Enter IDE Workspace</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                        <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                                        <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>

                        <a href="#demo" className="btn-secondary btn-lg">
                            <span>Explore Interactive Demo</span>
                            <span className="arrow-down">↓</span>
                        </a>
                    </div>

                    {/* Trust Indicators */}
                    <div className="hero-trust">
                        <span className="trust-item">✨ 100 Free credits on signup</span>
                        <span className="trust-dot">•</span>
                        <span className="trust-item">⚡ 10 credits / prompt</span>
                        <span className="trust-dot">•</span>
                        <span className="trust-item">🔄 Auto-refund on failure</span>
                    </div>

                    {/* Live Operation Ticker Banner */}
                    <div className="ticker-wrapper">
                        <div className="ticker-label">
                            <span className="live-dot" />
                            AGENT STREAM
                        </div>
                        <div className="ticker-track">
                            <div className="ticker-marquee">
                                {[...AGENT_TICKER, ...AGENT_TICKER].map((item, idx) => (
                                    <div key={idx} className="ticker-pill">
                                        <span className="pill-icon">{item.icon}</span>
                                        <span className="pill-op" style={{ color: item.color }}>{item.op}</span>
                                        <span className="pill-file">{item.file}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Interactive Workflow Simulator ─────────────────────────── */}
            <section className="section-container" id="demo">
                <div className="section-header">
                    <span className="section-badge">INTERACTIVE SIMULATION</span>
                    <h2 className="section-title">Experience Codo in Four Steps</h2>
                    <p className="section-desc">
                        Drag or click through the stages to inspect how the autonomous agent constructs an entire
                        application from scratch.
                    </p>
                </div>

                {/* Step Selector Tabs */}
                <div className="stage-tabs">
                    {WORKFLOW_STAGES.map((stg, i) => (
                        <button
                            key={stg.id}
                            onClick={() => setActiveStage(i)}
                            className={`stage-tab-btn ${activeStage === i ? "stage-tab-active" : ""}`}
                        >
                            <span className="tab-num">0{i + 1}</span>
                            <span className="tab-label">{stg.badge.split(" · ")[1]}</span>
                        </button>
                    ))}
                </div>

                {/* Interactive Simulation Frame */}
                <div className="sim-grid">
                    {/* Left: Narrative explanation */}
                    <div className="sim-info-card">
                        <span className="sim-badge">{WORKFLOW_STAGES[activeStage].badge}</span>
                        <h3 className="sim-headline">{WORKFLOW_STAGES[activeStage].headline}</h3>
                        <p className="sim-body">{WORKFLOW_STAGES[activeStage].desc}</p>

                        <div className="sim-action-box">
                            <div className="action-box-header">
                                <span className="action-label">Agent Intent</span>
                                <span className="action-status">Ready</span>
                            </div>
                            <div className="action-box-content">
                                <code>"{WORKFLOW_STAGES[activeStage].samplePrompt}"</code>
                            </div>
                        </div>

                        {/* Interactive Scrubber Slider */}
                        <div className="slider-control">
                            <div className="slider-labels">
                                <span>Input</span>
                                <span>Inspection</span>
                                <span>Generation</span>
                                <span>Execution</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={3}
                                step={1}
                                value={activeStage}
                                onChange={(e) => setActiveStage(Number(e.target.value))}
                                className="stage-range-slider"
                            />
                        </div>
                    </div>

                    {/* Right: Mock IDE Interface */}
                    <div className="sim-ide-window">
                        {/* IDE Window Top Bar */}
                        <div className="ide-header">
                            <div className="ide-controls">
                                <span className="ctrl red" />
                                <span className="ctrl yellow" />
                                <span className="ctrl green" />
                            </div>
                            <div className="ide-title-bar">
                                <span className="proj-name">codo-workspace</span>
                                <span className="proj-sep">/</span>
                                <span className="proj-file">
                                    {activeStage === 0 && "agent-chat.ai"}
                                    {activeStage === 1 && "get_tree.json"}
                                    {activeStage === 2 && "index.html"}
                                    {activeStage === 3 && "localhost:3000"}
                                </span>
                            </div>
                            <div className="ide-status-pill">
                                <span className="status-ping" />
                                <span>Agent Active</span>
                            </div>
                        </div>

                        {/* IDE Dynamic Body based on Active Stage */}
                        <div className="ide-body">
                            {activeStage === 0 && (
                                <div className="stage-view-chat">
                                    <div className="chat-bubble user-bubble">
                                        <div className="bubble-author">You</div>
                                        <p>Build a modern Pomodoro timer with sound cues, custom focus intervals, and a dark obsidian UI.</p>
                                    </div>
                                    <div className="chat-bubble ai-bubble">
                                        <div className="bubble-author">
                                            <span className="ai-tag">Codo Agent</span>
                                            <span className="credits-cost">-10 credits</span>
                                        </div>
                                        <p>I will construct this project. Let me inspect your root directory, create necessary markup and styling, and set up the timer loop.</p>
                                        <div className="agent-thinking">
                                            <span className="thinking-bar" />
                                            <span>Running graph stream with Gemini 2.5 Flash...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStage === 1 && (
                                <div className="stage-view-tree">
                                    <div className="tree-op-banner">
                                        <span className="op-tag">TOOL CALL</span>
                                        <code>get_tree(projectId="codo-demo")</code>
                                    </div>
                                    <div className="tree-explorer">
                                        <div className="tree-item folder">📁 pomodoro-app/</div>
                                        <div className="tree-item sub empty">↳ (Directory is empty. Generating scaffolding...)</div>
                                    </div>
                                    <div className="tree-resolution-card">
                                        <span className="res-icon">✓</span>
                                        <div>
                                            <strong>Target Architecture Planned:</strong>
                                            <p>index.html (HTML5 structure) • styles.css (Glassmorphism layout) • app.js (Timer loop & state)</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStage === 2 && (
                                <div className="stage-view-code">
                                    <div className="code-sidebar">
                                        <div className="sidebar-title">FILES</div>
                                        <div className="code-file active">📄 index.html <span className="file-tag">new</span></div>
                                        <div className="code-file">📄 styles.css <span className="file-tag">new</span></div>
                                        <div className="code-file">📄 app.js <span className="file-tag">new</span></div>
                                    </div>
                                    <div className="code-editor-area">
                                        <pre className="code-content">
                                            <code>{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Obsidian Pomodoro</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="dark-theme">
  <div id="pomodoro-app">
    <div class="timer-display">25:00</div>
    <div class="controls">
      <button id="start-btn" class="btn-glow">Start Focus</button>
      <button id="reset-btn">Reset</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`}</code>
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {activeStage === 3 && (
                                <div className="stage-view-run">
                                    <div className="preview-canvas">
                                        <div className="preview-top">
                                            <span className="prev-url">http://localhost:3000</span>
                                            <span className="prev-refresh">↻</span>
                                        </div>
                                        <div className="mock-rendered-app">
                                            <div className="mock-timer-card">
                                                <div className="mock-timer-badge">FOCUS SESSION</div>
                                                <div className="mock-digits">24:59</div>
                                                <div className="mock-progress"><div className="mock-fill" /></div>
                                                <button className="mock-btn">PAUSE</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="terminal-footer">
                                        <div className="term-bar">
                                            <span>TERMINAL</span>
                                            <span>bash (active)</span>
                                        </div>
                                        <div className="term-logs">
                                            <code>$ ls -la</code>
                                            <code className="text-gray-400">index.html (420B)  styles.css (1.2KB)  app.js (2.4KB)</code>
                                            <code className="text-emerald-400">$ Server listening on port 3000 • Live sync enabled</code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Key Features ────────────────────────────────────────────── */}
            <section className="section-container" id="features">
                <div className="section-header">
                    <span className="section-badge">BUILT FOR SPEED</span>
                    <h2 className="section-title">Engineered Like a Native Workstation</h2>
                    <p className="section-desc">
                        No brittle iframes or toy sandboxes. Codo provides the genuine toolchain every engineer demands.
                    </p>
                </div>

                <div className="features-grid">
                    {FEATURES.map((feat, idx) => (
                        <div key={idx} className="feature-card">
                            <div className="feat-header">
                                <div className="feat-icon-box">{feat.icon}</div>
                                <span className="feat-tag">{feat.tag}</span>
                            </div>
                            <h3 className="feat-title">{feat.title}</h3>
                            <p className="feat-desc">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Pricing Section ─────────────────────────────────────────── */}
            <section className="section-container" id="pricing">
                <div className="section-header">
                    <span className="section-badge">TRANSPARENT PRICING</span>
                    <h2 className="section-title">Simple Credit Packs. No Hidden Fees.</h2>
                    <p className="section-desc">
                        Start building for free with 100 bonus credits. Top up only when you need deeper generation runs.
                    </p>
                </div>

                <div className="pricing-grid">
                    {PLANS.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`pricing-card ${plan.highlight ? "pricing-card-featured" : ""}`}
                        >
                            {plan.tag && <div className="pricing-tag-banner">{plan.tag}</div>}

                            <div className="plan-head">
                                <h3 className="plan-name">{plan.name}</h3>
                                <p className="plan-sub">{plan.sub}</p>
                            </div>

                            <div className="plan-price-block">
                                <span className="plan-price">{plan.price}</span>
                                {plan.price !== "Free" && <span className="plan-period">/ pack</span>}
                            </div>

                            <div className="plan-credits-pill">
                                <strong>{plan.credits}</strong>
                                <span>• {plan.prompts}</span>
                            </div>

                            <ul className="plan-features-list">
                                {plan.features.map((item, fIdx) => (
                                    <li key={fIdx} className="feature-item">
                                        <svg className="w-5 h-5 feature-check" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    if (userData) {
                                        navigate("/plans");
                                    } else {
                                        handleAuth();
                                    }
                                }}
                                className={`plan-cta-btn ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
                            >
                                {userData ? (plan.price === "Free" ? "Current Plan" : "Upgrade") : plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ Section ─────────────────────────────────────────────── */}
            <section className="section-container" id="faq">
                <div className="section-header">
                    <span className="section-badge">FREQUENTLY ASKED QUESTIONS</span>
                    <h2 className="section-title">Everything You Need to Know</h2>
                </div>

                <div className="faq-container">
                    {FAQS.map((faq, idx) => (
                        <div
                            key={idx}
                            className={`faq-item ${openFaq === idx ? "faq-open" : ""}`}
                            onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                        >
                            <div className="faq-question">
                                <h4>{faq.q}</h4>
                                <span className="faq-toggle">{openFaq === idx ? "−" : "+"}</span>
                            </div>
                            {openFaq === idx && (
                                <div className="faq-answer">
                                    <p>{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Bottom Call To Action ───────────────────────────────────── */}
            <section className="cta-banner-section">
                <div className="cta-banner-card">
                    <div className="cta-glow" />
                    <h2 className="cta-title">Start Building Without Leaving Your Browser</h2>
                    <p className="cta-subtitle">
                        Claim 100 free AI credits instantly with Google. Turn ideas into working web software in seconds.
                    </p>
                    <div className="cta-btn-wrapper">
                        <button
                            onClick={handleAuth}
                            disabled={loading}
                            className="btn-primary btn-lg"
                        >
                            {loading ? (
                                <span className="btn-spinner" />
                            ) : userData ? (
                                "Go to My Projects"
                            ) : (
                                "Claim 100 Free Credits"
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="codo-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <div className="brand-logo">
                            <span className="logo-badge">AI</span>
                            <span className="brand-text">Codo</span>
                        </div>
                        <p className="footer-tagline">
                            The intelligent in-browser developer environment. Built with React, Node, Express, and LangGraph.
                        </p>
                    </div>

                    <div className="footer-links-group">
                        <div className="link-col">
                            <h5>Navigation</h5>
                            <a href="#demo">Workflow</a>
                            <a href="#features">Features</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#faq">FAQ</a>
                        </div>
                        <div className="link-col">
                            <h5>Community</h5>
                            <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub Repository</a>
                            <a href="https://github.com/AdityaKumar3594/Codo/issues" target="_blank" rel="noreferrer">Report Issue</a>
                            <a href="https://github.com/AdityaKumar3594" target="_blank" rel="noreferrer">Developer Profile</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 Codo by Aditya Kumar. Released for software craftsmen worldwide.</p>
                    <div className="footer-meta">
                        <span>Protected by Firebase Auth</span>
                        <span>•</span>
                        <span>Razorpay Verified</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ─── Stylesheet ───────────────────────────────────────────────────────────── */

const PAGE_STYLES = `
/* CSS Reset & Variables */
.codo-page {
  --bg-dark: #09090b;
  --bg-card: #121217;
  --bg-card-hover: #181820;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(244, 63, 94, 0.4);
  --accent-rose: #f43f5e;
  --accent-crimson: #e11d48;
  --accent-glow: rgba(225, 29, 72, 0.25);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: var(--font-family);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  line-height: 1.6;
}

/* Ambient glow orbs */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  pointer-events: none;
  z-index: 0;
}
.glow-top {
  width: 600px;
  height: 400px;
  background: radial-gradient(circle, rgba(225, 29, 72, 0.15) 0%, transparent 70%);
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
}
.glow-bottom {
  width: 700px;
  height: 500px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
  bottom: 200px;
  right: -100px;
}

/* Navbar */
.codo-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  transition: all 0.3s ease;
  border-bottom: 1px solid transparent;
}
.nav-scrolled {
  background: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(12px);
  border-color: var(--border-subtle);
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
}
.logo-badge {
  background: linear-gradient(135deg, var(--accent-rose), var(--accent-crimson));
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}
.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
}
.nav-link:hover {
  color: #fff;
}
.gh-star-pill {
  margin-left: 6px;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 7px;
  border-radius: 12px;
  font-size: 11px;
  color: #fbbf24;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #e11d48, #be123c);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 18px var(--accent-glow);
}
.btn-primary:hover {
  background: linear-gradient(135deg, #f43f5e, #e11d48);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(225, 29, 72, 0.4);
}
.btn-primary:active {
  transform: translateY(0);
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border: 1px solid var(--border-subtle);
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  text-decoration: none;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}
.btn-sm {
  padding: 8px 18px;
  font-size: 13px;
}
.btn-lg {
  padding: 14px 28px;
  font-size: 15px;
}
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Hero Section */
.hero-section {
  position: relative;
  z-index: 10;
  padding: 150px 24px 80px;
  display: flex;
  justify-content: center;
  text-align: center;
}
.hero-content {
  max-width: 860px;
  margin: 0 auto;
}
.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(225, 29, 72, 0.1);
  border: 1px solid rgba(225, 29, 72, 0.3);
  border-radius: 20px;
  font-size: 13px;
  color: #fca5a5;
  margin-bottom: 24px;
}
.pill-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f43f5e;
  box-shadow: 0 0 8px #f43f5e;
}
.pill-tag {
  background: var(--accent-crimson);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.hero-title {
  font-size: clamp(2.8rem, 6.5vw, 4.8rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.04em;
  margin-bottom: 24px;
}
.hero-gradient-text {
  background: linear-gradient(135deg, #fff 20%, #fda4af 60%, #e11d48 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-subtitle {
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  color: var(--text-muted);
  max-width: 680px;
  margin: 0 auto 36px;
  line-height: 1.6;
}
.hero-cta-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.arrow-down {
  margin-left: 8px;
  font-size: 16px;
}
.hero-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 48px;
  flex-wrap: wrap;
}
.trust-dot {
  color: #334155;
}

/* Ticker */
.ticker-wrapper {
  margin-top: 20px;
  background: rgba(18, 18, 23, 0.7);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
}
.ticker-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--accent-rose);
  white-space: nowrap;
}
.live-dot {
  width: 6px;
  height: 6px;
  background: #f43f5e;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
.ticker-track {
  overflow: hidden;
  width: 100%;
}
.ticker-marquee {
  display: flex;
  gap: 12px;
  width: max-content;
  animation: marquee 26s linear infinite;
}
.ticker-marquee:hover {
  animation-play-state: paused;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
}
.pill-op {
  font-weight: 600;
}
.pill-file {
  color: var(--text-muted);
}

/* Common Section Layout */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 24px;
  position: relative;
  z-index: 10;
}
.section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 60px;
}
.section-badge {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: var(--accent-rose);
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 12px;
}
.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
  line-height: 1.2;
}
.section-desc {
  color: var(--text-muted);
  font-size: 16px;
}

/* Simulation Section */
.stage-tabs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.stage-tab-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.stage-tab-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
.stage-tab-active {
  background: rgba(225, 29, 72, 0.15);
  border-color: var(--accent-rose);
  color: #fff;
}
.tab-num {
  color: var(--accent-rose);
  font-size: 12px;
}
.sim-grid {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 32px;
  align-items: stretch;
}
.sim-info-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.sim-badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-rose);
  letter-spacing: 0.5px;
}
.sim-headline {
  font-size: 24px;
  font-weight: 700;
  margin: 12px 0;
  line-height: 1.3;
}
.sim-body {
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
}
.sim-action-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
}
.action-box-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.action-status {
  color: #10b981;
}
.action-box-content code {
  color: #fbcfe8;
  font-size: 13px;
  font-family: ui-monospace, monospace;
}
.slider-control {
  margin-top: auto;
}
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 8px;
}
.stage-range-slider {
  width: 100%;
  accent-color: var(--accent-rose);
  cursor: pointer;
}

/* Mock IDE */
.sim-ide-window {
  background: #0d0d12;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  min-height: 480px;
}
.ide-header {
  background: #14141c;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ide-controls {
  display: flex;
  gap: 6px;
}
.ctrl {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.ctrl.red { background: #ef4444; }
.ctrl.yellow { background: #f59e0b; }
.ctrl.green { background: #10b981; }
.ide-title-bar {
  font-size: 12px;
  color: var(--text-muted);
}
.proj-name { color: #fff; font-weight: 600; }
.proj-sep { margin: 0 4px; color: #475569; }
.ide-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 3px 8px;
  border-radius: 12px;
}
.status-ping {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
}
.ide-body {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* Chat view */
.stage-view-chat {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chat-bubble {
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
}
.user-bubble {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  align-self: flex-end;
  max-width: 85%;
}
.ai-bubble {
  background: rgba(225, 29, 72, 0.08);
  border: 1px solid rgba(225, 29, 72, 0.2);
  align-self: flex-start;
  max-width: 90%;
}
.bubble-author {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #94a3b8;
}
.ai-tag { color: var(--accent-rose); }
.credits-cost {
  background: rgba(225, 29, 72, 0.2);
  color: #fda4af;
  padding: 1px 6px;
  border-radius: 4px;
}
.agent-thinking {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #94a3b8;
}
.thinking-bar {
  width: 14px;
  height: 14px;
  border: 2px solid var(--accent-rose);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Tree view */
.stage-view-tree {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tree-op-banner {
  background: #1e1e2d;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.op-tag {
  background: var(--accent-crimson);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.tree-explorer {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 8px;
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
.tree-item.folder { color: #38bdf8; font-weight: 600; }
.tree-item.sub { padding-left: 20px; color: #64748b; font-style: italic; margin-top: 6px; }
.tree-resolution-card {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 14px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  font-size: 13px;
}
.res-icon {
  color: #10b981;
  font-weight: 800;
}

/* Code view */
.stage-view-code {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  height: 100%;
}
.code-sidebar {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 12px;
}
.sidebar-title {
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.code-file {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.code-file.active {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.file-tag {
  font-size: 9px;
  background: rgba(225, 29, 72, 0.2);
  color: #fda4af;
  padding: 1px 4px;
  border-radius: 3px;
}
.code-editor-area {
  background: #000;
  border-radius: 8px;
  padding: 14px;
  overflow: auto;
}
.code-content {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #e2e8f0;
}

/* Run preview view */
.stage-view-run {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}
.preview-canvas {
  flex: 1;
  background: #181822;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.preview-top {
  background: #232332;
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
}
.mock-rendered-app {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.mock-timer-card {
  background: #09090b;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px 32px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
}
.mock-timer-badge {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--accent-rose);
  font-weight: 700;
}
.mock-digits {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1px;
  margin: 6px 0;
  color: #fff;
}
.mock-progress {
  width: 140px;
  height: 4px;
  background: #27272a;
  border-radius: 4px;
  margin: 0 auto 14px;
  overflow: hidden;
}
.mock-fill {
  width: 75%;
  height: 100%;
  background: var(--accent-rose);
}
.mock-btn {
  background: var(--accent-crimson);
  border: 0;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.terminal-footer {
  background: #050508;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  padding: 10px 14px;
  font-family: ui-monospace, monospace;
}
.term-bar {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #64748b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.term-logs code {
  display: block;
  font-size: 11px;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}
.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 32px 28px;
  transition: all 0.25s ease;
}
.feature-card:hover {
  transform: translateY(-4px);
  border-color: rgba(225, 29, 72, 0.3);
  background: var(--bg-card-hover);
}
.feat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.feat-icon-box {
  width: 44px;
  height: 44px;
  background: rgba(225, 29, 72, 0.1);
  border: 1px solid rgba(225, 29, 72, 0.25);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-rose);
}
.feat-tag {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}
.feat-title {
  font-size: 19px;
  font-weight: 700;
  margin-bottom: 12px;
}
.feat-desc {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
}

/* Pricing Grid */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 28px;
  align-items: stretch;
}
.pricing-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 36px 30px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.25s;
}
.pricing-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}
.pricing-card-featured {
  background: #16151f;
  border-color: var(--accent-rose);
  box-shadow: 0 10px 40px rgba(225, 29, 72, 0.2);
  transform: scale(1.02);
}
.pricing-tag-banner {
  position: absolute;
  top: -12px;
  right: 28px;
  background: linear-gradient(135deg, var(--accent-rose), var(--accent-crimson));
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.plan-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}
.plan-sub {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 24px;
}
.plan-price-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 14px;
}
.plan-price {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1px;
}
.plan-period {
  color: var(--text-muted);
  font-size: 14px;
}
.plan-credits-pill {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #fda4af;
  margin-bottom: 24px;
}
.plan-features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #cbd5e1;
}
.feature-check {
  color: #10b981;
  flex-shrink: 0;
}
.plan-cta-btn {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* FAQ */
.faq-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.faq-item {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.2s;
}
.faq-item:hover {
  border-color: rgba(255, 255, 255, 0.15);
}
.faq-open {
  border-color: var(--accent-rose);
  background: #16151f;
}
.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.faq-question h4 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}
.faq-toggle {
  font-size: 22px;
  color: var(--text-muted);
}
.faq-answer {
  margin-top: 14px;
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}

/* CTA Banner */
.cta-banner-section {
  max-width: 1200px;
  margin: 0 auto 100px;
  padding: 0 24px;
}
.cta-banner-card {
  background: linear-gradient(135deg, #181520, #0f0f15);
  border: 1px solid rgba(225, 29, 72, 0.3);
  border-radius: 24px;
  padding: 80px 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
.cta-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 300px;
  background: radial-gradient(circle, rgba(225, 29, 72, 0.2) 0%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
}
.cta-title {
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
  line-height: 1.2;
}
.cta-subtitle {
  color: var(--text-muted);
  font-size: 17px;
  max-width: 600px;
  margin: 0 auto 36px;
}
.cta-btn-wrapper {
  display: inline-block;
}

/* Footer */
.codo-footer {
  border-top: 1px solid var(--border-subtle);
  background: #060608;
  padding: 80px 24px 40px;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto 60px;
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}
.footer-brand {
  max-width: 380px;
}
.footer-tagline {
  color: #64748b;
  font-size: 14px;
  margin-top: 14px;
  line-height: 1.6;
}
.footer-links-group {
  display: flex;
  gap: 60px;
}
.link-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.link-col h5 {
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.link-col a {
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}
.link-col a:hover {
  color: #fff;
}
.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #475569;
  flex-wrap: wrap;
  gap: 16px;
}
.footer-meta {
  display: flex;
  gap: 12px;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .sim-grid {
    grid-template-columns: 1fr;
  }
  .stage-view-code {
    grid-template-columns: 1fr;
  }
  .nav-links {
    display: none;
  }
}
`;
