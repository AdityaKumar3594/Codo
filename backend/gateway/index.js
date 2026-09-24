import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import proxy from "express-http-proxy";

dotenv.config();

const port=process.env.PORT || 8000;

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json())

app.use("/api/auth",proxy(process.env.AUTH_SERVICE_URL))
app.get('/',(req,res)=>{
    res.json({"message":"Hello World from gateway"});
})

app.listen(port, () => {
    console.log(`Gateway running on port ${port}`);
})
