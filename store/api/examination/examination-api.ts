import { baseApi } from "../base-api";
import {
   CreateExaminationRequest,
   Examination,
   GetAllExaminationParams,
   GetAllExaminationResponse,
   UpdateExaminationRequest,
} from "./type";

const ExaminationApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getExaminations: builder.query<
         GetAllExaminationResponse,
         GetAllExaminationParams
      >({
         query: (params) => ({
            url: "/examinations",
            params,
         }),
         providesTags: [{ type: "Examination", id: "LIST" }],
      }),
      getExaminationById: builder.query<Examination, string>({
         query: (id) => `/examinations/${id}`,
         providesTags: (_, __, id) => [{ type: "Examination", id }],
      }),
      createExamination: builder.mutation<
         Examination,
         CreateExaminationRequest
      >({
         query: (body) => ({
            url: "/examinations",
            method: "POST",
            body,
         }),
         invalidatesTags: [{ type: "Examination", id: "LIST" }],
      }),
      updateExamination: builder.mutation<
         Examination,
         { id: string; body: UpdateExaminationRequest }
      >({
         query: ({ id, body }) => ({
            url: `/examinations/${id}`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: (_, __, { id }) => [
            { type: "Examination", id },
            { type: "Examination", id: "LIST" },
         ],
      }),
   }),
});

export const {
   useGetExaminationsQuery,
   useGetExaminationByIdQuery,
   useLazyGetExaminationByIdQuery,
   useCreateExaminationMutation,
   useUpdateExaminationMutation,
} = ExaminationApi;
