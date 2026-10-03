"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, Controller, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { HealthProfile } from "@/store/api/health-profile/type";
import {
   AssessmentInput,
   CreateRiskAssessmentRequest,
   RiskAssessmentResult,
} from "@/store/api/risk-factor-assessment/type";
import {
   useCreateRiskAssessmentMutation,
   useUpdateRiskAssessmentMutation,
   useGetRiskAssessmentFormSchemaQuery,
} from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { FormInput } from "@/components/common/form-input";
import { FormSelect } from "@/components/common/form-select";
import { CustomButton } from "@/components/common/custom-button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
   AlertTriangle,
   ArrowRight,
   Info,
   ScanSearch,
   Sparkles,
} from "lucide-react";
import { RiskAssessmentEvaluationModal } from "./risk-assessment-evaluation-modal";
import {
   OcrExtractedFormValues,
   OcrMedicalRecordModal,
} from "./ocr-medical-record-modal";
import { Examination } from "@/store/api/examination/type";
import { cn } from "@/lib/utils";
import {
   RiskLevelBadge,
   getRiskContainerClass,
   RISK_EXPLANATION_TEXT,
   formatRiskRate,
   checkHasUnderlyingDisease,
} from "@/components/common/risk-level-badge";
import { useAuth } from "@/hooks/use-auth";

export interface RiskFactorAssessmentFormProps {
   selectedProfile?: HealthProfile | null;
   onStartExaminationWithAssessment?: (
      assessment: RiskAssessmentResult,
      initialVitals?: Partial<Examination>,
   ) => void;
   initialAssessment?: RiskAssessmentResult | null;
   isDoctorEditMode?: boolean;
   onAssessmentSuccess?: (assessment: RiskAssessmentResult) => void;
   onCancelEdit?: () => void;
}

const assessmentSchema = z
   .object({
      hasUnderlyingDisease: z.boolean(),
      age: z.number().nullable().optional(),
      gender: z.string().optional(),
      isSmoking: z.boolean().nullable().optional(),
      systolicBp: z.number().nullable().optional(),
      diastolicBp: z.number().nullable().optional(),
      totalCholesterol: z.number().nullable().optional(),
      hdlCholesterol: z.number().nullable().optional(),
      nonHdlCholesterol: z.number().nullable().optional(),
      ldlCholesterol: z.number().nullable().optional(),
      triglycerides: z.number().nullable().optional(),
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
         // 1. Tuổi: Hệ thống chỉ cho phép phân tầng cho người từ 40 tuổi trở lên
         if (data.age === null || data.age === undefined) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Vui lòng nhập tuổi của người bệnh",
               path: ["age"],
            });
         } else if (data.age < 40) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Hệ thống chỉ cho phép phân tầng cho người từ 40 tuổi trở lên",
               path: ["age"],
            });
         } else if (data.age > 100) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Tuổi đánh giá tối đa là 100 tuổi",
               path: ["age"],
            });
         }
         // Thói quen hút thuốc: Bắt buộc chọn khi không có bệnh nền (SCORE2)
         if (data.isSmoking === null || data.isSmoking === undefined) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "Vui lòng chọn thói quen hút thuốc của người bệnh",
               path: ["isSmoking"],
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
            data.totalCholesterol === undefined ||
            data.totalCholesterol === 0
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Vui lòng nhập Cholesterol toàn phần (chưa tính được Non-HDL-Cholesterol)",
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

         // 6. HDL-Cholesterol: 0.5 - 4.5 mmol/L (bắt buộc để tính Non-HDL)
         if (
            data.hdlCholesterol === null ||
            data.hdlCholesterol === undefined
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Vui lòng nhập HDL-Cholesterol (chưa tính được Non-HDL-Cholesterol)",
               path: ["hdlCholesterol"],
            });
         } else if (data.hdlCholesterol < 0.5 || data.hdlCholesterol > 4.5) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "HDL-Cholesterol hợp lệ từ 0.5 - 4.5 mmol/L",
               path: ["hdlCholesterol"],
            });
         } else if (
            data.totalCholesterol &&
            data.hdlCholesterol >= data.totalCholesterol
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message: "HDL-Cholesterol phải nhỏ hơn Cholesterol toàn phần",
               path: ["hdlCholesterol"],
            });
         }

         // 7. Non-HDL-Cholesterol: Tự động tính từ Cholesterol toàn phần - HDL-Cholesterol
         if (
            data.totalCholesterol !== null &&
            data.totalCholesterol !== undefined &&
            data.hdlCholesterol !== null &&
            data.hdlCholesterol !== undefined &&
            data.hdlCholesterol < data.totalCholesterol
         ) {
            if (
               data.nonHdlCholesterol === null ||
               data.nonHdlCholesterol === undefined
            ) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Chưa tính được Non-HDL-Cholesterol",
                  path: ["hdlCholesterol"],
               });
            } else if (
               data.nonHdlCholesterol < 1.0 ||
               data.nonHdlCholesterol > 15.0
            ) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Non-HDL-Cholesterol hợp lệ từ 1.0 - 15.0 mmol/L",
                  path: ["hdlCholesterol"],
               });
            }
         }

         // 8. LDL-Cholesterol (nếu nhập): 0.5 - 15.0 mmol/L
         if (
            data.ldlCholesterol !== null &&
            data.ldlCholesterol !== undefined
         ) {
            if (data.ldlCholesterol < 0.5 || data.ldlCholesterol > 15.0) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "LDL-Cholesterol hợp lệ từ 0.5 - 15.0 mmol/L",
                  path: ["ldlCholesterol"],
               });
            } else if (
               data.totalCholesterol !== null &&
               data.totalCholesterol !== undefined &&
               data.ldlCholesterol >= data.totalCholesterol
            ) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "LDL-Cholesterol phải nhỏ hơn Cholesterol toàn phần",
                  path: ["ldlCholesterol"],
               });
            } else if (
               data.nonHdlCholesterol !== null &&
               data.nonHdlCholesterol !== undefined &&
               data.ldlCholesterol > data.nonHdlCholesterol
            ) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message:
                     "LDL-Cholesterol không được lớn hơn Non-HDL-Cholesterol",
                  path: ["ldlCholesterol"],
               });
            }
         }

         // 9. Triglycerides (nếu nhập): 0.2 - 30.0 mmol/L
         if (data.triglycerides !== null && data.triglycerides !== undefined) {
            if (data.triglycerides < 0.2 || data.triglycerides > 30.0) {
               ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Triglycerides hợp lệ từ 0.2 - 30.0 mmol/L",
                  path: ["triglycerides"],
               });
            }
         }

         // 10. Đường huyết lúc đói (nếu nhập): 2.0 - 35.0 mmol/L
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
      label: "Phì đại thất trái trên siêu âm tim hoặc điện tim",
   },
   {
      name: "hasAlbuminuria",
      label: "Có Albumin/Microalbumin niệu",
   },
   {
      name: "hasRetinopathy",
      label: "Có tổn thương đáy mắt",
   },
   {
      name: "hasSilentBrainInfarct",
      label: "Tổn thương thầm lặng trên não (slient infact)",
   },
];

