import { Factility } from "../facility/type";
import { Staff } from "../staff/type";

export type TreatmentTargetTemplate = {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt: null;
   name: string;
   doctorId?: string;
   doctor?: Staff;
   facilityId?: string;
   facility?: Factility;
   description: string;
   bpTarget: string;
   lipidTarget: string;
   bmiTarget: string;
   glycemicTarget: string;
   renalTarget: string | null;
   dietAdvice: string | null;
   exerciseAdvice: string | null;
   smokingAdvice: string | null;
   customTargets: Record<string, string>;
   doctorNotes: string;
};

export type CreateTreatmentTargetTemplateInput = {
   name: string;
   description: string;
   facilityId: string;
   dictionaryCode: string;
   bpTarget: string;
   lipidTarget: string;
   bmiTarget: string;
   glycemicTarget: string;
   renalTarget: string;
   dietAdvice: string;
   exerciseAdvice: string;
   smokingAdvice: string;
   customTargets: Record<string, string>;
   doctorNotes: string;
   isPublic: boolean;
};

export type UpdateTreatmentTargetTemplateInput =
   Partial<TreatmentTargetTemplate>;

export type ResponseTreatmentTargetTemplate = {
   data: TreatmentTargetTemplate[];
   total: number;
   page: number;
   limit: number;
};

export type ParamsHealthProfileTemplate = {
   doctorId?: string;
   facilityId?: string;
   page?: number;
   limit?: number;
   search?: string;
   dictionaryCode?: string;
   isPublic?: boolean;
};
