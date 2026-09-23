"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
import { Icd10SuggestInput } from "./icd10-suggest-input";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, Save, Trash2, X } from "lucide-react";
import { RiskAssessmentEvaluationModal } from "./risk-assessment-evaluation-modal";
import { RiskAssessmentDetailModal } from "./risk-assessment-detail-modal";
import {
   useLazyGetTreatmentTargetByAccessmentIdQuery,
   useLazyGetTreatmentTargetByIdQuery,
   useUpdateTreatmentTargetMutation,
   useVerifyTreatmentTargetMutation,
} from "@/store/api/treatment-target/treatment-target-api";
import { TreatmentTarget } from "@/store/api/treatment-target/type";

const getRiskLevelLabel = (level?: string) => {
   switch (level) {
      case "VERY_HIGH":
         return "Nguy cơ rất cao";
      case "HIGH":
         return "Nguy cơ cao";
      case "LOW":
         return "Nguy cơ thấp";
      default:
         return level || "Chưa xác định";
   }
};

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
   const list: { id: string; key: string; value: string }[] = [];
   if (Array.isArray(raw)) {
      raw.forEach((item, index) => {
         if (item && typeof item === "object") {
            Object.entries(item).forEach(([k, v]) => {
               list.push({
                  id: `ct-${index}-${k}`,
                  key: k,
                  value: String(v ?? ""),
               });
            });
         }
      });
   } else if (typeof raw === "object") {
      Object.entries(raw).forEach(([k, v], index) => {
         list.push({
            id: `ct-${index}-${k}`,
            key: k,
            value: String(v ?? ""),
         });
      });
   }
   return list;
};

