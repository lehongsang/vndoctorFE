import { baseApi } from "../base-api";
import type {
   AssignStaffBody,
   CareSubscriptions,
   ParamGetCareSubscriptions,
   ResponseGetCareSubscriptions,
   StaffRegisterRequest,
   UpdateAssignStaffBody,
} from "./type";

const CoordinatApi = baseApi.injectEndpoints({
   endpoints: (build) => ({
      getAllSubscriptions: build.query<
         ResponseGetCareSubscriptions,
         ParamGetCareSubscriptions
      >({
         query: (params) => ({
            url: "/care-subscriptions",
            method: "GET",
            params,
         }),
         providesTags: ["CareSubcriptions"],
      }),
      getDetailCareSubcription: build.query<CareSubscriptions, { id: string }>({
         query: ({ id }) => ({
            url: `/care-subscriptions/${id}`,
            method: "GET",
         }),
         providesTags: (id) => [{ type: "CareSubcriptions", id: `${id}` }],
      }),
      assignStaff: build.mutation<void, { id: string; body: AssignStaffBody }>({
         query: ({ id, body }) => ({
            url: `/care-subscriptions/${id}/assign-and-activate`,
            method: "POST",
            body,
         }),
         invalidatesTags: ["CareSubcriptions"],
      }),
      updateStaffSubscription: build.mutation<
         CareSubscriptions,
         { id: string; body: UpdateAssignStaffBody }
      >({
         query: ({ id, body }) => ({
            url: `/care-subscriptions/${id}/care-team`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: ["CareSubcriptions"],
      }),
      cancelSubscription: build.mutation<CareSubscriptions, { id: string }>({
         query: ({ id }) => ({
            url: `/care-subscriptions/${id}/cancel`,
            method: "POST",
         }),
         invalidatesTags: ["CareSubcriptions"],
      }),
      staffRegister: build.mutation<
         CareSubscriptions,
         { body: StaffRegisterRequest }
      >({
         query: ({ body }) => ({
            url: `/care-subscriptions/staff-register`,
            method: "POST",
            body,
         }),
         invalidatesTags: ["CareSubcriptions"],
      }),
   }),
});

export const {
   useGetAllSubscriptionsQuery,
   useGetDetailCareSubcriptionQuery,
   useAssignStaffMutation,
   useUpdateStaffSubscriptionMutation,
   useCancelSubscriptionMutation,
   useStaffRegisterMutation,
} = CoordinatApi;
