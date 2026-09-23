export type TreatmentTarget = {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt: string;
   healthProfileId: string;
   careSubscriptionId: string;
   doctorId: string;
   expertId: string;
   examinationId: string;
   assessmentResultId: string;
   dictionaryCode: string;
   treatmentPlanId?: string;
   bpTarget: string;
   lipidTarget: string;
   bmiTarget: string;
   glycemicTarget: string;
   renalTarget: string;
   dietAdvice: string;
   exerciseAdvice: string;
   smokingAdvice: string;
   customTargets?:
      | Record<string, string>
      | {
           [key: string]: string;
        }[];
   doctorNotes: string;
   expertNotes: string;
   status: string;
   verifiedAt: string;
};

export type VerifyTreatmentTargetInput = {
   bpTarget: string;
   lipidTarget: string;
   bmiTarget: string;
   glycemicTarget: string;
   renalTarget: string;
   customTargets?: Record<string, string>;
   dietAdvice: string;
   exerciseAdvice: string;
   smokingAdvice: string;
   doctorNotes: string;
   expertNotes: string;
};

export type UpdateTreatmentTargetInput = Partial<TreatmentTarget>;
