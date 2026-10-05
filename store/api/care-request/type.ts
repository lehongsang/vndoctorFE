import { CarePackage } from "../care-package/type";
import { Staff } from "../staff/type";

export type CareRequestStatus =
   | "PENDING"
   | "IN_PROGRESS"
   | "RESOLVED"
   | "CANCELLED";

export type CareRequestListItem = {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt?: string | null;
   requestCode?: string;
   facilityId?: string;
   subscriptionId: string;
   assignedUserId?: string;
   assignedUser?: Staff;
   status: CareRequestStatus;
   title: string;
   description: string;
   mediaUrls?: string[];
   resolutionNote?: string;
   resolvedAt?: string;
   subscription?: {
      id: string;
      status?: string;
      healthProfile?: {
         id: string;
         fullName: string;
         hospitalPatientCode?: string;
         phoneNumber?: string;
         dob?: string;
         gender?: string;
      };
      carePackage?: CarePackage;
      assignedDoctorId?: string;
   };
};

export type CareRequest = CareRequestListItem;

export type CareRequestDetail = CareRequestListItem & {
   facility?: {
      id: string;
      facilityName?: string;
      facilityCode?: string;
   };
};

export type CareRequestListResponse = {
   data: CareRequest[];
   page?: number;
   limit?: number;
   total?: number;
};

export type GetCareRequestsParams = {
   page?: number;
   limit?: number;
   status?: CareRequestStatus;
   search?: string;
};

export type ReceiveaCareRequestBody = {
   assignedUserId: string;
   note: string;
};

export type UpdateStatusCareRequest = {
   status: CareRequestStatus;
};
