import express from "express";
import { login, logout,deductCredits,addCredits } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.get("/logout", logout);
router.get("/user/deduct-credits",deductCredits)
router.get("/user/add-credits", addCredits)
export default router;