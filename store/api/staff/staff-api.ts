import { baseApi } from "../base-api";
import {
   CreateStaffPayload,
   GetStaffQueryArgs,
   Staff,
   StaffListResponse,
   UpdateStaffPayload,
   UpdateStaffPayloadAdmin,
} from "./type";

const staffApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getAllStaff: builder.query<StaffListResponse, GetStaffQueryArgs>({
         query: (arg) => {
            if (typeof arg === "string") {
               return `/staff/${arg}`;
            }
            const params: Record<string, string | number | boolean> = {};
            if (arg) {
               const { search, page, limit, facilityId, role, isActive } = arg;
               if (search) params.search = search;
               if (page !== undefined) params.page = page;
               if (limit !== undefined) params.limit = limit;
               if (facilityId) params.facilityId = facilityId;
               if (role) params.role = role;
               if (isActive !== undefined) params.isActive = isActive;
            }

            return {
               url: `/staff`,
               params,
            };
         },
         providesTags: () => [{ type: "Staff", id: "LIST" }],
      }),
      getDetailStaff: builder.query<Staff, string>({
         query: (id) => `/staff/${id}`,
         providesTags: () => [{ type: "Staff", id: "LIST" }],
      }),
      createStaff: builder.mutation<Staff, CreateStaffPayload>({
         query: (body) => ({
            url: `/staff`,
            method: "POST",
            body,
         }),
         invalidatesTags: () => [{ type: "Staff", id: "LIST" }],
      }),
      updateStaffAdmin: builder.mutation<
         Staff,
         UpdateStaffPayloadAdmin & { id: string }
      >({
         query: ({ id, ...body }) => ({
            url: `/staff/${id}`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: () => [{ type: "Staff", id: "LIST" }],
      }),
      updateStaff: builder.mutation<Staff, UpdateStaffPayload>({
         query: (body) => ({
            url: `/staff/me`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: () => [{ type: "Staff", id: "LIST" }],
      }),
      deleteStaff: builder.mutation<void, string>({
         query: (id) => ({
            url: `/staff/${id}`,
            method: "DELETE",
         }),
         invalidatesTags: () => [{ type: "Staff", id: "LIST" }],
      }),
   }),
});

export const {
   useGetAllStaffQuery,
   useCreateStaffMutation,
   useUpdateStaffMutation,
   useUpdateStaffAdminMutation,
   useGetDetailStaffQuery,
   useDeleteStaffMutation,
} = staffApi;
