import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./api/auth/auth-api";
import authReducer from "./slices/auth-slice";

export const store = configureStore({
   reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
   },
   middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
   devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
