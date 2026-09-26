import { CarePackage } from "../care-package/type";
import { HealthProfile } from "../health-profile/type";
import { Staff } from "../staff/type";

export type CareSubscriptions = {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt: string | null;
   healthProfileId: string;
   healthProfile?: HealthProfile;
   carePackageId: string;
   carePackage?: CarePackage;
   assignedDoctorId?: string;
   assignedDoctor?: Staff;
   assignedNurseId?: string;
   assignedNurse?: Staff;
   assignedExpertId?: string;
   assignedExpert?: Staff;
   status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
   isPatientConfirmed: boolean;
   patientConfirmedAt: string | null;
   registeredByStaffId: string;
   rejectionReason: string | null;
   startedAt: string;
   expiresAt: string;
};

export type AssignStaffBody = {
   assignedDoctorId?: string | null;
   assignedNurseId?: string | null;
   assignedExpertId?: string | null;
};

export type StaffRegisterRequest = {
   healthProfileId: string;
   carePackageId: string;
};

export type UpdateAssignStaffBody = {
   assignedDoctorId?: string | null;
   assignedNurseId?: string | null;
   assignedExpertId?: string | null;
};

export type ParamGetCareSubscriptions = {
   search: string;
   page?: number;
   limit?: number;
   sortBy?: string;
   status?: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
};

export type ResponseGetCareSubscriptions = {
   data: CareSubscriptions[];
   total: number;
   page: number;
   limit: number;
};
