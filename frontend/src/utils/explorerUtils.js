// ─── imports ──────────────────────────────────────────────────────────────────
import { IoLogoJavascript, IoLogoReact, IoLogoHtml5, IoLogoSass } from "react-icons/io5";
import { SiTypescript, SiPrisma, SiGraphql, SiDocker, SiYaml, SiToml, SiRust, SiGo, SiKotlin, SiSwift, SiPhp, SiRuby, SiCplusplus, SiC } from "react-icons/si";
import { BsFiletypeJson, BsFiletypePdf, BsFiletypeSvg, BsFiletypeXml, BsFiletypeSql } from "react-icons/bs";
import { FaCss3, FaPython, FaJava, FaMarkdown, FaGitAlt, FaDatabase } from "react-icons/fa";
import { AiOutlinePython } from "react-icons/ai";
import { HiOutlineDocument } from "react-icons/hi2";
import { VscTerminalBash } from "react-icons/vsc";
import { LuFileText, LuImage, LuFileJson } from "react-icons/lu";

// ─── known full filenames (takes priority over extension) ─────────────────────
const KNOWN_NAMES = {
    "dockerfile":        { icon: SiDocker,       color: "text-sky-400" },
    "docker-compose.yml":{ icon: SiDocker,       color: "text-sky-400" },
    "docker-compose.yaml":{ icon: SiDocker,      color: "text-sky-400" },
    ".gitignore":        { icon: FaGitAlt,        color: "text-orange-500" },
    ".env":              { icon: LuFileText,      color: "text-violet-400" },
    ".env.local":        { icon: LuFileText,      color: "text-violet-400" },
    ".env.production":   { icon: LuFileText,      color: "text-violet-400" },
    ".env.development":  { icon: LuFileText,      color: "text-violet-400" },
    "package.json":      { icon: BsFiletypeJson,  color: "text-amber-400" },
    "package-lock.json": { icon: LuFileJson,      color: "text-amber-300" },
    "tsconfig.json":     { icon: SiTypescript,    color: "text-blue-400" },
    "readme.md":         { icon: FaMarkdown,      color: "text-gray-300" },
    "prisma.schema":     { icon: SiPrisma,        color: "text-teal-400" },
};

