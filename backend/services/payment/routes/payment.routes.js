import express from "express";
import {
  getPlans,
  createOrder,
  verifyPayment,
  getPaymentHistory,
  handleWebhook,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/plans", getPlans);
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/history", getPaymentHistory);
router.post("/webhook", handleWebhook);

export default router;
