import type { User } from "@/store/slices/auth-slice";

export type LoginRequestDto = {
   username: string;
   password: string;
};

export type LoginResponseDto = {
   accessToken: string;
   refreshToken: string;
   tokenType: string;
   expiresIn: number;
   refreshTokenExpiresIn: number | string;
   staff: User;
};

export type MeResponseDto = User;

export type AuthErrorResponse = {
   statusCode: number;
   message: string;
   code: string;
};

export type LoginErrorResponse = AuthErrorResponse;

export type RefreshTokenRequestDto = {
   refreshToken: string;
};

export type RefreshTokenResponseDto = {
   accessToken: string;
   refreshToken: string;
   tokenType: string;
   expiresIn: number;
   refreshTokenExpiresIn: number;
};



