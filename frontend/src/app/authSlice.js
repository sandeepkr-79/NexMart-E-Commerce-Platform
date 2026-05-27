import { createSlice } from "@reduxjs/toolkit";

let storedUser = null;

try {
  const userData = localStorage.getItem("user");

  storedUser =
    userData && userData !== "undefined"
      ? JSON.parse(userData)
      : null;
} catch (error) {
  console.log("Invalid user data in localStorage");
  localStorage.removeItem("user");
}

const initialState = {
  user: storedUser,
  token: localStorage.getItem("token") || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.token = accessToken;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", accessToken);
    },

    logOut: (state) => {
      state.user = null;
      state.token = null;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;

export const selectCurrentToken = (state) => state.auth.token;