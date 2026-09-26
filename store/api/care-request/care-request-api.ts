import { baseApi } from "../base-api";
import {
   CareRequest,
   CareRequestDetail,
   CareRequestListResponse,
   GetCareRequestsParams,
   ReceiveaCareRequestBody,
   UpdateStatusCareRequest,
} from "./type";

export const CareRequestApi = baseApi.injectEndpoints({
   endpoints: (build) => ({
      getCareRequests: build.query<
         CareRequestListResponse,
         GetCareRequestsParams | void
      >({
         query: (params) => ({
            url: "/care-requests",
            params: params || undefined,
         }),
         providesTags: (result) => {
            const list = Array.isArray(result?.data)
               ? result.data
               : Array.isArray(result)
                 ? (result as unknown as CareRequest[])
                 : [];
            return [
               ...list.map(({ id }) => ({
                  type: "CareRequest" as const,
                  id,
               })),
               { type: "CareRequest", id: "LIST" },
            ];
         },
      }),
      getDetailCareRequest: build.query<CareRequestDetail, string>({
         query: (id: string) => ({
            url: `/care-requests/${id}`,
         }),
         providesTags: (_result, _error, id) => [{ type: "CareRequest", id }],
      }),
      receiveCareRequest: build.mutation<
         CareRequestDetail,
         {
            id: string;
            body: ReceiveaCareRequestBody;
         }
      >({
         query: ({ id, body }) => ({
            url: `/care-requests/${id}/receive`,
            method: "PUT",
            body,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: "CareRequest", id },
            { type: "CareRequest", id: "LIST" },
         ],
      }),
      updateStatusCareRequest: build.mutation<
         CareRequestDetail,
         { id: string; body: UpdateStatusCareRequest }
      >({
         query: ({ id, body }) => ({
            url: `/care-requests/${id}/status`,
            method: "PUT",
            body,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: "CareRequest", id },
            { type: "CareRequest", id: "LIST" },
         ],
      }),
      resolveCareRequest: build.mutation<
         CareRequestDetail,
         { id: string; body: { resolutionNote: string } }
      >({
         query: ({ id, body }) => ({
            url: `/care-requests/${id}/resolve`,
            method: "POST",
            body,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: "CareRequest", id },
            { type: "CareRequest", id: "LIST" },
         ],
      }),
      deleteCareRequest: build.mutation<CareRequestDetail, { id: string }>({
         query: ({ id }) => ({
            url: `/care-requests/${id}`,
            method: "DELETE",
         }),
         invalidatesTags: [{ type: "CareRequest", id: "LIST" }],
      }),
   }),
});

export const {
   useGetCareRequestsQuery,
   useGetDetailCareRequestQuery,
   useReceiveCareRequestMutation,
   useUpdateStatusCareRequestMutation,
   useResolveCareRequestMutation,
   useDeleteCareRequestMutation,
} = CareRequestApi;
