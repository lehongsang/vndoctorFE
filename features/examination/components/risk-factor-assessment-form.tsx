"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { HealthProfile } from "@/store/api/health-profile/type";
import {
   CreateRiskAssessmentRequest,
   RiskAssessmentResult,
} from "@/store/api/risk-factor-assessment/type";
import {
   useCreateRiskAssessmentMutation,
   useGetRiskAssessmentFormSchemaQuery,
} from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { useGetChronicDiseasesByHealthProfileIdQuery } from "@/store/api/chronic-diseases/chronic-diseases-api";
import { FormInput } from "@/components/common/form-input";
import { FormSelect } from "@/components/common/form-select";
import { CustomButton } from "@/components/common/custom-button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, Sparkles } from "lucide-react";
import { RiskAssessmentEvaluationModal } from "./risk-assessment-evaluation-modal";
import {
   OcrExtractedFormValues,
   OcrMedicalRecordModal,
} from "./ocr-medical-record-modal";
import { Examination } from "@/store/api/examination/type";
import { cn } from "@/lib/utils";

export interface RiskFactorAssessmentFormProps {
   selectedProfile?: HealthProfile | null;
   onStartExaminationWithAssessment?: (
      assessment: RiskAssessmentResult,
      initialVitals?: Partial<Examination>,
   ) => void;
}

const assessmentSchema = z
   .object({
      hasUnderlyingDisease: z.boolean(),
      age: z.number().nullable().optional(),
      gender: z.string().optional(),
      isSmoking: z.boolean(),
      systolicBp: z.number().nullable().optional(),
      diastolicBp: z.number().nullable().optional(),
      totalCholesterol: z.number().nullable().optional(),
      hdlCholesterol: z.number().nullable().optional(),
      glucoseFasting: z.number().nullable().optional(),
      heightCm: z.number().nullable().optional(),
      weightKg: z.number().nullable().optional(),

      // 1. Dấu hiệu tổn thương cơ quan đích
      hasLeftVentricularHypertrophy: z.boolean(),
      hasAlbuminuria: z.boolean(),
      hasRetinopathy: z.boolean(),
      hasSilentBrainInfarct: z.boolean(),

      // 2. Đái tháo đường & Thận
      diabetes: z.boolean(),
      diabetesDurationYears: z.number().nullable().optional(),
      glycemicControl: z.string().optional(),
      egfr: z.number().nullable().optional(),
      acr: z.number().nullable().optional(),

      // 3. Tiền sử biến cố tim mạch nặng
      stroke: z.boolean(),
      hasMyocardialInfarction: z.boolean(),
      hasAcuteCoronarySyndrome: z.boolean(),
      hasCoronaryArteryDisease: z.boolean(),
      hasTia: z.boolean(),
      hasAorticAneurysm: z.boolean(),
      hasPeripheralArteryDisease: z.boolean(),
      hasAtherosclerosis: z.boolean(),
      hasFamilialHypercholesterolemia: z.boolean(),
   })
   .superRefine((data, ctx) => {
      if (!data.hasUnderlyingDisease) {
         if (data.age === null || data.age === undefined) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Vui lòng nhập tuổi",
               path: ["age"],
            });
         } else if (data.age < 40) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Theo quy định Bộ Y tế, tuổi đánh giá SCORE2 bắt buộc từ 40 tuổi trở lên",
               path: ["age"],
            });
         } else if (data.age > 100) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Tuổi đánh giá tối đa là 100 tuổi",
               path: ["age"],
            });
         }

         // 2. Giới tính: Bắt buộc chọn
         if (!data.gender || data.gender.trim() === "") {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Vui lòng chọn giới tính",
               path: ["gender"],
            });
         }

         // 3. Huyết áp tâm thu: 70 - 250 mmHg (khoảng lâm sàng theo hướng dẫn BYT)
         if (data.systolicBp === null || data.systolicBp === undefined) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Vui lòng nhập huyết áp tâm thu",
               path: ["systolicBp"],
            });
         } else if (data.systolicBp < 70 || data.systolicBp > 250) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Huyết áp tâm thu hợp lệ từ 70 - 250 mmHg (theo BYT)",
               path: ["systolicBp"],
            });
         }

         // 4. Huyết áp tâm trương: 40 - 150 mmHg
         if (data.diastolicBp === null || data.diastolicBp === undefined) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Vui lòng nhập huyết áp tâm trương",
               path: ["diastolicBp"],
            });
         } else if (data.diastolicBp < 40 || data.diastolicBp > 150) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Huyết áp tâm trương hợp lệ từ 40 - 150 mmHg (theo BYT)",
               path: ["diastolicBp"],
            });
         }

         // Kiểm tra logic sinh lý: Tâm thu phải lớn hơn tâm trương
         if (
            data.systolicBp !== null &&
            data.systolicBp !== undefined &&
            data.diastolicBp !== null &&
            data.diastolicBp !== undefined &&
            data.systolicBp <= data.diastolicBp
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Huyết áp tâm thu phải lớn hơn huyết áp tâm trương",
               path: ["systolicBp"],
            });
         }

         // 5. Cholesterol toàn phần: 2.0 - 15.0 mmol/L (theo thang BYT / SCORE2)
         if (
            data.totalCholesterol === null ||
            data.totalCholesterol === undefined
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Vui lòng nhập Cholesterol toàn phần",
               path: ["totalCholesterol"],
            });
         } else if (
            data.totalCholesterol < 2.0 ||
            data.totalCholesterol > 15.0
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Cholesterol toàn phần hợp lệ từ 2.0 - 15.0 mmol/L (theo BYT)",
               path: ["totalCholesterol"],
            });
         }

         // 6. HDL-Cholesterol (nếu nhập): 0.5 - 4.5 mmol/L
         if (
            data.hdlCholesterol !== null &&
            data.hdlCholesterol !== undefined
         ) {
            if (data.hdlCholesterol < 0.5 || data.hdlCholesterol > 4.5) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "HDL-Cholesterol hợp lệ từ 0.5 - 4.5 mmol/L",
                  path: ["hdlCholesterol"],
               });
            } else if (
               data.totalCholesterol !== null &&
               data.totalCholesterol !== undefined &&
               data.hdlCholesterol >= data.totalCholesterol
            ) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "HDL-Cholesterol phải nhỏ hơn Cholesterol toàn phần",
                  path: ["hdlCholesterol"],
               });
            }
         }

         // 7. Đường huyết lúc đói (nếu nhập): 2.0 - 35.0 mmol/L
         if (
            data.glucoseFasting !== null &&
            data.glucoseFasting !== undefined
         ) {
            if (data.glucoseFasting < 2.0 || data.glucoseFasting > 35.0) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Đường huyết lúc đói hợp lệ từ 2.0 - 35.0 mmol/L",
                  path: ["glucoseFasting"],
               });
            }
         }

         // 8. Chiều cao & Cân nặng (nếu nhập)
         if (data.heightCm !== null && data.heightCm !== undefined) {
            if (data.heightCm < 100 || data.heightCm > 250) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Chiều cao hợp lệ từ 100 - 250 cm",
                  path: ["heightCm"],
               });
            }
         }
         if (data.weightKg !== null && data.weightKg !== undefined) {
            if (data.weightKg < 25 || data.weightKg > 250) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Cân nặng hợp lệ từ 25 - 250 kg",
                  path: ["weightKg"],
               });
            }
         }
      } else {
         // Luồng 2: Có bệnh nền (Non-ASCVD)
         if (data.diabetes) {
            if (
               data.diabetesDurationYears === null ||
               data.diabetesDurationYears === undefined
            ) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Vui lòng nhập số năm mắc ĐTĐ",
                  path: ["diabetesDurationYears"],
               });
            } else if (
               data.diabetesDurationYears < 0 ||
               data.diabetesDurationYears > 80
            ) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Số năm mắc ĐTĐ từ 0 - 80 năm",
                  path: ["diabetesDurationYears"],
               });
            }

            if (!data.glycemicControl || data.glycemicControl.trim() === "") {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Vui lòng chọn mức kiểm soát đường máu",
                  path: ["glycemicControl"],
               });
            }
         }

         // eGFR (Độ lọc cầu thận, nếu nhập)
         if (data.egfr !== null && data.egfr !== undefined) {
            if (data.egfr < 5 || data.egfr > 180) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "eGFR hợp lệ từ 5 - 180 mL/phút/1.73m² (theo BYT)",
                  path: ["egfr"],
               });
            }
         }

         // ACR (Tỷ lệ Albumin/Creatinin niệu, nếu nhập)
         if (data.acr !== null && data.acr !== undefined) {
            if (data.acr < 0 || data.acr > 1000) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "ACR hợp lệ từ 0 - 1000 mg/g (theo BYT)",
                  path: ["acr"],
               });
            }
         }
      }
   });

