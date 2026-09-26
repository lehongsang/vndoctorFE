import { baseApi } from "../base-api";
import {
   TreatmentTargetTemplate,
   CreateTreatmentTargetTemplateInput,
   UpdateTreatmentTargetTemplateInput,
   ResponseTreatmentTargetTemplate,
   ParamsHealthProfileTemplate,
} from "./type";

const TreatmentTargetTemplateApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      createTreatmentTargetTemplate: builder.mutation<
         TreatmentTargetTemplate,
         CreateTreatmentTargetTemplateInput
      >({
         query: (body) => ({
            url: "treatment-target-templates",
            method: "POST",
            body,
         }),
      }),
      updateTreatmentTargetTemplate: builder.mutation<
         TreatmentTargetTemplate,
         UpdateTreatmentTargetTemplateInput
      >({
         query: ({ id, ...body }) => ({
            url: `treatment-target-templates/${id}`,
            method: "PUT",
            body,
         }),
      }),
      deleteTreatmentTargetTemplate: builder.mutation<void, string>({
         query: (id) => ({
            url: `treatment-target-templates/${id}`,
            method: "DELETE",
         }),
      }),
      getTreatmentTargetTemplates: builder.query<
         ResponseTreatmentTargetTemplate,
         ParamsHealthProfileTemplate
      >({
         query: (params) => ({
            url: "treatment-target-templates",
            params,
         }),
      }),
   }),
});

export const {
   useCreateTreatmentTargetTemplateMutation,
   useUpdateTreatmentTargetTemplateMutation,
   useDeleteTreatmentTargetTemplateMutation,
   useGetTreatmentTargetTemplatesQuery,
} = TreatmentTargetTemplateApi;
