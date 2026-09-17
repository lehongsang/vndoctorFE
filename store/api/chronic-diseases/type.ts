export type ChronicDisease = {
   id: string;
   createdAt: string;
   updatedAt: string;
   deletedAt: string | null;
   code: string;
   name: string;
   icd10Code: string;
   category: string;
   isActive: boolean;
   displayOrder: number;
};

export type CreateChronicDiseaseRequest = {
   code: string;
   name: string;
   icd10Code: string;
   category: string;
   isActive: boolean;
   displayOrder: number;
};

export type UpdateChronicDiseaseRequest = {
   name: string;
   icd10Code: string;
   category: string;
   isActive: boolean;
   displayOrder: number;
};

export type GetAllChronicDiseasesResponse = {
   items: ChronicDisease[];
   total: number;
   page: number;
   limit: number;
};

export type ParamsGetAllChronicDiseases = {
   search?: string;
   page?: number;
   limit?: number;
};
