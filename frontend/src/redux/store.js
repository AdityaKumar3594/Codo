import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import themeReducer from "./themeSlice";
import projectReducer from "./projectSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        theme: themeReducer,
        project: projectReducer,
    },
});