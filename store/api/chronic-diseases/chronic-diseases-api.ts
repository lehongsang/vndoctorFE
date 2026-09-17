import { baseApi } from "../base-api";
import {
   ParamsGetAllChronicDiseases,
   ChronicDisease,
   GetAllChronicDiseasesResponse,
   CreateChronicDiseaseRequest,
   UpdateChronicDiseaseRequest,
} from "./type";

const ChronicDiseasesApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getAllChronicDiseases: builder.query<
         GetAllChronicDiseasesResponse,
         ParamsGetAllChronicDiseases
      >({
         query: (params) => ({
            url: "/chronic-diseases",
            method: "GET",
            params,
         }),
         providesTags: () => [{ type: "ChronicDiseases", id: "LIST" }],
      }),

      getDetailChronicDisease: builder.query<
         ChronicDisease,
         {
            id: string;
         }
      >({
         query: ({ id }) => ({ url: `/chronic-diseases/${id}`, method: "GET" }),
         providesTags: (_, __, { id }) => [
            { type: "ChronicDiseases", id: `${id}` },
         ],
      }),

      getChronicDiseasesByHealthProfileId: builder.query<
         ChronicDisease[],
         { healthProfileId: string }
      >({
         query: ({ healthProfileId }) =>
            `/chronic-diseases/profile/${healthProfileId}`,
         providesTags: (_, __, { healthProfileId }) => [
            {
               type: "ChronicDiseases",
               id: `HEALTH_PROFILE_${healthProfileId}`,
            },
         ],
      }),

      createChronicDisease: builder.mutation<
         ChronicDisease,
         CreateChronicDiseaseRequest
      >({
         query: (data) => ({
            url: "/chronic-diseases",
            method: "POST",
            body: data,
         }),
         invalidatesTags: [{ type: "ChronicDiseases", id: "LIST" }],
      }),

      updateChronicDisease: builder.mutation<
         ChronicDisease,
         { id: string; data: UpdateChronicDiseaseRequest }
      >({
         query: ({ id, data }) => ({
            url: `/chronic-diseases/${id}`,
            method: "PUT",
            body: data,
         }),
         invalidatesTags: (result, error, { id }) => [
            { type: "ChronicDiseases", id },
            { type: "ChronicDiseases", id: "LIST" },
         ],
      }),

      deleteChronicDisease: builder.mutation<void, string>({
         query: (id) => ({ url: `/chronic-diseases/${id}`, method: "DELETE" }),
         invalidatesTags: [{ type: "ChronicDiseases", id: "LIST" }],
      }),
   }),
   overrideExisting: true,
});

export const {
   useGetAllChronicDiseasesQuery,
   useGetDetailChronicDiseaseQuery,
   useGetChronicDiseasesByHealthProfileIdQuery,
   useCreateChronicDiseaseMutation,
   useUpdateChronicDiseaseMutation,
   useDeleteChronicDiseaseMutation,
} = ChronicDiseasesApi;
