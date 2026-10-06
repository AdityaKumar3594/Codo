
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "./redux/userSlice";
import { me } from "./features/me";

function App() {
    const dispatch=useDispatch()
    const { isDark } = useSelector((state) => state.theme)

    useEffect(()=>{
        const fetch=async ()=>{
            const data=await me()
            dispatch(setUserData(data))
        }
        fetch()
    },[])

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark)
    }, [isDark])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;