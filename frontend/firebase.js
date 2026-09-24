import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "codo-007.firebaseapp.com",
  projectId: "codo-007",
  storageBucket: "codo-007.firebasestorage.app",
  messagingSenderId: "734507316800",
  appId: "1:734507316800:web:f51313797aa4f0dc50d1a5",
  measurementId: "G-4V6447R81F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth=getAuth(app);
export const googleProvider=new GoogleAuthProvider()