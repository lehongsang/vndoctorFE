import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type StaffFacility = {
   id: string;
   createdAt: string;
   updatedAt: string;
   facilityCode: string;
   facilityName: string;
   facilityType: string;
   parentId: string | null;
   phoneNumber: string;
   address: string;
   isActive: boolean;
};

export type User = {
   id: string;
   createdAt: string;
   updatedAt: string;
   facilityId: string;
   facility: StaffFacility;
   staffCode: string;
   username: string;
   fullName: string;
   role: string;
   specialty: string;
   email: string;
   phoneNumber: string;
   isActive: boolean;
};

export type AuthState = {
   accessToken: string | null;
   refreshToken: string | null;
   user: User | null;
   isLoggedIn: boolean;
};



const initialState: AuthState = {
   accessToken: null,
   refreshToken: null,
   user: null,
   isLoggedIn: false,
};

export const authSlice = createSlice({
   name: "auth",
   initialState,
   reducers: {
      setToken: (
         state: AuthState,
         action: PayloadAction<{ accessToken: string; refreshToken: string }>,
      ) => {
         state.accessToken = action.payload.accessToken;
         state.refreshToken = action.payload.refreshToken;
         state.isLoggedIn = true;
      },
      setUser: (state: AuthState, action: PayloadAction<User>) => {
         state.user = action.payload;
      },
      logout: (state: AuthState) => {
         state.accessToken = null;
         state.refreshToken = null;
         state.user = null;
         state.isLoggedIn = false;
      },
   },
});

export const { setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