export type AssessmentFormValues = z.infer<typeof assessmentSchema>;

const GENDER_OPTIONS = [
   { label: "Nam", value: "Nam" },
   { label: "Nữ", value: "Nữ" },
];

const GLYCEMIC_OPTIONS = [
   { label: "Tốt", value: "Tốt" },
   { label: "Không tốt", value: "Không tốt" },
];

const TARGET_ORGAN_DAMAGE_ITEMS: {
   name: keyof AssessmentFormValues;
   label: string;
}[] = [
   {
      name: "hasLeftVentricularHypertrophy",
      label: "Phì đại thất trái (ECG / Siêu âm tim)",
   },
   {
      name: "hasAlbuminuria",
      label: "Có Albumin niệu / Microalbumin niệu",
   },
   {
      name: "hasRetinopathy",
      label: "Tổn thương võng mạc do THA / mạch cảnh",
   },
   {
      name: "hasSilentBrainInfarct",
      label: "Nhồi máu não thầm lặng",
   },
];

const CARDIOVASCULAR_EVENT_ITEMS: {
   name: keyof AssessmentFormValues;
   label: string;
}[] = [
   { name: "stroke", label: "Tiền sử đột quỵ não / Tai biến" },
   { name: "hasMyocardialInfarction", label: "Nhồi máu cơ tim" },
   { name: "hasAcuteCoronarySyndrome", label: "Hội chứng vành cấp" },
   { name: "hasCoronaryArteryDisease", label: "Bệnh lý động mạch vành mạn" },
   { name: "hasTia", label: "Cơn thiếu máu não thoáng qua (TIA)" },
   { name: "hasAorticAneurysm", label: "Phình động mạch chủ" },
   { name: "hasPeripheralArteryDisease", label: "Bệnh mạch máu ngoại vi" },
   { name: "hasAtherosclerosis", label: "Vữa xơ mạch máu lớn" },
   {
      name: "hasFamilialHypercholesterolemia",
      label: "Tăng Cholesterol máu gia đình",
   },
];

const DISEASE_CODE_MAP: Record<string, keyof AssessmentFormValues> = {
   diabetes: "diabetes",
   dtd: "diabetes",
   tieuduong: "diabetes",
   e10: "diabetes",
   e11: "diabetes",
   e14: "diabetes",
   stroke: "stroke",
   dotquy: "stroke",
   taibien: "stroke",
   cva: "stroke",
   i63: "stroke",
   i64: "stroke",
   hasmyocardialinfarction: "hasMyocardialInfarction",
   myocardial_infarction: "hasMyocardialInfarction",
   nhoimaucotim: "hasMyocardialInfarction",
   mi: "hasMyocardialInfarction",
   i21: "hasMyocardialInfarction",
   hasacutecoronarysyndrome: "hasAcuteCoronarySyndrome",
   acute_coronary_syndrome: "hasAcuteCoronarySyndrome",
   hoichungvanhcap: "hasAcuteCoronarySyndrome",
   acs: "hasAcuteCoronarySyndrome",
   hascoronaryarterydisease: "hasCoronaryArteryDisease",
   coronary_artery_disease: "hasCoronaryArteryDisease",
   machvanhman: "hasCoronaryArteryDisease",
   cad: "hasCoronaryArteryDisease",
   i25: "hasCoronaryArteryDisease",
   hastia: "hasTia",
   tia: "hasTia",
   g45: "hasTia",
   hasaorticaneurysm: "hasAorticAneurysm",
   aortic_aneurysm: "hasAorticAneurysm",
   phinhdongmachchu: "hasAorticAneurysm",
   i71: "hasAorticAneurysm",
   hasperipheralarterydisease: "hasPeripheralArteryDisease",
   peripheral_artery_disease: "hasPeripheralArteryDisease",
   machmaungoaivi: "hasPeripheralArteryDisease",
   pad: "hasPeripheralArteryDisease",
   i73: "hasPeripheralArteryDisease",
   hasatherosclerosis: "hasAtherosclerosis",
   atherosclerosis: "hasAtherosclerosis",
   vuaxomachmau: "hasAtherosclerosis",
   i70: "hasAtherosclerosis",
   hasfamilialhypercholesterolemia: "hasFamilialHypercholesterolemia",
   familial_hypercholesterolemia: "hasFamilialHypercholesterolemia",
   fh: "hasFamilialHypercholesterolemia",
   e78: "hasFamilialHypercholesterolemia",
   hasleftventricularhypertrophy: "hasLeftVentricularHypertrophy",
   lvh: "hasLeftVentricularHypertrophy",
   phidaithattrai: "hasLeftVentricularHypertrophy",
   hasalbuminuria: "hasAlbuminuria",
   albuminuria: "hasAlbuminuria",
   albumin_nieu: "hasAlbuminuria",
   hasretinopathy: "hasRetinopathy",
   retinopathy: "hasRetinopathy",
   tonthuongvongmac: "hasRetinopathy",
   hassilentbraininfarct: "hasSilentBrainInfarct",
   silent_brain_infarct: "hasSilentBrainInfarct",
   nhoimaunaothamlang: "hasSilentBrainInfarct",
};

