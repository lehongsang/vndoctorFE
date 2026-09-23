import { HealthProfile } from "../health-profile/type";

export type RiskLevel = "LOW" | "HIGH" | "VERY_HIGH";
export type WarningLevel = "WARNING" | "DANGER" | "INFO";

export type RedFlag = {
   metric: string;
   level: WarningLevel;
   title: string;
   value: string;
};

// --- Dynamic Form Schema Types ---
export type FormFieldType = "NUMBER" | "SELECT" | "BOOLEAN" | "TEXT";

export type FormField = {
   name: string;
   label: string;
   type: FormFieldType;
   value?: number | string | boolean | null;
   disabled?: boolean;
   options?: { label: string; value: string | number }[];
};

export type FormSectionCode =
   | "GENERAL_METRICS"
   | "TARGET_ORGAN_DAMAGE"
   | "CHRONIC_DISEASES"
   | string;

export type FormSection = {
   code: FormSectionCode;
   title: string;
   fields: FormField[];
};

export type PatientProfileInSchema = {
   healthProfileId: string;
   calculatedAge: number;
   gender: string;
   hasRecordedUnderlyingDiseases: boolean;
   recordedDiseaseCodes: string[];
};

export type RiskAssessmentFormSchemaResponse = {
   formCode: string;
   title: string;
   patientProfile: PatientProfileInSchema;
   sections: FormSection[];
};

// --- Request DTOs: Luồng 1 (Không có bệnh nền - SCORE2) ---
export type CreateRiskAssessmentGeneral = {
   healthProfileId: string;
   hasUnderlyingDisease: false;
   facilityId?: string | null;
   age?: number;
   gender?: string;
   isSmoking?: boolean;
   systolicBp?: number;
   diastolicBp?: number;
   totalCholesterol?: number;
   hdlCholesterol?: number;
   glucoseFasting?: number | null;
   heightCm?: number | null;
   weightKg?: number | null;
};

// --- Request DTOs: Luồng 2 (Có bệnh nền / Biến chứng - Non-ASCVD) ---
export type CreateRiskAssessmentWithDisease = {
   healthProfileId: string;
   hasUnderlyingDisease: true;
   facilityId?: string | null;
   chronicDiseaseIds?: string[];
   // Khối 1: Tổn thương cơ quan đích
   hasLeftVentricularHypertrophy?: boolean;
   hasAlbuminuria?: boolean;
   hasRetinopathy?: boolean;
   hasSilentBrainInfarct?: boolean;
   // Khối 2: Đái tháo đường & Thận
   diabetes?: boolean;
   diabetesDurationYears?: number;
   glycemicControl?: string | null;
   egfr?: number | null;
   acr?: number | null;
   // Khối 3: Tiền sử biến cố tim mạch nặng
   stroke?: boolean;
   hasMyocardialInfarction?: boolean;
   hasAcuteCoronarySyndrome?: boolean;
   hasCoronaryArteryDisease?: boolean;
   hasTia?: boolean;
   hasAorticAneurysm?: boolean;
   hasPeripheralArteryDisease?: boolean;
   hasAtherosclerosis?: boolean;
   hasFamilialHypercholesterolemia?: boolean;
   // Các chỉ số sinh lý kèm theo
   systolicBp?: number;
   diastolicBp?: number;
   totalCholesterol?: number;
   hdlCholesterol?: number | null;
   glucoseFasting?: number | null;
   heightCm?: number | null;
   weightKg?: number | null;
   age?: number;
   gender?: string;
   isSmoking?: boolean;
};

// Tổng hợp Request tạo phiếu đánh giá
export type CreateRiskAssessmentRequest =
   | CreateRiskAssessmentGeneral
   | CreateRiskAssessmentWithDisease;

// --- Response DTOs ---
export type RiskAssessmentDoctor = {
   id: string;
   fullName?: string;
   email?: string;
   avatar?: string | null;
   title?: string | null;
};

export type AssessmentInput = {
   id: string;
   createdAt?: string;
   updatedAt?: string;
   deletedAt?: string | null;
   healthProfileId: string;
   healthProfile?: HealthProfile;
   facilityId?: string;
   facility?: {
      id?: string;
      facilityCode?: string;
      facilityName?: string;
      facilityType?: string;
      phoneNumber?: string;
      address?: string;
      isActive?: boolean;
   };
   hasUnderlyingDisease: boolean;
   chronicDiseaseIds?: string[];
   age?: number;
   gender?: string;
   isSmoking?: boolean;
   systolicBp?: number;
   diastolicBp?: number;
   totalCholesterol?: number | string;
   hdlCholesterol?: number | string;
   ldlCholesterol?: number | string | null;
   triglycerides?: number | string | null;
   glucoseFasting?: number | string | null;
   heightCm?: number | string | null;
   weightKg?: number | string | null;
   bmi?: number | string | null;
   hasLeftVentricularHypertrophy?: boolean;
   hasAlbuminuria?: boolean;
   hasRetinopathy?: boolean;
   hasSilentBrainInfarct?: boolean;
   egfr?: number | string | null;
   acr?: number | string | null;
   diabetes?: boolean;
   diabetesDurationYears?: number | null;
   glycemicControl?: string | null;
   stroke?: boolean;
   hasMyocardialInfarction?: boolean;
   hasAcuteCoronarySyndrome?: boolean;
   hasCoronaryArteryDisease?: boolean;
   hasTia?: boolean;
   hasAorticAneurysm?: boolean;
   hasPeripheralArteryDisease?: boolean;
   hasAtherosclerosis?: boolean;
   hasFamilialHypercholesterolemia?: boolean;
   formSnapshot?: Record<string, unknown>;
   status?: string;
   assessmentDate?: string;
};

export type RiskAssessmentResult = {
   id: string;
   assessmentInputId?: string;
   assessmentInput?: AssessmentInput;
   riskLevel: RiskLevel;
   riskScore: number | string;
   doctorId?: string | null;
   doctor?: RiskAssessmentDoctor | null;
   conclusion?: string | null;
   recommendations?: string | null;
   evaluatedAt?: string;
   hasWarningAlert?: boolean;
   redFlags?: RedFlag[];
   createdAt?: string;
   updatedAt?: string;
   healthProfileId?: string;
   healthProfile?: HealthProfile;
};

// --- DTO Bác sĩ thẩm định ---
export type EvaluateRiskAssessmentRequest = {
   conclusion: string;
   recommendations: string;
   riskLevel?: RiskLevel;
   riskScore?: number;
};

// --- Params & Response danh sách ---
export type StaffRiskAssessmentParams = {
   healthProfileId?: string;
   facilityId?: string;
   riskLevel?: RiskLevel;
   fromDate?: string;
   toDate?: string;
   page?: number;
   limit?: number;
};

export type StaffRiskAssessmentListResponse = {
   items?: RiskAssessmentResult[];
   data?: RiskAssessmentResult[];
   total: number;
   page: number;
   limit: number;
};

export type PatientRiskAssessmentParams = {
   page?: number;
   limit?: number;
};

export type PatientRiskAssessmentListResponse = {
   items?: RiskAssessmentResult[];
   data?: RiskAssessmentResult[];
   total: number;
   page: number;
   limit: number;
};