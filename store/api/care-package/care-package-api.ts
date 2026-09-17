import { baseApi } from "../base-api";
import {
   CarePackage,
   CarePackageListResponse,
   CarePackageParams,
   CreateCarePackageRequest,
   CarePackageUpdateRequest,
   CarePackageStatus,
} from "./type";

export const CarePackageApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getCarePackages: builder.query<
         CarePackageListResponse,
         CarePackageParams
      >({
         query: (params) => ({
            url: "/care-packages",
            params,
         }),
         providesTags: (result) =>
            result?.data
               ? [
                    ...result.data.map(({ id }) => ({
                       type: "CarePackage" as const,
                       id,
                    })),
                    { type: "CarePackage", id: "LIST" },
                 ]
               : [{ type: "CarePackage", id: "LIST" }],
      }),
      getCarePackageDetail: builder.query<CarePackage, string>({
         query: (id) => `/care-packages/${id}`,
         providesTags: (_result, _error, id) => [{ type: "CarePackage", id }],
      }),
      createCarePackage: builder.mutation<
         CarePackage,
         CreateCarePackageRequest
      >({
         query: (body) => ({
            url: "/care-packages",
            method: "POST",
            body,
         }),
         invalidatesTags: [{ type: "CarePackage", id: "LIST" }],
      }),
      updateCarePackage: builder.mutation<
         CarePackage,
         { id: string; body: CarePackageUpdateRequest }
      >({
         query: ({ id, body }) => ({
            url: `/care-packages/${id}`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: "CarePackage", id },
            { type: "CarePackage", id: "LIST" },
         ],
      }),
      deleteCarePackage: builder.mutation<CarePackage, string>({
         query: (id) => ({
            url: `/care-packages/${id}`,
            method: "DELETE",
         }),
         invalidatesTags: [{ type: "CarePackage", id: "LIST" }],
      }),
      changeCarePackageStatus: builder.mutation<
         CarePackage,
         { id: string; status: CarePackageStatus }
      >({
         query: ({ id, status }) => ({
            url: `/care-packages/${id}/status`,
            method: "PATCH",
            body: { status },
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: "CarePackage", id },
            { type: "CarePackage", id: "LIST" },
         ],
      }),
   }),
});

export const {
   useGetCarePackagesQuery,
   useGetCarePackageDetailQuery,
   useCreateCarePackageMutation,
   useUpdateCarePackageMutation,
   useDeleteCarePackageMutation,
   useChangeCarePackageStatusMutation,
} = CarePackageApi;
