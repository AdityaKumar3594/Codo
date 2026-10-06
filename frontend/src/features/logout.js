import { api } from "../utils/axios";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

export const logout = async () => {
    try {
        await api.post("/api/auth/logout");
        await signOut(auth);
        return true;
    } catch (error) {
        console.error("Logout error:", error);
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Firebase signout error:", e);
        }
        return false;
    }
};
