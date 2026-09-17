export const STAFF_ROLES = [
   "VNDOCTOR_ADMIN",
   "ADMIN",
   "DOCTOR",
   "DOCTOR_EXPERT",
   "NURSE",
   "STAFF",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_OPTIONS: { label: string; value: StaffRole }[] = [
   { label: "Quản trị viên hệ thống", value: "VNDOCTOR_ADMIN" },
   { label: "Quản trị viên cơ sở", value: "ADMIN" },
   { label: "Bác sĩ chuyên gia", value: "DOCTOR_EXPERT" },
   { label: "Bác sĩ", value: "DOCTOR" },
   { label: "Điều dưỡng", value: "NURSE" },
   { label: "Nhân viên y tế", value: "STAFF" },
];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
   VNDOCTOR_ADMIN: "Quản trị viên hệ thống",
   ADMIN: "Quản trị viên cơ sở",
   DOCTOR_EXPERT: "Bác sĩ chuyên gia",
   DOCTOR: "Bác sĩ",
   NURSE: "Điều dưỡng",
   STAFF: "Nhân viên y tế",
};