const examinationSchema = z.object({
   assessmentInputId: z.string().optional(),
   treatmentTargetId: z.string().optional(),
   treatmentPlanId: z.string().optional(),
   reasonForVisit: z.string().min(1, "Vui lòng nhập lý do đến khám"),
   clinicalSymptoms: z.string().optional(),
   heartRate: z.number().nullable().optional(),
   systolicBp: z.number().nullable().optional(),
   diastolicBp: z.number().nullable().optional(),
   temperature: z.number().nullable().optional(),
   spo2: z.number().nullable().optional(),
   heightCm: z.number().nullable().optional(),
   weightKg: z.number().nullable().optional(),
   bmi: z.number().nullable().optional(),
   diagnosis: z.string().optional(),
   icd10Code: z.string().optional(),
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

   const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [updatedAssessment, setUpdatedAssessment] =
      useState<RiskAssessmentResult | null>(null);
   const [treatmentTarget, setTreatmentTarget] =
      useState<TreatmentTarget | null>(null);
   const [customTargetList, setCustomTargetList] = useState<
      { id: string; key: string; value: string }[]
   >([]);
   const treatmentTargetRef = useRef<HTMLDivElement | null>(null);
   const [prevExamId, setPrevExamId] = useState(initialData?.id);
   if (initialData?.id !== prevExamId) {
      setPrevExamId(initialData?.id);
      setTreatmentTarget(null);
   }

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
   const [fetchTreatmentTargetById] = useLazyGetTreatmentTargetByIdQuery();
   const [updateTreatmentTarget, { isLoading: isUpdatingTarget }] =
      useUpdateTreatmentTargetMutation();
   const [verifyTreatmentTarget, { isLoading: isVerifyingTarget }] =
      useVerifyTreatmentTargetMutation();

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
         const scoreStr = item.riskScore
            ? `(Nguy cơ 10 năm tới: ${item.riskScore}%)`
            : "";
         const label = `${formattedDate ? `[${formattedDate}] ` : ""}${getRiskLevelLabel(item.riskLevel)} ${scoreStr}`;

         opts.push({
            value: id,
            label,
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

      return opts;
   }, [riskAssessments, initialAssessmentInputId]);

   const {
      register,
      control,
      handleSubmit,
      reset,
      setValue,
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
         heightCm: initialData?.heightCm ?? null,
         weightKg: initialData?.weightKg ?? null,
         bmi: initialData?.bmi ?? null,
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
      if (!watchedAssessmentInputId || watchedAssessmentInputId === "none") {
         return null;
      }
      if (
         updatedAssessment &&
         (updatedAssessment.assessmentInputId ||
            updatedAssessment.assessmentInput?.id ||
            updatedAssessment.id) === watchedAssessmentInputId
      ) {
         return updatedAssessment;
      }
      return (
         riskAssessments.find(
            (a) =>
               (a.assessmentInputId || a.assessmentInput?.id || a.id) ===
               watchedAssessmentInputId,
         ) || null
      );
   }, [watchedAssessmentInputId, riskAssessments, updatedAssessment]);

   const handleApplyVitalsFromAssessment = () => {
      const input = selectedRiskAssessment?.assessmentInput;
      if (!input) {
         toast.warning("Phiếu phân tầng này không có dữ liệu chỉ số sinh tồn.");
         return;
      }
      if (input.systolicBp != null)
         setValue("systolicBp", Number(input.systolicBp));
      if (input.diastolicBp != null)
         setValue("diastolicBp", Number(input.diastolicBp));
      if (input.heightCm != null) setValue("heightCm", Number(input.heightCm));
      if (input.weightKg != null) setValue("weightKg", Number(input.weightKg));
      if (input.bmi != null) setValue("bmi", Number(input.bmi));
      toast.info("Đã điền các chỉ số sinh tồn từ phiếu phân tầng nguy cơ!");
   };

   const handleFetchTreatmentTarget = async () => {
      const primaryId = selectedRiskAssessment?.id;
      const fallbackId =
         selectedRiskAssessment?.assessmentInputId ||
         selectedRiskAssessment?.assessmentInput?.id;
      const targetId = primaryId || fallbackId || watchedAssessmentInputId;

      if (!targetId || targetId === "none") {
         toast.warning("Vui lòng chọn phiếu phân tầng nguy cơ trước.");
         return;
      }

      try {
         let result: TreatmentTarget | null = null;
         try {
            result = await fetchTreatmentTarget({ id: targetId }).unwrap();
         } catch (err: unknown) {
            if (fallbackId && fallbackId !== targetId) {
               result = await fetchTreatmentTarget({ id: fallbackId }).unwrap();
            } else {
               throw err;
            }
         }

         if (result) {
            setTreatmentTarget(result);
            setValue("treatmentTargetId", result.id, { shouldDirty: true });
            toast.success("Lấy mục tiêu điều trị thành công!");
            setTimeout(() => {
               treatmentTargetRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
               });
            }, 100);
         } else {
            toast.info("Không tìm thấy mục tiêu điều trị cho phiếu này.");
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

   const handleSaveTreatmentTarget = async () => {
      if (!treatmentTarget?.id) {
         toast.warning("Không có mục tiêu điều trị để lưu.");
         return;
      }

      const customTargetsObj: Record<string, string> = {};
      customTargetList.forEach((item) => {
         const k = item.key.trim();
         if (k) {
            customTargetsObj[k] = item.value.trim();
         }
      });

      try {
         const updated = await updateTreatmentTarget({
            id: treatmentTarget.id,
            data: {
               bpTarget: treatmentTarget.bpTarget,
               lipidTarget: treatmentTarget.lipidTarget,
               bmiTarget: treatmentTarget.bmiTarget,
               glycemicTarget: treatmentTarget.glycemicTarget,
               renalTarget: treatmentTarget.renalTarget,
               customTargets: customTargetsObj,
               dietAdvice: treatmentTarget.dietAdvice,
               exerciseAdvice: treatmentTarget.exerciseAdvice,
               smokingAdvice: treatmentTarget.smokingAdvice,
               doctorNotes: treatmentTarget.doctorNotes,
            },
         }).unwrap();
         setTreatmentTarget(updated);

         // Cập nhật thông tin vào form phiếu khám
         setValue("treatmentTargetId", updated.id, { shouldDirty: true });

         // Cập nhật ngay vào phiếu khám trên server nếu phiếu khám đã tồn tại
         if (isEditing && initialData?.id) {
            await updateExamination({
               id: initialData.id,
               body: {
                  treatmentTargetId: updated.id,
               },
            }).unwrap();
         }

         toast.success("Đã lưu mục tiêu điều trị và cập nhật vào phiếu khám!");
      } catch (error: unknown) {
         const err = error as { data?: { message?: string } };
         toast.error(
            err?.data?.message || "Cập nhật mục tiêu điều trị thất bại.",
         );
      }
   };

   const handleVerifyTreatmentTarget = async () => {
      if (!treatmentTarget?.id) {
         toast.warning("Không có mục tiêu điều trị để phê duyệt.");
         return;
      }

      const customTargetsObj: Record<string, string> = {};
      customTargetList.forEach((item) => {
         const k = item.key.trim();
         if (k) {
            customTargetsObj[k] = item.value.trim();
         }
      });

      try {
         const verified = await verifyTreatmentTarget({
            id: treatmentTarget.id,
            data: {
               bpTarget: treatmentTarget.bpTarget || "",
               lipidTarget: treatmentTarget.lipidTarget || "",
               bmiTarget: treatmentTarget.bmiTarget || "",
               glycemicTarget: treatmentTarget.glycemicTarget || "",
               renalTarget: treatmentTarget.renalTarget || "",
               customTargets: customTargetsObj,
               dietAdvice: treatmentTarget.dietAdvice || "",
               exerciseAdvice: treatmentTarget.exerciseAdvice || "",
               smokingAdvice: treatmentTarget.smokingAdvice || "",
               doctorNotes: treatmentTarget.doctorNotes || "",
               expertNotes: treatmentTarget.expertNotes || "",
            },
         }).unwrap();
         setTreatmentTarget(verified);

         // Cập nhật thông tin vào form phiếu khám
         setValue("treatmentTargetId", verified.id, { shouldDirty: true });

         // Cập nhật ngay vào phiếu khám trên server nếu phiếu khám đã tồn tại
         if (isEditing && initialData?.id) {
            await updateExamination({
               id: initialData.id,
               body: {
                  treatmentTargetId: verified.id,
               },
            }).unwrap();
         }

         toast.success(
            "Đã phê duyệt mục tiêu điều trị và cập nhật vào phiếu khám!",
         );
      } catch (error: unknown) {
         const err = error as { data?: { message?: string } };
         toast.error(
            err?.data?.message || "Phê duyệt mục tiêu điều trị thất bại.",
         );
      }
   };

   useEffect(() => {
      if (initialData) {
         reset({
            assessmentInputId: initialData.assessmentInputId || "",
            treatmentTargetId: initialData.treatmentTargetId || "",
            reasonForVisit: initialData.reasonForVisit || "",
            clinicalSymptoms: initialData.clinicalSymptoms || "",
            heartRate: initialData.heartRate ?? null,
            systolicBp: initialData.systolicBp ?? null,
            diastolicBp: initialData.diastolicBp ?? null,
            temperature: initialData.temperature ?? null,
            spo2: initialData.spo2 ?? null,
            heightCm: initialData.heightCm ?? null,
            weightKg: initialData.weightKg ?? null,
            bmi: initialData.bmi ?? null,
            diagnosis: initialData.diagnosis || "",
            icd10Code: initialData.icd10Code || "",
            nextAppointmentDate: initialData.nextAppointmentDate || "",
            status: initialData.status || "IN_PROGRESS",
         });
      } else {
         reset({
            assessmentInputId: "",
            treatmentTargetId: "",
            reasonForVisit: "",
            clinicalSymptoms: "",
            heartRate: null,
            systolicBp: null,
            diastolicBp: null,
            temperature: null,
            spo2: null,
            heightCm: null,
            weightKg: null,
            bmi: null,
            diagnosis: "",
            icd10Code: "",
            nextAppointmentDate: "",
            status: "IN_PROGRESS",
         });
      }
   }, [initialData, reset]);

   const heightCm = useWatch({ control, name: "heightCm" });
   const weightKg = useWatch({ control, name: "weightKg" });

   useEffect(() => {
      if (heightCm && weightKg && heightCm > 0) {
         const heightM = heightCm / 100;
         const calculatedBmi = Number(
            (weightKg / (heightM * heightM)).toFixed(1),
         );
         setValue("bmi", calculatedBmi);
      }
   }, [heightCm, weightKg, setValue]);

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

   // Tự động tải mục tiêu điều trị khi vào khám hoặc khi phiếu phân tầng thay đổi
   useEffect(() => {
      let isMounted = true;

      const autoLoadTarget = async () => {
         // 1. Ưu tiên tải theo treatmentTargetId nếu phiếu khám đã có sẵn
         if (initialTargetId) {
            try {
               const res = await fetchTreatmentTargetById({
                  id: initialTargetId,
               }).unwrap();
               if (isMounted && res) {
                  setTreatmentTarget(res);
                  setValue("treatmentTargetId", res.id, { shouldDirty: false });
                  return;
               }
            } catch {
               // Nếu không lấy được theo ID, tiếp tục thử theo assessmentId bên dưới
            }
         }

         // 2. Tải theo phiếu phân tầng nguy cơ
         if (!currentAssessmentTargetId) return;

         try {
            let res: TreatmentTarget | null = null;
            try {
               res = await fetchTreatmentTarget({
                  id: currentAssessmentTargetId,
               }).unwrap();
            } catch (err: unknown) {
               if (
                  fallbackAssessmentId &&
                  fallbackAssessmentId !== currentAssessmentTargetId
               ) {
                  res = await fetchTreatmentTarget({
                     id: fallbackAssessmentId,
                  }).unwrap();
               } else {
                  throw err;
               }
            }

            if (isMounted && res) {
               setTreatmentTarget(res);
               setValue("treatmentTargetId", res.id, { shouldDirty: false });
            }
         } catch {
            // Phiếu phân tầng chưa có mục tiêu điều trị trên hệ thống, giữ yên lặng
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
      fetchTreatmentTargetById,
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
         let targetId =
            values.treatmentTargetId || treatmentTarget?.id || undefined;

         // Tự động lưu tất cả thông tin mục tiêu điều trị (nếu có)
         if (treatmentTarget?.id) {
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
                  },
               }).unwrap();
               setTreatmentTarget(updatedTarget);
               targetId = updatedTarget.id;
               setValue("treatmentTargetId", updatedTarget.id, {
                  shouldDirty: false,
               });
            } catch (targetErr) {
               console.error("Lỗi khi lưu mục tiêu điều trị:", targetErr);
            }
         }

         if (isEditing && initialData?.id) {
            const result = await updateExamination({
               id: initialData.id,
               body: {
                  ...values,
                  assessmentInputId: finalAssessmentInputId,
                  treatmentTargetId: targetId,
                  status: finalStatus,
                  heartRate: values.heartRate ?? 0,
                  systolicBp: values.systolicBp ?? 0,
                  diastolicBp: values.diastolicBp ?? 0,
                  temperature: values.temperature ?? 0,
                  spo2: values.spo2 ?? 0,
                  heightCm: values.heightCm ?? 0,
                  weightKg: values.weightKg ?? 0,
                  bmi: values.bmi ?? 0,
               },
            }).unwrap();
            const message =
               finalStatus === "COMPLETED"
                  ? "Đã hoàn thành lượt khám và lưu thông tin!"
                  : finalStatus === "CANCELLED"
                    ? "Đã hủy lượt khám!"
                    : "Cập nhật phiếu khám và mục tiêu điều trị thành công!";
            toast.success(message);
            onSuccess?.(result);
         } else {
            const result = await createExamination({
               healthProfileId,
               facilityId: user?.facilityId || "",
               assessmentInputId: finalAssessmentInputId,
               treatmentTargetId: targetId,
               reasonForVisit: values.reasonForVisit,
               clinicalSymptoms: values.clinicalSymptoms || "",
               heartRate: values.heartRate ?? 0,
               systolicBp: values.systolicBp ?? 0,
               diastolicBp: values.diastolicBp ?? 0,
               temperature: values.temperature ?? 0,
               spo2: values.spo2 ?? 0,
               heightCm: values.heightCm ?? 0,
               weightKg: values.weightKg ?? 0,
               bmi: values.bmi ?? 0,
               diagnosis: values.diagnosis || "",
               icd10Code: values.icd10Code || "",
               nextAppointmentDate: values.nextAppointmentDate || "",
               status: finalStatus,
               examinationDate: new Date().toISOString(),
            }).unwrap();
            const message =
               finalStatus === "COMPLETED"
                  ? "Tạo và hoàn thành phiếu khám thành công!"
                  : finalStatus === "CANCELLED"
                    ? "Đã tạo phiếu khám với trạng thái hủy!"
                    : "Tạo phiếu khám và lưu mục tiêu điều trị thành công!";
            toast.success(message);
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
         () => {
            setSubmittingStatus(null);
         },
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
         // Đóng: Esc
         if (e.key === "Escape") {
            if (onCancelRef.current && !isSubmitting) {
               e.preventDefault();
               onCancelRef.current();
            }
            return;
         }

         if (!canEdit || isSubmitting) return;

         // Lưu và hoàn thành: F10 hoặc F12 (chuẩn y tế / HIS) hoặc Ctrl + Enter
         if (
            e.key === "F10" ||
            e.key === "F12" ||
            ((e.ctrlKey || e.metaKey) && e.key === "Enter")
         ) {
            e.preventDefault();
            handleSaveRef.current("COMPLETED");
            return;
         }

         // Lưu: F9 (chuẩn y tế / HIS) hoặc Ctrl + S
         if (
            e.key === "F9" ||
            ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S"))
         ) {
            e.preventDefault();
            handleSaveRef.current("IN_PROGRESS");
            return;
         }

         // Hủy đợt khám: F4 (chuẩn y tế / HIS) hoặc Alt + Delete
         if (
            e.key === "F4" ||
            (e.altKey && (e.key === "Delete" || e.key === "d" || e.key === "D"))
         ) {
            e.preventDefault();
            handleSaveRef.current("CANCELLED");
            return;
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
               <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                     1. Thông tin khám
                  </h3>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <FormTextarea
                     label="Lý do đến khám"
                     required
                     placeholder="Ví dụ: Đau đầu, mệt mỏi, ho sốt..."
                     error={errors.reasonForVisit?.message}
                     {...register("reasonForVisit")}
                  />

                  <FormTextarea
                     label="Triệu chứng lâm sàng"
                     placeholder="Mô tả chi tiết các triệu chứng, tiền sử khởi phát..."
                     rows={3}
                     error={errors.clinicalSymptoms?.message}
                     {...register("clinicalSymptoms")}
                  />

                  <div className="flex flex-col gap-2">
                     <Controller
                        control={control}
                        name="assessmentInputId"
                        render={({ field }) => (
                           <FormSelect
                              label="Phân tầng yếu tố nguy cơ (nếu có)"
                              placeholder={
                                 isLoadingRisk || isFetchingRisk
                                    ? "Đang tải danh sách phân tầng..."
                                    : riskAssessments.length === 0
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
                        <div className="p-3 rounded-sm border border-blue-200 bg-blue-50/50 flex flex-col gap-2 text-xs">
                           <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                 <span className="font-semibold text-slate-700">
                                    Mức nguy cơ:
                                 </span>
                                 <span
                                    className={cn(
                                       "px-2.5 py-1 rounded-full text-xs font-semibold",
                                       selectedRiskAssessment.riskLevel ===
                                          "VERY_HIGH"
                                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                                          : selectedRiskAssessment.riskLevel ===
                                              "HIGH"
                                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                                            : "bg-emerald-100 text-emerald-700 border border-emerald-200",
                                    )}
                                 >
                                    {getRiskLevelLabel(
                                       selectedRiskAssessment.riskLevel,
                                    )}
                                 </span>
                                 {selectedRiskAssessment.riskScore && (
                                    <span className="text-slate-600 font-medium">
                                       (Điểm: {selectedRiskAssessment.riskScore}
                                       %)
                                    </span>
                                 )}
                              </div>

                              {selectedRiskAssessment.assessmentInput && (
                                 <button
                                    type="button"
                                    onClick={handleApplyVitalsFromAssessment}
                                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                                 >
                                    Điền chỉ số sinh tồn từ phiếu này
                                 </button>
                              )}
                           </div>

                           {selectedRiskAssessment.doctorId ? (
                              <div className="text-slate-600 flex flex-col gap-2">
                                 <span className="font-medium text-slate-700">
                                    Xác nhận bởi:{" "}
                                    {selectedRiskAssessment.doctor?.fullName}
                                 </span>
                                 {selectedRiskAssessment.conclusion && (
                                    <div className="text-slate-600 line-clamp-2">
                                       <span className="font-medium text-slate-700">
                                          Kết luận:{" "}
                                       </span>
                                       {selectedRiskAssessment.conclusion}
                                    </div>
                                 )}
                                 <div className="flex items-center justify-center gap-2 flex-wrap">
                                    <CustomButton
                                       type="button"
                                       onClick={() =>
                                          setIsEvaluationModalOpen(true)
                                       }
                                       className="w-fit h-8"
                                    >
                                       Đánh giá lại
                                    </CustomButton>
                                    <CustomButton
                                       type="button"
                                       variant="outline"
                                       onClick={() =>
                                          setIsDetailModalOpen(true)
                                       }
                                       className="w-fit h-8"
                                    >
                                       Xem chi tiết
                                    </CustomButton>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                 <CustomButton
                                    type="button"
                                    onClick={() =>
                                       setIsEvaluationModalOpen(true)
                                    }
                                    className="h-8 w-fit"
                                 >
                                    Đánh giá
                                 </CustomButton>
                                 <CustomButton
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDetailModalOpen(true)}
                                    className="h-8 w-fit"
                                 >
                                    Xem chi tiết
                                 </CustomButton>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>
            </div>
            {/* Phần 2: Chỉ số sinh tồn & Thể lực */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                     2. Chỉ số sinh tồn
                  </h3>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Controller
                     control={control}
                     name="systolicBp"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="H/áp tâm thu (mmHg)"
                           placeholder="vd: 120"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.systolicBp?.message}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="diastolicBp"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="H/áp tâm trương (mmHg)"
                           placeholder="vd: 80"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.diastolicBp?.message}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="heartRate"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="Mạch (lần/phút)"
                           placeholder="vd: 75"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.heartRate?.message}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="spo2"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="SpO2 (%)"
                           placeholder="vd: 98"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.spo2?.message}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="temperature"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="Nhiệt độ (°C)"
                           placeholder="vd: 36.5"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.temperature?.message}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="heightCm"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="Chiều cao (cm)"
                           placeholder="vd: 165"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.heightCm?.message}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="weightKg"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="Cân nặng (kg)"
                           placeholder="vd: 60"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.weightKg?.message}
                        />
                     )}
                  />

                  <Controller
                     control={control}
                     name="bmi"
                     render={({ field: { onChange, value } }) => (
                        <FormNumberInput
                           label="BMI (kg/m²)"
                           placeholder="Tự tính"
                           value={value ?? ""}
                           onValueChange={(val) =>
                              onChange(val.floatValue ?? null)
                           }
                           error={errors.bmi?.message}
                        />
                     )}
                  />
               </div>
            </div>

            {/* Phần 3: Chẩn đoán & Kế hoạch điều trị */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">
                     3. Chẩn đoán & Điều trị
                  </h2>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <FormTextarea
                     label="Chẩn đoán"
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
                           onClear={() => {
                              field.onChange("");
                           }}
                           onSelectDisease={(disease) => {
                              const icd10 = `${disease.icd10Code} - ${disease.name}`;
                              field.onChange(icd10);
                           }}
                        />
                     )}
                  />

                  {/* Mục tiêu điều trị khi chưa có mẫu */}
                  {!treatmentTarget && (
                     <div className="flex flex-col gap-2 p-3 rounded-md bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                           <span className="text-sm font-semibold text-slate-800">
                              Mục tiêu điều trị
                           </span>
                           {selectedRiskAssessment && (
                              <CustomButton
                                 type="button"
                                 size="sm"
                                 onClick={handleFetchTreatmentTarget}
                                 isLoading={isFetchingTarget}
                                 className="h-8"
                              >
                                 Lấy mẫu mục tiêu điều trị
                              </CustomButton>
                           )}
                        </div>
                        {!selectedRiskAssessment && (
                           <span className="text-xs text-slate-500 italic">
                              Chọn phiếu phân tầng nguy cơ ở Phần 1 để tải mục
                              tiêu điều trị.
                           </span>
                        )}
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
                              {treatmentTarget.status && (
                                 <span
                                    className={cn(
                                       "px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1",
                                       treatmentTarget.status === "VERIFIED"
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                          : "bg-amber-100 text-amber-800 border border-amber-300",
                                    )}
                                 >
                                    {treatmentTarget.status ===
                                       "DOCTOR_VERIFIED" && (
                                       <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    )}
                                    {treatmentTarget.status ===
                                    "DOCTOR_VERIFIED"
                                       ? "Đã duyệt"
                                       : "Chưa duyệt"}
                                 </span>
                              )}
                           </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md text-sm text-blue-700">
                           <Info className="w-4 h-4" />
                           <span>
                              Mục tiêu điều trị căn cứ theo khuyến cáo hiệp hội
                              tim mạch châu Âu ESC; hiệp hội đái tháo đường Mỹ
                           </span>
                        </div>

                        {/* Các chỉ số kiểm soát */}
                        <div className="grid grid-cols-1 gap-4">
                           <FormInput
                              label="Huyết áp"
                              placeholder="VD: < 130/80 mmHg"
                              value={treatmentTarget.bpTarget || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "bpTarget",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("bpTarget", "")
                              }
                              disabled={!canEdit}
                           />
                           <FormInput
                              label="Lipid máu"
                              placeholder="VD: LDL-C < 1.4 mmol/L"
                              value={treatmentTarget.lipidTarget || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "lipidTarget",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("lipidTarget", "")
                              }
                              disabled={!canEdit}
                           />
                           <FormInput
                              label="BMI"
                              placeholder="VD: 18.5 - 22.9 kg/m²"
                              value={treatmentTarget.bmiTarget || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "bmiTarget",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("bmiTarget", "")
                              }
                              disabled={!canEdit}
                           />
                           <FormInput
                              label="Đường huyết"
                              placeholder="VD: HbA1c < 7.0%"
                              value={treatmentTarget.glycemicTarget || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "glycemicTarget",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("glycemicTarget", "")
                              }
                              disabled={!canEdit}
                           />
                           <FormInput
                              label="Chức năng thận"
                              placeholder="VD: eGFR > 60 mL/min"
                              value={treatmentTarget.renalTarget || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "renalTarget",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("renalTarget", "")
                              }
                              disabled={!canEdit}
                           />

                           {/* Mục tiêu điều trị tùy chỉnh / bổ sung */}
                           <div className="space-y-2 pt-2 border-t border-dashed border-slate-200">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                 <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <span>Mục tiêu bổ sung (Tùy chỉnh)</span>
                                    {customTargetList.length > 0 && (
                                       <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                          {customTargetList.length}
                                       </span>
                                    )}
                                 </label>
                                 {canEdit && (
                                    <CustomButton
                                       type="button"
                                       onClick={handleAddCustomTarget}
                                       className="text-xs h-8"
                                    >
                                       Thêm mục tiêu
                                    </CustomButton>
                                 )}
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

                              {customTargetList.length > 0 ? (
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
                              ) : (
                                 <div className="p-3 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 bg-slate-50/50">
                                    Chưa có mục tiêu bổ sung nào. Nhấn{" "}
                                    <span className="font-semibold text-slate-600">
                                       + Thêm mục tiêu
                                    </span>{" "}
                                    hoặc chọn từ gợi ý nhanh ở trên.
                                 </div>
                              )}
                           </div>

                           <FormTextarea
                              label="Tư vấn chế độ ăn"
                              placeholder="Chế độ ăn giảm muối, hạn chế dầu mỡ..."
                              value={treatmentTarget.dietAdvice || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "dietAdvice",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("dietAdvice", "")
                              }
                              rows={2}
                              disabled={!canEdit}
                           />
                           <FormTextarea
                              label="Tư vấn vận động"
                              placeholder="Đi bộ nhanh 30 phút/ngày..."
                              value={treatmentTarget.exerciseAdvice || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "exerciseAdvice",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("exerciseAdvice", "")
                              }
                              rows={2}
                              disabled={!canEdit}
                           />
                           <FormTextarea
                              label="Tư vấn cai thuốc lá"
                              placeholder="Cai thuốc lá hoàn toàn..."
                              value={treatmentTarget.smokingAdvice || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "smokingAdvice",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("smokingAdvice", "")
                              }
                              rows={2}
                              disabled={!canEdit}
                           />
                           <FormTextarea
                              label="Ghi chú của bác sĩ"
                              placeholder="Ghi chú thêm về mục tiêu điều trị..."
                              value={treatmentTarget.doctorNotes || ""}
                              onChange={(e) =>
                                 handleTargetFieldChange(
                                    "doctorNotes",
                                    e.target.value,
                                 )
                              }
                              onClear={() =>
                                 handleTargetFieldChange("doctorNotes", "")
                              }
                              rows={2}
                              disabled={!canEdit}
                           />

                           <div className="flex items-center justify-center gap-2 flex-wrap">
                              <CustomButton
                                 type="button"
                                 onClick={handleSaveTreatmentTarget}
                                 isLoading={isUpdatingTarget}
                                 disabled={!canEdit}
                                 className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                 <Save className="w-3.5 h-3.5 mr-1" />
                                 Lưu mục tiêu
                              </CustomButton>
                              <CustomButton
                                 type="button"
                                 onClick={handleVerifyTreatmentTarget}
                                 isLoading={isVerifyingTarget}
                                 disabled={!canEdit}
                                 className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                 <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                 {treatmentTarget.status === "VERIFIED"
                                    ? "Phê duyệt lại"
                                    : "Phê duyệt"}
                              </CustomButton>
                              <button
                                 type="button"
                                 onClick={() => setTreatmentTarget(null)}
                                 className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
                                 title="Đóng mục tiêu điều trị"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                           </div>
                        </div>

                        {/* Lời khuyên và ghi chú */}
                        <div className="grid grid-cols-1 gap-4"></div>

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

                  <FormInput
                     type="date"
                     label="Ngày hẹn tái khám"
                     error={errors.nextAppointmentDate?.message}
                     {...register("nextAppointmentDate")}
                  />
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
               {/* Hủy (CANCELLED) */}
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

               {/* Lưu (IN_PROGRESS) */}
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

               {/* Lưu và hoàn thành (COMPLETED) */}
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
                  }}
               />

               <RiskAssessmentDetailModal
                  isOpen={isDetailModalOpen}
                  onClose={() => setIsDetailModalOpen(false)}
                  assessment={selectedRiskAssessment}
                  onEvaluate={() => setIsEvaluationModalOpen(true)}
               />
            </>
         )}
      </form>
   );
}
