export const FACILITY_TYPES = [
   "CENTRAL_HOSPITAL",
   "PROVINCIAL_HOSPITAL",
   "DISTRICT_HOSPITAL",
   "COMMUNE_HEALTH_STATION",
   "CLINIC",
   "OTHER",
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

export const FACILITY_TYPE_OPTIONS: { label: string; value: FacilityType }[] = [
   { label: "Bệnh viện tuyến Trung ương", value: "CENTRAL_HOSPITAL" },
   { label: "Bệnh viện tuyến Tỉnh / Thành phố", value: "PROVINCIAL_HOSPITAL" },
   { label: "Bệnh viện tuyến Quận / Huyện", value: "DISTRICT_HOSPITAL" },
   { label: "Trạm y tế Xã / Phường", value: "COMMUNE_HEALTH_STATION" },
   { label: "Phòng khám", value: "CLINIC" },
   { label: "Cơ sở y tế khác", value: "OTHER" },
];

export type Factility = {
   id: string;
   createdAt: string;
   updatedAt: string;
   facilityCode: string;
   facilityName: string;
   facilityType: FacilityType;
   parentId?: string;
   phoneNumber?: string;
   address?: string;
   isActive: boolean;
};

export type CreateFacilityRequestDto = {
   facilityCode?: string;
   facilityName: string;
   facilityType: FacilityType;
   parentId?: string;
   phoneNumber?: string;
   address?: string;
   isActive?: boolean;
};

export type UpdateFacilityDto = {
   facilityName?: string;
   facilityType?: FacilityType;
   parentId?: string;
   phoneNumber?: string;
   address?: string;
   isActive?: boolean;
};

export type GetChildrenF1FacilityParams = {
   id: string;
   search?: string;
   page?: number;
   limit?: number;
   facilityType?: FacilityType;
};

export type GetChildrenF1FacilityQueryArgs =
   | string
   | GetChildrenF1FacilityParams;

