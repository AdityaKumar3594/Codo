import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import proxy from "express-http-proxy";
import httpProxy  from "http-proxy";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
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

// ── COOP header — allows Firebase auth popup to communicate back ──────────────
// Without this, window.closed / window.close() are blocked by the browser
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});

app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── REST routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",    proxy(process.env.AUTH_SERVICE_URL || "http://localhost:8001"));
app.use("/api/project", protect, proxyWithHeader(process.env.PROJECT_SERVICE_URL || "http://localhost:8002"));
app.use("/api/file",    protect, proxyWithHeader(process.env.FILE_SERVICE_URL || "http://localhost:8003"));
app.use("/api/payment/webhook", proxy(process.env.PAYMENT_SERVICE_URL || "http://localhost:8006"));
app.use("/api/payment/plans",   proxy(process.env.PAYMENT_SERVICE_URL || "http://localhost:8006"));
app.use("/api/payment",         protect, proxyWithHeader(process.env.PAYMENT_SERVICE_URL  || "http://localhost:8006"));
app.use(
    "/api/ai",
    protect,
    createProxyMiddleware({
        target: process.env.AI_SERVICE_URL || "http://localhost:8004",
        changeOrigin: true,
        pathRewrite: { "^/api/ai": "" },
        proxyTimeout: 0,
        timeout: 0,
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.user) proxyReq.setHeader("x-user-id", String(req.user._id));
                fixRequestBody(proxyReq, req);
            },
        },
    })
);
app.use("/api/terminal",        protect, proxy(process.env.TERMINAL_SERVICE_URL || "http://localhost:8005"));
app.get("/api/me",              protect, getCurrentUser);

app.get("/", (req, res) => {
    res.json({ message: "Hello World from gateway" });
});

const socketProxy=httpProxy.createProxyServer({
    target:process.env.TERMINAL_SERVICE_URL || "http://localhost:8005",
    ws:true
})

socketProxy.on("error", (err, req, res) => {
    console.error("Socket proxy error:", err.message);
    if (res && !res.headersSent && res.writeHead) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Terminal service unavailable" }));
    }
});

app.use("/socket.io",(req,res)=>{
    socketProxy.web(req,res,{
        target:process.env.TERMINAL_SERVICE_URL || "http://localhost:8005",
    })
})

server.on("upgrade",(req,socket,head)=>{
    if(req.url.startsWith("/socket.io")){
        socketProxy.ws(req,socket,head,{
            target:process.env.TERMINAL_SERVICE_URL || "http://localhost:8005",
        })
    }
})



server.listen(port,"0.0.0.0", () => {
    console.log(`Gateway running on port ${port}`);
});