function matchDiseaseToField(disease: {
   code?: string;
   icd10Code?: string;
   name?: string;
}): keyof AssessmentFormValues | null {
   const clean = (s?: string) =>
      s
         ? s
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]/g, "")
         : "";

   const codeKey = clean(disease.code);
   const icdKey = clean(disease.icd10Code);
   const nameKey = clean(disease.name);

   if (codeKey && DISEASE_CODE_MAP[codeKey]) return DISEASE_CODE_MAP[codeKey];
   if (icdKey && DISEASE_CODE_MAP[icdKey]) return DISEASE_CODE_MAP[icdKey];

   if (
      nameKey.includes("daithaoduong") ||
      nameKey.includes("tieuduong") ||
      nameKey.includes("diabetes")
   ) {
      return "diabetes";
   }
   if (
      nameKey.includes("dotquy") ||
      nameKey.includes("taibien") ||
      nameKey.includes("stroke")
   ) {
      return "stroke";
   }
   if (nameKey.includes("nhoimaucotim") || nameKey.includes("myocardial")) {
      return "hasMyocardialInfarction";
   }
   if (nameKey.includes("vanhcap") || nameKey.includes("acutecoronary")) {
      return "hasAcuteCoronarySyndrome";
   }
   if (
      nameKey.includes("dongmachvanh") ||
      nameKey.includes("machvanh") ||
      nameKey.includes("coronary")
   ) {
      return "hasCoronaryArteryDisease";
   }
   if (nameKey.includes("tia") || nameKey.includes("thoangqua")) {
      return "hasTia";
   }
   if (
      nameKey.includes("phinhdongmachchu") ||
      nameKey.includes("aorticaneurysm")
   ) {
      return "hasAorticAneurysm";
   }
   if (
      nameKey.includes("machmaungoaivi") ||
      nameKey.includes("peripheralartery")
   ) {
      return "hasPeripheralArteryDisease";
   }
   if (
      nameKey.includes("vuaxomachmau") ||
      nameKey.includes("xovua") ||
      nameKey.includes("atherosclerosis")
   ) {
      return "hasAtherosclerosis";
   }
   if (
      nameKey.includes("tangcholesterol") ||
      nameKey.includes("cholesterolgiadinh")
   ) {
      return "hasFamilialHypercholesterolemia";
   }
   if (nameKey.includes("phidaithattrai") || nameKey.includes("hypertrophy")) {
      return "hasLeftVentricularHypertrophy";
   }
   if (nameKey.includes("albuminnieu") || nameKey.includes("albuminuria")) {
      return "hasAlbuminuria";
   }
   if (nameKey.includes("vongmac") || nameKey.includes("retinopathy")) {
      return "hasRetinopathy";
   }
   if (
      nameKey.includes("nhoimaunaothamlang") ||
      nameKey.includes("silentbrain")
   ) {
      return "hasSilentBrainInfarct";
   }

   return null;
}

export type FieldDataSource = "PROFILE" | "OCR" | "MANUAL";

interface CheckboxCardItemProps {
   name: keyof AssessmentFormValues;
   label: string;
   control: Control<AssessmentFormValues>;
   disabled?: boolean;
   isLocked?: boolean;
   source?: FieldDataSource;
}

function CheckboxCardItem({
   name,
   label,
   control,
   disabled = false,
   isLocked = false,
   source,
}: CheckboxCardItemProps) {
   return (
      <Controller
         name={name}
         control={control}
         render={({ field }) => (
            <label
               className={cn(
                  "flex items-center gap-2 font-semibold text-sm text-slate-700 select-none",
                  disabled ? "cursor-not-allowed opacity-85" : "cursor-pointer",
               )}
            >
               <Checkbox
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => {
                     if (disabled) return;
                     field.onChange(checked);
                  }}
                  disabled={disabled}
                  className="rounded! border border-primary"
               />
               <span className="flex items-center gap-1.5 flex-wrap">
                  {label}
                  {isLocked ? (
                     <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        Hồ sơ
                     </span>
                  ) : source === "OCR" && field.value ? (
                     <span className="text-[10px] font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-violet-600 inline-block" />
                        Từ OCR
                     </span>
                  ) : null}
               </span>
            </label>
         )}
      />
   );
}

