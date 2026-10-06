import { createSlice } from "@reduxjs/toolkit";

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialDark = savedTheme ? savedTheme === "dark" : prefersDark;

const themeSlice = createSlice({
    name: "theme",
    initialState: {
        isDark: initialDark,
    },
    reducers: {
        toggleTheme: (state) => {
            state.isDark = !state.isDark;
            localStorage.setItem("theme", state.isDark ? "dark" : "light");
        },
    },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
