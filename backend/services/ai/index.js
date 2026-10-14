import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/ai.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

app.use("/", router);

app.get("/health", (req, res) => {
    res.json({ message: "AI service is running" });
});

connectDB();

app.listen(PORT, () => {
    console.log(`AI service running on port ${PORT}`);
});