export function RiskFactorAssessmentForm({
   selectedProfile,
   onStartExaminationWithAssessment,
}: RiskFactorAssessmentFormProps) {
   const router = useRouter();
   const [assessmentResult, setAssessmentResult] =
      useState<RiskAssessmentResult | null>(null);
   const [isEvaluationModalOpen, setIsEvaluationModalOpen] =
      useState<boolean>(false);
   const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
   const [fieldSources, setFieldSources] = useState<
      Partial<Record<keyof AssessmentFormValues, FieldDataSource>>
   >({});

   const [createAssessment, { isLoading: isSubmitting }] =
      useCreateRiskAssessmentMutation();

   // Lấy dữ liệu schema & bệnh nền đã ghi nhận của bệnh nhân
   const { data: schemaData } = useGetRiskAssessmentFormSchemaQuery(
      { healthProfileId: selectedProfile?.id || "" },
      { skip: !selectedProfile?.id },
   );

   const { data: profileChronicDiseases } =
      useGetChronicDiseasesByHealthProfileIdQuery(
         { healthProfileId: selectedProfile?.id || "" },
         { skip: !selectedProfile?.id },
      );

   // Tuổi tính từ ngày sinh hồ sơ
   const profileAge = selectedProfile?.dob
      ? Math.max(
           0,
           new Date().getFullYear() -
              new Date(selectedProfile.dob).getFullYear(),
        )
      : null;

   const profileGender =
      selectedProfile?.gender === "MALE"
         ? "Nam"
         : selectedProfile?.gender === "FEMALE"
           ? "Nữ"
           : "";

   // Danh sách các bệnh nền đã ghi nhận trong hồ sơ (cần khóa và auto check)
   const lockedDiseaseKeys = useMemo(() => {
      const keys = new Set<keyof AssessmentFormValues>();
      if (!selectedProfile) return keys;

      // 1. Từ Schema trả về
      if (schemaData?.patientProfile?.recordedDiseaseCodes) {
         schemaData.patientProfile.recordedDiseaseCodes.forEach((code) => {
            const matched = matchDiseaseToField({ code });
            if (matched) keys.add(matched);
         });
      }
      if (schemaData?.sections) {
         schemaData.sections.forEach((sec) => {
            sec.fields.forEach((f) => {
               if (f.disabled && f.value) {
                  const matched = matchDiseaseToField({ code: f.name });
                  if (matched) keys.add(matched);
               }
            });
         });
      }

      // 2. Từ danh sách bệnh mạn tính của hồ sơ
      if (Array.isArray(profileChronicDiseases)) {
         profileChronicDiseases.forEach((cd) => {
            const matched = matchDiseaseToField(cd);
            if (matched) keys.add(matched);
         });
      }

      // 3. Từ các trường yếu tố nguy cơ và bệnh lý trong hồ sơ sức khỏe
      if (selectedProfile.hasDiabetes) {
         keys.add("diabetes");
      }
      if (selectedProfile.hasStroke) {
         keys.add("stroke");
      }
      if (selectedProfile.hasMyocardialInfarction) {
         keys.add("hasMyocardialInfarction");
      }
      if (selectedProfile.hasAcuteCoronarySyndrome) {
         keys.add("hasAcuteCoronarySyndrome");
      }
      if (selectedProfile.hasCoronaryArteryDisease) {
         keys.add("hasCoronaryArteryDisease");
      }
      if (selectedProfile.hasTia) {
         keys.add("hasTia");
      }
      if (selectedProfile.hasAorticAneurysm) {
         keys.add("hasAorticAneurysm");
      }
      if (selectedProfile.hasPeripheralArteryDisease) {
         keys.add("hasPeripheralArteryDisease");
      }
      if (selectedProfile.hasAtherosclerosis) {
         keys.add("hasAtherosclerosis");
      }
      if (selectedProfile.hasFamilialHypercholesterolemia) {
         keys.add("hasFamilialHypercholesterolemia");
      }

      return keys;
   }, [selectedProfile, schemaData, profileChronicDiseases]);

   const hasRecordedUnderlying =
      Boolean(schemaData?.patientProfile?.hasRecordedUnderlyingDiseases) ||
      lockedDiseaseKeys.size > 0 ||
      Boolean(selectedProfile?.hasDiabetes) ||
      Boolean(selectedProfile?.hasStroke) ||
      Boolean(selectedProfile?.hasMyocardialInfarction) ||
      Boolean(selectedProfile?.hasAcuteCoronarySyndrome) ||
      Boolean(selectedProfile?.hasCoronaryArteryDisease) ||
      Boolean(selectedProfile?.hasTia) ||
      Boolean(selectedProfile?.hasAorticAneurysm) ||
      Boolean(selectedProfile?.hasPeripheralArteryDisease) ||
      Boolean(selectedProfile?.hasAtherosclerosis) ||
      Boolean(selectedProfile?.hasFamilialHypercholesterolemia);

   const isAgeLocked = Boolean(
      profileAge !== null || schemaData?.patientProfile?.calculatedAge,
   );
   const isGenderLocked = Boolean(
      profileGender || schemaData?.patientProfile?.gender,
   );
   const isSmokingLocked = selectedProfile?.isSmoking !== undefined;

   const getFieldSource = (
      fieldName: keyof AssessmentFormValues,
   ): FieldDataSource => {
      const isFromProfile =
         (fieldName === "age" && isAgeLocked) ||
         (fieldName === "gender" && isGenderLocked) ||
         (fieldName === "isSmoking" && isSmokingLocked) ||
         (fieldName === "hasUnderlyingDisease" && hasRecordedUnderlying) ||
         lockedDiseaseKeys.has(fieldName);

      if (isFromProfile) return "PROFILE";
      if (fieldSources[fieldName] === "OCR") return "OCR";
      return "MANUAL";
   };

   const renderSourceBadge = (fieldName: keyof AssessmentFormValues) => {
      const source = getFieldSource(fieldName);

      if (source === "PROFILE") {
         return (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
               Hồ sơ
            </span>
         );
      }
      if (source === "OCR") {
         return (
            <span className="text-[10px] font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
               <Sparkles className="w-2.5 h-2.5 text-violet-600 inline-block" />
               Từ OCR
            </span>
         );
      }
      return null;
   };

   const renderFieldLabel = (
      title: string,
      fieldName: keyof AssessmentFormValues,
      customSubtext?: string,
   ) => {
      return (
         <span className="flex items-center justify-between gap-1.5 w-full flex-wrap">
            <span className="flex items-center gap-1.5">
               <span>{title}</span>
               {customSubtext && (
                  <span className="text-[11px] font-normal text-slate-500">
                     {customSubtext}
                  </span>
               )}
            </span>
            {renderSourceBadge(fieldName)}
         </span>
      );
   };

   const {
      register,
      handleSubmit,
      control,
      setValue,
      formState: { errors },
   } = useForm<AssessmentFormValues>({
      resolver: zodResolver(assessmentSchema),
      defaultValues: {
         hasUnderlyingDisease: false,
         age: profileAge,
         gender: profileGender,
         isSmoking: Boolean(selectedProfile?.isSmoking),
         systolicBp: null,
         diastolicBp: null,
         totalCholesterol: null,
         hdlCholesterol: null,
         glucoseFasting: null,
         heightCm: null,
         weightKg: null,
         hasLeftVentricularHypertrophy: false,
         hasAlbuminuria: false,
         hasRetinopathy: false,
         hasSilentBrainInfarct: false,
         diabetes: false,
         diabetesDurationYears: null,
         glycemicControl: "",
         egfr: null,
         acr: null,
         stroke: false,
         hasMyocardialInfarction: false,
         hasAcuteCoronarySyndrome: false,
         hasCoronaryArteryDisease: false,
         hasTia: false,
         hasAorticAneurysm: false,
         hasPeripheralArteryDisease: false,
         hasAtherosclerosis: false,
         hasFamilialHypercholesterolemia: false,
      },
   });

   // Tự động điền thông tin và khóa dữ liệu từ hồ sơ bệnh nhân
   useEffect(() => {
      if (!selectedProfile) return;

      const effectiveAge =
         schemaData?.patientProfile?.calculatedAge ?? profileAge;
      if (effectiveAge !== null && effectiveAge !== undefined) {
         setValue("age", effectiveAge);
      }

      const effectiveGender =
         schemaData?.patientProfile?.gender === "MALE"
            ? "Nam"
            : schemaData?.patientProfile?.gender === "FEMALE"
              ? "Nữ"
              : profileGender;
      if (effectiveGender) {
         setValue("gender", effectiveGender);
      }

      if (selectedProfile.isSmoking !== undefined) {
         setValue("isSmoking", Boolean(selectedProfile.isSmoking));
      }

      if (hasRecordedUnderlying) {
         setValue("hasUnderlyingDisease", true);
         lockedDiseaseKeys.forEach((key) => {
            setValue(key, true);
         });
      }
   }, [
      selectedProfile,
      schemaData,
      profileAge,
      profileGender,
      hasRecordedUnderlying,
      lockedDiseaseKeys,
      setValue,
   ]);

   const hasUnderlyingDisease = Boolean(
      useWatch({ control, name: "hasUnderlyingDisease" }),
   );
   const diabetes = Boolean(useWatch({ control, name: "diabetes" }));

   const handleApplyOcr = (values: OcrExtractedFormValues) => {
      const newSources: Partial<
         Record<keyof AssessmentFormValues, FieldDataSource>
      > = {
         ...fieldSources,
      };

      // 1. Phân loại bệnh nền: Ưu tiên hồ sơ -> nếu hồ sơ đã có bệnh nền (hasRecordedUnderlying) thì luôn giữ true
      const shouldHaveUnderlying =
         hasRecordedUnderlying ||
         Boolean(values.hasUnderlyingDisease) ||
         Boolean(values.hasCoronaryArteryDisease) ||
         Boolean(values.diabetes) ||
         Boolean(values.hasMyocardialInfarction) ||
         Boolean(values.hasAcuteCoronarySyndrome) ||
         Boolean(values.stroke) ||
         Boolean(values.hasTia) ||
         Boolean(values.hasAorticAneurysm) ||
         Boolean(values.hasPeripheralArteryDisease) ||
         Boolean(values.hasAtherosclerosis) ||
         Boolean(values.hasFamilialHypercholesterolemia) ||
         Boolean(values.hasLeftVentricularHypertrophy) ||
         Boolean(values.hasRetinopathy) ||
         Boolean(values.hasAlbuminuria) ||
         Boolean(values.hasSilentBrainInfarct);

      if (shouldHaveUnderlying) {
         setValue("hasUnderlyingDisease", true, {
            shouldDirty: true,
            shouldValidate: true,
         });
         if (!hasRecordedUnderlying) {
            newSources.hasUnderlyingDisease = "OCR";
         }
      }

      // 2. Tuổi: Ưu tiên hồ sơ bệnh nhân (isAgeLocked) -> không ghi đè nếu đã có từ hồ sơ
      if (!isAgeLocked && values.age !== undefined && values.age !== null) {
         setValue("age", values.age, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.age = "OCR";
      }

      // 3. Giới tính: Ưu tiên hồ sơ bệnh nhân (isGenderLocked) -> không ghi đè nếu đã có từ hồ sơ
      if (!isGenderLocked && values.gender) {
         setValue("gender", values.gender, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.gender = "OCR";
      }

      // 4. Các chỉ số sinh lý & xét nghiệm (OCR điền vào form, người dùng vẫn có thể chỉnh sửa tay tiếp)
      if (values.isSmoking !== undefined && values.isSmoking !== null) {
         setValue("isSmoking", values.isSmoking, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.isSmoking = "OCR";
      }
      if (values.systolicBp !== undefined && values.systolicBp !== null) {
         setValue("systolicBp", values.systolicBp, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.systolicBp = "OCR";
      }
      if (values.diastolicBp !== undefined && values.diastolicBp !== null) {
         setValue("diastolicBp", values.diastolicBp, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.diastolicBp = "OCR";
      }
      if (
         values.totalCholesterol !== undefined &&
         values.totalCholesterol !== null
      ) {
         setValue("totalCholesterol", values.totalCholesterol, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.totalCholesterol = "OCR";
      }
      if (
         values.hdlCholesterol !== undefined &&
         values.hdlCholesterol !== null
      ) {
         setValue("hdlCholesterol", values.hdlCholesterol, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.hdlCholesterol = "OCR";
      }
      if (
         values.glucoseFasting !== undefined &&
         values.glucoseFasting !== null
      ) {
         setValue("glucoseFasting", values.glucoseFasting, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.glucoseFasting = "OCR";
      }
      if (values.egfr !== undefined && values.egfr !== null) {
         setValue("egfr", values.egfr, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.egfr = "OCR";
      }
      if (values.acr !== undefined && values.acr !== null) {
         setValue("acr", values.acr, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.acr = "OCR";
      }
      if (values.heightCm !== undefined && values.heightCm !== null) {
         setValue("heightCm", values.heightCm, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.heightCm = "OCR";
      }
      if (values.weightKg !== undefined && values.weightKg !== null) {
         setValue("weightKg", values.weightKg, {
            shouldDirty: true,
            shouldValidate: true,
         });
         newSources.weightKg = "OCR";
      }

      // 5. Bệnh nền & Tổn thương cơ quan đích:
      // NGUYÊN TẮC: Nếu trường nào đã có từ hồ sơ (lockedDiseaseKeys) -> BẮT BUỘC GIỮ NGUYÊN từ hồ sơ, KHÔNG ĐƯỢC PHÉP SỬA!
      // Chỉ cập nhật từ OCR nếu trường đó CHƯA CÓ trong hồ sơ.
      const applyDiseaseIfUnlocked = (
         field: keyof AssessmentFormValues,
         ocrVal?: boolean | null,
      ) => {
         if (lockedDiseaseKeys.has(field)) {
            // Đã ghi nhận từ hồ sơ -> Giữ nguyên true
            setValue(field, true, { shouldDirty: true });
            newSources[field] = "PROFILE";
            return;
         }
         if (ocrVal !== undefined && ocrVal !== null) {
            setValue(field, ocrVal, { shouldDirty: true });
            if (ocrVal) {
               newSources[field] = "OCR";
            }
         }
      };

      // Dấu hiệu tổn thương cơ quan đích
      applyDiseaseIfUnlocked(
         "hasLeftVentricularHypertrophy",
         values.hasLeftVentricularHypertrophy,
      );
      applyDiseaseIfUnlocked("hasRetinopathy", values.hasRetinopathy);
      applyDiseaseIfUnlocked("hasAlbuminuria", values.hasAlbuminuria);
      applyDiseaseIfUnlocked(
         "hasSilentBrainInfarct",
         values.hasSilentBrainInfarct,
      );

      // Bệnh lý mạn tính kèm theo
      applyDiseaseIfUnlocked("diabetes", values.diabetes);
      applyDiseaseIfUnlocked(
         "hasCoronaryArteryDisease",
         values.hasCoronaryArteryDisease,
      );
      applyDiseaseIfUnlocked(
         "hasMyocardialInfarction",
         values.hasMyocardialInfarction,
      );
      applyDiseaseIfUnlocked("hasAorticAneurysm", values.hasAorticAneurysm);
      applyDiseaseIfUnlocked("hasAtherosclerosis", values.hasAtherosclerosis);
      applyDiseaseIfUnlocked("stroke", values.stroke);
      applyDiseaseIfUnlocked(
         "hasAcuteCoronarySyndrome",
         values.hasAcuteCoronarySyndrome,
      );
      applyDiseaseIfUnlocked("hasTia", values.hasTia);
      applyDiseaseIfUnlocked(
         "hasPeripheralArteryDisease",
         values.hasPeripheralArteryDisease,
      );
      applyDiseaseIfUnlocked(
         "hasFamilialHypercholesterolemia",
         values.hasFamilialHypercholesterolemia,
      );

      setFieldSources(newSources);

      toast.success(
         "Đã áp dụng dữ liệu OCR (Ưu tiên: Hồ sơ bệnh nhân > OCR > Nhập tay).",
      );
   };

   const onSubmit = async (data: AssessmentFormValues) => {
      if (!selectedProfile?.id) {
         toast.warning("Vui lòng chọn hồ sơ bệnh nhân trước khi đánh giá");
         return;
      }

      try {
         // Đảm bảo các trường bị khóa luôn có dữ liệu chính xác từ hồ sơ
         const finalAge = isAgeLocked
            ? (schemaData?.patientProfile?.calculatedAge ?? profileAge)
            : data.age;
         const finalGender = isGenderLocked
            ? profileGender || data.gender
            : data.gender;

         let payload: CreateRiskAssessmentRequest;

         if (!data.hasUnderlyingDisease) {
            payload = {
               healthProfileId: String(selectedProfile.id),
               hasUnderlyingDisease: false,
               age: finalAge ?? undefined,
               gender: finalGender || undefined,
               isSmoking: data.isSmoking,
               systolicBp: data.systolicBp ?? undefined,
               diastolicBp: data.diastolicBp ?? undefined,
               totalCholesterol: data.totalCholesterol ?? undefined,
               hdlCholesterol: data.hdlCholesterol ?? undefined,
               glucoseFasting: data.glucoseFasting ?? null,
               heightCm: data.heightCm ?? null,
               weightKg: data.weightKg ?? null,
            };
         } else {
            payload = {
               healthProfileId: String(selectedProfile.id),
               hasUnderlyingDisease: true,
               hasLeftVentricularHypertrophy:
                  lockedDiseaseKeys.has("hasLeftVentricularHypertrophy") ||
                  data.hasLeftVentricularHypertrophy,
               hasAlbuminuria:
                  lockedDiseaseKeys.has("hasAlbuminuria") ||
                  data.hasAlbuminuria,
               hasRetinopathy:
                  lockedDiseaseKeys.has("hasRetinopathy") ||
                  data.hasRetinopathy,
               hasSilentBrainInfarct:
                  lockedDiseaseKeys.has("hasSilentBrainInfarct") ||
                  data.hasSilentBrainInfarct,
               diabetes: lockedDiseaseKeys.has("diabetes") || data.diabetes,
               diabetesDurationYears: data.diabetesDurationYears ?? undefined,
               glycemicControl: data.glycemicControl || null,
               egfr: data.egfr ?? null,
               acr: data.acr ?? null,
               stroke: lockedDiseaseKeys.has("stroke") || data.stroke,
               hasMyocardialInfarction:
                  lockedDiseaseKeys.has("hasMyocardialInfarction") ||
                  data.hasMyocardialInfarction,
               hasAcuteCoronarySyndrome:
                  lockedDiseaseKeys.has("hasAcuteCoronarySyndrome") ||
                  data.hasAcuteCoronarySyndrome,
               hasCoronaryArteryDisease:
                  lockedDiseaseKeys.has("hasCoronaryArteryDisease") ||
                  data.hasCoronaryArteryDisease,
               hasTia: lockedDiseaseKeys.has("hasTia") || data.hasTia,
               hasAorticAneurysm:
                  lockedDiseaseKeys.has("hasAorticAneurysm") ||
                  data.hasAorticAneurysm,
               hasPeripheralArteryDisease:
                  lockedDiseaseKeys.has("hasPeripheralArteryDisease") ||
                  data.hasPeripheralArteryDisease,
               hasAtherosclerosis:
                  lockedDiseaseKeys.has("hasAtherosclerosis") ||
                  data.hasAtherosclerosis,
               hasFamilialHypercholesterolemia:
                  lockedDiseaseKeys.has("hasFamilialHypercholesterolemia") ||
                  data.hasFamilialHypercholesterolemia,
               systolicBp: data.systolicBp ?? undefined,
               diastolicBp: data.diastolicBp ?? undefined,
               totalCholesterol: data.totalCholesterol ?? undefined,
               hdlCholesterol: data.hdlCholesterol ?? null,
               glucoseFasting: data.glucoseFasting ?? null,
               heightCm: data.heightCm ?? null,
               weightKg: data.weightKg ?? null,
               age: finalAge ?? undefined,
               gender: finalGender || undefined,
               isSmoking: data.isSmoking,
            };
         }

         const res = await createAssessment(payload).unwrap();
         setAssessmentResult(res);
         toast.success("Đánh giá phân tầng nguy cơ thành công!");
      } catch (error: unknown) {
         console.error("Failed to create risk assessment:", error);
         const apiError = error as { data?: { message?: string } };
         toast.error(
            apiError?.data?.message || "Có lỗi xảy ra khi thực hiện đánh giá",
         );
      }
   };

   return (
      <div className="flex flex-col gap-4 px-0.5">
         <div className="p-3 text-sm flex items-start gap-2 bg-blue-50 border border-blue-200 rounded">
            <Info className="w-5 h-5" />
            Phân tầng yếu tố nguy cơ theo thang điểm Score 2; Score-OP;
            Score-dia được Khuyến cáo của hiệp hội tim mạch châu Âu ESC
         </div>
         {/* Hiển thị kết quả đánh giá */}
         {assessmentResult && (
            <div
               className={cn(
                  "p-5 rounded-xl border transition-all text-sm",
                  assessmentResult.riskLevel === "VERY_HIGH"
                     ? "bg-rose-50/80 border-rose-300 text-rose-950"
                     : assessmentResult.riskLevel === "HIGH"
                       ? "bg-amber-50/80 border-amber-300 text-amber-950"
                       : "bg-emerald-50/80 border-emerald-300 text-emerald-950",
               )}
            >
               <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                     <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm sm:text-base">
                           Kết quả phân tầng nguy cơ:
                        </span>
                        <span
                           className={cn(
                              "px-2.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide",
                              assessmentResult.riskLevel === "VERY_HIGH"
                                 ? "bg-rose-600 text-white"
                                 : assessmentResult.riskLevel === "HIGH"
                                   ? "bg-amber-600 text-white"
                                   : "bg-emerald-600 text-white",
                           )}
                        >
                           {assessmentResult.riskLevel === "VERY_HIGH"
                              ? "Nguy cơ rất cao"
                              : assessmentResult.riskLevel === "HIGH"
                                ? "Nguy cơ cao"
                                : "Nguy cơ thấp"}
                        </span>
                     </div>

                     <span className="text-xs sm:text-sm font-semibold text-slate-700 ml-1">
                        Nguy cơ biến cố trong 10 năm:{" "}
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                           {assessmentResult.riskScore}%
                        </span>
                     </span>

                     <p className="text-xs text-slate-500 italic mt-2">
                        * Phân tầng yếu tố nguy cơ theo thang điểm Score 2;
                        Score-OP; Score-dia được Khuyến cáo của hiệp hội tim
                        mạch châu Âu ESC
                     </p>

                     {assessmentResult.conclusion && (
                        <p className="text-xs sm:text-sm text-slate-700">
                           <span className="font-semibold">Kết luận: </span>
                           {assessmentResult.conclusion}
                        </p>
                     )}

                     {assessmentResult.recommendations && (
                        <p className="text-xs sm:text-sm text-slate-700">
                           <span className="font-semibold">Khuyến nghị: </span>
                           {assessmentResult.recommendations}
                        </p>
                     )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                     <CustomButton
                        type="button"
                        size="sm"
                        className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                        onClick={() => {
                           if (!assessmentResult || !selectedProfile?.id)
                              return;
                           const input = assessmentResult.assessmentInput;
                           const initialData: Partial<Examination> = {
                              assessmentInputId:
                                 assessmentResult.assessmentInputId ||
                                 assessmentResult.assessmentInput?.id ||
                                 assessmentResult.id,
                              systolicBp:
                                 input?.systolicBp != null
                                    ? Number(input.systolicBp)
                                    : undefined,
                              diastolicBp:
                                 input?.diastolicBp != null
                                    ? Number(input.diastolicBp)
                                    : undefined,
                              heightCm:
                                 input?.heightCm != null
                                    ? Number(input.heightCm)
                                    : undefined,
                              weightKg:
                                 input?.weightKg != null
                                    ? Number(input.weightKg)
                                    : undefined,
                              bmi:
                                 input?.bmi != null
                                    ? Number(input.bmi)
                                    : undefined,
                              status: "IN_PROGRESS",
                           };

                           if (onStartExaminationWithAssessment) {
                              onStartExaminationWithAssessment(
                                 assessmentResult,
                                 initialData,
                              );
                           } else {
                              router.push(
                                 `/work?profileId=${selectedProfile.id}`,
                              );
                           }
                        }}
                     >
                        Khám bệnh ngay
                     </CustomButton>
                     <CustomButton
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => setIsEvaluationModalOpen(true)}
                     >
                        {assessmentResult.doctor
                           ? "Thẩm định lại"
                           : "Thẩm định"}
                     </CustomButton>
                     <CustomButton
                        type="button"
                        variant="destructive"
                        className="h-9"
                        onClick={() => setAssessmentResult(null)}
                     >
                        Đóng
                     </CustomButton>
                  </div>
               </div>

               {assessmentResult.redFlags &&
                  assessmentResult.redFlags.length > 0 && (
                     <div className="pt-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                           Dấu hiệu cảnh báo nguy cơ cao:
                        </div>
                        <div className="">
                           {assessmentResult.redFlags.map((flag, idx) => (
                              <div
                                 key={idx}
                                 className="bg-white/90 rounded-md px-3 py-2 border border-slate-200 text-xs flex items-center gap-2"
                              >
                                 <span className="font-medium text-slate-800">
                                    {flag.title || flag.metric}
                                 </span>
                                 <span
                                    className={cn(
                                       "font-semibold px-2 py-0.5 rounded text-[11px]",
                                       flag.level === "DANGER"
                                          ? "bg-rose-100 text-rose-700"
                                          : flag.level === "WARNING"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-blue-100 text-blue-700",
                                    )}
                                 >
                                    {flag.value}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
            </div>
         )}

         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50/90 flex-wrap">
               <span className="font-semibold text-slate-700 flex items-center gap-1">
                  Nguồn dữ liệu:
               </span>
               <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full inline-flex items-center gap-1">
                     Hồ sơ bệnh nhân
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
               </div>
               <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-violet-700 bg-violet-100  px-2 py-1 rounded-full inline-flex items-center gap-1">
                     Trích xuất OCR
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
               </div>
               <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200  px-2 py-1 rounded-full inline-flex items-center gap-1">
                     Nhập tay
                  </span>
               </div>
            </div>

            <div>
               <RadioGroup
                  value={hasUnderlyingDisease ? "true" : "false"}
                  onValueChange={(val) => {
                     if (hasRecordedUnderlying && val === "false") {
                        toast.info(
                           "Bệnh nhân có bệnh nền đã ghi nhận trong hồ sơ, tự động áp dụng luồng đánh giá có bệnh nền",
                        );
                        return;
                     }
                     setValue("hasUnderlyingDisease", val === "true");
                  }}
                  className="flex items-center gap-6"
               >
                  <div className="flex items-center gap-2 cursor-pointer">
                     <RadioGroupItem
                        value="false"
                        id="underlying-false"
                        disabled={hasRecordedUnderlying}
                        className="border-slate-700"
                     />
                     <Label
                        htmlFor="underlying-false"
                        className={cn(
                           "text-sm font-medium",
                           hasRecordedUnderlying
                              ? "text-slate-400 cursor-not-allowed"
                              : "text-slate-700 cursor-pointer",
                        )}
                     >
                        Không có bệnh nền
                     </Label>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer">
                     <RadioGroupItem
                        value="true"
                        id="underlying-true"
                        className="border-slate-700"
                     />
                     <Label
                        htmlFor="underlying-true"
                        className="cursor-pointer text-sm font-medium text-slate-700 flex items-center gap-1.5"
                     >
                        Có bệnh nền
                        {hasRecordedUnderlying && (
                           <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100  px-2 py-0.5 rounded-full">
                              Theo hồ sơ
                           </span>
                        )}
                     </Label>
                  </div>
               </RadioGroup>
            </div>
            {!hasUnderlyingDisease && (
               <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <FormInput
                        label={renderFieldLabel(
                           "Tuổi",
                           "age",
                           isAgeLocked ? "(Theo ngày sinh)" : undefined,
                        )}
                        type="number"
                        placeholder="Nhập tuổi (≥ 40)"
                        disabled={isAgeLocked}
                        error={errors.age?.message}
                        {...register("age", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                           <FormSelect
                              label={renderFieldLabel(
                                 "Giới tính",
                                 "gender",
                                 isGenderLocked ? "(Theo hồ sơ)" : undefined,
                              )}
                              options={GENDER_OPTIONS}
                              value={field.value || undefined}
                              onValueChange={field.onChange}
                              placeholder="Chọn giới tính"
                              disabled={isGenderLocked}
                              error={errors.gender?.message}
                           />
                        )}
                     />

                     <div className="flex flex-col justify-center pt-2">
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                           <label className="text-sm font-semibold text-slate-700">
                              Thói quen hút thuốc
                           </label>
                           {renderSourceBadge("isSmoking")}
                        </div>
                        <Controller
                           name="isSmoking"
                           control={control}
                           render={({ field }) => (
                              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                 <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                 />
                                 Có hút thuốc lá
                              </label>
                           )}
                        />
                     </div>

                     <FormInput
                        label={renderFieldLabel(
                           "Huyết áp tâm thu (mmHg)",
                           "systolicBp",
                        )}
                        type="number"
                        placeholder="Ví dụ: 120"
                        error={errors.systolicBp?.message}
                        {...register("systolicBp", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <FormInput
                        label={renderFieldLabel(
                           "Huyết áp tâm trương (mmHg)",
                           "diastolicBp",
                        )}
                        type="number"
                        placeholder="Ví dụ: 80"
                        error={errors.diastolicBp?.message}
                        {...register("diastolicBp", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <FormInput
                        label={renderFieldLabel(
                           "Cholesterol toàn phần (mmol/L)",
                           "totalCholesterol",
                        )}
                        type="number"
                        step="0.1"
                        placeholder="Ví dụ: 5.0"
                        error={errors.totalCholesterol?.message}
                        {...register("totalCholesterol", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <FormInput
                        label={renderFieldLabel(
                           "HDL-Cholesterol (mmol/L)",
                           "hdlCholesterol",
                        )}
                        type="number"
                        step="0.1"
                        placeholder="Ví dụ: 1.2"
                        error={errors.hdlCholesterol?.message}
                        {...register("hdlCholesterol", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <FormInput
                        label={renderFieldLabel(
                           "Đường huyết lúc đói (mmol/L)",
                           "glucoseFasting",
                        )}
                        type="number"
                        step="0.1"
                        placeholder="Ví dụ: 5.5"
                        error={errors.glucoseFasting?.message}
                        {...register("glucoseFasting", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <div className="grid grid-cols-2 gap-2">
                        <FormInput
                           label={renderFieldLabel(
                              "Chiều cao (cm)",
                              "heightCm",
                           )}
                           type="number"
                           placeholder="Ví dụ: 165"
                           error={errors.heightCm?.message}
                           {...register("heightCm", {
                              setValueAs: (v) =>
                                 v === "" || isNaN(v) ? null : Number(v),
                           })}
                        />
                        <FormInput
                           label={renderFieldLabel("Cân nặng (kg)", "weightKg")}
                           type="number"
                           placeholder="Ví dụ: 65"
                           error={errors.weightKg?.message}
                           {...register("weightKg", {
                              setValueAs: (v) =>
                                 v === "" || isNaN(v) ? null : Number(v),
                           })}
                        />
                     </div>
                  </div>
               </div>
            )}

            {hasUnderlyingDisease && (
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {TARGET_ORGAN_DAMAGE_ITEMS.map((item) => (
                        <CheckboxCardItem
                           key={item.name}
                           name={item.name}
                           label={item.label}
                           control={control}
                           disabled={lockedDiseaseKeys.has(item.name)}
                           isLocked={lockedDiseaseKeys.has(item.name)}
                           source={getFieldSource(item.name)}
                        />
                     ))}
                     <div className="col-span-full">
                        <Controller
                           name="diabetes"
                           control={control}
                           render={({ field }) => (
                              <label
                                 className={cn(
                                    "flex items-center gap-2 text-sm font-semibold text-slate-800 select-none",
                                    lockedDiseaseKeys.has("diabetes")
                                       ? "cursor-not-allowed opacity-85"
                                       : "cursor-pointer",
                                 )}
                              >
                                 <Checkbox
                                    checked={Boolean(field.value)}
                                    onCheckedChange={(checked) => {
                                       if (lockedDiseaseKeys.has("diabetes"))
                                          return;
                                       field.onChange(checked);
                                    }}
                                    disabled={lockedDiseaseKeys.has("diabetes")}
                                    className="rounded! border border-primary"
                                 />
                                 <span className="flex items-center gap-1.5 flex-wrap">
                                    Mắc đái tháo đường
                                    {lockedDiseaseKeys.has("diabetes") ? (
                                       <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                          Hồ sơ
                                       </span>
                                    ) : getFieldSource("diabetes") === "OCR" &&
                                      field.value ? (
                                       <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1">
                                          <Sparkles className="w-2.5 h-2.5 text-violet-600 inline-block" />
                                          Từ OCR
                                       </span>
                                    ) : null}
                                 </span>
                              </label>
                           )}
                        />
                     </div>
                     {diabetes && (
                        <>
                           <FormInput
                              label="Số năm mắc ĐTĐ"
                              type="number"
                              placeholder="Ví dụ: 5"
                              error={errors.diabetesDurationYears?.message}
                              {...register("diabetesDurationYears", {
                                 setValueAs: (v) =>
                                    v === "" || isNaN(v) ? null : Number(v),
                              })}
                           />
                           <Controller
                              name="glycemicControl"
                              control={control}
                              render={({ field }) => (
                                 <FormSelect
                                    label="Tình trạng kiểm soát đường máu"
                                    options={GLYCEMIC_OPTIONS}
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                    placeholder="Tốt / Không tốt"
                                    error={errors.glycemicControl?.message}
                                 />
                              )}
                           />
                        </>
                     )}
                  </div>
                  <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                     <FormInput
                        label={renderFieldLabel(
                           "Độ lọc cầu thận eGFR (mL/phút/1.73m²)",
                           "egfr",
                        )}
                        type="number"
                        step="0.1"
                        placeholder="Ví dụ: 55"
                        error={errors.egfr?.message}
                        {...register("egfr", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <FormInput
                        label={renderFieldLabel(
                           "Tỷ lệ Albumin/Creatinin niệu ACR (mg/g)",
                           "acr",
                        )}
                        type="number"
                        step="0.1"
                        placeholder="Ví dụ: 35"
                        error={errors.acr?.message}
                        {...register("acr", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {CARDIOVASCULAR_EVENT_ITEMS.map((item) => (
                        <CheckboxCardItem
                           key={item.name}
                           name={item.name}
                           label={item.label}
                           control={control}
                           disabled={lockedDiseaseKeys.has(item.name)}
                           isLocked={lockedDiseaseKeys.has(item.name)}
                           source={getFieldSource(item.name)}
                        />
                     ))}
                  </div>
               </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
               <CustomButton
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  disabled={isSubmitting}
                  className="px-6 h-10 text-xs font-semibold"
               >
                  OCR Hồ sơ
               </CustomButton>
               <CustomButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Đang đánh giá..."
                  className="px-6 h-10 text-xs font-semibold"
               >
                  Đánh giá phân tầng nguy cơ
               </CustomButton>
            </div>
         </form>

         {/* Modal Thẩm định & Xác nhận phân tầng ngay sau khi đánh giá */}
         <RiskAssessmentEvaluationModal
            isOpen={isEvaluationModalOpen}
            onClose={() => setIsEvaluationModalOpen(false)}
            assessment={assessmentResult}
            onSuccess={(updated) => {
               setAssessmentResult(updated);
            }}
         />

         {/* Modal OCR Trích xuất Hồ sơ Bệnh án Y tế */}
         <OcrMedicalRecordModal
            isOpen={isOcrModalOpen}
            onClose={() => setIsOcrModalOpen(false)}
            onApplyToForm={handleApplyOcr}
         />
      </div>
   );
}

export default RiskFactorAssessmentForm;
