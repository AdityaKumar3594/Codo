import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8006;

app.use(express.json());

app.use("/", paymentRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Payment service is running" });
});

connectDB();

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
