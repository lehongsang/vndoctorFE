import { baseApi } from "../base-api";
import {
   GetHealthRecordsParams,
   HealthRecord,
   HealthRecordsListResponse,
   HealthRecordsSummaryResponse,
   HealthMetricType,
} from "./type";

const HealthRecordApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getHealthRecords: builder.query<
         HealthRecordsListResponse | HealthRecord[],
         GetHealthRecordsParams
      >({
         query: (params) => ({
            url: "/health-records",
            params,
         }),
         providesTags: (result) =>
            result
               ? [
                    { type: "HealthRecord" as const, id: "LIST" },
                    ...(Array.isArray(result)
                       ? result.map((r) => ({
                            type: "HealthRecord" as const,
                            id: r.id,
                         }))
                       : (result.data || result.items || []).map((r) => ({
                            type: "HealthRecord" as const,
                            id: r.id,
                         }))),
                 ]
               : [{ type: "HealthRecord" as const, id: "LIST" }],
      }),

      getHealthRecordsSummary: builder.query<
         HealthRecordsSummaryResponse,
         { healthProfileId: string; metricType?: HealthMetricType }
      >({
         query: ({ healthProfileId, metricType }) => ({
            url: `/health-records/summary/${healthProfileId}`,
            params: metricType ? { metricType } : undefined,
         }),
         providesTags: (_, __, { healthProfileId }) => [
            { type: "HealthRecord" as const, id: `SUMMARY_${healthProfileId}` },
         ],
      }),

      getHealthRecordById: builder.query<HealthRecord, string>({
         query: (id) => `/health-records/${id}`,
         providesTags: (_, __, id) => [{ type: "HealthRecord" as const, id }],
      }),
   }),
});

export const {
   useGetHealthRecordsQuery,
   useLazyGetHealthRecordsQuery,
   useGetHealthRecordsSummaryQuery,
   useLazyGetHealthRecordsSummaryQuery,
   useGetHealthRecordByIdQuery,
   useLazyGetHealthRecordByIdQuery,
} = HealthRecordApi;
