import { Examination } from "../examination/type";
import { HealthProfile } from "../health-profile/type";
import { Staff } from "../staff/type";
import { Factility } from "../facility/type";
import { CareSubscriptions } from "../coordinate/type";

export type CreateConsultationType = {
   examinationId: string;
   reason: string;
};

export type ConsultationStatus =
   | "PENDING"
   | "IN_PROGRESS"
   | "COMPLETED"
   | "CANCELLED"
   | string;

export type Consultation = {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt: null | string;
   consultationCode: string;
   examinationId: string;
   examination?: Examination;
   healthProfileId: string;
   healthProfile?: HealthProfile;
   careSubscriptionId?: string;
   careSubscription?: CareSubscriptions;
   facilityId?: string;
   facility?: Factility;
   requestingDoctorId: string;
   requestingDoctor?: Staff;
   expertDoctorId?: string;
   expertDoctor?: Staff;
   reason: string;
   conclusion?: string;
   status: ConsultationStatus;
   requestedAt?: string;
   respondedAt?: string;
   cancelledAt?: string;
   cancelReason?: string;
};

export type ParamRequestConsultation = {
   page?: number;
   limit?: number;
   status?: string;
   type?: string;
   search?: string;
   facilityId?: string;
   examinationId?: string;
   healthProfileId?: string;
   careSubscriptionId?: string;
   requestingDoctorId?: string;
   expertDoctorId?: string;
};

export type ConsultationListResponse =
   | Consultation[]
   | {
        items: Consultation[];
        total?: number;
        page?: number;
        limit?: number;
     };

export type RespondConsultationPayload = {
   conclusion: string;
};
