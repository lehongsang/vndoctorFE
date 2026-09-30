import { baseApi } from "../base-api";
import {
   CreateTreatmentTargetInput,
   TreatmentTarget,
   UpdateTreatmentTargetInput,
   VerifyTreatmentTargetInput,
} from "./type";

const TreatmentTargetApi = baseApi.injectEndpoints({
   endpoints: (build) => ({
      createTreamentTarget: build.mutation<
         TreatmentTarget,
         { data: CreateTreatmentTargetInput }
      >({
         query: ({ data }) => ({
            url: `/treatment-targets`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: ["TreatmentTarget"],
      }),
      getDetailTreamentTarget: build.query<TreatmentTarget, { id: string }>({
         query: ({ id }) => ({
            url: `/treatment-targets/${id}`,
         }),
         providesTags: ["TreatmentTarget"],
      }),
      getTreatmentTargetByAccessmentId: build.query<
         TreatmentTarget,
         { id: string }
      >({
         query: ({ id }) => ({
            url: `/treatment-targets/by-assessment/${id}`,
         }),
         providesTags: ["TreatmentTarget"],
      }),
      updateTreatmentTarget: build.mutation<
         TreatmentTarget,
         { id: string; data: UpdateTreatmentTargetInput }
      >({
         query: ({ id, data }) => ({
            url: `/treatment-targets/${id}`,
            method: "PATCH",
            body: data,
         }),
         invalidatesTags: ["TreatmentTarget"],
      }),
      getTreatmentTargetById: build.query<TreatmentTarget, { id: string }>({
         query: ({ id }) => ({
            url: `/treatment-targets/${id}`,
         }),
         providesTags: ["TreatmentTarget"],
      }),
      verifyTreatmentTarget: build.mutation<
         TreatmentTarget,
         { id: string; data: VerifyTreatmentTargetInput }
      >({
         query: ({ id, data }) => ({
            url: `/treatment-targets/${id}/verify`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: ["TreatmentTarget"],
      }),
   }),
});
export const {
   useCreateTreamentTargetMutation,
   useGetDetailTreamentTargetQuery,
   useLazyGetDetailTreamentTargetQuery,
   useGetTreatmentTargetByAccessmentIdQuery,
   useLazyGetTreatmentTargetByAccessmentIdQuery,
   useGetTreatmentTargetByIdQuery,
   useLazyGetTreatmentTargetByIdQuery,
   useUpdateTreatmentTargetMutation,
   useVerifyTreatmentTargetMutation,
} = TreatmentTargetApi;
export const useCreateTreatmentTargetMutation =
   TreatmentTargetApi.useCreateTreamentTargetMutation;
export const useGetDetailTreatmentTargetQuery =
   TreatmentTargetApi.useGetDetailTreamentTargetQuery;
export const useLazyGetDetailTreatmentTargetQuery =
   TreatmentTargetApi.useLazyGetDetailTreamentTargetQuery;
