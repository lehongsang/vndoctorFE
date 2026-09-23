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
import { cn } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";

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

const examinationSchema = z.object({
   assessmentInputId: z.string().optional(),
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

   const { data: riskAssessmentData, isLoading: isLoadingRisk } =
      useGetStaffRiskAssessmentsQuery(
         { healthProfileId, limit: 50 },
         { skip: !healthProfileId },
      );

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
         const dateStr =
            item.createdAt || item.assessmentInput?.assessmentDate;
         let formattedDate = "";
         if (dateStr) {
            try {
               const d = new Date(dateStr);
               if (!isNaN(d.getTime())) {
                  formattedDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
               }
            } catch {
               formattedDate = dateStr;
            }
         }
         const scoreStr = item.riskScore ? ` (Điểm: ${item.riskScore}%)` : "";
         const label = `${formattedDate ? `[${formattedDate}] ` : ""}${getRiskLevelLabel(item.riskLevel)}${scoreStr}`;

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
      return (
         riskAssessments.find(
            (a) =>
               (a.assessmentInputId || a.assessmentInput?.id || a.id) ===
               watchedAssessmentInputId,
         ) || null
      );
   }, [watchedAssessmentInputId, riskAssessments]);

   const handleApplyVitalsFromAssessment = () => {
      const input = selectedRiskAssessment?.assessmentInput;
      if (!input) {
         toast.warning(
            "Phiếu phân tầng này không có dữ liệu chỉ số sinh tồn.",
         );
         return;
      }
      if (input.systolicBp != null)
         setValue("systolicBp", Number(input.systolicBp));
      if (input.diastolicBp != null)
         setValue("diastolicBp", Number(input.diastolicBp));
      if (input.heightCm != null)
         setValue("heightCm", Number(input.heightCm));
      if (input.weightKg != null)
         setValue("weightKg", Number(input.weightKg));
      if (input.bmi != null)
         setValue("bmi", Number(input.bmi));
      toast.info("Đã điền các chỉ số sinh tồn từ phiếu phân tầng nguy cơ!");
   };

   useEffect(() => {
      if (initialData) {
         reset({
            assessmentInputId: initialData.assessmentInputId || "",
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
         if (isEditing && initialData?.id) {
            const result = await updateExamination({
               id: initialData.id,
               body: {
                  ...values,
                  assessmentInputId: finalAssessmentInputId,
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
                  ? "Đã hoàn thành lượt khám!"
                  : finalStatus === "CANCELLED"
                    ? "Đã hủy lượt khám!"
                    : "Cập nhật phiếu khám thành công!";
            toast.success(message);
            onSuccess?.(result);
         } else {
            const result = await createExamination({
               healthProfileId,
               facilityId: user?.facilityId || "",
               assessmentInputId: finalAssessmentInputId,
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
                    : "Tạo phiếu khám mới thành công!";
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
                                 isLoadingRisk
                                    ? "Đang tải danh sách phân tầng..."
                                    : riskAssessments.length === 0
                                      ? "Bệnh nhân chưa có phiếu phân tầng nguy cơ nào"
                                      : "Chọn phiếu phân tầng nguy cơ"
                              }
                              options={riskAssessmentOptions}
                              value={field.value || "none"}
                              onValueChange={(val) => {
                                 field.onChange(val === "none" ? "" : val);
                              }}
                              disabled={!canEdit || isLoadingRisk}
                              error={errors.assessmentInputId?.message}
                           />
                        )}
                     />

                     {selectedRiskAssessment && (
                        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 flex flex-col gap-2 text-xs">
                           <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                 <span className="font-semibold text-slate-700">
                                    Mức nguy cơ:
                                 </span>
                                 <span
                                    className={cn(
                                       "px-2.5 py-0.5 rounded-full text-xs font-semibold",
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
                                       (Điểm: {selectedRiskAssessment.riskScore}%)
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

                           {selectedRiskAssessment.conclusion && (
                              <div className="text-slate-600 line-clamp-2">
                                 <span className="font-medium text-slate-700">
                                    Kết luận:{" "}
                                 </span>
                                 {selectedRiskAssessment.conclusion}
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

                  <FormInput
                     label="Mã bệnh (ICD-10)"
                     placeholder="Ví dụ: I10, E11..."
                     error={errors.icd10Code?.message}
                     {...register("icd10Code")}
                  />

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
         <div className="sticky bottom-0 right-0 bg-white flex flex-wrap items-center justify-end gap-3">
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
      </form>
   );
}
