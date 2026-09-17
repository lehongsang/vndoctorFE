"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CloverLoading } from "@/components/common/clover-loading";
import { useAuth } from "@/hooks/use-auth";
import { useLazyMeQuery } from "@/store/api/auth/auth-api";

const PUBLIC_ROUTES = ["/login", "/auth", "/register", "/forgot-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const router = useRouter();
   const pathname = usePathname();
   const { isLoggedIn, setToken, setUser, logout } = useAuth();
   const [triggerGetMe] = useLazyMeQuery();
   const [isInitialized, setIsInitialized] = useState(false);

   const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route),
   );

   const hasInitializedRef = React.useRef(false);

   useEffect(() => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      const initAuth = async () => {
         const token = localStorage.getItem("accessToken");
         const refreshToken = localStorage.getItem("refreshToken");
         const savedUser = localStorage.getItem("user");

         if (!token || !refreshToken) {
            logout();
            setIsInitialized(true);
            return;
         }

         setToken({ accessToken: token, refreshToken });
         if (savedUser) {
            try {
               setUser(JSON.parse(savedUser));
            } catch (e) {
               console.error("Lỗi khi đọc thông tin user đã lưu:", e);
            }
         }

         try {
            const staff = await triggerGetMe().unwrap();
            setUser(staff);
            localStorage.setItem("user", JSON.stringify(staff));
         } catch (error: unknown) {
            const err = error as {
               status?: number | string;
               data?: { statusCode?: number };
            };
            const isUnauthorized =
               err?.status === 401 || err?.data?.statusCode === 401;

            if (isUnauthorized) {
               console.warn(
                  "Phiên đăng nhập hết hạn hoặc không hợp lệ (401):",
                  error,
               );
               logout();
            } else {
               console.warn(
                  "Không thể kết nối lấy thông tin staff mới, giữ nguyên phiên làm việc:",
                  error,
               );
            }
         } finally {
            setIsInitialized(true);
         }
      };

      initAuth();
   }, [triggerGetMe, setToken, setUser, logout]);

   useEffect(() => {
      if (!isInitialized) return;

      if (!isLoggedIn && !isPublicRoute) {
         router.replace("/login");
      } else if (isLoggedIn && isPublicRoute) {
         router.replace("/");
      }
   }, [isLoggedIn, isPublicRoute, isInitialized, router]);
   if (!isInitialized) {
      return (
         <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/60">
            <CloverLoading size="lg" text="Đang tải..." />
         </div>
      );
   }
   if (!isLoggedIn && !isPublicRoute) {
      return null;
   }

   return <>{children}</>;
}
