import { signInWithPopup } from "firebase/auth";
import React from "react"
import { auth,googleProvider } from "../firebase";
import { login } from "./features/login";
import { BrowserRouter,Routes,Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard"

function App() {

    return (
        <BrowserRouter>
            <Routes>
                
                <Route path="/dashboard" element={<Dashboard/>}/>
            </Routes>
        


        </BrowserRouter>
    );
}

export default App;