import { baseApi } from "../base-api";
import {
   TreatmentTarget,
   UpdateTreatmentTargetInput,
   VerifyTreatmentTargetInput,
} from "./type";

const TreatmentTargetApi = baseApi.injectEndpoints({
   endpoints: (build) => ({
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
      getTreatmentTargetById: build.query<
         TreatmentTarget,
         { id: string }
      >({
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
   useGetTreatmentTargetByAccessmentIdQuery,
   useLazyGetTreatmentTargetByAccessmentIdQuery,
   useGetTreatmentTargetByIdQuery,
   useLazyGetTreatmentTargetByIdQuery,
   useUpdateTreatmentTargetMutation,
   useVerifyTreatmentTargetMutation,
} = TreatmentTargetApi;
