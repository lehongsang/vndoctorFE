import { CareSubscriptions } from "../coordinate/type";

export type LinkStatus = "NOT_LINKED" | "PENDING" | "ACTIVE" | "UNLINKED";
export type AppLinkStatus = "UN_LINK" | "LINKED";

export type HealthProfile = {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt: string | null;
   accountId: string;
   relationship: "SELF" | "FATHER" | "MOTHER" | "CHILD" | "SPOUSE" | "OTHER";
   fullName: string;
   hospitalPatientCode: string;
   linkStatus: LinkStatus;
   dob: string;
   gender: "MALE" | "FEMALE" | "OTHER";
   citizenId: string;
   phoneNumber: string;
   address: string;
   bloodType: string;
   allergy: string;
   isLinked: boolean;
   appLinkStatus: AppLinkStatus;
   medicalHistory: string;
   height: number;
   weight: number;
   isSmoking: boolean;
   hasHypertension: boolean;
   hasDyslipidemia: boolean;
   hasDiabetes: boolean;
   hasStroke: boolean;
   hasMyocardialInfarction: boolean;
   hasAcuteCoronarySyndrome: boolean;
   hasCoronaryArteryDisease: boolean;
   hasTia: boolean;
   hasAorticAneurysm: boolean;
   hasPeripheralArteryDisease: boolean;
   hasAtherosclerosis: boolean;
   hasFamilialHypercholesterolemia: boolean;
   facilityId: string;
   facilityLink?: {
      id: string;
      status?: string;
      hospitalPatientCode?: string;
      phoneNumber?: string;
      linkedAt?: string;
      facility?: {
         id?: string;
         facilityCode?: string;
         facilityName?: string;
         facilityType?: string;
         phoneNumber?: string;
         address?: string;
         isActive?: boolean;
      };
   }[];
   facility: {
      id: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      facilityCode: string;
      facilityName: string;
      facilityType: string;
      parentId: string | null;
      phoneNumber: string;
      address: string;
      isActive: boolean;
   };
   careSubscriptionId?: string;
   careSubscriptions?: CareSubscriptions[];
   carePackageId?: string;
   subscription?: CareSubscriptions;
};

export type CreateHealthProfile = {
   relationship: "SELF" | "FATHER" | "MOTHER" | "CHILD" | "SPOUSE" | "OTHER";
   fullName: string;
   dob: string;
   gender: "MALE" | "FEMALE" | "OTHER";
   citizenId: string;
   phoneNumber: string;
   address: string;
   bloodType: "UNKNOWN" | "A" | "B" | "AB" | "O";
   allergy: string;
   medicalHistory: string;
   height: number;
   weight: number;
   isSmoking: boolean;
   hasHypertension: boolean;
   hasDyslipidemia: boolean;
   hasDiabetes: boolean;
   hasStroke: boolean;
   hasMyocardialInfarction: boolean;
   hasAcuteCoronarySyndrome: boolean;
   hasCoronaryArteryDisease: boolean;
   hasTia: boolean;
   hasAorticAneurysm: boolean;
   hasPeripheralArteryDisease: boolean;
   hasAtherosclerosis: boolean;
   hasFamilialHypercholesterolemia: boolean;
};

export type UpdateHealthProfile = Partial<CreateHealthProfile> & {
   id?: string;
};

export type RequestParamsHealthProfile = {
   page: number;
   limit: number;
   search?: string;
   linkStatus?: LinkStatus;
   staffId?: string;
};

export type ResponseListHealthProfile = {
   items: HealthProfile[];
   total: number;
   page: number;
   limit: number;
};

export type LinkRequest = {
   healthProfileId: string;
   phoneNumber: string;
};

export type ParamsHealthProfileAssign = {
   page?: number;
   limit?: number;
   doctorId?: string;
   facilityId?: string;
   search?: string;
};

export type ResponseListHealthProfileAssign = {
   items: HealthProfile[];
   total: number;
   page: number;
   limit: number;
};
