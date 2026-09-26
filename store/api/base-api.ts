import {
   BaseQueryFn,
   createApi,
   FetchArgs,
   fetchBaseQuery,
   FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store";
import { logout, setToken } from "../slices/auth-slice";
import type { RefreshTokenResponseDto } from "./auth/type";

const rawBaseQuery = fetchBaseQuery({
   baseUrl: process.env.NEXT_PUBLIC_API_URL,
   prepareHeaders: (headers, { getState }) => {
      if (headers.has("skip-auth")) {
         headers.delete("skip-auth");
         return headers;
      }

      if (headers.has("Authorization")) {
         return headers;
      }

      const token =
         (getState() as RootState).auth?.accessToken ||
         (typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null);

      if (token) {
         headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
   },
});

let refreshPromise: Promise<string | null> | null = null;

const baseQueryWithReauth: BaseQueryFn<
   string | FetchArgs,
   unknown,
   FetchBaseQueryError
> = async (args, api, extraOptions) => {
   let result = await rawBaseQuery(args, api, extraOptions);

   const url = typeof args === "string" ? args : args.url;
   const isAuthEndpoint =
      url.includes("/auth/staff/login") || url.includes("/auth/staff/refresh");

   if (result.error && result.error.status === 401 && !isAuthEndpoint) {
      const state = api.getState() as RootState;
      const currentRefreshToken =
         state.auth?.refreshToken ||
         (typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null);

      if (!currentRefreshToken) {
         api.dispatch(logout());
         if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            window.location.replace("/login");
         }
         return result;
      }

      if (!refreshPromise) {
         refreshPromise = (async () => {
            try {
               const refreshResult = await rawBaseQuery(
                  {
                     url: "/auth/staff/refresh",
                     method: "POST",
                     headers: { "skip-auth": "true" },
                     body: {
                        refreshToken: currentRefreshToken,
                     },
                  },
                  api,
                  extraOptions,
               );

               if (refreshResult.data) {
                  const data = refreshResult.data as RefreshTokenResponseDto;
                  if (typeof window !== "undefined") {
                     localStorage.setItem("accessToken", data.accessToken);
                     localStorage.setItem("refreshToken", data.refreshToken);
                  }
                  api.dispatch(
                     setToken({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                     }),
                  );
                  return data.accessToken;
               }
               api.dispatch(logout());
               if (typeof window !== "undefined") {
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("refreshToken");
                  localStorage.removeItem("user");
                  window.location.replace("/login");
               }
               return null;
            } catch {
               return null;
            } finally {
               refreshPromise = null;
            }
         })();
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
         result = await rawBaseQuery(args, api, extraOptions);
      }
   }

   return result;
};

export const baseApi = createApi({
   reducerPath: "api",
   baseQuery: baseQueryWithReauth,
   endpoints: () => ({}),
   tagTypes: [
      "Users",
      "Facilities",
      "Staff",
      "CarePackage",
      "HealthProfile",
      "ChronicDiseases",
      "CareSubcriptions",
      "RiskAssessment",
      "Ocr",
      "Examination",
      "Conversations",
      "Messages",
      "TreatmentTarget",
      "CareRequest",
      "HealthRecord",
   ],
});
