"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { Examination, ExaminationStatus } from "@/store/api/examination/type";
import {
   useCreateExaminationMutation,
   useUpdateExaminationMutation,
} from "@/store/api/examination/examination-api";
import { useGetStaffRiskAssessmentsQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { RiskAssessmentResult } from "@/store/api/risk-factor-assessment/type";
import { useAuth } from "@/hooks/use-auth";
import { FormInput } from "@/components/common/form-input";
import { FormNumberInput } from "@/components/common/form-number-input";
import { FormTextarea } from "@/components/common/form-textarea";
import { FormSelect } from "@/components/common/form-select";
import { CustomButton } from "@/components/common/custom-button";
import { cn } from "@/lib/utils";
import { AlertCircle, Info, Trash2, X } from "lucide-react";
import { RiskAssessmentEvaluationModal } from "./risk-assessment-evaluation-modal";
import { RiskAssessmentDetailModal } from "./risk-assessment-detail-modal";
import { TreatmentTargetTemplateModal } from "./treatment-target-template-modal";
import { TreatmentTargetTemplate } from "@/store/api/treatment-target-template/type";
import { useGetTreatmentTargetTemplatesQuery } from "@/store/api/treatment-target-template/treatment-target-template-api";
import {
   useCreateTreamentTargetMutation,
   useLazyGetDetailTreamentTargetQuery,
   useLazyGetTreatmentTargetByAccessmentIdQuery,
   useUpdateTreatmentTargetMutation,
} from "@/store/api/treatment-target/treatment-target-api";
import { TreatmentTarget } from "@/store/api/treatment-target/type";
import { Icd10SuggestInput } from "./icd10-suggest-input";
import {
   RiskLevelBadge,
   getRiskLevelLabel,
   getRiskContainerClass,
   RISK_EXPLANATION_TEXT,
   formatRiskRate,
   checkHasUnderlyingDisease,
} from "@/components/common/risk-level-badge";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { RiskFactorAssessmentForm } from "./risk-factor-assessment-form";
import { useGetDetailHealthProfileQuery } from "@/store/api/health-profile/health-profile-api";
import { ScrollArea } from "@/components/ui/scroll-area";

const COMMON_CUSTOM_TARGET_PRESETS = [
   { key: "uricAcid", label: "Acid Uric", defaultVal: "< 360 umol/L" },
   {
      key: "restingHeartRate",
      label: "Nhịp tim khi nghỉ",
      defaultVal: "60 - 75 bpm",
   },
   { key: "triglyceride", label: "Triglyceride", defaultVal: "< 1.7 mmol/L" },
   { key: "microalbumin", label: "Microalbumin niệu", defaultVal: "< 30 mg/g" },
];

const parseCustomTargets = (
   raw?: Record<string, string> | { [key: string]: string }[],
): { id: string; key: string; value: string }[] => {
   if (!raw) return [];
   return Array.isArray(raw)
      ? raw.flatMap((item, idx) =>
           item && typeof item === "object"
              ? Object.entries(item).map(([k, v]) => ({
                   id: `ct-${idx}-${k}`,
                   key: k,
                   value: String(v ?? ""),
                }))
              : [],
        )
      : Object.entries(raw).map(([k, v], idx) => ({
           id: `ct-${idx}-${k}`,
           key: k,
           value: String(v ?? ""),
        }));
};

const examinationSchema = z.object({
   assessmentInputId: z.string().optional(),
   treatmentTargetId: z.string().optional(),
   treatmentPlanId: z.string().optional(),
   reasonForVisit: z.string().trim().min(1, "Vui lòng nhập lý do đến khám"),
   clinicalSymptoms: z.string().trim().optional(),
   heartRate: z.number().nullable().optional(),
   systolicBp: z.number().nullable().optional(),
   diastolicBp: z.number().nullable().optional(),
   temperature: z.number().nullable().optional(),
   spo2: z.number().nullable().optional(),
   respiratoryRate: z.number().nullable().optional(),
   diagnosis: z.string().trim().min(1, "Vui lòng nhập chẩn đoán"),
   icd10Code: z.string().trim().optional(),
   nextAppointmentDate: z.string().optional(),
   status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export type ExaminationFormValues = z.infer<typeof examinationSchema>;

export interface ExaminationFormProps {
   healthProfileId: string;
   initialData?: Examination | null;
   onSuccess?: (examination: Examination) => void;
   onCancel?: () => void;
}

type VitalFieldKey =
   | "systolicBp"
   | "diastolicBp"
   | "heartRate"
   | "respiratoryRate"
   | "spo2"
   | "temperature";

const VITAL_INPUT_CONFIGS: {
   name: VitalFieldKey;
   label: string;
   placeholder: string;
}[] = [
   { name: "systolicBp", label: "H/áp tâm thu (mmHg)", placeholder: "vd: 120" },
   {
      name: "diastolicBp",
      label: "H/áp tâm trương (mmHg)",
      placeholder: "vd: 80",
   },
   { name: "heartRate", label: "Mạch (lần/phút)", placeholder: "vd: 75" },
   {
      name: "respiratoryRate",
      label: "Nhịp thở (lần/phút)",
      placeholder: "vd: 16",
   },
   { name: "spo2", label: "SpO2 (%)", placeholder: "vd: 98" },
   { name: "temperature", label: "Nhiệt độ (°C)", placeholder: "vd: 36.5" },
];

const COMMON_REASONS_FOR_VISIT = [
   "Khám sức khỏe tổng quát",
   "Khám sức khỏe định kỳ",
   "Tái khám theo hẹn",
   "Khám lấy thuốc định kỳ",
];

const APPOINTMENT_INTERVALS = [
   { label: "1 tuần", days: 7, months: 0 },
   { label: "2 tuần", days: 14, months: 0 },
   { label: "1 tháng", days: 0, months: 1 },
   { label: "2 tháng", days: 0, months: 2 },
   { label: "3 tháng", days: 0, months: 3 },
   { label: "6 tháng", days: 0, months: 6 },
];

const calculateFutureDate = (months: number, days: number = 0): string => {
   const d = new Date();
   if (months > 0) d.setMonth(d.getMonth() + months);
   if (days > 0) d.setDate(d.getDate() + days);
   const year = d.getFullYear();
   const month = String(d.getMonth() + 1).padStart(2, "0");
   const day = String(d.getDate()).padStart(2, "0");
   return `${year}-${month}-${day}`;
};

type TargetStringKey =
   | "bpTarget"
   | "lipidTarget"
   | "bmiTarget"
   | "glycemicTarget"
   | "renalTarget"
   | "dietAdvice"
   | "exerciseAdvice"
   | "smokingAdvice"
   | "doctorNotes";

const TARGET_INPUT_FIELDS: {
   key: TargetStringKey;
   label: string;
   placeholder: string;
}[] = [
   { key: "bpTarget", label: "Huyết áp", placeholder: "VD: < 130/80 mmHg" },
   {
      key: "lipidTarget",
      label: "Lipid máu",
      placeholder: "VD: LDL-C < 1.4 mmol/L",
   },
   { key: "bmiTarget", label: "BMI", placeholder: "VD: 18.5 - 22.9 kg/m²" },
   {
      key: "glycemicTarget",
      label: "Đường huyết",
      placeholder: "VD: HbA1c < 7.0%",
   },
   {
      key: "renalTarget",
      label: "Chức năng thận",
      placeholder: "VD: eGFR > 60 mL/min",
   },
];

const TARGET_TEXTAREA_FIELDS: {
   key: TargetStringKey;
   label: string;
   placeholder: string;
}[] = [
   {
      key: "dietAdvice",
      label: "Tư vấn chế độ ăn",
      placeholder: "Chế độ ăn giảm muối, hạn chế dầu mỡ...",
   },
   {
      key: "exerciseAdvice",
      label: "Tư vấn vận động",
      placeholder: "Đi bộ nhanh 30 phút/ngày...",
   },
   {
      key: "smokingAdvice",
      label: "Tư vấn cai thuốc lá",
      placeholder: "Cai thuốc lá hoàn toàn...",
   },
   {
      key: "doctorNotes",
      label: "Ghi chú của bác sĩ",
      placeholder: "Ghi chú thêm về mục tiêu điều trị...",
   },
];

const unwrapTargetResponse = (raw: unknown): TreatmentTarget | null => {
   if (!raw || typeof raw !== "object") return null;
   if ("data" in raw && raw.data && typeof raw.data === "object") {
      return raw.data as TreatmentTarget;
   }
   return raw as TreatmentTarget;
};

export function ExaminationForm({
   healthProfileId,
   initialData,
   onSuccess,
   onCancel,
}: ExaminationFormProps) {
   const { user } = useAuth();
   const [submittingStatus, setSubmittingStatus] =
      useState<ExaminationStatus | null>(null);
   const [createExamination, { isLoading: isCreating }] =
      useCreateExaminationMutation();
   const [updateExamination, { isLoading: isUpdating }] =
      useUpdateExaminationMutation();

   const isSubmitting = isCreating || isUpdating;
   const isEditing = Boolean(initialData?.id);
   const canEdit = !isEditing || initialData?.status === "IN_PROGRESS";

   const {
      data: riskAssessmentData,
      isLoading: isLoadingRisk,
      isFetching: isFetchingRisk,
      refetch: refetchRiskAssessments,
   } = useGetStaffRiskAssessmentsQuery(
      { healthProfileId, limit: 50 },
      { skip: !healthProfileId },
   );

   const { data: healthProfileData } = useGetDetailHealthProfileQuery(
      healthProfileId,
      { skip: !healthProfileId },
   );

   const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [isCreateRiskModalOpen, setIsCreateRiskModalOpen] = useState(false);
   const [editingRiskAssessment, setEditingRiskAssessment] =
      useState<RiskAssessmentResult | null>(null);
   const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
   const [templateModalMode, setTemplateModalMode] = useState<
      "list" | "create"
   >("list");
   const { data: templateResponse } = useGetTreatmentTargetTemplatesQuery({
      limit: 5,
   });
   const quickTemplates = templateResponse?.data || [];

   const [updatedAssessment, setUpdatedAssessment] =
      useState<RiskAssessmentResult | null>(null);
   const [treatmentTarget, setTreatmentTarget] =
      useState<TreatmentTarget | null>(null);
   const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
      null,
   );
   const [customTargetList, setCustomTargetList] = useState<
      { id: string; key: string; value: string }[]
   >([]);
   const treatmentTargetRef = useRef<HTMLDivElement | null>(null);
   const isInitialTargetLoadedRef = useRef(false);

   const scrollToTarget = () => {
      setTimeout(() => {
         treatmentTargetRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
         });
      }, 100);
   };

   const createBlankTargetObj = useCallback(
      (): TreatmentTarget => ({
         id: "",
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
         deletedAt: "",
         healthProfileId,
         careSubscriptionId: "",
         doctorId: user?.id || "",
         expertId: "",
         examinationId: initialData?.id || "",
         assessmentResultId: "",
         dictionaryCode: "",
         bpTarget: "",
         lipidTarget: "",
         bmiTarget: "",
         glycemicTarget: "",
         renalTarget: "",
         dietAdvice: "",
         exerciseAdvice: "",
         smokingAdvice: "",
         doctorNotes: "",
         expertNotes: "",
         status: "DRAFT",
         verifiedAt: "",
      }),
      [healthProfileId, initialData?.id, user?.id],
   );

   const handleCreateBlankTarget = () => {
      setSelectedTemplateId(null);
      setTreatmentTarget(createBlankTargetObj());
      setCustomTargetList([]);
      scrollToTarget();
   };

   const [prevCustomTargetsRaw, setPrevCustomTargetsRaw] = useState(
      treatmentTarget?.customTargets,
   );
   const [prevTargetId, setPrevTargetId] = useState(treatmentTarget?.id);

   if (
      treatmentTarget?.id !== prevTargetId ||
      treatmentTarget?.customTargets !== prevCustomTargetsRaw
   ) {
      setPrevTargetId(treatmentTarget?.id);
      setPrevCustomTargetsRaw(treatmentTarget?.customTargets);
      setCustomTargetList(parseCustomTargets(treatmentTarget?.customTargets));
   }

   const handleApplyTemplate = (template: TreatmentTargetTemplate) => {
      setSelectedTemplateId(template.id);
      setTreatmentTarget((prev) => {
         const base = prev || createBlankTargetObj();
         return {
            ...base,
            id: "",
            status: "DRAFT",
            bpTarget: template.bpTarget || base.bpTarget,
            lipidTarget: template.lipidTarget || base.lipidTarget,
            bmiTarget: template.bmiTarget || base.bmiTarget,
            glycemicTarget: template.glycemicTarget || base.glycemicTarget,
            renalTarget: template.renalTarget || base.renalTarget,
            dietAdvice: template.dietAdvice || base.dietAdvice,
            exerciseAdvice: template.exerciseAdvice || base.exerciseAdvice,
            smokingAdvice: template.smokingAdvice || base.smokingAdvice,
            doctorNotes: template.doctorNotes || base.doctorNotes,
         };
      });
      setValue("treatmentTargetId", "", { shouldDirty: true });

      if (
         template.customTargets &&
         typeof template.customTargets === "object"
      ) {
         const parsed = parseCustomTargets(template.customTargets);
         if (parsed.length > 0) setCustomTargetList(parsed);
      }

      toast.success(`Đã áp dụng mẫu mục tiêu: "${template.name}"`);
      scrollToTarget();
   };

   const handleAddCustomTarget = () => {
      setCustomTargetList((prev) => [
         ...prev,
         {
            id: `ct-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            key: "",
            value: "",
         },
      ]);
   };

   const handleUpdateCustomTarget = (
      id: string,
      field: "key" | "value",
      val: string,
   ) => {
      setCustomTargetList((prev) =>
         prev.map((item) =>
            item.id === id ? { ...item, [field]: val } : item,
         ),
      );
   };

   const handleRemoveCustomTarget = (id: string) => {
      setCustomTargetList((prev) => prev.filter((item) => item.id !== id));
   };

   const [fetchTreatmentTarget, { isFetching: isFetchingTarget }] =
      useLazyGetTreatmentTargetByAccessmentIdQuery();
   const [fetchDetailTreatmentTarget] = useLazyGetDetailTreamentTargetQuery();
   const [createTreatmentTarget, { isLoading: isCreatingTarget }] =
      useCreateTreamentTargetMutation();
   const [updateTreatmentTarget, { isLoading: isUpdatingTarget }] =
      useUpdateTreatmentTargetMutation();

   const riskAssessments: RiskAssessmentResult[] = useMemo(
      () => riskAssessmentData?.data || riskAssessmentData?.items || [],
      [riskAssessmentData],
   );

   const initialAssessmentInputId = initialData?.assessmentInputId;

   const riskAssessmentOptions = useMemo(() => {
      const opts: { label: string; value: string }[] = [
         {
            value: "none",
            label:
               riskAssessments.length === 0
                  ? "Không có phiếu phân tầng nguy cơ nào"
                  : "Không liên kết phiếu phân tầng nguy cơ",
         },
      ];

      riskAssessments.forEach((item) => {
         const id =
            item.assessmentInputId || item.assessmentInput?.id || item.id;
         const dateStr = item.createdAt || item.assessmentInput?.assessmentDate;
         let formattedDate = "";
         if (dateStr) {
            try {
               const d = new Date(dateStr);
               if (!isNaN(d.getTime())) {
                  formattedDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
               }
            } catch {
               formattedDate = dateStr;
            }
         }
         const hasUnderlying = checkHasUnderlyingDisease(item);
         const rateFormatted = formatRiskRate(item.riskScore, hasUnderlying);
         const scoreStr =
            rateFormatted !== "—" ? `(Tỷ lệ biến cố: ${rateFormatted})` : "";
         opts.push({
            value: id,
            label: `${formattedDate ? `[${formattedDate}] ` : ""}${getRiskLevelLabel(item.riskLevel)} ${scoreStr}`,
         });
      });

      if (
         initialAssessmentInputId &&
         !opts.some((o) => o.value === initialAssessmentInputId)
      ) {
         opts.push({
            value: initialAssessmentInputId,
            label: `Phiếu phân tầng đã liên kết (${initialAssessmentInputId.slice(0, 8)}...)`,
         });
      }

      if (
         updatedAssessment &&
         !opts.some(
            (o) =>
               o.value === updatedAssessment.id ||
               o.value === updatedAssessment.assessmentInputId ||
               o.value === updatedAssessment.assessmentInput?.id,
         )
      ) {
         const hasUnderlying = checkHasUnderlyingDisease(updatedAssessment);
         const rateFormatted = formatRiskRate(
            updatedAssessment.riskScore,
            hasUnderlying,
         );
         const scoreStr =
            rateFormatted !== "—" ? `(Tỷ lệ biến cố: ${rateFormatted})` : "";
         const targetId =
            updatedAssessment.assessmentInputId ||
            updatedAssessment.assessmentInput?.id ||
            updatedAssessment.id;
         opts.push({
            value: targetId,
            label: `[Vừa đánh giá] ${getRiskLevelLabel(updatedAssessment.riskLevel)} ${scoreStr}`,
         });
      }

      return opts;
   }, [riskAssessments, initialAssessmentInputId, updatedAssessment]);

   const {
      register,
      control,
      handleSubmit,
      reset,
      setValue,
      getValues,
      formState: { errors },
   } = useForm<ExaminationFormValues>({
      resolver: zodResolver(examinationSchema),
      defaultValues: {
         assessmentInputId: initialData?.assessmentInputId || "",
         treatmentTargetId: initialData?.treatmentTargetId || "",
         treatmentPlanId: initialData?.treatmentPlanId || "",
         reasonForVisit: initialData?.reasonForVisit || "",
         clinicalSymptoms: initialData?.clinicalSymptoms || "",
         heartRate: initialData?.heartRate ?? null,
         systolicBp: initialData?.systolicBp ?? null,
         diastolicBp: initialData?.diastolicBp ?? null,
         temperature: initialData?.temperature ?? null,
         spo2: initialData?.spo2 ?? null,
         respiratoryRate: initialData?.respiratoryRate ?? null,
         diagnosis: initialData?.diagnosis || "",
         icd10Code: initialData?.icd10Code || "",
         nextAppointmentDate: initialData?.nextAppointmentDate || "",
         status: (initialData?.status as ExaminationStatus) || "IN_PROGRESS",
      },
   });

   const watchedAssessmentInputId = useWatch({
      control,
      name: "assessmentInputId",
   });

   const selectedRiskAssessment = useMemo(() => {
      if (!watchedAssessmentInputId || watchedAssessmentInputId === "none")
         return null;
      if (
         updatedAssessment &&
         (updatedAssessment.id === watchedAssessmentInputId ||
            updatedAssessment.assessmentInputId === watchedAssessmentInputId ||
            updatedAssessment.assessmentInput?.id === watchedAssessmentInputId)
      ) {
         return updatedAssessment;
      }
      return (
         riskAssessments.find(
            (a) =>
               a.id === watchedAssessmentInputId ||
               a.assessmentInputId === watchedAssessmentInputId ||
               a.assessmentInput?.id === watchedAssessmentInputId,
         ) || null
      );
   }, [watchedAssessmentInputId, riskAssessments, updatedAssessment]);

   const handleSelectReasonSuggestion = (suggestion: string) => {
      const current = getValues("reasonForVisit") || "";
      if (!current.trim()) {
         setValue("reasonForVisit", suggestion, {
            shouldValidate: true,
            shouldDirty: true,
         });
      } else if (!current.includes(suggestion)) {
         setValue("reasonForVisit", `${current.trim()}, ${suggestion}`, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
   };

   const handleSelectAppointmentInterval = (
      months: number,
      days: number = 0,
   ) => {
      const calculatedDate = calculateFutureDate(months, days);
      setValue("nextAppointmentDate", calculatedDate, {
         shouldValidate: true,
         shouldDirty: true,
      });
   };

   const handleFetchTreatmentTarget = async () => {
      const primaryId = selectedRiskAssessment?.assessmentInputId;
      const fallbackId = selectedRiskAssessment?.assessmentInput?.id;
      const targetId = primaryId || fallbackId || watchedAssessmentInputId;

      if (!targetId || targetId === "none") {
         toast.warning("Vui lòng chọn phiếu phân tầng nguy cơ trước.");
         return;
      }

      try {
         let rawResult: unknown = null;
         try {
            rawResult = await fetchTreatmentTarget({ id: targetId }).unwrap();
         } catch (err: unknown) {
            if (fallbackId && fallbackId !== targetId) {
               rawResult = await fetchTreatmentTarget({
                  id: fallbackId,
               }).unwrap();
            } else {
               throw err;
            }
         }

         const result = unwrapTargetResponse(rawResult);
         if (result) {
            const isAlreadySavedOnThisExam =
               Boolean(initialTargetId) && initialTargetId === result.id;
            setTreatmentTarget({
               ...result,
               id: isAlreadySavedOnThisExam ? result.id : "",
               status: isAlreadySavedOnThisExam ? result.status : "DRAFT",
            });
            setValue(
               "treatmentTargetId",
               isAlreadySavedOnThisExam ? result.id : "",
               {
                  shouldDirty: true,
               },
            );
            toast.success("Lấy mục tiêu điều trị từ phân tầng thành công!");
            scrollToTarget();
         } else {
            toast.info(
               "Không tìm thấy dữ liệu mục tiêu cho phiếu phân tầng này.",
            );
         }
      } catch (error: unknown) {
         const err = error as { data?: { message?: string }; status?: number };
         toast.error(
            err?.data?.message ||
               "Không tìm thấy mục tiêu điều trị cho phiếu phân tầng này.",
         );
      }
   };

   const handleTargetFieldChange = (
      field: keyof TreatmentTarget,
      value: string,
   ) => {
      setTreatmentTarget((prev) => (prev ? { ...prev, [field]: value } : null));
   };

   const getCustomTargetsObject = useCallback(() => {
      const obj: Record<string, string> = {};
      customTargetList.forEach((item) => {
         const k = item.key.trim();
         if (k) obj[k] = item.value.trim();
      });
      return obj;
   }, [customTargetList]);

   const handleConfirmAndSaveTarget = async () => {
      const currentTarget = unwrapTargetResponse(treatmentTarget);
      if (!currentTarget) {
         toast.warning(
            "Chưa có thông tin mục tiêu điều trị để xác nhận và lưu.",
         );
         return;
      }

      const customTargetsMap = getCustomTargetsObject();
      const basePayload = {
         bpTarget: currentTarget.bpTarget || "",
         lipidTarget: currentTarget.lipidTarget || "",
         bmiTarget: currentTarget.bmiTarget || "",
         glycemicTarget: currentTarget.glycemicTarget || "",
         renalTarget: currentTarget.renalTarget || "",
         customTargets: customTargetsMap,
         dietAdvice: currentTarget.dietAdvice || "",
         exerciseAdvice: currentTarget.exerciseAdvice || "",
         smokingAdvice: currentTarget.smokingAdvice || "",
         doctorNotes: currentTarget.doctorNotes || "",
      };

      const existingTargetId = currentTarget.id;

      try {
         if (existingTargetId) {
            // Trường hợp mục tiêu đã có ID trên DB -> Cập nhật
            const rawUpdated = await updateTreatmentTarget({
               id: existingTargetId,
               data: basePayload,
            }).unwrap();

            const updated = unwrapTargetResponse(rawUpdated) || {
               ...currentTarget,
               ...basePayload,
            };

            setTreatmentTarget(updated);
            setValue("treatmentTargetId", updated.id, { shouldDirty: true });

            if (isEditing && initialData?.id) {
               await updateExamination({
                  id: initialData.id,
                  body: { treatmentTargetId: updated.id },
               }).unwrap();
            }

            toast.success("Cập nhật mục tiêu điều trị thành công!");
         } else {
            // Mục tiêu mới (lấy từ template, tự nhập hoặc lấy từ phân tầng) -> Tạo mới & xác nhận luôn qua POST /treatment-targets
            const assessmentId =
               selectedRiskAssessment?.id ||
               selectedRiskAssessment?.assessmentInputId ||
               selectedRiskAssessment?.assessmentInput?.id ||
               (watchedAssessmentInputId && watchedAssessmentInputId !== "none"
                  ? watchedAssessmentInputId
                  : undefined);

            const assessmentInputId =
               selectedRiskAssessment?.assessmentInputId ||
               selectedRiskAssessment?.assessmentInput?.id ||
               undefined;

            const assessmentResultId = selectedRiskAssessment?.id || undefined;

            const rawCreated = await createTreatmentTarget({
               data: {
                  healthProfileId,
                  assessmentId,
                  assessmentInputId,
                  assessmentResultId,
                  examinationId: initialData?.id || undefined,
                  dictionaryCode: currentTarget.dictionaryCode || undefined,
                  ...basePayload,
               },
            }).unwrap();

            const created = unwrapTargetResponse(rawCreated);
            if (created) {
               setTreatmentTarget(created);
               setValue("treatmentTargetId", created.id, { shouldDirty: true });

               if (isEditing && initialData?.id) {
                  await updateExamination({
                     id: initialData.id,
                     body: { treatmentTargetId: created.id },
                  }).unwrap();
               }
            } else {
               setTreatmentTarget((prev) =>
                  prev ? { ...prev, status: "DOCTOR_VERIFIED" } : null,
               );
            }

            toast.success("Xác nhận và lưu mục tiêu điều trị thành công!");
         }
      } catch (error: unknown) {
         const err = error as { data?: { message?: string } };
         toast.error(
            err?.data?.message ||
               "Xác nhận và lưu mục tiêu điều trị thất bại. Vui lòng thử lại.",
         );
      }
   };

   useEffect(() => {
      reset({
         assessmentInputId: initialData?.assessmentInputId || "",
         treatmentTargetId: initialData?.treatmentTargetId || "",
         reasonForVisit: initialData?.reasonForVisit || "",
         clinicalSymptoms: initialData?.clinicalSymptoms || "",
         heartRate: initialData?.heartRate ?? null,
         systolicBp: initialData?.systolicBp ?? null,
         diastolicBp: initialData?.diastolicBp ?? null,
         temperature: initialData?.temperature ?? null,
         spo2: initialData?.spo2 ?? null,
         respiratoryRate: initialData?.respiratoryRate ?? null,
         diagnosis: initialData?.diagnosis || "",
         icd10Code: initialData?.icd10Code || "",
         nextAppointmentDate: initialData?.nextAppointmentDate || "",
         status: initialData?.status || "IN_PROGRESS",
      });
      isInitialTargetLoadedRef.current = false;
   }, [initialData, reset]);

   const initialTargetId = initialData?.treatmentTargetId;
   const currentAssessmentTargetId =
      selectedRiskAssessment?.id ||
      selectedRiskAssessment?.assessmentInputId ||
      selectedRiskAssessment?.assessmentInput?.id ||
      initialData?.assessmentInputId ||
      (watchedAssessmentInputId && watchedAssessmentInputId !== "none"
         ? watchedAssessmentInputId
         : "");
   const fallbackAssessmentId =
      selectedRiskAssessment?.assessmentInputId ||
      selectedRiskAssessment?.assessmentInput?.id ||
      "";

   useEffect(() => {
      let isMounted = true;

      const autoLoadTarget = async () => {
         // Khi load lại phiếu khám: dùng api getDetailTreamentTarget để lấy chi tiết mục tiêu điều trị theo ID
         if (initialTargetId && !isInitialTargetLoadedRef.current) {
            isInitialTargetLoadedRef.current = true;
            try {
               const rawRes = await fetchDetailTreatmentTarget({
                  id: initialTargetId,
               }).unwrap();
               const res = unwrapTargetResponse(rawRes);
               if (isMounted && res) {
                  setTreatmentTarget(res);
                  setValue("treatmentTargetId", res.id, { shouldDirty: false });
                  return;
               }
            } catch {
               // Không tìm thấy target theo ID
            }
         }

         // Khi tạo phiếu khám mới (chưa có initialTargetId) có chọn phân tầng: lấy từ api by-assessment để fill vào form
         if (!initialTargetId && currentAssessmentTargetId) {
            try {
               let rawRes: unknown = null;
               try {
                  rawRes = await fetchTreatmentTarget({
                     id: currentAssessmentTargetId,
                  }).unwrap();
               } catch (err: unknown) {
                  if (
                     fallbackAssessmentId &&
                     fallbackAssessmentId !== currentAssessmentTargetId
                  ) {
                     rawRes = await fetchTreatmentTarget({
                        id: fallbackAssessmentId,
                     }).unwrap();
                  } else {
                     throw err;
                  }
               }

               const res = unwrapTargetResponse(rawRes);
               if (isMounted && res) {
                  setTreatmentTarget({
                     ...res,
                     id: "",
                     status: "DRAFT",
                  });
                  setValue("treatmentTargetId", "", { shouldDirty: true });
               }
            } catch {
               // Không có target liên kết theo phân tầng, bỏ qua
            }
         }
      };

      autoLoadTarget();
      return () => {
         isMounted = false;
      };
   }, [
      initialTargetId,
      currentAssessmentTargetId,
      fallbackAssessmentId,
      fetchTreatmentTarget,
      fetchDetailTreatmentTarget,
      setValue,
   ]);

   const onSubmit = async (
      values: ExaminationFormValues,
      targetStatus?: ExaminationStatus,
   ) => {
      if (isEditing && initialData?.status !== "IN_PROGRESS") {
         toast.error(
            "Phiếu khám chỉ có thể chỉnh sửa khi ở trạng thái đang khám",
         );
         return;
      }
      const finalStatus = targetStatus || values.status;
      const finalAssessmentInputId =
         values.assessmentInputId === "none"
            ? ""
            : values.assessmentInputId || "";

      try {
         const customTargetsMap = getCustomTargetsObject();
         const treatmentTargetData = treatmentTarget
            ? {
                 bpTarget: treatmentTarget.bpTarget || undefined,
                 lipidTarget: treatmentTarget.lipidTarget || undefined,
                 bmiTarget: treatmentTarget.bmiTarget || undefined,
                 glycemicTarget: treatmentTarget.glycemicTarget || undefined,
                 renalTarget: treatmentTarget.renalTarget || undefined,
                 dietAdvice: treatmentTarget.dietAdvice || undefined,
                 exerciseAdvice: treatmentTarget.exerciseAdvice || undefined,
                 smokingAdvice: treatmentTarget.smokingAdvice || undefined,
                 doctorNotes: treatmentTarget.doctorNotes || undefined,
                 customTargets:
                    Object.keys(customTargetsMap).length > 0
                       ? customTargetsMap
                       : undefined,
              }
            : undefined;

         let targetId =
            values.treatmentTargetId || treatmentTarget?.id || undefined;

         if (treatmentTarget && !targetId) {
            try {
               const rawCreated = await createTreatmentTarget({
                  data: {
                     healthProfileId,
                     assessmentId:
                        selectedRiskAssessment?.id ||
                        selectedRiskAssessment?.assessmentInputId ||
                        selectedRiskAssessment?.assessmentInput?.id ||
                        finalAssessmentInputId ||
                        undefined,
                     assessmentInputId:
                        selectedRiskAssessment?.assessmentInputId ||
                        selectedRiskAssessment?.assessmentInput?.id ||
                        undefined,
                     assessmentResultId:
                        selectedRiskAssessment?.id || undefined,
                     examinationId: initialData?.id || undefined,
                     dictionaryCode:
                        treatmentTarget.dictionaryCode || undefined,
                     bpTarget: treatmentTarget.bpTarget || "",
                     lipidTarget: treatmentTarget.lipidTarget || "",
                     bmiTarget: treatmentTarget.bmiTarget || "",
                     glycemicTarget: treatmentTarget.glycemicTarget || "",
                     renalTarget: treatmentTarget.renalTarget || "",
                     dietAdvice: treatmentTarget.dietAdvice || "",
                     exerciseAdvice: treatmentTarget.exerciseAdvice || "",
                     smokingAdvice: treatmentTarget.smokingAdvice || "",
                     doctorNotes: treatmentTarget.doctorNotes || "",
                     customTargets: customTargetsMap,
                  },
               }).unwrap();

               const created = unwrapTargetResponse(rawCreated);
               if (created?.id) {
                  targetId = created.id;
                  setTreatmentTarget(created);
                  setValue("treatmentTargetId", created.id, {
                     shouldDirty: false,
                  });
               }
            } catch (createErr) {
               console.error(
                  "Auto create target in onSubmit error:",
                  createErr,
               );
            }
         } else if (treatmentTarget?.id) {
            try {
               const updatedTarget = await updateTreatmentTarget({
                  id: treatmentTarget.id,
                  data: {
                     bpTarget: treatmentTarget.bpTarget || "",
                     lipidTarget: treatmentTarget.lipidTarget || "",
                     bmiTarget: treatmentTarget.bmiTarget || "",
                     glycemicTarget: treatmentTarget.glycemicTarget || "",
                     renalTarget: treatmentTarget.renalTarget || "",
                     dietAdvice: treatmentTarget.dietAdvice || "",
                     exerciseAdvice: treatmentTarget.exerciseAdvice || "",
                     smokingAdvice: treatmentTarget.smokingAdvice || "",
                     doctorNotes: treatmentTarget.doctorNotes || "",
                     expertNotes: treatmentTarget.expertNotes || "",
                     customTargets: customTargetsMap,
                  },
               }).unwrap();
               const actualUpdated =
                  unwrapTargetResponse(updatedTarget) || updatedTarget;
               setTreatmentTarget(actualUpdated);
               targetId = actualUpdated.id;
               setValue("treatmentTargetId", actualUpdated.id, {
                  shouldDirty: false,
               });
            } catch (targetErr) {
               console.error("Lỗi khi lưu mục tiêu điều trị:", targetErr);
            }
         }

         const numericVitals = {
            heartRate: values.heartRate ?? 0,
            systolicBp: values.systolicBp ?? 0,
            diastolicBp: values.diastolicBp ?? 0,
            temperature: values.temperature ?? 0,
            spo2: values.spo2 ?? 0,
            respiratoryRate: values.respiratoryRate ?? 0,
         };

         if (isEditing && initialData?.id) {
            const finalTargetId =
               targetId ??
               (initialData.treatmentTargetId && !treatmentTarget
                  ? null
                  : undefined);
            const finalAssessmentId = finalAssessmentInputId
               ? finalAssessmentInputId
               : initialData.assessmentInputId
                 ? null
                 : undefined;

            const result = await updateExamination({
               id: initialData.id,
               body: {
                  ...values,
                  ...numericVitals,
                  assessmentInputId: finalAssessmentId,
                  treatmentTargetId: finalTargetId,
                  treatmentTargetTemplateId: selectedTemplateId || undefined,
                  treatmentTargetData,
                  status: finalStatus,
               },
            }).unwrap();

            toast.success(
               finalStatus === "COMPLETED"
                  ? "Đã hoàn thành lượt khám và lưu thông tin!"
                  : finalStatus === "CANCELLED"
                    ? "Đã hủy lượt khám!"
                    : "Cập nhật phiếu khám và mục tiêu điều trị thành công!",
            );
            onSuccess?.(result);
         } else {
            const result = await createExamination({
               healthProfileId,
               facilityId: user?.facilityId || "",
               assessmentInputId: finalAssessmentInputId || undefined,
               treatmentTargetId: targetId,
               treatmentTargetTemplateId: selectedTemplateId || undefined,
               treatmentTargetData,
               reasonForVisit: values.reasonForVisit,
               clinicalSymptoms: values.clinicalSymptoms || "",
               ...numericVitals,
               diagnosis: values.diagnosis || "",
               icd10Code: values.icd10Code || "",
               nextAppointmentDate: values.nextAppointmentDate || "",
               status: finalStatus,
               examinationDate: new Date().toISOString(),
            }).unwrap();

            toast.success(
               finalStatus === "COMPLETED"
                  ? "Tạo và hoàn thành phiếu khám thành công!"
                  : finalStatus === "CANCELLED"
                    ? "Đã tạo phiếu khám với trạng thái hủy!"
                    : "Tạo phiếu khám và lưu mục tiêu điều trị thành công!",
            );
            onSuccess?.(result);
         }
      } catch (err) {
         console.error("Lỗi khi lưu phiếu khám:", err);
         toast.error("Không thể lưu phiếu khám. Vui lòng thử lại!");
      }
   };

   const handleSaveWithStatus = (targetStatus: ExaminationStatus) => {
      setValue("status", targetStatus);
      handleSubmit(
         async (values) => {
            setSubmittingStatus(targetStatus);
            await onSubmit(values, targetStatus);
            setSubmittingStatus(null);
         },
         () => setSubmittingStatus(null),
      )();
   };

   const handleSaveRef = useRef(handleSaveWithStatus);
   const onCancelRef = useRef(onCancel);
   useEffect(() => {
      handleSaveRef.current = handleSaveWithStatus;
      onCancelRef.current = onCancel;
   });

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
            if (onCancelRef.current && !isSubmitting) {
               e.preventDefault();
               onCancelRef.current();
            }
            return;
         }

         if (!canEdit || isSubmitting) return;

         if (
            e.key === "F10" ||
            e.key === "F12" ||
            ((e.ctrlKey || e.metaKey) && e.key === "Enter")
         ) {
            e.preventDefault();
            handleSaveRef.current("COMPLETED");
            return;
         }

         if (
            e.key === "F9" ||
            ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S"))
         ) {
            e.preventDefault();
            handleSaveRef.current("IN_PROGRESS");
            return;
         }

         if (
            e.key === "F4" ||
            (e.altKey && (e.key === "Delete" || e.key === "d" || e.key === "D"))
         ) {
            e.preventDefault();
            handleSaveRef.current("CANCELLED");
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [canEdit, isSubmitting]);

   return (
      <form
         onSubmit={(e) => e.preventDefault()}
         className="flex flex-col gap-6"
      >
         {!canEdit && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
               <span>
                  Phiếu khám này đã{" "}
                  {initialData?.status === "COMPLETED"
                     ? "hoàn thành"
                     : "bị hủy"}
                  , không thể chỉnh sửa. Chỉ phiếu khám ở trạng thái &quot;Đang
                  khám&quot; mới có thể chỉnh sửa.
               </span>
            </div>
         )}

         <fieldset disabled={!canEdit} className="flex flex-col gap-6">
            {/* Phần 1: Lý do khám & Triệu chứng */}
            <div className="flex flex-col gap-3">
               <h3 className="text-sm font-bold text-slate-800">
                  1. Thông tin khám
               </h3>

               <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                     <FormTextarea
                        label="Lý do đến khám"
                        required
                        placeholder="Ví dụ: Đau đầu, mệt mỏi, ho sốt..."
                        error={errors.reasonForVisit?.message}
                        {...register("reasonForVisit")}
                     />
                     {canEdit && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                           <span className="text-xs text-slate-500 font-medium">
                              Gợi ý nhanh:
                           </span>
                           {COMMON_REASONS_FOR_VISIT.map((item) => (
                              <button
                                 key={item}
                                 type="button"
                                 onClick={() =>
                                    handleSelectReasonSuggestion(item)
                                 }
                                 className="px-2 py-0.5 shadow-sm text-xs rounded-sm border border-slate-200 bg-slate-50 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer text-slate-700"
                                 title={`Thêm "${item}" vào lý do đến khám`}
                              >
                                 {item}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>

                  <FormTextarea
                     label="Triệu chứng lâm sàng"
                     placeholder="Mô tả chi tiết các triệu chứng, tiền sử khởi phát..."
                     rows={3}
                     error={errors.clinicalSymptoms?.message}
                     {...register("clinicalSymptoms")}
                  />

                  <div className="flex flex-col gap-2">
                     <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label className="text-xs font-medium text-slate-800">
                           Phân tầng yếu tố nguy cơ (nếu có)
                        </label>
                        {canEdit && (
                           <CustomButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsCreateRiskModalOpen(true)}
                              className="h-7 text-xs px-2.5 text-primary border-primary/30 hover:bg-primary/5 cursor-pointer"
                           >
                              + Thực hiện phân tầng nguy cơ
                           </CustomButton>
                        )}
                     </div>
                     <Controller
                        control={control}
                        name="assessmentInputId"
                        render={({ field }) => (
                           <FormSelect
                              label=""
                              placeholder={
                                 isLoadingRisk || isFetchingRisk
                                    ? "Đang tải danh sách phân tầng..."
                                    : riskAssessments.length === 0 && !updatedAssessment
                                      ? "Bệnh nhân chưa có phiếu phân tầng nguy cơ nào"
                                      : "Chọn phiếu phân tầng nguy cơ"
                              }
                              options={riskAssessmentOptions}
                              value={field.value || "none"}
                              defaultValue="none"
                              onValueChange={(val) => {
                                 setUpdatedAssessment(null);
                                 setTreatmentTarget(null);
                                 field.onChange(val === "none" ? "" : val);
                              }}
                              disabled={!canEdit || isLoadingRisk}
                              error={errors.assessmentInputId?.message}
                           />
                        )}
                     />

                     {selectedRiskAssessment && (
                        <div
                           className={cn(
                              "p-4 rounded-sm border flex flex-col gap-2.5 text-xs",
                              getRiskContainerClass(
                                 selectedRiskAssessment.riskLevel,
                              ),
                           )}
                        >
                           <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                 <span className="font-bold text-xs sm:text-sm">
                                    Nguy cơ biến cố tim mạch trong 10 năm:
                                 </span>
                                 <RiskLevelBadge
                                    level={selectedRiskAssessment.riskLevel}
                                 />
                              </div>
                              {selectedRiskAssessment.riskScore !== null &&
                                 selectedRiskAssessment.riskScore !==
                                    undefined &&
                                 selectedRiskAssessment.riskScore !== "" && (
                                    <div className="text-xs flex items-center gap-1.5 flex-wrap">
                                       <span className="text-slate-700 font-bold">
                                          Tỷ lệ biến cố:
                                       </span>
                                       <span className="text-base font-extrabold text-primary">
                                          {formatRiskRate(
                                             selectedRiskAssessment.riskScore,
                                             checkHasUnderlyingDisease(
                                                selectedRiskAssessment,
                                             ),
                                          )}
                                       </span>
                                    </div>
                                 )}
                           </div>

                           {/* Giải thích tỷ lệ biến cố */}
                           <div className="text-[11px] text-slate-900 bg-white/80 p-2.5 rounded border border-slate-200/70 leading-relaxed">
                              <strong className="text-slate-900">
                                 Giải thích:
                              </strong>{" "}
                              {RISK_EXPLANATION_TEXT}
                           </div>

                           <p className="text-[11px] text-slate-900 italic">
                              * Phân tầng yếu tố nguy cơ theo thang điểm Score 2;
                              Score-OP; Score-dia được Khuyến cáo của hiệp hội tim
                              mạch châu Âu ESC
                           </p>

                           {selectedRiskAssessment.doctorId ? (
                              <div className="text-slate-600 flex flex-col gap-2">
                                 <span className="font-medium text-slate-700">
                                    Xác nhận bởi:{" "}
                                    {selectedRiskAssessment.doctor?.fullName}
                                 </span>
                                 {selectedRiskAssessment.doctorNote && (
                                    <div className="text-slate-600 line-clamp-2">
                                       <span className="font-medium text-slate-700">
                                          Kết luận:{" "}
                                       </span>
                                       {selectedRiskAssessment.doctorNote}
                                    </div>
                                 )}
                                 <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
                                    <CustomButton
                                       type="button"
                                       variant="outline"
                                       onClick={() =>
                                          setIsDetailModalOpen(true)
                                       }
                                       className="h-8 w-fit text-xs cursor-pointer"
                                    >
                                       Xem chi tiết
                                    </CustomButton>
                                    <CustomButton
                                       type="button"
                                       onClick={() =>
                                          setIsEvaluationModalOpen(true)
                                       }
                                       className="w-fit h-8 text-xs cursor-pointer"
                                    >
                                       Đánh giá lại
                                    </CustomButton>
                                 </div>
                              </div>
                           ) : (
                              <div className="text-slate-600 flex flex-col gap-2">
                                 <span className="font-medium text-amber-600">
                                    Chưa được xác nhận
                                 </span>
                                 <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
                                    <CustomButton
                                       type="button"
                                       variant="outline"
                                       onClick={() => setIsDetailModalOpen(true)}
                                       className="h-8 w-fit text-xs cursor-pointer"
                                    >
                                       Xem chi tiết
                                    </CustomButton>
                                    <CustomButton
                                       type="button"
                                       onClick={() =>
                                          setIsEvaluationModalOpen(true)
                                       }
                                       className="h-8 w-fit text-xs cursor-pointer"
                                    >
                                       Xác nhận
                                    </CustomButton>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Phần 2: Chỉ số sinh tồn & Thể lực */}
            <div className="flex flex-col gap-3">
               <h3 className="text-sm font-bold text-slate-800">
                  2. Chỉ số sinh tồn
               </h3>

               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {VITAL_INPUT_CONFIGS.map((item) => (
                     <Controller
                        key={item.name}
                        control={control}
                        name={item.name}
                        render={({ field: { onChange, value } }) => (
                           <FormNumberInput
                              label={item.label}
                              placeholder={item.placeholder}
                              value={value ?? ""}
                              onValueChange={(val) =>
                                 onChange(val.floatValue ?? null)
                              }
                              error={errors[item.name]?.message}
                           />
                        )}
                     />
                  ))}
               </div>
            </div>

            {/* Phần 3: Chẩn đoán & Kế hoạch điều trị */}
            <div className="flex flex-col gap-3">
               <h2 className="text-sm font-bold text-slate-800">
                  3. Chẩn đoán & Điều trị
               </h2>

               <div className="grid grid-cols-1 gap-4">
                  <FormTextarea
                     label="Chẩn đoán"
                     required
                     placeholder="Ví dụ: Tăng huyết áp độ 1..."
                     error={errors.diagnosis?.message}
                     {...register("diagnosis")}
                  />

                  <Controller
                     control={control}
                     name="icd10Code"
                     render={({ field }) => (
                        <Icd10SuggestInput
                           label="Mã bệnh (ICD-10)"
                           placeholder="Nhập mã hoặc tên bệnh (VD: I10, E11, tăng huyết áp...)"
                           error={errors.icd10Code?.message}
                           value={field.value || ""}
                           onChange={field.onChange}
                           onBlur={field.onBlur}
                           onClear={() => field.onChange("")}
                           onSelectDisease={(disease) => {
                              field.onChange(
                                 `${disease.icd10Code} - ${disease.name}`,
                              );
                           }}
                        />
                     )}
                  />

                  {/* Mục tiêu điều trị khi chưa có mẫu */}
                  {!treatmentTarget && (
                     <div className="flex flex-col gap-2 p-3 rounded-sm bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                           <span className="text-sm font-semibold text-slate-800">
                              Mục tiêu điều trị
                           </span>
                           <div className="flex items-center gap-2 flex-wrap">
                              <CustomButton
                                 type="button"
                                 size="sm"
                                 onClick={handleCreateBlankTarget}
                                 className="h-8 text-xs"
                              >
                                 Tự nhập mục tiêu
                              </CustomButton>
                              <CustomButton
                                 type="button"
                                 size="sm"
                                 onClick={() => {
                                    setTemplateModalMode("list");
                                    setIsTemplateModalOpen(true);
                                 }}
                                 className="h-8 text-xs"
                              >
                                 Chọn từ mẫu
                              </CustomButton>
                              {selectedRiskAssessment && (
                                 <CustomButton
                                    type="button"
                                    size="sm"
                                    onClick={handleFetchTreatmentTarget}
                                    isLoading={isFetchingTarget}
                                    className="h-8"
                                 >
                                    Lấy mẫu theo phân tầng
                                 </CustomButton>
                              )}
                           </div>
                        </div>
                     </div>
                  )}

                  {treatmentTarget && (
                     <div
                        ref={treatmentTargetRef}
                        id="treatment-target-section"
                        className="mt-4 flex flex-col gap-4"
                     >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                           <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-800 text-sm">
                                 Mục tiêu điều trị
                              </h4>
                              <span
                                 className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1",
                                    treatmentTarget.id
                                       ? "bg-emerald-100 text-emerald-800"
                                       : "bg-amber-100 text-amber-800",
                                 )}
                              >
                                 {treatmentTarget.id
                                    ? "Đã xác nhận & lưu"
                                    : "Chưa lưu"}
                              </span>
                           </div>
                        </div>

                        {/* Gợi ý mẫu nhanh */}
                        {canEdit && (
                           <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                 <span className="text-xs font-semibold text-slate-600">
                                    Gợi ý mẫu:
                                 </span>
                                 {quickTemplates.length > 0 ? (
                                    quickTemplates.map((tpl) => (
                                       <button
                                          key={tpl.id}
                                          type="button"
                                          onClick={() =>
                                             handleApplyTemplate(tpl)
                                          }
                                          className="px-2.5 py-0.5 shadow-sm text-xs rounded-sm border border-slate-200 bg-white hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer text-slate-700 font-medium"
                                          title={tpl.description || tpl.name}
                                       >
                                          + {tpl.name}
                                       </button>
                                    ))
                                 ) : (
                                    <span className="text-xs text-slate-400 italic">
                                       Chưa có mẫu mục tiêu nào
                                    </span>
                                 )}
                              </div>
                              <button
                                 type="button"
                                 onClick={() => {
                                    setTemplateModalMode("list");
                                    setIsTemplateModalOpen(true);
                                 }}
                                 className="text-xs text-primary hover:underline font-medium underline-offset-2 cursor-pointer whitespace-nowrap ml-auto"
                              >
                                 Xem tất cả mẫu
                              </button>
                           </div>
                        )}

                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md text-sm text-blue-700">
                           <Info className="w-4 h-4" />
                           <span>
                              Mục tiêu điều trị căn cứ theo khuyến cáo hiệp hội
                              tim mạch châu Âu ESC; hiệp hội đái tháo đường Mỹ
                           </span>
                        </div>

                        {/* Các chỉ số kiểm soát */}
                        <div className="grid grid-cols-1 gap-4">
                           {TARGET_INPUT_FIELDS.map(
                              ({ key, label, placeholder }) => (
                                 <FormInput
                                    key={key}
                                    label={label}
                                    placeholder={placeholder}
                                    value={treatmentTarget[key] || ""}
                                    onChange={(e) =>
                                       handleTargetFieldChange(
                                          key,
                                          e.target.value,
                                       )
                                    }
                                    onClear={() =>
                                       handleTargetFieldChange(key, "")
                                    }
                                    disabled={!canEdit}
                                 />
                              ),
                           )}

                           {/* Mục tiêu điều trị tùy chỉnh / bổ sung */}
                           <div className="space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                 <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <span>Mục tiêu bổ sung (Tùy chỉnh)</span>
                                    {customTargetList.length > 0 && (
                                       <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                          {customTargetList.length}
                                       </span>
                                    )}
                                 </label>
                              </div>

                              {canEdit && (
                                 <div className="flex flex-wrap gap-1.5 items-center">
                                    <span className="text-[11px] text-slate-400">
                                       Gợi ý nhanh:
                                    </span>
                                    {COMMON_CUSTOM_TARGET_PRESETS.map(
                                       (preset) => {
                                          const isAdded = customTargetList.some(
                                             (t) =>
                                                t.key.toLowerCase() ===
                                                preset.key.toLowerCase(),
                                          );
                                          return (
                                             <button
                                                key={preset.key}
                                                type="button"
                                                disabled={isAdded}
                                                onClick={() => {
                                                   setCustomTargetList(
                                                      (prev) => [
                                                         ...prev,
                                                         {
                                                            id: `ct-${Date.now()}-${preset.key}`,
                                                            key: preset.key,
                                                            value: preset.defaultVal,
                                                         },
                                                      ],
                                                   );
                                                }}
                                                className={cn(
                                                   "text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer",
                                                   isAdded
                                                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                      : "bg-white text-slate-600 hover:text-primary-600 hover:border-primary-300 border-slate-200 shadow-2xs",
                                                )}
                                             >
                                                + {preset.label}
                                             </button>
                                          );
                                       },
                                    )}
                                 </div>
                              )}

                              {customTargetList.length > 0 && (
                                 <div className="space-y-2 mt-2">
                                    {customTargetList.map((item, idx) => (
                                       <div
                                          key={item.id}
                                          className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                                       >
                                          <div className="flex-1 w-full sm:w-auto">
                                             <FormInput
                                                label={
                                                   idx === 0
                                                      ? "Tên / Mã chỉ số"
                                                      : undefined
                                                }
                                                placeholder="VD: uricAcid, Acid Uric..."
                                                value={item.key}
                                                onChange={(e) =>
                                                   handleUpdateCustomTarget(
                                                      item.id,
                                                      "key",
                                                      e.target.value,
                                                   )
                                                }
                                                disabled={!canEdit}
                                                containerClassName="w-full"
                                             />
                                          </div>
                                          <div className="flex-1 w-full sm:w-auto">
                                             <FormInput
                                                label={
                                                   idx === 0
                                                      ? "Mục tiêu cần đạt được"
                                                      : undefined
                                                }
                                                placeholder="VD: < 360 umol/L"
                                                value={item.value}
                                                onChange={(e) =>
                                                   handleUpdateCustomTarget(
                                                      item.id,
                                                      "value",
                                                      e.target.value,
                                                   )
                                                }
                                                disabled={!canEdit}
                                                containerClassName="w-full"
                                             />
                                          </div>
                                          {canEdit && (
                                             <button
                                                type="button"
                                                onClick={() =>
                                                   handleRemoveCustomTarget(
                                                      item.id,
                                                   )
                                                }
                                                className={cn(
                                                   "p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors self-end sm:self-center cursor-pointer",
                                                   idx === 0 && "sm:mt-5",
                                                )}
                                                title="Xóa mục tiêu này"
                                             >
                                                <Trash2 className="w-4 h-4" />
                                             </button>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {canEdit && (
                                 <div className="flex justify-center">
                                    <CustomButton
                                       type="button"
                                       onClick={handleAddCustomTarget}
                                       className="text-xs h-8 w-1/2"
                                    >
                                       Thêm mục tiêu
                                    </CustomButton>
                                 </div>
                              )}
                           </div>

                           {TARGET_TEXTAREA_FIELDS.map(
                              ({ key, label, placeholder }) => (
                                 <FormTextarea
                                    key={key}
                                    label={label}
                                    placeholder={placeholder}
                                    value={treatmentTarget[key] || ""}
                                    onChange={(e) =>
                                       handleTargetFieldChange(
                                          key,
                                          e.target.value,
                                       )
                                    }
                                    onClear={() =>
                                       handleTargetFieldChange(key, "")
                                    }
                                    rows={2}
                                    disabled={!canEdit}
                                 />
                              ),
                           )}

                           <div className="flex items-center justify-center gap-2 flex-wrap">
                              {canEdit && (
                                 <CustomButton
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                       setTemplateModalMode("create");
                                       setIsTemplateModalOpen(true);
                                    }}
                                    className="h-9 underline text-primary"
                                    title="Lưu các thông số mục tiêu điều trị hiện tại thành mẫu mới"
                                 >
                                    Lưu thành mẫu
                                 </CustomButton>
                              )}
                              <CustomButton
                                 type="button"
                                 onClick={handleConfirmAndSaveTarget}
                                 isLoading={
                                    isCreatingTarget || isUpdatingTarget
                                 }
                                 disabled={!canEdit}
                                 className="h-9 text-xs"
                              >
                                 {treatmentTarget.id
                                    ? "Cập nhật và lưu"
                                    : "Xác nhận và lưu"}
                              </CustomButton>
                              <CustomButton
                                 type="button"
                                 variant="destructive"
                                 onClick={() => {
                                    setTreatmentTarget(null);
                                    setSelectedTemplateId(null);
                                    setCustomTargetList([]);
                                    setValue("treatmentTargetId", "", {
                                       shouldDirty: true,
                                    });
                                 }}
                                 className="h-9 text-xs"
                                 title="Gỡ bỏ mục tiêu điều trị khỏi phiếu khám"
                              >
                                 <X className="w-3.5 h-3.5" />
                                 <span>Gỡ bỏ</span>
                              </CustomButton>
                           </div>
                        </div>

                        {treatmentTarget.expertNotes && (
                           <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                              <span className="font-semibold block mb-0.5">
                                 Ghi chú của chuyên gia:
                              </span>
                              {treatmentTarget.expertNotes}
                           </div>
                        )}
                     </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                     <FormInput
                        type="date"
                        label="Ngày hẹn tái khám"
                        error={errors.nextAppointmentDate?.message}
                        {...register("nextAppointmentDate")}
                     />
                     {canEdit && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                           <span className="text-xs text-slate-500 font-medium">
                              Gợi ý nhanh:
                           </span>
                           {APPOINTMENT_INTERVALS.map((item) => (
                              <button
                                 key={item.label}
                                 type="button"
                                 onClick={() =>
                                    handleSelectAppointmentInterval(
                                       item.months,
                                       item.days,
                                    )
                                 }
                                 className="px-2 py-0.5 shadow-sm text-xs rounded-sm border border-slate-200 bg-slate-50 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer text-slate-700"
                                 title={`Hẹn tái khám sau ${item.label}`}
                              >
                                 {item.label}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </fieldset>

         {/* Nút hành động theo trạng thái */}
         <div className="sticky bottom-0 right-0 bg-white pt-2 flex flex-wrap items-center justify-end gap-3">
            <div className="flex flex-wrap items-center gap-2">
               {onCancel && (
                  <CustomButton
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={onCancel}
                     disabled={isSubmitting}
                     className="h-9 px-3 text-xs gap-1.5 cursor-pointer"
                     title="Đóng (Esc)"
                  >
                     <X className="w-3.5 h-3.5" />
                     <span>Đóng</span>
                     <kbd>(Esc)</kbd>
                  </CustomButton>
               )}
               {initialData?.status === "IN_PROGRESS" && (
                  <CustomButton
                     type="button"
                     variant="destructive"
                     size="sm"
                     isLoading={submittingStatus === "CANCELLED"}
                     disabled={isSubmitting || !canEdit}
                     onClick={() => handleSaveWithStatus("CANCELLED")}
                     className="h-9 px-3.5 text-xs gap-1.5 cursor-pointer"
                     title="Hủy đợt khám (F4)"
                  >
                     <span>Hủy đợt khám</span>
                     <kbd>(F4)</kbd>
                  </CustomButton>
               )}

               <CustomButton
                  type="button"
                  size="sm"
                  isLoading={submittingStatus === "IN_PROGRESS"}
                  disabled={isSubmitting || !canEdit}
                  onClick={() => handleSaveWithStatus("IN_PROGRESS")}
                  className="h-9 px-4 text-xs gap-1.5 cursor-pointer"
                  title="Lưu (F9)"
               >
                  <span>Lưu</span>
                  <kbd>(F9)</kbd>
               </CustomButton>

               <CustomButton
                  type="button"
                  size="sm"
                  isLoading={submittingStatus === "COMPLETED"}
                  disabled={isSubmitting || !canEdit}
                  onClick={() => handleSaveWithStatus("COMPLETED")}
                  className="h-9 px-4 text-xs gap-1.5 cursor-pointer"
                  title="Lưu và hoàn thành (F10)"
               >
                  <span>Lưu và hoàn thành</span>
                  <kbd>(F10)</kbd>
               </CustomButton>
            </div>
         </div>

         {selectedRiskAssessment && (
            <>
               <RiskAssessmentEvaluationModal
                  isOpen={isEvaluationModalOpen}
                  onClose={() => setIsEvaluationModalOpen(false)}
                  assessment={selectedRiskAssessment}
                  onSuccess={(updated) => {
                     refetchRiskAssessments?.();
                     setUpdatedAssessment(updated);
                     const targetId =
                        updated.assessmentInputId ||
                        updated.assessmentInput?.id ||
                        updated.id;
                     setValue("assessmentInputId", targetId, {
                        shouldDirty: true,
                     });
                  }}
               />

               <RiskAssessmentDetailModal
                  isOpen={isDetailModalOpen}
                  onClose={() => setIsDetailModalOpen(false)}
                  assessment={selectedRiskAssessment}
                  onEvaluate={() => setIsEvaluationModalOpen(true)}
                  onEdit={(assessment) => {
                     setIsDetailModalOpen(false);
                     setEditingRiskAssessment(assessment);
                  }}
               />
            </>
         )}

         {/* Modal Tạo mới / Chỉnh sửa & Đánh giá lại phân tầng nguy cơ */}
         <Dialog
            open={Boolean(editingRiskAssessment) || isCreateRiskModalOpen}
            onOpenChange={(open) => {
               if (!open) {
                  setEditingRiskAssessment(null);
                  setIsCreateRiskModalOpen(false);
               }
            }}
         >
            <DialogContent className="sm:min-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 rounded-sm">
               <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-900">
                     {editingRiskAssessment
                        ? "Chỉnh sửa & Đánh giá lại phân tầng nguy cơ"
                        : "Đánh giá phân tầng nguy cơ"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                     {editingRiskAssessment
                        ? "Bác sĩ được chỉnh sửa các dữ liệu người trước đã nhập. Sau khi sửa, hệ thống sẽ tính toán và phân tầng lại chính xác."
                        : "Nhập các thông tin lâm sàng và xét nghiệm để đánh giá phân tầng nguy cơ tim mạch cho người bệnh."}
                  </DialogDescription>
               </DialogHeader>
               <ScrollArea className="h-[65vh] -mr-3 pr-3">
                  {(editingRiskAssessment || isCreateRiskModalOpen) && (
                     <RiskFactorAssessmentForm
                        selectedProfile={
                           healthProfileData ||
                           editingRiskAssessment?.healthProfile ||
                           null
                        }
                        initialAssessment={editingRiskAssessment}
                        isDoctorEditMode={Boolean(editingRiskAssessment)}
                        onCancelEdit={() => {
                           setEditingRiskAssessment(null);
                           setIsCreateRiskModalOpen(false);
                        }}
                        onAssessmentSuccess={(updated) => {
                           refetchRiskAssessments?.();
                           setUpdatedAssessment(updated);
                           const targetId =
                              updated.assessmentInputId ||
                              updated.assessmentInput?.id ||
                              updated.id;
                           setValue("assessmentInputId", targetId, {
                              shouldDirty: true,
                           });
                           setEditingRiskAssessment(null);
                           setIsCreateRiskModalOpen(false);
                        }}
                     />
                  )}
               </ScrollArea>
            </DialogContent>
         </Dialog>
         <TreatmentTargetTemplateModal
            isOpen={isTemplateModalOpen}
            initialMode={templateModalMode}
            onClose={() => setIsTemplateModalOpen(false)}
            onApplyTemplate={handleApplyTemplate}
            currentTargetData={treatmentTarget}
            customTargets={getCustomTargetsObject()}
            dictionaryCode={treatmentTarget?.dictionaryCode || "DEFAULT"}
         />
      </form>
   );
}
