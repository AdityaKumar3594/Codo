import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ─── axios instance pointed at the auth service ───────────────────────────────
const authAPI = axios.create({
    baseURL: process.env.AUTH_SERVICE_URL || "http://localhost:8001",
    headers: { "Content-Type": "application/json" },
});

// Normalise axios error into a clean string message
const errMsg = (error) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    error.message;

/**
 * Deducts credits for a user by calling the Auth service.
 * Supports both calling signatures:
 *   - deductCredits({ userId, amount, throwOnError })
 *   - deductCredits(userId, amount)
 *
 * @param {string|{userId: string, amount?: number, throwOnError?: boolean}} userOrOptions - User ID or options object
 * @param {number} [maybeAmount=1] - Credit amount (when passing userId as first argument)
 * @returns {Promise<{ success: boolean, credits?: number, message?: string, status?: number }>}
 */
export const deductCredits = async (userOrOptions, maybeAmount = 1) => {
    let userId;
    let amount = 1;
    let throwOnError = false;

    if (typeof userOrOptions === "object" && userOrOptions !== null) {
        userId = userOrOptions.userId;
        amount = typeof userOrOptions.amount === "number" ? userOrOptions.amount : 1;
        throwOnError = Boolean(userOrOptions.throwOnError);
    } else {
        userId = userOrOptions;
        if (typeof maybeAmount === "number") {
            amount = maybeAmount;
        }
    }

    if (!userId) {
        const message = "userId is required to deduct credits";
        if (throwOnError) {
            const err = new Error(message);
            err.status = 400;
            throw err;
        }
        return {
            success: false,
            message,
            status: 400,
        };
    }

    try {
        const { data } = await authAPI.post("/user/deduct-credits", {
            userId: String(userId),
            amount: Number(amount),
        });

        return {
            success: true,
            credits: data?.credits,
            status: 200,
        };
    } catch (error) {
        const message = errMsg(error);
        const status = error?.response?.status || 500;
        console.error("deductCredits error:", message);

        if (throwOnError) {
            const err = new Error(message);
            err.status = status;
            err.response = error?.response;
            throw err;
        }

        return {
            success: false,
            message,
            status,
        };
    }
};

export default deductCredits;