const CARDIOVASCULAR_EVENT_ITEMS: {
   name: keyof AssessmentFormValues;
   label: string;
}[] = [
   { name: "stroke", label: "Đột quỵ não" },
   { name: "hasMyocardialInfarction", label: "Nhồi máu cơ tim" },
   { name: "hasAcuteCoronarySyndrome", label: "Hội chứng vành cấp" },
   { name: "hasCoronaryArteryDisease", label: "Bệnh lý mạch vành" },
   { name: "hasTia", label: "Cơn thiếu máu não cục bộ thoáng qua (TIA)" },
   { name: "hasAorticAneurysm", label: "Phình động mạch chủ" },
   { name: "hasPeripheralArteryDisease", label: "Bệnh mạch máu ngoại vi" },
   { name: "hasAtherosclerosis", label: "Xơ vữa mạch máu" },
   {
      name: "hasFamilialHypercholesterolemia",
      label: "Tăng mỡ máu gia đình",
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

const getPositiveFactors = (input?: AssessmentInput | null) => {
   if (!input) return [];
   const factors: { label: string; value?: string }[] = [];

   if (input.diabetes) {
      const details: string[] = [];
      if (input.diabetesDurationYears)
         details.push(`${input.diabetesDurationYears} năm`);
      if (input.glycemicControl)
         details.push(`kiểm soát ${input.glycemicControl}`);
      factors.push({
         label: "Đái tháo đường",
         value: details.length > 0 ? `Có (${details.join(", ")})` : "Có",
      });
   }
   if (input.hasLeftVentricularHypertrophy) {
      factors.push({
         label: "Phì đại thất trái trên siêu âm tim hoặc điện tim",
      });
   }
   if (input.hasAlbuminuria) {
      factors.push({ label: "Có Albumin niệu / Microalbumin niệu" });
   }
   if (input.hasRetinopathy) {
      factors.push({ label: "Tổn thương đáy mắt" });
   }
   if (input.hasSilentBrainInfarct) {
      factors.push({ label: "Tổn thương thầm lặng trên não (slient infact)" });
   }
   if (input.stroke) {
      factors.push({ label: "Đột quỵ não" });
   }
   if (input.hasMyocardialInfarction) {
      factors.push({ label: "Nhồi máu cơ tim" });
   }
   if (input.hasAcuteCoronarySyndrome) {
      factors.push({ label: "Hội chứng vành cấp" });
   }
   if (input.hasCoronaryArteryDisease) {
      factors.push({ label: "Bệnh lý mạch vành" });
   }
   if (input.hasTia) {
      factors.push({ label: "Cơn thiếu máu não cục bộ thoáng qua (TIA)" });
   }
   if (input.hasAorticAneurysm) {
      factors.push({ label: "Phình động mạch chủ" });
   }
   if (input.hasPeripheralArteryDisease) {
      factors.push({ label: "Bệnh mạch máu ngoại vi" });
   }
   if (input.hasAtherosclerosis) {
      factors.push({ label: "Vữa xơ mạch máu" });
   }
   if (input.hasFamilialHypercholesterolemia) {
      factors.push({ label: "Tăng mỡ máu gia đình" });
   }

   return factors;
};

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
                  className="border border-primary"
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
   initialAssessment,
   isDoctorEditMode = false,
   onAssessmentSuccess,
   onCancelEdit,
}: RiskFactorAssessmentFormProps) {
   const router = useRouter();
   const isEditMode = Boolean(initialAssessment) || Boolean(isDoctorEditMode);
   const [createdAssessment, setCreatedAssessment] =
      useState<RiskAssessmentResult | null>(null);
   const [prevInitialAssessment, setPrevInitialAssessment] =
      useState<RiskAssessmentResult | null | undefined>(initialAssessment);

   if (prevInitialAssessment !== initialAssessment) {
      setPrevInitialAssessment(initialAssessment);
      setCreatedAssessment(null);
   }

   const assessmentResult = createdAssessment || initialAssessment || null;
   const setAssessmentResult = setCreatedAssessment;
   const resultRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      if (createdAssessment && resultRef.current) {
         resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
   }, [createdAssessment]);
   const [isEvaluationModalOpen, setIsEvaluationModalOpen] =
      useState<boolean>(false);
   const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
   const [fieldSources, setFieldSources] = useState<
      Partial<Record<keyof AssessmentFormValues, FieldDataSource>>
   >({});

   const [createAssessment, { isLoading: isCreating }] =
      useCreateRiskAssessmentMutation();
   const [updateRiskAssessment, { isLoading: isUpdating }] =
      useUpdateRiskAssessmentMutation();
   const isSubmitting = isCreating || isUpdating;

   const activeProfile =
      selectedProfile || initialAssessment?.healthProfile || null;

   // Lấy dữ liệu schema & bệnh nền đã ghi nhận của bệnh nhân
   const { data: schemaData } = useGetRiskAssessmentFormSchemaQuery(
      { healthProfileId: activeProfile?.id || "" },
      { skip: !activeProfile?.id },
   );

   // Tuổi tính từ ngày sinh hồ sơ
   const profileAge = activeProfile?.dob
      ? Math.max(
           0,
           new Date().getFullYear() - new Date(activeProfile.dob).getFullYear(),
        )
      : null;

   const profileGender =
      activeProfile?.gender === "MALE"
         ? "Nam"
         : activeProfile?.gender === "FEMALE"
           ? "Nữ"
           : "";

   // Danh sách các bệnh nền đã ghi nhận trong hồ sơ (khóa không cho phép sửa)
   const lockedDiseaseKeys = useMemo(() => {
      const keys = new Set<keyof AssessmentFormValues>();
      if (!activeProfile) return keys;

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

      // 2. Từ các trường yếu tố nguy cơ và bệnh lý trong hồ sơ sức khỏe
      if (activeProfile.hasDiabetes) {
         keys.add("diabetes");
      }
      if (activeProfile.hasStroke) {
         keys.add("stroke");
      }
      if (activeProfile.hasMyocardialInfarction) {
         keys.add("hasMyocardialInfarction");
      }
      if (activeProfile.hasAcuteCoronarySyndrome) {
         keys.add("hasAcuteCoronarySyndrome");
      }
      if (activeProfile.hasCoronaryArteryDisease) {
         keys.add("hasCoronaryArteryDisease");
      }
      if (activeProfile.hasTia) {
         keys.add("hasTia");
      }
      if (activeProfile.hasAorticAneurysm) {
         keys.add("hasAorticAneurysm");
      }
      if (activeProfile.hasPeripheralArteryDisease) {
         keys.add("hasPeripheralArteryDisease");
      }
      if (activeProfile.hasAtherosclerosis) {
         keys.add("hasAtherosclerosis");
      }
      if (activeProfile.hasFamilialHypercholesterolemia) {
         keys.add("hasFamilialHypercholesterolemia");
      }

      return keys;
   }, [activeProfile, schemaData]);

   const hasRecordedUnderlying =
      Boolean(schemaData?.patientProfile?.hasRecordedUnderlyingDiseases) ||
      lockedDiseaseKeys.size > 0 ||
      Boolean(activeProfile?.hasDiabetes) ||
      Boolean(activeProfile?.hasStroke) ||
      Boolean(activeProfile?.hasMyocardialInfarction) ||
      Boolean(activeProfile?.hasAcuteCoronarySyndrome) ||
      Boolean(activeProfile?.hasCoronaryArteryDisease) ||
      Boolean(activeProfile?.hasTia) ||
      Boolean(activeProfile?.hasAorticAneurysm) ||
      Boolean(activeProfile?.hasPeripheralArteryDisease) ||
      Boolean(activeProfile?.hasAtherosclerosis) ||
      Boolean(activeProfile?.hasFamilialHypercholesterolemia) ||
      Boolean(activeProfile?.hasChronicKidneyDisease);

   // Các chỉ số từ hồ sơ sức khỏe không cho phép sửa:
   const isAgeLocked = Boolean(
      profileAge !== null || schemaData?.patientProfile?.calculatedAge,
   );
   const isGenderLocked = Boolean(
      profileGender || schemaData?.patientProfile?.gender,
   );
   const isSmokingLocked =
      activeProfile?.isSmoking !== undefined &&
      activeProfile?.isSmoking !== null;

   // Trích xuất chiều cao & cân nặng từ hồ sơ sức khỏe
   const profileHeight = useMemo(() => {
      if (!activeProfile) return null;
      const raw = activeProfile.height;
      if (raw !== null && raw !== undefined) {
         const num = Number(raw);
         if (!isNaN(num) && num > 0) return num;
      }
      return null;
   }, [activeProfile]);

   const profileWeight = useMemo(() => {
      if (!activeProfile) return null;
      const raw = activeProfile.weight;
      if (raw !== null && raw !== undefined) {
         const num = Number(raw);
         if (!isNaN(num) && num > 0) return num;
      }
      return null;
   }, [activeProfile]);

   // Trích xuất bổ sung từ schema nếu có
   const schemaHeight = useMemo(() => {
      if (!schemaData?.sections) return null;
      for (const sec of schemaData.sections) {
         for (const f of sec.fields) {
            if (f.name === "heightCm" || f.name === "height") {
               const num = Number(f.value);
               if (!isNaN(num) && num > 0) return num;
            }
         }
      }
      return null;
   }, [schemaData]);

   const schemaWeight = useMemo(() => {
      if (!schemaData?.sections) return null;
      for (const sec of schemaData.sections) {
         for (const f of sec.fields) {
            if (f.name === "weightKg" || f.name === "weight") {
               const num = Number(f.value);
               if (!isNaN(num) && num > 0) return num;
            }
         }
      }
      return null;
   }, [schemaData]);

   const effectiveHeight = profileHeight ?? schemaHeight;
   const effectiveWeight = profileWeight ?? schemaWeight;
   const isHeightFromProfile = Boolean(
      effectiveHeight !== null && effectiveHeight !== undefined,
   );
   const isWeightFromProfile = Boolean(
      effectiveWeight !== null && effectiveWeight !== undefined,
   );

   const getFieldSource = (
      fieldName: keyof AssessmentFormValues,
   ): FieldDataSource => {
      if (fieldSources[fieldName] === "OCR") return "OCR";
      const isFromProfile =
         (fieldName === "age" && isAgeLocked) ||
         (fieldName === "gender" && isGenderLocked) ||
         (fieldName === "isSmoking" && isSmokingLocked) ||
         (fieldName === "heightCm" && isHeightFromProfile) ||
         (fieldName === "weightKg" && isWeightFromProfile) ||
         (fieldName === "hasUnderlyingDisease" && hasRecordedUnderlying) ||
         lockedDiseaseKeys.has(fieldName);

      if (isFromProfile) return "PROFILE";
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
   ) => {
      return (
         <span className="flex items-center gap-1.5 flex-wrap">
            <span>{title}</span>
            {renderSourceBadge(fieldName)}
         </span>
      );
   };

   const {
      register,
      handleSubmit,
      control,
      setValue,
      getValues,
      formState: { errors },
   } = useForm<AssessmentFormValues>({
      mode: "onSubmit",
      reValidateMode: "onChange",
      resolver: zodResolver(assessmentSchema),
      defaultValues: {
         hasUnderlyingDisease: false,
         age: profileAge,
         gender: profileGender,
         isSmoking:
            initialAssessment?.assessmentInput?.isSmoking !== undefined &&
            initialAssessment?.assessmentInput?.isSmoking !== null
               ? Boolean(initialAssessment.assessmentInput.isSmoking)
               : activeProfile?.isSmoking !== undefined &&
                   activeProfile?.isSmoking !== null
                 ? Boolean(activeProfile.isSmoking)
                 : null,
         systolicBp: null,
         diastolicBp: null,
         totalCholesterol: null,
         hdlCholesterol: null,
         nonHdlCholesterol: null,
         ldlCholesterol: null,
         triglycerides: null,
         glucoseFasting: null,
         heightCm: effectiveHeight,
         weightKg: effectiveWeight,
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

   const { user } = useAuth();
   const isDoctorOrExpert =
      user?.role === "DOCTOR" ||
      user?.role === "DOCTOR_EXPERT" ||
      user?.role === "EXPERT";
   const hasCarePackage = Boolean(
      selectedProfile?.careSubscription || selectedProfile?.careSubscriptionId,
   );

   const positiveFactors = useMemo(() => {
      if (!assessmentResult) return [];
      if (assessmentResult.assessmentInput) {
         return getPositiveFactors(assessmentResult.assessmentInput);
      }
      return getPositiveFactors(getValues() as unknown as AssessmentInput);
   }, [assessmentResult, getValues]);

   // Tự động điền thông tin và khóa dữ liệu từ hồ sơ bệnh nhân (chỉ khi tạo mới)
   useEffect(() => {
      if (initialAssessment) return;
      if (!selectedProfile) return;

      const effectiveAge =
         schemaData?.patientProfile?.calculatedAge ?? profileAge;
      if (effectiveAge !== null && effectiveAge !== undefined) {
         setValue("age", effectiveAge, { shouldValidate: false });
      }

      const effectiveGender =
         schemaData?.patientProfile?.gender === "MALE"
            ? "Nam"
            : schemaData?.patientProfile?.gender === "FEMALE"
              ? "Nữ"
              : profileGender;
      if (effectiveGender) {
         setValue("gender", effectiveGender, { shouldValidate: false });
      }

      if (
         selectedProfile.isSmoking !== undefined &&
         selectedProfile.isSmoking !== null
      ) {
         setValue("isSmoking", Boolean(selectedProfile.isSmoking), {
            shouldValidate: false,
         });
      }

      // Tự động điền chiều cao và cân nặng từ hồ sơ (nếu có)
      if (effectiveHeight !== null && effectiveHeight !== undefined) {
         setValue("heightCm", effectiveHeight, { shouldValidate: false });
      }
      if (effectiveWeight !== null && effectiveWeight !== undefined) {
         setValue("weightKg", effectiveWeight, { shouldValidate: false });
      }

      if (hasRecordedUnderlying) {
         setValue("hasUnderlyingDisease", true, { shouldValidate: false });
         lockedDiseaseKeys.forEach((key) => {
            setValue(key, true, { shouldValidate: false });
         });
      }
   }, [
      selectedProfile,
      initialAssessment,
      schemaData,
      profileAge,
      profileGender,
      effectiveHeight,
      effectiveWeight,
      hasRecordedUnderlying,
      lockedDiseaseKeys,
      setValue,
   ]);

   // Tự động điền dữ liệu từ phiếu đánh giá cũ khi bác sĩ thực hiện chỉnh sửa
   useEffect(() => {
      if (!initialAssessment?.assessmentInput) return;
      const inp = initialAssessment.assessmentInput;

      setValue(
         "hasUnderlyingDisease",
         hasRecordedUnderlying ? true : Boolean(inp.hasUnderlyingDisease),
         { shouldValidate: false },
      );

      // Các trường từ hồ sơ giữ nguyên từ hồ sơ (không cho sửa), nếu không từ hồ sơ thì điền từ inp
      if (!isAgeLocked && inp.age !== undefined && inp.age !== null) {
         setValue("age", Number(inp.age), { shouldValidate: false });
      }
      if (!isGenderLocked && inp.gender) {
         setValue("gender", inp.gender, { shouldValidate: false });
      }
      if (
         !isSmokingLocked &&
         inp.isSmoking !== undefined &&
         inp.isSmoking !== null
      ) {
         setValue("isSmoking", Boolean(inp.isSmoking), {
            shouldValidate: false,
         });
      }
      if (
         !isHeightFromProfile &&
         inp.heightCm !== undefined &&
         inp.heightCm !== null
      ) {
         setValue("heightCm", Number(inp.heightCm), { shouldValidate: false });
      }
      if (
         !isWeightFromProfile &&
         inp.weightKg !== undefined &&
         inp.weightKg !== null
      ) {
         setValue("weightKg", Number(inp.weightKg), { shouldValidate: false });
      }

      // Các chỉ số khám/xét nghiệm (bác sĩ được phép sửa)
      if (inp.systolicBp !== undefined && inp.systolicBp !== null) {
         setValue("systolicBp", Number(inp.systolicBp), {
            shouldValidate: false,
         });
      }
      if (inp.diastolicBp !== undefined && inp.diastolicBp !== null) {
         setValue("diastolicBp", Number(inp.diastolicBp), {
            shouldValidate: false,
         });
      }
      if (inp.totalCholesterol !== undefined && inp.totalCholesterol !== null) {
         setValue("totalCholesterol", Number(inp.totalCholesterol), {
            shouldValidate: false,
         });
      }
      if (inp.hdlCholesterol !== undefined && inp.hdlCholesterol !== null) {
         setValue("hdlCholesterol", Number(inp.hdlCholesterol), {
            shouldValidate: false,
         });
      }
      if (
         inp.nonHdlCholesterol !== undefined &&
         inp.nonHdlCholesterol !== null
      ) {
         setValue("nonHdlCholesterol", Number(inp.nonHdlCholesterol), {
            shouldValidate: false,
         });
      }
      if (inp.ldlCholesterol !== undefined && inp.ldlCholesterol !== null) {
         setValue("ldlCholesterol", Number(inp.ldlCholesterol), {
            shouldValidate: false,
         });
      }
      if (inp.triglycerides !== undefined && inp.triglycerides !== null) {
         setValue("triglycerides", Number(inp.triglycerides), {
            shouldValidate: false,
         });
      }
      if (inp.glucoseFasting !== undefined && inp.glucoseFasting !== null) {
         setValue("glucoseFasting", Number(inp.glucoseFasting), {
            shouldValidate: false,
         });
      }

      // 1. Dấu hiệu tổn thương cơ quan đích (nếu trong hồ sơ thì khóa true, không thì từ inp)
      setValue(
         "hasLeftVentricularHypertrophy",
         lockedDiseaseKeys.has("hasLeftVentricularHypertrophy")
            ? true
            : Boolean(inp.hasLeftVentricularHypertrophy),
         { shouldValidate: false },
      );
      setValue(
         "hasAlbuminuria",
         lockedDiseaseKeys.has("hasAlbuminuria")
            ? true
            : Boolean(inp.hasAlbuminuria),
         { shouldValidate: false },
      );
      setValue(
         "hasRetinopathy",
         lockedDiseaseKeys.has("hasRetinopathy")
            ? true
            : Boolean(inp.hasRetinopathy),
         { shouldValidate: false },
      );
      setValue(
         "hasSilentBrainInfarct",
         lockedDiseaseKeys.has("hasSilentBrainInfarct")
            ? true
            : Boolean(inp.hasSilentBrainInfarct),
         { shouldValidate: false },
      );

      // 2. Đái tháo đường & Thận
      setValue(
         "diabetes",
         lockedDiseaseKeys.has("diabetes") ? true : Boolean(inp.diabetes),
         { shouldValidate: false },
      );
      if (
         inp.diabetesDurationYears !== undefined &&
         inp.diabetesDurationYears !== null
      ) {
         setValue("diabetesDurationYears", Number(inp.diabetesDurationYears), {
            shouldValidate: false,
         });
      }
      if (inp.glycemicControl) {
         setValue("glycemicControl", inp.glycemicControl, {
            shouldValidate: false,
         });
      }
      if (inp.egfr !== undefined && inp.egfr !== null) {
         setValue("egfr", Number(inp.egfr), { shouldValidate: false });
      }
      if (inp.acr !== undefined && inp.acr !== null) {
         setValue("acr", Number(inp.acr), { shouldValidate: false });
      }

      // 3. Tiền sử biến cố tim mạch nặng
      setValue(
         "stroke",
         lockedDiseaseKeys.has("stroke") ? true : Boolean(inp.stroke),
         { shouldValidate: false },
      );
      setValue(
         "hasMyocardialInfarction",
         lockedDiseaseKeys.has("hasMyocardialInfarction")
            ? true
            : Boolean(inp.hasMyocardialInfarction),
         { shouldValidate: false },
      );
      setValue(
         "hasAcuteCoronarySyndrome",
         lockedDiseaseKeys.has("hasAcuteCoronarySyndrome")
            ? true
            : Boolean(inp.hasAcuteCoronarySyndrome),
         { shouldValidate: false },
      );
      setValue(
         "hasCoronaryArteryDisease",
         lockedDiseaseKeys.has("hasCoronaryArteryDisease")
            ? true
            : Boolean(inp.hasCoronaryArteryDisease),
         { shouldValidate: false },
      );
      setValue(
         "hasTia",
         lockedDiseaseKeys.has("hasTia") ? true : Boolean(inp.hasTia),
         { shouldValidate: false },
      );
      setValue(
         "hasAorticAneurysm",
         lockedDiseaseKeys.has("hasAorticAneurysm")
            ? true
            : Boolean(inp.hasAorticAneurysm),
         { shouldValidate: false },
      );
      setValue(
         "hasPeripheralArteryDisease",
         lockedDiseaseKeys.has("hasPeripheralArteryDisease")
            ? true
            : Boolean(inp.hasPeripheralArteryDisease),
         { shouldValidate: false },
      );
      setValue(
         "hasAtherosclerosis",
         lockedDiseaseKeys.has("hasAtherosclerosis")
            ? true
            : Boolean(inp.hasAtherosclerosis),
         { shouldValidate: false },
      );
      setValue(
         "hasFamilialHypercholesterolemia",
         lockedDiseaseKeys.has("hasFamilialHypercholesterolemia")
            ? true
            : Boolean(inp.hasFamilialHypercholesterolemia),
         { shouldValidate: false },
      );
   }, [
      initialAssessment,
      hasRecordedUnderlying,
      isAgeLocked,
      isGenderLocked,
      isSmokingLocked,
      isHeightFromProfile,
      isWeightFromProfile,
      lockedDiseaseKeys,
      setValue,
   ]);

   const hasUnderlyingDisease = Boolean(
      useWatch({ control, name: "hasUnderlyingDisease" }),
   );
   const effectiveAge = schemaData?.patientProfile?.calculatedAge ?? profileAge;
   const watchedAge = useWatch({ control, name: "age" });
   const currentAge =
      (isAgeLocked ? effectiveAge : watchedAge) ?? effectiveAge ?? watchedAge;
   const isUnder40 =
      !hasUnderlyingDisease &&
      typeof currentAge === "number" &&
      !isNaN(currentAge) &&
      currentAge < 40;
   const diabetes = Boolean(useWatch({ control, name: "diabetes" }));
   const watchedTotalChol = useWatch({ control, name: "totalCholesterol" });
   const watchedHdlChol = useWatch({ control, name: "hdlCholesterol" });
   const watchedNonHdlChol = useWatch({ control, name: "nonHdlCholesterol" });
   const watchedLdlChol = useWatch({ control, name: "ldlCholesterol" });
   const watchedTriglycerides = useWatch({ control, name: "triglycerides" });

   const parseNumeric = (val: unknown): number | null => {
      if (
         val === null ||
         val === undefined ||
         val === "" ||
         (typeof val === "string" && val.trim() === "")
      ) {
         return null;
      }
      const num = Number(val);
      if (isNaN(num) || num <= 0) return null;
      return num;
   };

   const numTotalChol = parseNumeric(watchedTotalChol);
   const numHdlChol = parseNumeric(watchedHdlChol);
   const numLdlChol = parseNumeric(watchedLdlChol);
   const numTriglycerides = parseNumeric(watchedTriglycerides);

   // Tự động tính Non-HDL-Cholesterol khi có cả Cholesterol toàn phần và HDL-Cholesterol
   useEffect(() => {
      if (hasUnderlyingDisease) return;

      if (
         numTotalChol !== null &&
         numHdlChol !== null &&
         numTotalChol > numHdlChol
      ) {
         const diff = Math.round((numTotalChol - numHdlChol) * 100) / 100;
         setValue("nonHdlCholesterol", diff, {
            shouldDirty: true,
         });
      } else {
         setValue("nonHdlCholesterol", null, {
            shouldValidate: false,
         });
      }
   }, [hasUnderlyingDisease, numTotalChol, numHdlChol, setValue]);

   // Cảnh báo nếu không nhập 1 trong 2 trường để tính Non-HDL
   const nonHdlWarning = useMemo(() => {
      if (hasUnderlyingDisease) return undefined;

      const hasTotal = numTotalChol !== null;
      const hasHdl = numHdlChol !== null;

      if (!hasTotal && !hasHdl) {
         return undefined;
      }
      if (hasTotal && !hasHdl) {
         return "Chưa tính được Non-HDL-Cholesterol do chưa nhập HDL-Cholesterol";
      }
      if (!hasTotal && hasHdl) {
         return "Chưa tính được Non-HDL-Cholesterol do chưa nhập Cholesterol toàn phần";
      }
      if (hasTotal && hasHdl && numTotalChol <= numHdlChol) {
         return "Chưa tính được Non-HDL-Cholesterol: HDL-Cholesterol phải nhỏ hơn Cholesterol toàn phần";
      }
      return undefined;
   }, [hasUnderlyingDisease, numTotalChol, numHdlChol]);

   // Kiểm tra lỗi thời gian thực cho LDL-Cholesterol
   const ldlError = useMemo(() => {
      if (numLdlChol === null) return undefined;
      if (numLdlChol < 0.5 || numLdlChol > 15.0) {
         return "LDL-Cholesterol hợp lệ từ 0.5 - 15.0 mmol/L";
      }
      if (numTotalChol !== null && numLdlChol >= numTotalChol) {
         return "LDL-Cholesterol phải nhỏ hơn Cholesterol toàn phần";
      }
      const numNonHdl = parseNumeric(watchedNonHdlChol);
      if (numNonHdl !== null && numLdlChol > numNonHdl) {
         return "LDL-Cholesterol không được lớn hơn Non-HDL-Cholesterol";
      }
      return undefined;
   }, [numLdlChol, numTotalChol, watchedNonHdlChol]);

   // Kiểm tra lỗi thời gian thực cho Triglycerides
   const triglyceridesError = useMemo(() => {
      if (numTriglycerides === null) return undefined;
      if (numTriglycerides < 0.2 || numTriglycerides > 30.0) {
         return "Triglycerides hợp lệ từ 0.2 - 30.0 mmol/L";
      }
      return undefined;
   }, [numTriglycerides]);

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
         });
         if (!hasRecordedUnderlying) {
            newSources.hasUnderlyingDisease = "OCR";
         }
      }

      // 2. Tuổi: Ưu tiên hồ sơ bệnh nhân (isAgeLocked) -> không ghi đè nếu đã có từ hồ sơ
      if (!isAgeLocked && values.age !== undefined && values.age !== null) {
         setValue("age", values.age, {
            shouldDirty: true,
         });
         newSources.age = "OCR";
      }

      // 3. Giới tính: Ưu tiên hồ sơ bệnh nhân (isGenderLocked) -> không ghi đè nếu đã có từ hồ sơ
      if (!isGenderLocked && values.gender) {
         setValue("gender", values.gender, {
            shouldDirty: true,
         });
         newSources.gender = "OCR";
      }

      // 4. Các chỉ số sinh lý & xét nghiệm (OCR điền vào form, người dùng vẫn có thể chỉnh sửa tay tiếp)
      if (
         !isSmokingLocked &&
         values.isSmoking !== undefined &&
         values.isSmoking !== null
      ) {
         setValue("isSmoking", values.isSmoking, {
            shouldDirty: true,
         });
         newSources.isSmoking = "OCR";
      }
      if (values.systolicBp !== undefined && values.systolicBp !== null) {
         setValue("systolicBp", values.systolicBp, {
            shouldDirty: true,
         });
         newSources.systolicBp = "OCR";
      }
      if (values.diastolicBp !== undefined && values.diastolicBp !== null) {
         setValue("diastolicBp", values.diastolicBp, {
            shouldDirty: true,
         });
         newSources.diastolicBp = "OCR";
      }
      if (
         values.totalCholesterol !== undefined &&
         values.totalCholesterol !== null
      ) {
         setValue("totalCholesterol", values.totalCholesterol, {
            shouldDirty: true,
         });
         newSources.totalCholesterol = "OCR";
      }
      if (
         values.hdlCholesterol !== undefined &&
         values.hdlCholesterol !== null
      ) {
         setValue("hdlCholesterol", values.hdlCholesterol, {
            shouldDirty: true,
         });
         newSources.hdlCholesterol = "OCR";
      }
      if (
         values.nonHdlCholesterol !== undefined &&
         values.nonHdlCholesterol !== null
      ) {
         setValue("nonHdlCholesterol", values.nonHdlCholesterol, {
            shouldDirty: true,
         });
         newSources.nonHdlCholesterol = "OCR";
      }
      if (
         values.ldlCholesterol !== undefined &&
         values.ldlCholesterol !== null
      ) {
         setValue("ldlCholesterol", values.ldlCholesterol, {
            shouldDirty: true,
         });
         newSources.ldlCholesterol = "OCR";
      }
      if (values.triglycerides !== undefined && values.triglycerides !== null) {
         setValue("triglycerides", values.triglycerides, {
            shouldDirty: true,
         });
         newSources.triglycerides = "OCR";
      }
      if (
         values.glucoseFasting !== undefined &&
         values.glucoseFasting !== null
      ) {
         setValue("glucoseFasting", values.glucoseFasting, {
            shouldDirty: true,
         });
         newSources.glucoseFasting = "OCR";
      }
      if (values.egfr !== undefined && values.egfr !== null) {
         setValue("egfr", values.egfr, {
            shouldDirty: true,
         });
         newSources.egfr = "OCR";
      }
      if (values.acr !== undefined && values.acr !== null) {
         setValue("acr", values.acr, {
            shouldDirty: true,
         });
         newSources.acr = "OCR";
      }
      if (values.heightCm !== undefined && values.heightCm !== null) {
         setValue("heightCm", values.heightCm, {
            shouldDirty: true,
         });
         newSources.heightCm = "OCR";
      }
      if (values.weightKg !== undefined && values.weightKg !== null) {
         setValue("weightKg", values.weightKg, {
            shouldDirty: true,
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
      const targetProfileId =
         activeProfile?.id ||
         initialAssessment?.healthProfileId ||
         initialAssessment?.assessmentInput?.healthProfileId;

      if (!targetProfileId) {
         toast.warning("Vui lòng chọn hồ sơ bệnh nhân trước khi đánh giá");
         return;
      }

      try {
         // Đảm bảo các chỉ số từ hồ sơ sức khỏe luôn được giữ nguyên (không cho phép sửa)
         const finalAge = isAgeLocked
            ? (schemaData?.patientProfile?.calculatedAge ?? profileAge)
            : data.age;
         const finalGender = isGenderLocked
            ? profileGender || data.gender
            : data.gender;
         const finalSmoking = isSmokingLocked
            ? Boolean(activeProfile?.isSmoking)
            : data.isSmoking;
         const finalHeight = isHeightFromProfile
            ? effectiveHeight
            : data.heightCm;
         const finalWeight = isWeightFromProfile
            ? effectiveWeight
            : data.weightKg;

         let payload: CreateRiskAssessmentRequest;

         if (!data.hasUnderlyingDisease && !hasRecordedUnderlying) {
            if (finalAge === null || finalAge === undefined) {
               toast.warning("Vui lòng cung cấp thông tin tuổi của người bệnh");
               return;
            }

            if (finalAge < 40) {
               toast.warning(
                  `Hệ thống chỉ cho phép phân tầng cho người từ 40 tuổi trở lên (Hiện tại: ${finalAge} tuổi)`,
               );
               return;
            }

            if (finalSmoking === null || finalSmoking === undefined) {
               toast.warning(
                  "Vui lòng chọn thói quen hút thuốc của người bệnh",
               );
               return;
            }

            payload = {
               healthProfileId: String(targetProfileId),
               hasUnderlyingDisease: false,
               age: finalAge ?? undefined,
               gender: finalGender || undefined,
               isSmoking: finalSmoking,
               systolicBp: data.systolicBp ?? undefined,
               diastolicBp: data.diastolicBp ?? undefined,
               totalCholesterol: data.totalCholesterol ?? undefined,
               hdlCholesterol: data.hdlCholesterol ?? undefined,
               nonHdlCholesterol: data.nonHdlCholesterol ?? undefined,
               ldlCholesterol: data.ldlCholesterol ?? null,
               triglycerides: data.triglycerides ?? null,
               glucoseFasting: data.glucoseFasting ?? null,
               heightCm: finalHeight ?? null,
               weightKg: finalWeight ?? null,
            };
         } else {
            payload = {
               healthProfileId: String(targetProfileId),
               hasUnderlyingDisease: true,
               hasLeftVentricularHypertrophy:
                  lockedDiseaseKeys.has("hasLeftVentricularHypertrophy") ||
                  Boolean(data.hasLeftVentricularHypertrophy),
               hasAlbuminuria:
                  lockedDiseaseKeys.has("hasAlbuminuria") ||
                  Boolean(data.hasAlbuminuria),
               hasRetinopathy:
                  lockedDiseaseKeys.has("hasRetinopathy") ||
                  Boolean(data.hasRetinopathy),
               hasSilentBrainInfarct:
                  lockedDiseaseKeys.has("hasSilentBrainInfarct") ||
                  Boolean(data.hasSilentBrainInfarct),
               diabetes:
                  lockedDiseaseKeys.has("diabetes") || Boolean(data.diabetes),
               diabetesDurationYears: data.diabetesDurationYears ?? undefined,
               glycemicControl: data.glycemicControl || null,
               egfr: data.egfr ?? null,
               acr: data.acr ?? null,
               stroke: lockedDiseaseKeys.has("stroke") || Boolean(data.stroke),
               hasMyocardialInfarction:
                  lockedDiseaseKeys.has("hasMyocardialInfarction") ||
                  Boolean(data.hasMyocardialInfarction),
               hasAcuteCoronarySyndrome:
                  lockedDiseaseKeys.has("hasAcuteCoronarySyndrome") ||
                  Boolean(data.hasAcuteCoronarySyndrome),
               hasCoronaryArteryDisease:
                  lockedDiseaseKeys.has("hasCoronaryArteryDisease") ||
                  Boolean(data.hasCoronaryArteryDisease),
               hasTia: lockedDiseaseKeys.has("hasTia") || Boolean(data.hasTia),
               hasAorticAneurysm:
                  lockedDiseaseKeys.has("hasAorticAneurysm") ||
                  Boolean(data.hasAorticAneurysm),
               hasPeripheralArteryDisease:
                  lockedDiseaseKeys.has("hasPeripheralArteryDisease") ||
                  Boolean(data.hasPeripheralArteryDisease),
               hasAtherosclerosis:
                  lockedDiseaseKeys.has("hasAtherosclerosis") ||
                  Boolean(data.hasAtherosclerosis),
               hasFamilialHypercholesterolemia:
                  lockedDiseaseKeys.has("hasFamilialHypercholesterolemia") ||
                  Boolean(data.hasFamilialHypercholesterolemia),
               systolicBp: data.systolicBp ?? undefined,
               diastolicBp: data.diastolicBp ?? undefined,
               totalCholesterol: data.totalCholesterol ?? undefined,
               hdlCholesterol: data.hdlCholesterol ?? null,
               glucoseFasting: data.glucoseFasting ?? null,
               heightCm: finalHeight ?? null,
               weightKg: finalWeight ?? null,
               age: finalAge ?? undefined,
               gender: finalGender || undefined,
               isSmoking: finalSmoking ?? undefined,
            };
         }

         // Khi đánh giá lại: chính là update phân tầng yếu tố đó (nếu có id cũ)
         const assessmentIdToUpdate =
            initialAssessment?.id ||
            initialAssessment?.assessmentInputId ||
            initialAssessment?.assessmentInput?.id;

         let res: RiskAssessmentResult;
         if (assessmentIdToUpdate) {
            res = await updateRiskAssessment({
               id: assessmentIdToUpdate,
               data: payload,
            }).unwrap();
         } else {
            res = await createAssessment(payload).unwrap();
         }

         setAssessmentResult(res);
         onAssessmentSuccess?.(res);
         toast.success(
            assessmentIdToUpdate
               ? "Đã cập nhật và phân tầng lại nguy cơ thành công! Bác sĩ vui lòng bấm 'Xác nhận' để hoàn tất thẩm định."
               : "Đánh giá phân tầng nguy cơ thành công!",
         );
      } catch (error: unknown) {
         console.error("Failed to submit risk assessment:", error);
         const apiError = error as { data?: { message?: string } };
         toast.error(
            apiError?.data?.message || "Có lỗi xảy ra khi thực hiện đánh giá",
         );
      }
   };

   return (
      <div className="flex flex-col gap-4 px-0.5">
         <div className="p-3 text-sm flex items-start gap-2 bg-blue-50 border border-blue-200 rounded">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <span>
               Phân tầng yếu tố nguy cơ theo thang điểm Score 2; Score-OP;
               Score-dia được Khuyến cáo của hiệp hội tim mạch châu Âu ESC
            </span>
         </div>
         {isUnder40 && (
            <div className="p-3 text-sm flex items-start gap-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded">
               <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
               <div className="space-y-0.5">
                  <div className="font-semibold text-amber-800">
                     Không đủ điều kiện phân tầng nguy cơ tim mạch
                  </div>
                  <div className="text-xs text-amber-700">
                     Người bệnh hiện tại{" "}
                     <span className="font-bold">{currentAge} tuổi</span>.Hệ
                     thống chỉ cho phép phân tầng nguy cơ cho người từ{" "}
                     <span className="font-bold">40 tuổi trở lên</span>.
                  </div>
               </div>
            </div>
         )}
         {/* Hiển thị kết quả đánh giá */}
         {assessmentResult && (
            <div
               ref={resultRef}
               className={cn(
                  "p-4 rounded-sm border flex flex-col gap-2.5",
                  getRiskContainerClass(assessmentResult.riskLevel),
               )}
            >
               <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                     <span className="font-bold text-xs sm:text-sm">
                        Nguy cơ biến cố tim mạch trong 10 năm:
                     </span>
                     <RiskLevelBadge level={assessmentResult.riskLevel} />
                  </div>
                  {assessmentResult.riskScore !== null &&
                     assessmentResult.riskScore !== undefined &&
                     assessmentResult.riskScore !== "" && (
                        <div className="text-xs flex items-center gap-1.5 flex-wrap">
                           <span className="text-slate-700 font-bold">
                              Tỷ lệ biến cố:
                           </span>
                           <span className="text-base font-extrabold text-primary">
                              {formatRiskRate(
                                 assessmentResult.riskScore,
                                 checkHasUnderlyingDisease(
                                    assessmentResult,
                                 ),
                              )}
                           </span>
                        </div>
                     )}
               </div>

               {/* Giải thích tỷ lệ biến cố */}
               <div className="text-[11px] text-slate-900 bg-white/80 p-2.5 rounded border border-slate-200/70 leading-relaxed">
                  <strong className="text-slate-900">Giải thích:</strong>{" "}
                  {RISK_EXPLANATION_TEXT}
               </div>

               <p className="text-[11px] text-slate-900 italic">
                  * Phân tầng yếu tố nguy cơ theo thang điểm Score 2;
                  Score-OP; Score-dia được Khuyến cáo của hiệp hội tim
                  mạch châu Âu ESC
               </p>

               {/* Thông tin bác sĩ thẩm định & nút thao tác */}
               <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/80 flex-wrap">
                  <div>
                     {assessmentResult.doctorId ? (
                        <div className="text-slate-600 flex flex-col gap-1 text-xs">
                           <span className="font-medium text-slate-700">
                              Xác nhận bởi: {assessmentResult.doctor?.fullName}
                           </span>
                           {assessmentResult.doctorNote && (
                              <div className="text-slate-600">
                                 <span className="font-medium text-slate-700">
                                    Kết luận:{" "}
                                 </span>
                                 {assessmentResult.doctorNote}
                              </div>
                           )}
                        </div>
                     ) : (
                        <span className="text-xs text-amber-600 font-medium">
                           Chưa được xác nhận
                        </span>
                     )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                     {isDoctorOrExpert && hasCarePackage && (
                        <CustomButton
                           type="button"
                           size="sm"
                           className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs text-xs"
                           onClick={() => {
                              const pId =
                                 selectedProfile?.id ||
                                 assessmentResult.healthProfileId ||
                                 assessmentResult.assessmentInput
                                    ?.healthProfileId;
                              if (!assessmentResult || !pId) return;
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
                                 status: "IN_PROGRESS",
                              };

                              if (onStartExaminationWithAssessment) {
                                 onStartExaminationWithAssessment(
                                    assessmentResult,
                                    initialData,
                                 );
                              } else {
                                 router.push(`/work?profileId=${pId}`);
                              }
                           }}
                        >
                           Khám bệnh ngay
                        </CustomButton>
                     )}
                     {isDoctorOrExpert && (
                        <CustomButton
                           type="button"
                           size="sm"
                           className="h-8 font-semibold px-3 cursor-pointer text-xs"
                           onClick={() => setIsEvaluationModalOpen(true)}
                        >
                           {assessmentResult.doctor
                              ? "Thẩm định lại"
                              : "Xác nhận"}
                        </CustomButton>
                     )}
                  </div>
               </div>

               {positiveFactors.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/80">
                     <div className="font-bold text-slate-800 text-xs">
                        Yếu tố nguy cơ & Bệnh nền ghi nhận
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {positiveFactors.map((factor, idx) => (
                           <div
                              key={idx}
                              className="p-2 rounded bg-rose-50/70 border border-rose-200 text-xs flex items-center justify-between"
                           >
                              <span className="font-medium text-rose-900">
                                 {factor.label}
                              </span>
                              <span className="font-semibold text-rose-700 text-[11px]">
                                 {factor.value || "Có"}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {assessmentResult.redFlags &&
                  assessmentResult.redFlags.length > 0 && (
                     <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/80">
                        <div className="font-bold text-rose-700 uppercase tracking-wide text-[11px]">
                           Cảnh báo nguy cơ cao
                        </div>
                        <div className="flex flex-col gap-0.5">
                           {assessmentResult.redFlags.map((flag, idx) => (
                              <div
                                 key={idx}
                                 className="text-xs flex items-baseline"
                              >
                                 + {flag.title || flag.metric} : {flag.value}
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

            {!hasUnderlyingDisease && (
               <div className="space-y-3">
                  {/* Thông tin cơ bản: Tuổi, Giới tính, Thói quen hút thuốc */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <FormInput
                        label={renderFieldLabel("Tuổi", "age")}
                        type="number"
                        min={0}
                        required
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
                              label={renderFieldLabel("Giới tính", "gender")}
                              options={GENDER_OPTIONS}
                              required
                              value={field.value || undefined}
                              onValueChange={field.onChange}
                              placeholder="Chọn giới tính"
                              disabled={isGenderLocked}
                              error={errors.gender?.message}
                           />
                        )}
                     />

                     <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                           <label className="text-xs font-medium text-slate-800">
                              Thói quen hút thuốc{" "}
                           </label>
                           {renderSourceBadge("isSmoking")}
                           <span className="text-red-600 text-xs">*</span>
                        </div>
                        <Controller
                           name="isSmoking"
                           control={control}
                           render={({ field }) => {
                              const hasError = Boolean(errors.isSmoking);
                              return (
                                 <div className="flex flex-col">
                                    <div
                                       className={cn(
                                          "grid grid-cols-2 h-10 rounded-sm border overflow-hidden transition-colors",
                                          hasError
                                             ? "border-destructive ring-1 ring-destructive/20"
                                             : "border-input",
                                       )}
                                    >
                                       <div
                                          onClick={() => {
                                             if (!isSmokingLocked)
                                                field.onChange(true);
                                          }}
                                          className={cn(
                                             "flex items-center gap-2 px-3 text-xs font-medium transition-colors select-none",
                                             isSmokingLocked
                                                ? "cursor-not-allowed opacity-70 bg-slate-50"
                                                : "cursor-pointer hover:bg-slate-50",
                                             field.value === true
                                                ? "bg-primary/5 text-primary font-semibold"
                                                : "bg-background text-slate-700",
                                          )}
                                       >
                                          <Checkbox
                                             id="smoking-yes"
                                             checked={field.value === true}
                                             disabled={isSmokingLocked}
                                             onCheckedChange={() => {
                                                if (!isSmokingLocked)
                                                   field.onChange(true);
                                             }}
                                          />
                                          <Label
                                             htmlFor="smoking-yes"
                                             className={cn(
                                                "text-xs font-medium",
                                                isSmokingLocked
                                                   ? "cursor-not-allowed text-slate-500"
                                                   : "cursor-pointer",
                                             )}
                                          >
                                             Có
                                          </Label>
                                       </div>

                                       <div
                                          onClick={() => {
                                             if (!isSmokingLocked)
                                                field.onChange(false);
                                          }}
                                          className={cn(
                                             "flex items-center gap-2 px-3 text-xs font-medium transition-colors select-none",
                                             isSmokingLocked
                                                ? "cursor-not-allowed opacity-70 bg-slate-50"
                                                : "cursor-pointer hover:bg-slate-50",
                                             field.value === false
                                                ? "bg-primary/5 text-primary font-semibold"
                                                : "bg-background text-slate-700",
                                          )}
                                       >
                                          <Checkbox
                                             id="smoking-no"
                                             checked={field.value === false}
                                             disabled={isSmokingLocked}
                                             onCheckedChange={() => {
                                                if (!isSmokingLocked)
                                                   field.onChange(false);
                                             }}
                                          />
                                          <Label
                                             htmlFor="smoking-no"
                                             className={cn(
                                                "text-xs font-medium",
                                                isSmokingLocked
                                                   ? "cursor-not-allowed text-slate-500"
                                                   : "cursor-pointer",
                                             )}
                                          >
                                             Không
                                          </Label>
                                       </div>
                                    </div>
                                    {errors.isSmoking?.message && (
                                       <span className="text-[11px] font-medium text-destructive mt-0.5">
                                          {errors.isSmoking.message}
                                       </span>
                                    )}
                                 </div>
                              );
                           }}
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <FormInput
                        label={renderFieldLabel(
                           "Huyết áp tâm thu (mmHg)",
                           "systolicBp",
                        )}
                        required
                        type="number"
                        min={0}
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
                        min={0}
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
                        required
                        type="number"
                        min={0}
                        step="any"
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
                        min={0}
                        step="any"
                        placeholder="Ví dụ: 1.2"
                        error={
                           errors.hdlCholesterol?.message ||
                           (numTotalChol !== null &&
                           numHdlChol !== null &&
                           numHdlChol >= numTotalChol
                              ? "HDL-Cholesterol phải nhỏ hơn Cholesterol toàn phần"
                              : undefined)
                        }
                        {...register("hdlCholesterol", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     {nonHdlWarning && (
                        <div className="col-span-full flex items-center gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                           <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                           <span className="font-medium">{nonHdlWarning}</span>
                        </div>
                     )}

                     {!nonHdlWarning &&
                        watchedNonHdlChol !== null &&
                        watchedNonHdlChol !== undefined && (
                           <div className="col-span-full flex items-center gap-2 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                              <Sparkles className="size-4 text-emerald-600 shrink-0" />
                              <span>
                                 Non-HDL-Cholesterol:{" "}
                                 <strong className="text-emerald-950 font-bold text-sm">
                                    {watchedNonHdlChol} mmol/L
                                 </strong>
                              </span>
                           </div>
                        )}

                     <FormInput
                        label={renderFieldLabel(
                           "LDL-Cholesterol (mmol/L)",
                           "ldlCholesterol",
                        )}
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Ví dụ: 2.6"
                        error={errors.ldlCholesterol?.message || ldlError}
                        {...register("ldlCholesterol", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <FormInput
                        label={renderFieldLabel(
                           "Triglycerides (mmol/L)",
                           "triglycerides",
                        )}
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Ví dụ: 1.7"
                        error={
                           errors.triglycerides?.message || triglyceridesError
                        }
                        {...register("triglycerides", {
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
                        min={0}
                        step="any"
                        placeholder="Ví dụ: 5.5"
                        error={errors.glucoseFasting?.message}
                        {...register("glucoseFasting", {
                           setValueAs: (v) =>
                              v === "" || isNaN(v) ? null : Number(v),
                        })}
                     />

                     <div className="col-span-full grid grid-cols-2 gap-2">
                        <FormInput
                           label={renderFieldLabel(
                              "Chiều cao (cm)",
                              "heightCm",
                           )}
                           type="number"
                           min={0}
                           disabled={isHeightFromProfile}
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
                           min={0}
                           disabled={isWeightFromProfile}
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
                                    className="border border-primary"
                                 />
                                 <span className="flex items-center gap-1.5 flex-wrap">
                                    Đái tháo đường
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
                              min={0}
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
                        min={0}
                        step="any"
                        placeholder="Ví dụ: 55.67"
                        error={errors.egfr?.message}
                        {...register("egfr", {
                           setValueAs: (v) => {
                              if (v === "" || v === null || v === undefined)
                                 return null;
                              if (typeof v === "string") {
                                 const clean = v.replace(",", ".");
                                 const num = parseFloat(clean);
                                 return isNaN(num) ? null : num;
                              }
                              return isNaN(Number(v)) ? null : Number(v);
                           },
                        })}
                     />

                     <FormInput
                        label={renderFieldLabel(
                           "Tỷ lệ Albumin/Creatinin niệu ACR (mg/g)",
                           "acr",
                        )}
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Ví dụ: 33.56"
                        error={errors.acr?.message}
                        {...register("acr", {
                           setValueAs: (v) => {
                              if (v === "" || v === null || v === undefined)
                                 return null;
                              if (typeof v === "string") {
                                 const clean = v.replace(",", ".");
                                 const num = parseFloat(clean);
                                 return isNaN(num) ? null : num;
                              }
                              return isNaN(Number(v)) ? null : Number(v);
                           },
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
               {isEditMode && onCancelEdit && (
                  <CustomButton
                     type="button"
                     variant="destructive"
                     onClick={onCancelEdit}
                     disabled={isSubmitting}
                     className="px-5 h-10 text-xs font-semibold"
                  >
                     Hủy chỉnh sửa
                  </CustomButton>
               )}
               <CustomButton
                  type="button"
                  onClick={() => setIsOcrModalOpen(true)}
                  disabled={isSubmitting}
                  startIcon={<ScanSearch />}
                  className="px-6 h-10 text-xs font-semibold"
               >
                  OCR Phân tích file
               </CustomButton>
               <CustomButton
                  type="submit"
                  disabled={isSubmitting || isUnder40}
                  isLoading={isSubmitting}
                  loadingText={
                     isEditMode ? "Đang đánh giá lại..." : "Đang đánh giá..."
                  }
                  className="px-6 h-10 text-xs font-semibold"
               >
                  {isEditMode ? "Đánh giá lại" : "Đánh giá phân tầng nguy cơ"}
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
               onAssessmentSuccess?.(updated);
            }}
         />

         {/* Modal OCR Trích xuất Hồ sơ Bệnh án Y tế */}
         <OcrMedicalRecordModal
            isOpen={isOcrModalOpen}
            onClose={() => setIsOcrModalOpen(false)}
            onApplyToForm={handleApplyOcr}
            expectedPatient={{
               fullName: selectedProfile?.fullName,
               dob: selectedProfile?.dob,
            }}
         />
      </div>
   );
}

export default RiskFactorAssessmentForm;
