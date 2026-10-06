"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
   useGetConsultationByIdQuery,
   useConsultAndResponseMutation,
} from "@/store/api/consultation/consultation-api";
import { Consultation } from "@/store/api/consultation/type";
import {
   useGetExaminationByIdQuery,
   useUpdateExaminationMutation,
} from "@/store/api/examination/examination-api";
import { Examination } from "@/store/api/examination/type";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, calculateAge, cn } from "@/lib/utils";
import { STATUS_CONFIG } from "./consultation-table";
import { computeWordDiff, DiffPart } from "@/lib/diff-utils";
import { CustomButton } from "@/components/common/custom-button";
import { FormInput } from "@/components/common/form-input";
import { FormNumberInput } from "@/components/common/form-number-input";
import { FormTextarea } from "@/components/common/form-textarea";
import { FormSelect } from "@/components/common/form-select";
import { CloverLoading } from "@/components/common/clover-loading";
import { Icd10SuggestInput } from "@/features/examination/components/icd10-suggest-input";
import {
   useGetStaffRiskAssessmentsQuery,
   useGetRiskAssessmentDetailQuery,
} from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { RiskAssessmentResult } from "@/store/api/risk-factor-assessment/type";
import { RiskAssessmentDetailModal } from "@/features/examination/components/risk-assessment-detail-modal";
import {
   RiskLevelBadge,
   getRiskLevelLabel,
   getRiskContainerClass,
   RISK_EXPLANATION_TEXT,
   formatRiskRate,
   checkHasUnderlyingDisease,
} from "@/components/common/risk-level-badge";
import {
   ArrowLeft,
   ArrowRight,
   Lock,
   RotateCcw,
   Save,
   Sparkles,
} from "lucide-react";

interface ConsultationDetailPageProps {
   consultationId: string;
}

interface FormState {
   reasonForVisit: string;
   clinicalSymptoms: string;
   assessmentInputId: string;
   diagnosis: string;
   icd10Code: string;
   systolicBp: number | null;
   diastolicBp: number | null;
   heartRate: number | null;
   temperature: number | null;
   spo2: number | null;
   respiratoryRate: number | null;
   nextAppointmentDate: string;
   // Treatment target
   bpTarget: string;
   lipidTarget: string;
   bmiTarget: string;
   glycemicTarget: string;
   renalTarget: string;
   dietAdvice: string;
   exerciseAdvice: string;
   smokingAdvice: string;
   doctorNotes: string;
   // Consultation conclusion
   conclusion: string;
}

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

function InlineFieldDiff({
   oldValue,
   newValue,
   isWordDiff = true,
   unit = "",
   onRevert,
}: {
   oldValue?: string | number | null;
   newValue?: string | number | null;
   isWordDiff?: boolean;
   unit?: string;
   onRevert?: () => void;
}) {
   const oldStr =
      oldValue === null || oldValue === undefined
         ? ""
         : String(oldValue).trim();
   const newStr =
      newValue === null || newValue === undefined
         ? ""
         : String(newValue).trim();

   if (oldStr === newStr) return null;

   if (!isWordDiff) {
      // Dạng chỉ số số / ngày tháng (Scalar)
      return (
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
               <span className="text-rose-600 line-through decoration-rose-500 font-medium text-[11px]">
                  {oldStr ? `${oldStr}${unit ? " " + unit : ""}` : "(Trống)"}
               </span>
               <span className="text-slate-400 font-bold">➔</span>
               <span className="text-emerald-700 font-bold text-[11px]">
                  {newStr
                     ? `${newStr}${unit ? " " + unit : ""}`
                     : "(Xóa trống)"}
               </span>
            </div>

            {onRevert && (
               <CustomButton
                  variant="ghost"
                  type="button"
                  onClick={onRevert}
                  className="h-6 text-rose-600 text-[11px] hover:text-rose-500 flex items-center gap-1 transition-colors"
                  title="Hoàn tác về bản gốc"
               >
                  <RotateCcw className="size-3" />
               </CustomButton>
            )}
         </div>
      );
   }

   // Dạng văn bản (Word diff)
   const parts: DiffPart[] = computeWordDiff(oldStr, newStr);

   return (
      <div className="text-xs leading-relaxed">
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
               <span className="text-rose-600 line-through decoration-rose-500">
                  Đỏ: Xóa
               </span>
               <span className="text-emerald-700 font-semibold">
                  Xanh: Thêm mới
               </span>
            </div>

            {onRevert && (
               <CustomButton
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={onRevert}
                  className="h-6 text-rose-600 hover:text-rose-500 text-[11px] flex items-center gap-1 transition-colors"
                  title="Hoàn tác trường này về bản gốc"
               >
                  <RotateCcw className="size-3" />
                  <span>Hoàn tác</span>
               </CustomButton>
            )}
         </div>

         <div className="whitespace-pre-wrap leading-relaxed text-xs">
            {parts.map((part, idx) => {
               if (part.type === "removed") {
                  return (
                     <span
                        key={idx}
                        className="text-rose-600 line-through decoration-rose-500 font-medium mx-0.5 inline-block"
                     >
                        {part.value}
                     </span>
                  );
               }
               if (part.type === "added") {
                  return (
                     <span
                        key={idx}
                        className="text-emerald-700 font-semibold mx-0.5 inline-block"
                     >
                        {part.value}
                     </span>
                  );
               }
               return (
                  <span key={idx} className="text-slate-800">
                     {part.value}
                  </span>
               );
            })}
         </div>
      </div>
   );
}

