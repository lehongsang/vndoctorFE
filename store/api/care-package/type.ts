import { Staff } from "../staff/type";

export type CarePackageType = "STANDARD" | "VIP";
export type CarePackageStatus = "ACTIVE" | "INACTIVE";

export type CreateCarePackageRequest = {
   facilityId: string;
   name: string;
   type: CarePackageType;
   doctorExpertId?: string;
   description: string;
   durationDays: number;
   priceAmount: number;
   status: CarePackageStatus;
};

export type CarePackage = {
   id: string;
   createdAt: string;
   updatedAt: string;
   facilityId: string;
   code: string;
   name: string;
   type: CarePackageType;
   doctorExpertId?: string;
   doctorExpert?: Staff;
   description: string;
   durationDays: number;
   priceAmount: number;
   status: CarePackageStatus;
};

export type CarePackageUpdateRequest = {
   name?: string;
   type?: CarePackageType;
   facilityId?: string;
   doctorExpertId?: string;
   description?: string;
   durationDays?: number;
   priceAmount?: number;
   status?: CarePackageStatus;
};

export type CarePackageParams = {
   page?: number;
   limit?: number;
   search?: string;
   type?: CarePackageType;
   facilityId?: string;
   status?: CarePackageStatus;
};

export type CarePackageListResponse = {
   data: CarePackage[];
   total: number;
   page: number;
   limit: number;
};
