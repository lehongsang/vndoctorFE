import { Factility } from "../facility/type";

export {
   STAFF_ROLES,
   STAFF_ROLE_OPTIONS,
   STAFF_ROLE_LABELS,
   type StaffRole,
} from "@/types/staff";
import { StaffRole } from "@/types/staff";

export type Staff = {
   id: string;
   createdAt: string;
   updatedAt: string;
   facilityId?: string | null;
   facility?: Factility | null;
   staffCode: string;
   username: string;
   fullName: string;
   role: StaffRole;
   specialty?: string | null;
   email?: string | null;
   phoneNumber?: string | null;
   isActive: boolean;
};

export type StaffListResponse = {
   items: Staff[];
   total: number;
   page: number;
   limit: number;
   totalPages?: number;
};

export type GetStaffParams = {
   search?: string;
   page?: number;
   limit?: number;
   facilityId?: string;
   role?: StaffRole;
   isActive?: boolean;
   sortBy?: string;
   sortOrder?: "asc" | "desc";
};

export type GetStaffQueryArgs = string | GetStaffParams | void;

export type CreateStaffDto = {
   facilityId?: string;
   fullName: string;
   email: string;
   username?: string;
   password?: string;
   role: StaffRole;
   specialty?: string;
   phoneNumber?: string;
};

export type UpdateStaffDto = {
   fullName?: string;
   email?: string;
   role?: StaffRole;
   specialty?: string;
   phoneNumber?: string;
   isActive?: boolean;
};

export type ChangeStaffPasswordDto = {
   oldPassword: string;
   newPassword: string;
};

export type CreateStaffResponse = {
   data: string;
   message: string;
};

export type CreateStaffPayload = {
   facilityId: string;
   fullName: string;
   email: string;
   username: string;
   password: string;
   role: StaffRole;
   specialty: string;
   phoneNumber: string;
};

export type UpdateStaffPayloadAdmin = {
   fullName: string;
   email: string;
   role: StaffRole;
   specialty?: string;
   phoneNumber: string;
   isActive: boolean;
};

export type UpdateStaffPayload = {
   fullName: string;
   email: string;
   specialty?: string;
   phoneNumber: string;
};
