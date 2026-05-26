import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice.js';
import authReducer from './authSlice.js';
import cartReducer from './cartSlice.js';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});
