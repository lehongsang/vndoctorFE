export type HealthMetricType =
   | "BLOOD_PRESSURE"
   | "HEART_RATE"
   | "BLOOD_GLUCOSE"
   | "SPO2"
   | "BODY_TEMPERATURE"
   | "WEIGHT";

export interface BloodPressureEvaluation {
   stage?: string;
   systolicStage?: string;
   diastolicStage?: string;
   riskLevel?: string;
   recommendation?: string;
}

export interface HealthRecord {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt?: string | null;
   healthProfileId: string;
   metricType: HealthMetricType;
   valueNumeric: number;
   secondaryValue?: number | null;
   unit: string;
   note?: string | null;
   measuredAt: string;
   evaluation?: BloodPressureEvaluation | Record<string, unknown> | string | null;
}

export interface GetHealthRecordsParams {
   healthProfileId?: string;
   metricType?: HealthMetricType;
   fromDate?: string;
   toDate?: string;
   page?: number;
   limit?: number;
}

export interface HealthRecordsListResponse {
   data?: HealthRecord[];
   items?: HealthRecord[];
   total?: number;
   totalItems?: number;
   page?: number;
   limit?: number;
   totalPages?: number;
}

export type HealthRecordsSummaryResponse = Record<
   string,
   HealthRecord | undefined
>;