export function ConsultationDetailPage({
   consultationId,
}: ConsultationDetailPageProps) {
   const router = useRouter();

   // Query consultation details
   const {
      data: consultation,
      isLoading: isLoadingConsultation,
      refetch: refetchConsultation,
   } = useGetConsultationByIdQuery(consultationId, {
      skip: !consultationId,
   });

   const examinationId =
      consultation?.examinationId || consultation?.examination?.id || "";

   // Query related examination details
   const {
      data: examination,
      isLoading: isLoadingExamination,
      refetch: refetchExamination,
   } = useGetExaminationByIdQuery(examinationId, {
      skip: !examinationId,
   });

   if (isLoadingConsultation || (examinationId && isLoadingExamination)) {
      return (
         <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <CloverLoading
               size="lg"
               text="Đang tải phiếu hội chẩn & phiếu khám..."
            />
         </div>
      );
   }

   if (!consultation) {
      return (
         <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800">
               Không tìm thấy phiếu hội chẩn
            </h2>
            <CustomButton
               variant="outline"
               size="sm"
               onClick={() => router.push("/consultation")}
               className="mt-4"
            >
               <ArrowLeft className="size-4 mr-1.5" />
               Quay lại danh sách
            </CustomButton>
         </div>
      );
   }

   return (
      <ConsultationDetailContent
         key={`${consultation.id}-${examination?.id || ""}`}
         consultation={consultation}
         examination={examination}
         consultationId={consultationId}
         examinationId={examinationId}
         refetchConsultation={refetchConsultation}
         refetchExamination={refetchExamination}
      />
   );
}

