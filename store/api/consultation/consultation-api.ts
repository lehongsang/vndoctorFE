import { baseApi } from "../base-api";
import {
   Consultation,
   ConsultationListResponse,
   CreateConsultationType,
   ParamRequestConsultation,
   RespondConsultationPayload,
} from "./type";

const ConsultationApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      createConsultation: builder.mutation<
         Consultation,
         CreateConsultationType
      >({
         query: (data) => ({
            url: "/medical-consultations",
            method: "POST",
            body: data,
         }),
         invalidatesTags: ["Consultation"],
      }),
      getAllConsultations: builder.query<
         ConsultationListResponse,
         ParamRequestConsultation | void
      >({
         query: (params) => ({
            url: "/medical-consultations",
            method: "GET",
            params: params || undefined,
         }),
         providesTags: ["Consultation"],
      }),
      getConsultationById: builder.query<Consultation, string>({
         query: (id) => `/medical-consultations/${id}`,
         providesTags: (_res, _err, id) => [{ type: "Consultation", id }],
      }),
      consultAndResponse: builder.mutation<
         Consultation,
         {
            id: string;
            body: RespondConsultationPayload;
         }
      >({
         query: ({ id, body }) => ({
            url: `/medical-consultations/${id}/respond`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: (_res, _err, { id }) => [
            { type: "Consultation", id },
            "Consultation",
         ],
      }),
   }),
});

export const {
   useCreateConsultationMutation,
   useGetAllConsultationsQuery,
   useGetConsultationByIdQuery,
   useConsultAndResponseMutation,
} = ConsultationApi;
