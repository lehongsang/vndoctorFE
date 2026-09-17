import { User } from "@/store/slices/auth-slice";
import { baseApi } from "../base-api";
import {
   LoginRequestDto,
   LoginResponseDto,
   RefreshTokenRequestDto,
   RefreshTokenResponseDto,
} from "./type";

export const authApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      login: builder.mutation<LoginResponseDto, LoginRequestDto>({
         query: (data) => ({
            url: "/auth/staff/login",
            method: "POST",
            body: data,
         }),
         invalidatesTags: ["Users"],
      }),
      me: builder.query<User, void>({
         query: () => ({ url: "/auth/staff/me" }),
         providesTags: ["Users"],
      }),
      refreshToken: builder.mutation<
         RefreshTokenResponseDto,
         RefreshTokenRequestDto
      >({
         query: (data) => ({
            url: "/auth/staff/refresh",
            method: "POST",
            headers: { "skip-auth": "true" },
            body: {
               refreshToken: data.refreshToken,
            },
         }),
      }),
   }),
});

export const {
   useLoginMutation,
   useMeQuery,
   useLazyMeQuery,
   useRefreshTokenMutation,
} = authApi;

