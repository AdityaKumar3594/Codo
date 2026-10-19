import { api } from "../utils/axios";

export const getPlans = async () => {
    try {
        const { data } = await api.get("/api/payment/plans");
        return data?.plans || null;
    } catch (error) {
        console.error("Failed to fetch plans:", error);
        return null;
    }
};

export const createPaymentOrder = async (plan) => {
    try {
        const { data } = await api.post("/api/payment/create-order", { plan });
        return data;
    } catch (error) {
        console.error("Failed to create order:", error);
        throw error;
    }
};

export const testUpgradePlan = async (plan) => {
    try {
        const { data } = await api.post("/api/payment/test-upgrade", { plan });
        return data;
    } catch (error) {
        console.error("Test upgrade failed:", error);
        throw error;
    }
};