function ConsultationDetailContent({
   consultation,
   examination,
   consultationId,
   examinationId,
   refetchConsultation,
   refetchExamination,
}: {
   consultation: Consultation;
   examination?: Examination;
   consultationId: string;
   examinationId: string;
   refetchConsultation: () => void;
   refetchExamination: () => void;
}) {
   const router = useRouter();
   const { user } = useAuth();

   // Mutations
   const [updateExamination, { isLoading: isUpdatingExam }] =
      useUpdateExaminationMutation();
   const [consultAndResponse, { isLoading: isRespondingConsultation }] =
      useConsultAndResponseMutation();

   const initialSnapshot: FormState = useMemo(() => {
      const target = examination?.treatmentTarget || {};
      return {
         reasonForVisit: examination?.reasonForVisit || "",
         clinicalSymptoms: examination?.clinicalSymptoms || "",
         assessmentInputId: examination?.assessmentInputId || "",
         diagnosis: examination?.diagnosis || "",
         icd10Code: examination?.icd10Code || "",
         systolicBp: examination?.systolicBp ?? null,
         diastolicBp: examination?.diastolicBp ?? null,
         heartRate: examination?.heartRate ?? null,
         temperature: examination?.temperature ?? null,
         spo2: examination?.spo2 ?? null,
         respiratoryRate: examination?.respiratoryRate ?? null,
         nextAppointmentDate: examination?.nextAppointmentDate || "",
         bpTarget: target.bpTarget || "",
         lipidTarget: target.lipidTarget || "",
         bmiTarget: target.bmiTarget || "",
         glycemicTarget: target.glycemicTarget || "",
         renalTarget: target.renalTarget || "",
         dietAdvice: target.dietAdvice || "",
         exerciseAdvice: target.exerciseAdvice || "",
         smokingAdvice: target.smokingAdvice || "",
         doctorNotes: target.doctorNotes || "",
         conclusion: consultation.conclusion || "",
      };
   }, [consultation, examination]);

   const [originalState, setOriginalState] =
      useState<FormState>(initialSnapshot);
   const [formState, setFormState] = useState<FormState>(initialSnapshot);

   const hasConclusion = Boolean(
      consultation.conclusion?.trim() ||
      consultation.status === "COMPLETED" ||
      consultation.status === "RESOLVED",
   );

   const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

   const healthProfileId =
      consultation.healthProfileId ||
      consultation.healthProfile?.id ||
      examination?.healthProfileId ||
      "";

   const {
      data: staffRiskAssessmentsData,
      isLoading: isLoadingRisk,
   } = useGetStaffRiskAssessmentsQuery(
      { healthProfileId, limit: 50 },
      { skip: !healthProfileId },
   );

   const riskAssessments: RiskAssessmentResult[] = useMemo(() => {
      if (!staffRiskAssessmentsData) return [];
      return (
         staffRiskAssessmentsData.data ||
         staffRiskAssessmentsData.items ||
         []
      );
   }, [staffRiskAssessmentsData]);

   const { data: detailRiskAssessment } = useGetRiskAssessmentDetailQuery(
      formState.assessmentInputId || "",
      {
         skip:
            !formState.assessmentInputId ||
            formState.assessmentInputId === "none",
      },
   );

   const selectedRiskAssessment = useMemo(() => {
      const currentId = formState.assessmentInputId;
      if (!currentId || currentId === "none") return null;
      return (
         riskAssessments.find(
            (a) =>
               a.id === currentId ||
               a.assessmentInputId === currentId ||
               a.assessmentInput?.id === currentId,
         ) ||
         detailRiskAssessment ||
         null
      );
   }, [formState.assessmentInputId, riskAssessments, detailRiskAssessment]);

   const riskAssessmentOptions = useMemo(() => {
      const opts: { value: string; label: string }[] = [
         { value: "none", label: "Không liên kết phân tầng nguy cơ" },
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

      const initialId = examination?.assessmentInputId;
      if (initialId && !opts.some((o) => o.value === initialId)) {
         opts.push({
            value: initialId,
            label: `Phiếu phân tầng đã liên kết (${initialId.slice(0, 8)}...)`,
         });
      }

      return opts;
   }, [riskAssessments, examination?.assessmentInputId]);

   const getAssessmentDiffLabel = (id?: string) => {
      if (!id || id === "none") return "Không liên kết";
      const found = riskAssessments.find(
         (a) =>
            a.id === id ||
            a.assessmentInputId === id ||
            a.assessmentInput?.id === id,
      );
      if (found) {
         const rate = formatRiskRate(
            found.riskScore,
            checkHasUnderlyingDisease(found),
         );
         return `${getRiskLevelLabel(found.riskLevel)} ${rate !== "—" ? `(${rate})` : ""}`;
      }
      return id.slice(0, 8);
   };

   // Compute changes count
   const changedFieldsCount = useMemo(() => {
      if (!originalState || hasConclusion) return 0;
      let count = 0;
      (Object.keys(formState) as (keyof FormState)[]).forEach((key) => {
         const oldV = originalState[key] ?? "";
         const newV = formState[key] ?? "";
         if (String(oldV).trim() !== String(newV).trim()) {
            count++;
         }
      });
      return count;
   }, [originalState, formState, hasConclusion]);

   const handleInputChange = (field: keyof FormState, value: unknown) => {
      if (hasConclusion) return;
      setFormState((prev) => ({
         ...prev,
         [field]: value,
      }));
   };

   // Revert single field
   const handleRevertField = useCallback(
      (field: keyof FormState) => {
         if (!originalState) return;
         setFormState((prev) => ({
            ...prev,
            [field]: originalState[field],
         }));
         toast.info(`Đã hoàn tác trường "${field}" về giá trị ban đầu`);
      },
      [originalState],
   );

   // Revert all
   const handleRevertAll = () => {
      if (!originalState) return;
      setFormState(originalState);
      toast.info(
         "Đã khôi phục tất cả các trường về giá trị gốc của phiếu khám",
      );
   };

   // Select reason suggestion
   const handleSelectReasonSuggestion = (suggestion: string) => {
      const current = formState.reasonForVisit || "";
      if (!current.trim()) {
         handleInputChange("reasonForVisit", suggestion);
      } else if (!current.includes(suggestion)) {
         handleInputChange(
            "reasonForVisit",
            `${current.trim()}, ${suggestion}`,
         );
      }
   };

   // Select appointment interval
   const handleSelectAppointmentInterval = (
      months: number,
      days: number = 0,
   ) => {
      const date = calculateFutureDate(months, days);
      handleInputChange("nextAppointmentDate", date);
   };

   // Save Examination changes
   const handleSaveExaminationChanges = async () => {
      if (hasConclusion) {
         toast.warn("Phiếu hội chẩn đã có kết luận, không thể sửa đổi.");
         return;
      }
      if (!examinationId) {
         toast.error("Không tìm thấy thông tin phiếu khám liên quan");
         return;
      }

      try {
         const treatmentTargetData = {
            bpTarget: formState.bpTarget || undefined,
            lipidTarget: formState.lipidTarget || undefined,
            bmiTarget: formState.bmiTarget || undefined,
            glycemicTarget: formState.glycemicTarget || undefined,
            renalTarget: formState.renalTarget || undefined,
            dietAdvice: formState.dietAdvice || undefined,
            exerciseAdvice: formState.exerciseAdvice || undefined,
            smokingAdvice: formState.smokingAdvice || undefined,
            doctorNotes: formState.doctorNotes || undefined,
         };

         await updateExamination({
            id: examinationId,
            body: {
               diagnosis: formState.diagnosis,
               icd10Code: formState.icd10Code || undefined,
               reasonForVisit: formState.reasonForVisit || undefined,
               clinicalSymptoms: formState.clinicalSymptoms || undefined,
               assessmentInputId:
                  formState.assessmentInputId === "none" ||
                  !formState.assessmentInputId
                     ? null
                     : formState.assessmentInputId,
               heartRate: formState.heartRate ?? 0,
               systolicBp: formState.systolicBp ?? 0,
               diastolicBp: formState.diastolicBp ?? 0,
               temperature: formState.temperature ?? 0,
               spo2: formState.spo2 ?? 0,
               respiratoryRate: formState.respiratoryRate ?? 0,
               nextAppointmentDate: formState.nextAppointmentDate || undefined,
               treatmentTargetData,
            },
         }).unwrap();

         toast.success("Cập nhật thay đổi phiếu khám thành công!");
         setOriginalState((prev) => ({ ...prev, ...formState }));
         refetchExamination();
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(
            error.data?.message || "Không thể cập nhật thông tin phiếu khám",
         );
      }
   };

   // Save Conclusion & Complete Consultation
   const handleSaveConclusion = async () => {
      if (hasConclusion) {
         toast.warn("Phiếu hội chẩn đã có kết luận, không thể sửa đổi.");
         return;
      }
      if (!consultationId) return;

      if (!formState.conclusion.trim()) {
         toast.error("Vui lòng nhập kết luận / ý kiến hội chẩn của chuyên gia");
         return;
      }

      try {
         if (changedFieldsCount > 0) {
            await handleSaveExaminationChanges();
         }

         await consultAndResponse({
            id: consultationId,
            body: {
               conclusion: formState.conclusion.trim(),
            },
         }).unwrap();

         toast.success("Lưu kết luận hội chẩn và hoàn tất thành công!");
         setOriginalState((prev) => ({
            ...prev,
            conclusion: formState.conclusion.trim(),
         }));
         refetchConsultation();
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(
            error.data?.message || "Không thể cập nhật kết luận hội chẩn",
         );
      }
   };

   const patient =
      consultation.healthProfile ||
      examination?.healthProfile ||
      consultation.examination?.healthProfile;

   const requestingDoctor =
      consultation.requestingDoctor ||
      examination?.doctor ||
      consultation.examination?.doctor;

   const expertDoctor =
      consultation.expertDoctor ||
      (user?.fullName ? { fullName: user.fullName } : null);

   const statusConfig = STATUS_CONFIG[consultation.status] || {
      label: consultation.status,
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
   };

   return (
      <div className="space-y-4">
         {/* Top Header Card */}
         <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
               <CustomButton
                  type="button"
                  size="sm"
                  onClick={() => router.push("/consultation")}
                  className="h-8.5 px-3 text-xs w-fit"
               >
                  <ArrowLeft className="size-4 mr-1.5" />
                  Danh sách hội chẩn
               </CustomButton>
               <div className="flex items-center gap-3">
                  <div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-base font-bold text-slate-900">
                           Hội chẩn:{" "}
                           {consultation.consultationCode ||
                              consultation.id.slice(0, 8)}
                        </h1>
                        <span
                           className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border",
                              statusConfig.bg,
                              statusConfig.text,
                              statusConfig.border,
                           )}
                        >
                           {statusConfig.label}
                        </span>
                        {changedFieldsCount > 0 && (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">
                              <Sparkles className="size-3 text-amber-600" />
                              {changedFieldsCount} trường đã chỉnh sửa
                           </span>
                        )}
                     </div>
                     <p className="text-xs text-slate-500 mt-0.5 flex items-center flex-wrap">
                        BS gửi:{" "}
                        <strong>
                           {requestingDoctor?.fullName || "Bác sĩ điều trị"}
                        </strong>
                        <span className="mx-2">
                           <ArrowRight className="size-3" />
                        </span>
                        BS hội chẩn:{" "}
                        <strong className="text-blue-700">
                           {expertDoctor?.fullName || "Chuyên gia"}
                        </strong>
                        <span className="mx-2">|</span>
                        Gửi lúc:{" "}
                        {formatDate(
                           consultation.requestedAt || consultation.createdAt,
                           true,
                        )}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* 2-Column Grid: Cột trái = Phiếu khám, Cột phải = Kết luận & Thông tin hội chẩn */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* CỘT TRÁI (Left): Phiếu khám bệnh */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-5">
               <div className="bg-white rounded-sm border border-slate-200 p-5 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                     <div>
                        <h2 className="text-base font-bold text-slate-900">
                           Nội dung Phiếu khám bệnh
                        </h2>
                        <p className="text-xs text-slate-500">
                           Bác sĩ chuyên gia có thể chỉnh sửa trực tiếp. Thay
                           đổi sẽ hiển thị trực quan (xóa màu đỏ gạch giữa, thêm
                           mới màu xanh) ngay bên dưới mỗi trường.
                        </p>
                     </div>
                  </div>
                  {/* Header Actions */}
                  {hasConclusion ? (
                     <div className="flex items-center gap-2 p-2.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs w-full">
                        <Lock className="size-4 shrink-0 text-emerald-600" />
                        <span>Phiếu hội chẩn đã có kết luận chính thức. Dữ liệu phiếu khám và kết luận đã được khóa, không thể chỉnh sửa.</span>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 justify-end flex-wrap">
                        {changedFieldsCount > 0 && (
                           <span className="text-xs text-center font-semibold text-emerald-700">
                              ( Đã chỉnh sửa {changedFieldsCount} mục )
                           </span>
                        )}
                        {changedFieldsCount > 0 && (
                           <CustomButton
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRevertAll}
                              className="h-9 px-3 text-xs"
                           >
                              <RotateCcw className="size-3.5 mr-1" />
                              Khôi phục tất cả
                           </CustomButton>
                        )}
                        <CustomButton
                           type="button"
                           size="sm"
                           onClick={handleSaveExaminationChanges}
                           isLoading={isUpdatingExam}
                           disabled={changedFieldsCount === 0}
                           className="h-9 px-3.5 text-xs"
                        >
                           <Save className="size-3.5 mr-1.5" />
                           Lưu sửa đổi
                        </CustomButton>
                     </div>
                  )}

                  <fieldset disabled={hasConclusion} className="space-y-6 disabled:opacity-90">

                  {/* PHẦN 1: THÔNG TIN KHÁM */}
                  <div className="space-y-3">
                     <h3 className="text-sm font-bold text-slate-800">
                        1. Thông tin khám & Phân tầng nguy cơ
                     </h3>

                     <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 border rounded-sm border-slate-200 space-y-1">
                           <div className="flex items-center justify-between">
                              <span className="text-slate-500 text-[11px]">
                                 Bệnh nhân:
                              </span>
                              <span className="font-bold text-slate-900">
                                 {patient?.fullName || "—"}
                              </span>
                           </div>
                           <div className="flex items-center justify-between text-slate-600 text-[11px]">
                              <span>Giới tính: {patient?.gender || "—"}</span>
                              {patient?.dob && (
                                 <span>
                                    Tuổi: {calculateAge(patient.dob) ?? "—"}
                                 </span>
                              )}
                           </div>
                           {patient?.hospitalPatientCode && (
                              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                                 <span>Mã:</span>
                                 <span className="font-mono">
                                    {patient.hospitalPatientCode}
                                 </span>
                              </div>
                           )}
                           {patient?.phoneNumber && (
                              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                                 <span>SĐT:</span>
                                 <span>{patient.phoneNumber}</span>
                              </div>
                           )}
                        </div>
                        {/* Lý do đến khám */}
                        <div className="flex flex-col gap-1">
                           <FormInput
                              label="Lý do đến khám"
                              placeholder="Ví dụ: Đau đầu, mệt mỏi, ho sốt..."
                              value={formState.reasonForVisit}
                              onChange={(e) =>
                                 handleInputChange(
                                    "reasonForVisit",
                                    e.target.value,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
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
                                    className="px-2 py-0.5 shadow-xs text-xs rounded-sm border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer text-slate-700"
                                 >
                                    {item}
                                 </button>
                              ))}
                           </div>
                           {/* Diff trực tiếp Lý do đến khám */}
                           <InlineFieldDiff
                              oldValue={originalState?.reasonForVisit}
                              newValue={formState.reasonForVisit}
                              isWordDiff={true}
                              onRevert={() =>
                                 handleRevertField("reasonForVisit")
                              }
                           />
                        </div>

                        {/* Triệu chứng lâm sàng */}
                        <div className="flex flex-col gap-1">
                           <FormTextarea
                              label="Triệu chứng lâm sàng"
                              placeholder="Mô tả chi tiết các triệu chứng, tiền sử khởi phát..."
                              rows={3}
                              value={formState.clinicalSymptoms}
                              onChange={(e) =>
                                 handleInputChange(
                                    "clinicalSymptoms",
                                    e.target.value,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           {/* Diff trực tiếp Triệu chứng lâm sàng */}
                           <InlineFieldDiff
                              oldValue={originalState?.clinicalSymptoms}
                              newValue={formState.clinicalSymptoms}
                              isWordDiff={true}
                              onRevert={() =>
                                 handleRevertField("clinicalSymptoms")
                              }
                           />
                        </div>

                        {/* Phân tầng yếu tố nguy cơ tim mạch */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                           <FormSelect
                              label="Phiếu phân tầng nguy cơ tim mạch liên kết"
                              placeholder={
                                 isLoadingRisk
                                    ? "Đang tải danh sách phân tầng..."
                                    : riskAssessments.length === 0
                                      ? "Bệnh nhân chưa có phiếu phân tầng nguy cơ nào"
                                      : "Chọn phiếu phân tầng nguy cơ"
                              }
                              options={riskAssessmentOptions}
                              value={formState.assessmentInputId || "none"}
                              defaultValue="none"
                              onValueChange={(val) =>
                                 handleInputChange(
                                    "assessmentInputId",
                                    val === "none" ? "" : val,
                                 )
                              }
                              disabled={hasConclusion || isLoadingRisk}
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={getAssessmentDiffLabel(
                                 originalState?.assessmentInputId,
                              )}
                              newValue={getAssessmentDiffLabel(
                                 formState.assessmentInputId,
                              )}
                              isWordDiff={false}
                              onRevert={() =>
                                 handleRevertField("assessmentInputId")
                              }
                           />

                           {selectedRiskAssessment && (
                              <div
                                 className={cn(
                                    "p-4 rounded-sm border flex flex-col gap-2.5 text-xs mt-1",
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
                                    * Phân tầng yếu tố nguy cơ theo thang điểm Score
                                    2; Score-OP; Score-dia được Khuyến cáo của hiệp
                                    hội tim mạch châu Âu ESC
                                 </p>

                                 <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200/60">
                                    {selectedRiskAssessment.doctorId ? (
                                       <div className="text-slate-600 flex flex-col gap-0.5">
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
                                       </div>
                                    ) : (
                                       <span className="font-medium text-amber-600">
                                          Chưa được xác nhận bởi bác sĩ
                                       </span>
                                    )}
                                    <CustomButton
                                       type="button"
                                       size="sm"
                                       onClick={() => setIsRiskModalOpen(true)}
                                       className="h-8 px-3 text-xs ml-auto"
                                    >
                                       Xem chi tiết phân tầng
                                    </CustomButton>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* PHẦN 2: CHỈ SỐ SINH TỒN */}
                  <div className="space-y-3 pt-2">
                     <h3 className="text-sm font-bold text-slate-800">
                        2. Chỉ số sinh tồn (Sinh hiệu)
                     </h3>

                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Huyết áp tâm thu */}
                        <div>
                           <FormNumberInput
                              label="H/áp tâm thu (mmHg)"
                              placeholder="120"
                              value={formState.systolicBp ?? ""}
                              onValueChange={(val) =>
                                 handleInputChange(
                                    "systolicBp",
                                    val.floatValue ?? null,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.systolicBp}
                              newValue={formState.systolicBp}
                              isWordDiff={false}
                              unit="mmHg"
                              onRevert={() => handleRevertField("systolicBp")}
                           />
                        </div>

                        {/* Huyết áp tâm trương */}
                        <div>
                           <FormNumberInput
                              label="H/áp tâm trương (mmHg)"
                              placeholder="80"
                              value={formState.diastolicBp ?? ""}
                              onValueChange={(val) =>
                                 handleInputChange(
                                    "diastolicBp",
                                    val.floatValue ?? null,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.diastolicBp}
                              newValue={formState.diastolicBp}
                              isWordDiff={false}
                              unit="mmHg"
                              onRevert={() => handleRevertField("diastolicBp")}
                           />
                        </div>

                        {/* Mạch */}
                        <div>
                           <FormNumberInput
                              label="Mạch (lần/phút)"
                              placeholder="75"
                              value={formState.heartRate ?? ""}
                              onValueChange={(val) =>
                                 handleInputChange(
                                    "heartRate",
                                    val.floatValue ?? null,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.heartRate}
                              newValue={formState.heartRate}
                              isWordDiff={false}
                              unit="bpm"
                              onRevert={() => handleRevertField("heartRate")}
                           />
                        </div>

                        {/* Thân nhiệt */}
                        <div>
                           <FormNumberInput
                              label="Nhiệt độ (°C)"
                              placeholder="36.5"
                              value={formState.temperature ?? ""}
                              onValueChange={(val) =>
                                 handleInputChange(
                                    "temperature",
                                    val.floatValue ?? null,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.temperature}
                              newValue={formState.temperature}
                              isWordDiff={false}
                              unit="°C"
                              onRevert={() => handleRevertField("temperature")}
                           />
                        </div>

                        {/* SpO2 */}
                        <div>
                           <FormNumberInput
                              label="SpO2 (%)"
                              placeholder="98"
                              value={formState.spo2 ?? ""}
                              onValueChange={(val) =>
                                 handleInputChange(
                                    "spo2",
                                    val.floatValue ?? null,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.spo2}
                              newValue={formState.spo2}
                              isWordDiff={false}
                              unit="%"
                              onRevert={() => handleRevertField("spo2")}
                           />
                        </div>

                        {/* Nhịp thở */}
                        <div>
                           <FormNumberInput
                              label="Nhịp thở (lần/phút)"
                              placeholder="16"
                              value={formState.respiratoryRate ?? ""}
                              onValueChange={(val) =>
                                 handleInputChange(
                                    "respiratoryRate",
                                    val.floatValue ?? null,
                                 )
                              }
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.respiratoryRate}
                              newValue={formState.respiratoryRate}
                              isWordDiff={false}
                              unit="lần/phút"
                              onRevert={() =>
                                 handleRevertField("respiratoryRate")
                              }
                           />
                        </div>
                     </div>
                  </div>

                  {/* PHẦN 3: CHẨN ĐOÁN & ĐIỀU TRỊ */}
                  <div className="space-y-3 pt-2">
                     <h3 className="text-sm font-bold text-slate-800">
                        3. Chẩn đoán & Điều trị
                     </h3>

                     <div className="grid grid-cols-1 gap-4">
                        {/* Chẩn đoán */}
                        <div className="flex flex-col gap-1">
                           <FormTextarea
                              label="Chẩn đoán xác định"
                              placeholder="Ví dụ: Tăng huyết áp độ 1, Rối loạn lipid máu..."
                              rows={2}
                              value={formState.diagnosis}
                              onChange={(e) =>
                                 handleInputChange("diagnosis", e.target.value)
                              }
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.diagnosis}
                              newValue={formState.diagnosis}
                              isWordDiff={true}
                              onRevert={() => handleRevertField("diagnosis")}
                           />
                        </div>

                        {/* Mã bệnh ICD-10 */}
                        <div className="flex flex-col gap-1">
                           <Icd10SuggestInput
                              label="Mã bệnh (ICD-10)"
                              placeholder="Nhập mã hoặc tên bệnh (VD: I10, E11, tăng huyết áp...)"
                              value={formState.icd10Code}
                              onChange={(e) =>
                                 handleInputChange("icd10Code", e.target.value)
                              }
                              onSelectDisease={(disease) => {
                                 handleInputChange("icd10Code", disease.code);
                                 if (!formState.diagnosis) {
                                    handleInputChange(
                                       "diagnosis",
                                       disease.name,
                                    );
                                 }
                              }}
                              onClear={() => handleInputChange("icd10Code", "")}
                              className="text-xs bg-white"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.icd10Code}
                              newValue={formState.icd10Code}
                              isWordDiff={false}
                              onRevert={() => handleRevertField("icd10Code")}
                           />
                        </div>
                     </div>
                  </div>

                  {/* PHẦN 4: MỤC TIÊU ĐIỀU TRỊ & LỜI DẶN DÒ CỦA BÁC SĨ */}
                  <div className="space-y-3 pt-2">
                     <h3 className="text-sm font-bold text-slate-800">
                        4. Mục tiêu điều trị & Lời dặn dò của bác sĩ
                     </h3>

                     <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-sm text-xs text-blue-800 font-medium leading-relaxed">
                        Mục tiêu điều trị căn cứ theo khuyến cáo hiệp hội tim
                        mạch châu Âu ESC; hiệp hội đái tháo đường Mỹ
                     </div>

                     {/* Hiển thị toàn bộ theo hàng dọc (grid-cols-1) giống form khám */}
                     <div className="grid grid-cols-1 gap-3">
                        {/* 1. Huyết áp mục tiêu */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-rose-50/70 border-rose-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-rose-900">
                              Huyết áp mục tiêu
                           </label>
                           <FormTextarea
                              placeholder="VD: < 130/80 mmHg"
                              value={formState.bpTarget}
                              onChange={(e) =>
                                 handleInputChange("bpTarget", e.target.value)
                              }
                              rows={2}
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.bpTarget}
                              newValue={formState.bpTarget}
                              isWordDiff={false}
                              onRevert={() => handleRevertField("bpTarget")}
                           />
                        </div>

                        {/* 2. Lipid máu mục tiêu */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-amber-50/70 border-amber-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-amber-900">
                              Lipid máu mục tiêu
                           </label>
                           <FormTextarea
                              placeholder="VD: LDL-C < 1.4 mmol/L"
                              value={formState.lipidTarget}
                              onChange={(e) =>
                                 handleInputChange(
                                    "lipidTarget",
                                    e.target.value,
                                 )
                              }
                              rows={2}
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.lipidTarget}
                              newValue={formState.lipidTarget}
                              isWordDiff={false}
                              onRevert={() => handleRevertField("lipidTarget")}
                           />
                        </div>

                        {/* 3. BMI mục tiêu */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-emerald-50/70 border-emerald-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-emerald-900">
                              BMI mục tiêu
                           </label>
                           <FormTextarea
                              placeholder="VD: 18.5 - 22.9 kg/m²"
                              value={formState.bmiTarget}
                              onChange={(e) =>
                                 handleInputChange("bmiTarget", e.target.value)
                              }
                              rows={2}
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.bmiTarget}
                              newValue={formState.bmiTarget}
                              isWordDiff={false}
                              onRevert={() => handleRevertField("bmiTarget")}
                           />
                        </div>

                        {/* 4. Đường huyết mục tiêu */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-purple-50/70 border-purple-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-purple-900">
                              Đường huyết mục tiêu
                           </label>
                           <FormTextarea
                              placeholder="VD: HbA1c < 7.0%"
                              value={formState.glycemicTarget}
                              onChange={(e) =>
                                 handleInputChange(
                                    "glycemicTarget",
                                    e.target.value,
                                 )
                              }
                              rows={2}
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.glycemicTarget}
                              newValue={formState.glycemicTarget}
                              isWordDiff={false}
                              onRevert={() =>
                                 handleRevertField("glycemicTarget")
                              }
                           />
                        </div>

                        {/* 5. Chức năng thận mục tiêu */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-sky-50/70 border-sky-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-sky-900">
                              Chức năng thận mục tiêu
                           </label>
                           <FormTextarea
                              placeholder="VD: eGFR > 60 mL/min"
                              value={formState.renalTarget}
                              onChange={(e) =>
                                 handleInputChange(
                                    "renalTarget",
                                    e.target.value,
                                 )
                              }
                              rows={2}
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.renalTarget}
                              newValue={formState.renalTarget}
                              isWordDiff={false}
                              onRevert={() => handleRevertField("renalTarget")}
                           />
                        </div>

                        {/* 6. Tư vấn lối sống & Dinh dưỡng */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-teal-50/70 border-teal-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-teal-900">
                              Tư vấn lối sống & Dinh dưỡng
                           </label>
                           <FormTextarea
                              placeholder="Chế độ ăn giảm muối, hạn chế dầu mỡ..."
                              rows={2}
                              value={formState.dietAdvice}
                              onChange={(e) =>
                                 handleInputChange("dietAdvice", e.target.value)
                              }
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.dietAdvice}
                              newValue={formState.dietAdvice}
                              isWordDiff={true}
                              onRevert={() => handleRevertField("dietAdvice")}
                           />
                        </div>

                        {/* 7. Tư vấn vận động & Thể lực */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-blue-50/70 border-blue-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-blue-900">
                              Tư vấn vận động & Thể lực
                           </label>
                           <FormTextarea
                              placeholder="Đi bộ nhanh 30 phút/ngày..."
                              rows={2}
                              value={formState.exerciseAdvice}
                              onChange={(e) =>
                                 handleInputChange(
                                    "exerciseAdvice",
                                    e.target.value,
                                 )
                              }
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.exerciseAdvice}
                              newValue={formState.exerciseAdvice}
                              isWordDiff={true}
                              onRevert={() =>
                                 handleRevertField("exerciseAdvice")
                              }
                           />
                        </div>

                        {/* 8. Tư vấn cai thuốc lá */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-orange-50/70 border-orange-200/90">
                           <label className="text-xs font-semibold block mb-1.5 text-orange-900">
                              Tư vấn cai thuốc lá / Rượu bia
                           </label>
                           <FormTextarea
                              placeholder="Cai thuốc lá hoàn toàn, hạn chế rượu bia..."
                              rows={2}
                              value={formState.smokingAdvice}
                              onChange={(e) =>
                                 handleInputChange(
                                    "smokingAdvice",
                                    e.target.value,
                                 )
                              }
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.smokingAdvice}
                              newValue={formState.smokingAdvice}
                              isWordDiff={true}
                              onRevert={() =>
                                 handleRevertField("smokingAdvice")
                              }
                           />
                        </div>

                        {/* 9. Ghi chú của bác sĩ */}
                        <div className="p-3 rounded-sm border transition-all shadow-2xs bg-slate-50 border-slate-300">
                           <label className="text-xs font-semibold block mb-1.5 text-slate-800">
                              Ghi chú của bác sĩ
                           </label>
                           <FormTextarea
                              placeholder="Ghi chú thêm về mục tiêu điều trị..."
                              rows={2}
                              value={formState.doctorNotes}
                              onChange={(e) =>
                                 handleInputChange(
                                    "doctorNotes",
                                    e.target.value,
                                 )
                              }
                              className="text-xs bg-white border-slate-200"
                           />
                           <InlineFieldDiff
                              oldValue={originalState?.doctorNotes}
                              newValue={formState.doctorNotes}
                              isWordDiff={true}
                              onRevert={() => handleRevertField("doctorNotes")}
                           />
                        </div>
                     </div>
                  </div>

                  {/* PHẦN 5: HẸN TÁI KHÁM */}
                  <div className="space-y-3 pt-2">
                     <h3 className="text-sm font-bold text-slate-800">
                        5. Kế hoạch & Hẹn tái khám
                     </h3>

                     <div className="flex flex-col gap-1.5">
                        <FormInput
                           type="date"
                           label="Ngày hẹn tái khám"
                           value={formState.nextAppointmentDate}
                           onChange={(e) =>
                              handleInputChange(
                                 "nextAppointmentDate",
                                 e.target.value,
                              )
                           }
                           className="text-xs bg-white"
                        />
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
                                 className="px-2 py-0.5 shadow-xs text-xs rounded-sm border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors cursor-pointer text-slate-700"
                              >
                                 {item.label}
                              </button>
                           ))}
                        </div>
                        <InlineFieldDiff
                           oldValue={originalState?.nextAppointmentDate}
                           newValue={formState.nextAppointmentDate}
                           isWordDiff={false}
                           onRevert={() =>
                              handleRevertField("nextAppointmentDate")
                           }
                        />
                     </div>
                  </div>
                  </fieldset>
               </div>
            </div>

            {/* CỘT PHẢI (Right): Kết luận & Thông tin hội chẩn (Sticky) */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-1">
               {/* 1. KHỐI KẾT LUẬN & Ý KIẾN CHUYÊN GIA HỘI CHẨN */}
               <div className="bg-white rounded-sm border p-4 shadow-sm space-y-3">
                  <div className="bg-blue-50/50 rounded-sm border border-blue-200 p-3.5 shadow-2xs space-y-2">
                     <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                        <span className="text-blue-900 font-semibold text-xs">
                           Lý do & Vấn đề cần hội chẩn:
                        </span>
                        <span className="text-[11px] text-slate-500">
                           {formatDate(
                              consultation.requestedAt ||
                                 consultation.createdAt,
                              true,
                           )}
                        </span>
                     </div>
                     <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white/95 p-3 rounded-sm border border-blue-100 whitespace-pre-wrap">
                        {consultation.reason || "Không có lý do chi tiết"}
                     </p>
                  </div>
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                     <span className="text-emerald-900 font-bold text-sm">
                        Ý kiến & Kết luận của Chuyên gia:
                     </span>
                     {!hasConclusion ? (
                        <CustomButton
                           type="button"
                           size="sm"
                           onClick={handleSaveConclusion}
                           isLoading={isRespondingConsultation}
                           className="h-7.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                           Lưu kết luận
                        </CustomButton>
                     ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                           <Lock className="size-3" />
                           Đã hoàn thành
                        </span>
                     )}
                  </div>

                  {hasConclusion ? (
                     <div className="space-y-2">
                        <p className="text-xs text-slate-900 font-medium whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-sm border border-emerald-200">
                           {consultation.conclusion}
                        </p>
                        {consultation.respondedAt && (
                           <p className="text-[11px] text-slate-500 text-right">
                              Thời gian phản hồi:{" "}
                              {formatDate(consultation.respondedAt, true)}
                           </p>
                        )}
                     </div>
                  ) : (
                     <>
                        <FormTextarea
                           name="conclusion"
                           value={formState.conclusion}
                           onChange={(e) =>
                              handleInputChange("conclusion", e.target.value)
                           }
                           rows={6}
                           placeholder="Nhập ý kiến chuyên môn, đánh giá nguy cơ, phác đồ điều trị khuyến nghị cho bệnh nhân..."
                           className="text-xs bg-white"
                           required
                        />
                        <CustomButton
                           type="button"
                           size="sm"
                           onClick={handleSaveConclusion}
                           isLoading={isRespondingConsultation}
                           className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                        >
                           Hoàn thành hội chẩn & Lưu kết luận
                        </CustomButton>
                     </>
                  )}
               </div>
            </div>
         </div>
         <RiskAssessmentDetailModal
            assessment={selectedRiskAssessment}
            isOpen={isRiskModalOpen}
            onClose={() => setIsRiskModalOpen(false)}
         />
      </div>
   );
}
