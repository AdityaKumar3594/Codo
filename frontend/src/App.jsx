import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectPage from "./pages/ProjectPage";
import Plan from "./pages/Plan";
import LandingPage from "./pages/LandingPage";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "./redux/userSlice";
import { me } from "./features/me";

// Redirects unauthenticated users to "/" (Dashboard handles the login UI)
function ProtectedRoute({ children }) {
    const userData = useSelector((state) => state.user.userData);
    const loading  = useSelector((state) => state.user.loading);

    // While the initial me() fetch is in flight, render nothing to avoid flash
    if (loading) return null;
    if (!userData) return <Navigate to="/" replace />;
    return children;
}

function App() {
    const dispatch = useDispatch();
    const { isDark } = useSelector((state) => state.theme);

    useEffect(() => {
        const fetch = async () => {
            const data = await me();
            dispatch(setUserData(data));
        };
        fetch();
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/plans" element={<Plan />} />
                <Route path="/plan" element={<Plan />} />
                <Route
                    path="/project/:id"
                    element={
                        <ProtectedRoute>
                            <ProjectPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
