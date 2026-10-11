import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
        loading: true,  // true until the initial me() fetch resolves
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload;
            state.loading  = false;
        },
        clearUserData: (state) => {
            state.userData = null;
            state.loading  = false;
        },
    },
});

export const { setUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;
