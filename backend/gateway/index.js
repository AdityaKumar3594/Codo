import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import proxy from "express-http-proxy";
import { createProxyMiddleware } from "http-proxy-middleware";
import { protect } from "./middleware/protect.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";

dotenv.config();

const port = process.env.PORT || 8000;

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());

// ── REST routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",    proxy(process.env.AUTH_SERVICE_URL));
app.use("/api/project", protect, proxyWithHeader(process.env.PROJECT_SERVICE_URL));
app.use("/api/file",    protect, proxyWithHeader(process.env.FILE_SERVICE_URL));
app.use("/api/ai",      protect, proxyWithHeader(process.env.AI_SERVICE_URL));
app.use("/api/payment/webhook", proxy(process.env.PAYMENT_SERVICE_URL));
app.use("/api/payment", protect, proxyWithHeader(process.env.PAYMENT_SERVICE_URL));
app.get("/api/me",      protect, getCurrentUser);

app.get("/", (req, res) => {
    res.json({ message: "Hello World from gateway" });
});

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── Terminal Socket.IO proxy ──────────────────────────────────────────────────
// Socket.IO client connects to:  ws://localhost:8000  with  path: "/terminal/socket.io"
// That means upgrade requests arrive at /terminal/socket.io/...
// We proxy them straight to the terminal service at port 8005 keeping the path intact.
const terminalProxy = createProxyMiddleware({
    target:       process.env.TERMINAL_SERVICE_URL || "http://localhost:8005",
    changeOrigin: true,
    ws:           true,
    pathRewrite:  { "^/terminal": "" },  // strip prefix → terminal service sees /socket.io/...
    on: {
        error: (err, req, res) => {
            console.error("Terminal proxy error:", err.message);
            if (res?.headersSent === false && res?.writeHead) {
                res.writeHead(502);
                res.end("Terminal service unavailable");
            }
        },
    },
});

// Register as Express middleware for the HTTP leg of Socket.IO (polling fallback + handshake)
app.use("/terminal", terminalProxy);

// Forward WebSocket upgrades — hpm v4 exposes catchUpgradeRequest(server)
terminalProxy.upgrade; // ensure the property is accessed (noop, just for clarity)
server.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith("/terminal")) {
        terminalProxy.upgrade(req, socket, head);
    } else {
        socket.destroy();
    }
});

server.listen(port, () => {
    console.log(`Gateway running on port ${port}`);
});
