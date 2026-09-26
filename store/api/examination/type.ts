import { Factility } from "../facility/type";
import { HealthProfile } from "../health-profile/type";
import { Staff } from "../staff/type";

export type ExaminationStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type SaveExaminationTreatmentTargetDto = {
   bpTarget?: string;
   lipidTarget?: string;
   bmiTarget?: string;
   glycemicTarget?: string;
   renalTarget?: string;
   dietAdvice?: string;
   exerciseAdvice?: string;
   smokingAdvice?: string;
   customTargets?: Record<string, string>;
   doctorNotes?: string;
};

export type Examination = {
   id: string;
   healthProfileId: string;
   healthProfile?: HealthProfile;
   facilityId?: string;
   facility?: Factility;
   doctorId?: string;
   doctor?: Staff;
   assessmentInputId?: string;
   treatmentTargetId?: string | null;
   treatmentTarget?: SaveExaminationTreatmentTargetDto & {
      id?: string;
      status?: string;
   };
   treatmentPlanId?: string;
   heartRate?: number;
   systolicBp?: number;
   diastolicBp?: number;
   temperature?: number;
   spo2?: number;
   heightCm?: number;
   weightKg?: number;
   bmi?: number;
   reasonForVisit?: string;
   clinicalSymptoms?: string;
   diagnosis: string;
   icd10Code?: string;
   nextAppointmentDate?: string;
   status: ExaminationStatus;
   createdAt: string;
   updatedAt: string;
   examinationDate?: string;
};

export type CreateExaminationRequest = {
   healthProfileId: string;
   diagnosis: string;
   facilityId?: string;
   assessmentInputId?: string;
   treatmentTargetId?: string;
   treatmentTargetTemplateId?: string;
   treatmentTargetData?: SaveExaminationTreatmentTargetDto;
   treatmentPlanId?: string;
   heartRate?: number;
   systolicBp?: number;
   diastolicBp?: number;
   temperature?: number;
   spo2?: number;
   heightCm?: number;
   weightKg?: number;
   bmi?: number;
   reasonForVisit?: string;
   clinicalSymptoms?: string;
   icd10Code?: string;
   nextAppointmentDate?: string;
   status?: ExaminationStatus;
   examinationDate?: string;
};

export type UpdateExaminationRequest = Partial<
   Omit<CreateExaminationRequest, "treatmentTargetId" | "assessmentInputId">
> & {
   treatmentTargetId?: string | null;
   assessmentInputId?: string | null;
};

export type GetAllExaminationParams = {
   healthProfileId?: string;
   page?: number;
   limit?: number;
   fromDate?: string;
   toDate?: string;
   status?: ExaminationStatus;
};

export type GetAllExaminationResponse = {
   data: Examination[];
   total: number;
   page: number;
   limit: number;
};