// ─── extension map ─────────────────────────────────────────────────────────────
const EXT_MAP = {
    // JavaScript family
    js:    { icon: IoLogoJavascript, color: "text-yellow-400" },
    mjs:   { icon: IoLogoJavascript, color: "text-yellow-400" },
    cjs:   { icon: IoLogoJavascript, color: "text-yellow-400" },
    jsx:   { icon: IoLogoReact,      color: "text-sky-400" },

    // TypeScript family
    ts:    { icon: SiTypescript,     color: "text-blue-400" },
    tsx:   { icon: IoLogoReact,      color: "text-blue-500" },
    d_ts:  { icon: SiTypescript,     color: "text-blue-300" },

    // Styles
    css:   { icon: FaCss3,           color: "text-violet-400" },
    scss:  { icon: IoLogoSass,       color: "text-pink-400" },
    sass:  { icon: IoLogoSass,       color: "text-pink-400" },
    less:  { icon: FaCss3,           color: "text-blue-300" },

    // Markup
    html:  { icon: IoLogoHtml5,      color: "text-orange-400" },
    htm:   { icon: IoLogoHtml5,      color: "text-orange-400" },
    xml:   { icon: BsFiletypeXml,    color: "text-orange-300" },
    svg:   { icon: BsFiletypeSvg,    color: "text-yellow-300" },

    // Data
    json:  { icon: BsFiletypeJson,   color: "text-amber-400" },
    yaml:  { icon: SiYaml,           color: "text-rose-400" },
    yml:   { icon: SiYaml,           color: "text-rose-400" },
    toml:  { icon: SiToml,           color: "text-orange-300" },
    csv:   { icon: FaDatabase,       color: "text-green-400" },
    sql:   { icon: BsFiletypeSql,    color: "text-blue-300" },

    // Python
    py:    { icon: AiOutlinePython,  color: "text-emerald-400" },
    pyw:   { icon: AiOutlinePython,  color: "text-emerald-400" },

    // Java / JVM
    java:  { icon: FaJava,           color: "text-red-400" },
    kt:    { icon: SiKotlin,         color: "text-purple-400" },
    kts:   { icon: SiKotlin,         color: "text-purple-400" },

    // Systems
    rs:    { icon: SiRust,           color: "text-orange-500" },
    go:    { icon: SiGo,             color: "text-sky-400" },
    c:     { icon: SiC,              color: "text-blue-400" },
    cpp:   { icon: SiCplusplus,      color: "text-blue-500" },
    h:     { icon: SiC,              color: "text-blue-300" },
    hpp:   { icon: SiCplusplus,      color: "text-blue-300" },

    // Scripting
    sh:    { icon: VscTerminalBash,  color: "text-emerald-400" },
    bash:  { icon: VscTerminalBash,  color: "text-emerald-400" },
    zsh:   { icon: VscTerminalBash,  color: "text-emerald-400" },
    ps1:   { icon: VscTerminalBash,  color: "text-blue-400" },
    rb:    { icon: SiRuby,           color: "text-red-400" },
    php:   { icon: SiPhp,            color: "text-violet-400" },

    // Swift / mobile
    swift: { icon: SiSwift,          color: "text-orange-400" },

    // GraphQL / Prisma
    graphql: { icon: SiGraphql,      color: "text-pink-500" },
    gql:   { icon: SiGraphql,        color: "text-pink-500" },
    prisma:{ icon: SiPrisma,         color: "text-teal-400" },

    // Docs / text
    md:    { icon: FaMarkdown,       color: "text-gray-300" },
    mdx:   { icon: FaMarkdown,       color: "text-gray-300" },
    txt:   { icon: LuFileText,       color: "text-gray-400" },
    pdf:   { icon: BsFiletypePdf,    color: "text-red-400" },
    lock:  { icon: LuFileText,       color: "text-gray-500" },

    // Images
    png:   { icon: LuImage,          color: "text-pink-400" },
    jpg:   { icon: LuImage,          color: "text-pink-400" },
    jpeg:  { icon: LuImage,          color: "text-pink-400" },
    gif:   { icon: LuImage,          color: "text-purple-400" },
    webp:  { icon: LuImage,          color: "text-purple-400" },
    ico:   { icon: LuImage,          color: "text-yellow-300" },

    // Config / misc
    env:   { icon: LuFileText,       color: "text-violet-400" },
};

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Returns { icon: ComponentClass, color: "text-*" } for a given filename.
 * Falls back to a generic document icon if unrecognised.
 */
export function getFileIcon(name = "") {
    const lower = name.toLowerCase();

    // 1. Check known full filenames first
    if (KNOWN_NAMES[lower]) return KNOWN_NAMES[lower];

    // 2. Check extension
    const ext = lower.includes(".") ? lower.split(".").pop() : "";
    if (EXT_MAP[ext]) return EXT_MAP[ext];

    // 3. Fallback
    return { icon: HiOutlineDocument, color: "text-gray-400" };
}

// ─── folder name → icon colour ────────────────────────────────────────────────
const FOLDER_COLORS = {
    src:          "text-sky-400",
    public:       "text-emerald-400",
    images:       "text-pink-400",
    img:          "text-pink-400",
    assets:       "text-pink-400",
    css:          "text-violet-400",
    styles:       "text-violet-400",
    js:           "text-yellow-400",
    scripts:      "text-yellow-400",
    components:   "text-sky-400",
    pages:        "text-sky-400",
    utils:        "text-amber-400",
    hooks:        "text-teal-400",
    node_modules: "text-zinc-600",
    dist:         "text-zinc-500",
    build:        "text-zinc-500",
    lib:          "text-indigo-400",
    types:        "text-blue-400",
    api:          "text-green-400",
    routes:       "text-orange-400",
    middleware:   "text-rose-400",
    services:     "text-purple-400",
    config:       "text-gray-400",
    store:        "text-pink-400",
    redux:        "text-purple-500",
    context:      "text-cyan-400",
    test:         "text-yellow-300",
    tests:        "text-yellow-300",
    __tests__:    "text-yellow-300",
};

export function folderColor(name = "") {
    return FOLDER_COLORS[name.toLowerCase()] ?? "text-sky-400";
}
