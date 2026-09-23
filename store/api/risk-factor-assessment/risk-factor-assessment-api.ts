import { baseApi } from "../base-api";
import {
   RiskAssessmentFormSchemaResponse,
   CreateRiskAssessmentRequest,
   RiskAssessmentResult,
   EvaluateRiskAssessmentRequest,
   StaffRiskAssessmentParams,
   StaffRiskAssessmentListResponse,
   PatientRiskAssessmentParams,
   PatientRiskAssessmentListResponse,
} from "./type";

export const RiskFactorAssessmentApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      // 1. Lấy dynamic form schema tự động điền và khóa các trường bệnh nền
      getRiskAssessmentFormSchema: builder.query<
         RiskAssessmentFormSchemaResponse,
         { healthProfileId: string }
      >({
         query: ({ healthProfileId }) => ({
            url: "/risk-assessments/form-schema",
            params: { healthProfileId },
         }),
         providesTags: (_result, _error, { healthProfileId }) => [
            { type: "RiskAssessment", id: `SCHEMA_${healthProfileId}` },
         ],
      }),

      // 2. Tạo phiếu đánh giá nguy cơ (Hệ thống tự tính điểm SCORE2 hoặc Non-ASCVD & phát hiện Red Flags)
      createRiskAssessment: builder.mutation<
         RiskAssessmentResult,
         CreateRiskAssessmentRequest
      >({
         query: (body) => ({
            url: "/risk-assessments",
            method: "POST",
            body,
         }),
         invalidatesTags: [
            { type: "RiskAssessment", id: "STAFF_LIST" },
            { type: "RiskAssessment", id: "PATIENT_LIST" },
         ],
      }),

      // 3. Xem chi tiết phiếu đánh giá
      getRiskAssessmentDetail: builder.query<RiskAssessmentResult, string>({
         query: (id) => `/risk-assessments/${id}`,
         providesTags: (_result, _error, id) => [
            { type: "RiskAssessment", id },
         ],
      }),

      // 4. Danh sách phiếu đánh giá tại cơ sở y tế (Bác sĩ/Staff tra cứu)
      getStaffRiskAssessments: builder.query<
         StaffRiskAssessmentListResponse,
         StaffRiskAssessmentParams | void
      >({
         query: (params) => ({
            url: "/risk-assessments/staff",
            params: params || undefined,
         }),
         providesTags: (result) =>
            result?.items
               ? [
                    ...result.items.map(({ id }) => ({
                       type: "RiskAssessment" as const,
                       id,
                    })),
                    { type: "RiskAssessment", id: "STAFF_LIST" },
                 ]
               : [{ type: "RiskAssessment", id: "STAFF_LIST" }],
      }),

      // 5. Danh sách lịch sử đánh giá của bệnh nhân
      getPatientRiskAssessments: builder.query<
         PatientRiskAssessmentListResponse,
         PatientRiskAssessmentParams | void
      >({
         query: (params) => ({
            url: "/risk-assessments",
            params: params || undefined,
         }),
         providesTags: [{ type: "RiskAssessment", id: "PATIENT_LIST" }],
      }),

      // 6. Bác sĩ thẩm định & ghi kết luận phác đồ điều trị
      evaluateRiskAssessment: builder.mutation<
         RiskAssessmentResult,
         { id: string; data: EvaluateRiskAssessmentRequest }
      >({
         query: ({ id, data }) => ({
            url: `/risk-assessments/${id}/evaluate`,
            method: "POST",
            body: data,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: "RiskAssessment", id },
            { type: "RiskAssessment", id: "STAFF_LIST" },
            { type: "RiskAssessment", id: "PATIENT_LIST" },
         ],
      }),

      // 7. Xóa mềm phiếu đánh giá
      deleteRiskAssessment: builder.mutation<void, string>({
         query: (id) => ({
            url: `/risk-assessments/${id}`,
            method: "DELETE",
         }),
         invalidatesTags: [
            { type: "RiskAssessment", id: "STAFF_LIST" },
            { type: "RiskAssessment", id: "PATIENT_LIST" },
         ],
      }),
   }),
   overrideExisting: true,
});

export const {
   useGetRiskAssessmentFormSchemaQuery,
   useLazyGetRiskAssessmentFormSchemaQuery,
   useCreateRiskAssessmentMutation,
   useGetRiskAssessmentDetailQuery,
   useGetStaffRiskAssessmentsQuery,
   useGetPatientRiskAssessmentsQuery,
   useEvaluateRiskAssessmentMutation,
   useDeleteRiskAssessmentMutation,
} = RiskFactorAssessmentApi;
