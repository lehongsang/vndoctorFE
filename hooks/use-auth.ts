import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, setToken, setUser, type User } from "@/store/slices/auth-slice";
import { baseApi } from "@/store/api/base-api";

export const useAuth = () => {
   const dispatch = useAppDispatch();
   const user = useAppSelector((state) => state.auth.user);
   const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
   const accessToken = useAppSelector((state) => state.auth.accessToken);
   const refreshToken = useAppSelector((state) => state.auth.refreshToken);

   const handleLogout = useCallback(() => {
      if (typeof window !== "undefined") {
         localStorage.removeItem("accessToken");
         localStorage.removeItem("refreshToken");
         localStorage.removeItem("user");
      }
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
   }, [dispatch]);

   const handleSetToken = useCallback(
      (tokens: { accessToken: string; refreshToken: string }) => {
         dispatch(setToken(tokens));
      },
      [dispatch],
   );

   const handleSetUser = useCallback(
      (userData: User) => {
         dispatch(setUser(userData));
      },
      [dispatch],
   );

   return {
      user,
      isLoggedIn,
      accessToken,
      refreshToken,
      setToken: handleSetToken,
      setUser: handleSetUser,
      logout: handleLogout,
   };
};


