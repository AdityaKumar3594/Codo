import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

// Generic forwarder to auth service
const forwardToAuth = async (req, res) => {
  try {
    const url = `${AUTH_SERVICE_URL}${req.originalUrl}`;

    const headers = { "Content-Type": "application/json" };
    if (req.headers.authorization) headers["Authorization"] = req.headers.authorization;
    if (req.headers.cookie) headers["Cookie"] = req.headers.cookie;

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    // Forward Set-Cookie headers from auth service
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) res.setHeader("Set-Cookie", setCookie);

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Auth forward error:", error.message);
    res.status(502).json({ success: false, message: "Auth service unavailable" });
  }
};

// Route all /api/auth/* to auth service
app.use("/api/auth", forwardToAuth);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, service: "gateway", status: "running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
