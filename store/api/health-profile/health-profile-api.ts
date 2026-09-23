import {
   ResponseListHealthProfile,
   RequestParamsHealthProfile,
   HealthProfile,
   CreateHealthProfile,
   UpdateHealthProfile,
   LinkRequest,
   ParamsHealthProfileAssign,
   ResponseListHealthProfileAssign,
} from "./type";

import { baseApi } from "../base-api";

const HealthProfileApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getHealthProfiles: builder.query<
         ResponseListHealthProfile,
         RequestParamsHealthProfile
      >({
         query: (params) => ({
            url: "/health-profiles",
            params,
         }),
         providesTags: [{ type: "HealthProfile", id: "LIST" }],
      }),

      createHealthProfile: builder.mutation<HealthProfile, CreateHealthProfile>(
         {
            query: (data) => ({
               url: "/health-profiles/facility",
               method: "POST",
               body: data,
            }),
            invalidatesTags: [{ type: "HealthProfile", id: "LIST" }],
         },
      ),

      updateHealthProfile: builder.mutation<
         HealthProfile,
         { id: string; data: UpdateHealthProfile }
      >({
         query: ({ id, data }) => ({
            url: `/health-profiles/${id}`,
            method: "PATCH",
            body: data,
         }),
         invalidatesTags: (_, __, { id }) => [
            { type: "HealthProfile", id },
            { type: "HealthProfile", id: `${id}` },
         ],
      }),

      getDetailHealthProfile: builder.query<HealthProfile, string>({
         query: (id) => `/health-profiles/${id}`,
         providesTags: (result) => [{ type: "HealthProfile", id: result?.id }],
      }),

      getHealthProfileAssign: builder.query<
         ResponseListHealthProfileAssign,
         ParamsHealthProfileAssign
      >({
         query: (params) => ({
            url: `/health-profiles/profileList`,
            params,
         }),
         providesTags: [{ type: "HealthProfile", id: "LIST" }],
      }),

      deleteHealthProfile: builder.mutation<void, string>({
         query: (id) => ({
            url: `/health-profiles/${id}`,
            method: "DELETE",
         }),
         invalidatesTags: (_, __, id) => [
            { type: "HealthProfile", id },
            { type: "HealthProfile", id: "LIST" },
         ],
      }),
      linkToApp: builder.mutation<HealthProfile, LinkRequest>({
         query: (body) => ({
            url: `/patient-links/request`,
            method: "POST",
            body,
         }),
         invalidatesTags: (_, __, body) => [
            { type: "HealthProfile", id: body.healthProfileId },
            { type: "HealthProfile", id: "LIST" },
         ],
      }),
   }),
});

export const {
   useGetHealthProfilesQuery,
   useCreateHealthProfileMutation,
   useUpdateHealthProfileMutation,
   useGetDetailHealthProfileQuery,
   useGetHealthProfileAssignQuery,
   useDeleteHealthProfileMutation,
   useLinkToAppMutation,
} = HealthProfileApi;
