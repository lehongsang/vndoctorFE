"use client";

import { useState, useMemo } from "react";
import { Examination } from "@/store/api/examination/type";
import { HealthProfile } from "@/store/api/health-profile/type";
import { CustomButton } from "@/components/common/custom-button";
import { useGetExaminationByIdQuery } from "@/store/api/examination/examination-api";
import {
   useGetTreatmentTargetByIdQuery,
   useGetTreatmentTargetByAccessmentIdQuery,
} from "@/store/api/treatment-target/treatment-target-api";
import { useGetRiskAssessmentDetailQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { RiskAssessmentDetailModal } from "./risk-assessment-detail-modal";
import { cn } from "@/lib/utils";

export interface ExaminationDetailProps {
   examination: Examination;
   healthProfile?: HealthProfile;
   onEdit?: () => void;
   onClose?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
   IN_PROGRESS: {
      label: "Đang khám",
      className: "bg-amber-50 text-amber-800 border-amber-300",
   },
   COMPLETED: {
      label: "Hoàn thành",
      className: "bg-emerald-50 text-emerald-800 border-emerald-300",
   },
   CANCELLED: {
      label: "Đã hủy",
      className: "bg-rose-50 text-rose-800 border-rose-300",
   },
};

const formatDate = (dateStr?: string, includeTime: boolean = false) => {
   if (!dateStr) return "—";
   try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      if (!includeTime) return `${day}/${month}/${year}`;
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
   } catch {
      return dateStr;
   }
};

const getAge = (dobStr?: string) => {
   if (!dobStr) return null;
   try {
      const birth = new Date(dobStr);
      if (isNaN(birth.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return age > 0 ? age : null;
   } catch {
      return null;
   }
};

const getBpCategory = (systolic?: number | null, diastolic?: number | null) => {
   if (!systolic || !diastolic) return null;
   if (systolic < 120 && diastolic < 80)
      return {
         label: "Tối ưu",
         className: "text-emerald-800 bg-emerald-50 border-emerald-300",
      };
   if (systolic <= 129 && diastolic <= 84)
      return {
         label: "Bình thường",
         className: "text-emerald-800 bg-emerald-50 border-emerald-300",
      };
   if (systolic <= 139 || diastolic <= 89)
      return {
         label: "Tiền tăng HA",
         className: "text-amber-800 bg-amber-50 border-amber-300",
      };
   if (systolic <= 159 || diastolic <= 99)
      return {
         label: "Tăng HA độ 1",
         className: "text-rose-800 bg-rose-50 border-rose-300",
      };
   return {
      label: "Tăng HA độ 2+",
      className: "text-rose-900 bg-rose-100 border-rose-400",
   };
};

const getBmiCategory = (bmi?: number | null) => {
   if (!bmi || bmi <= 0) return null;
   if (bmi < 18.5)
      return {
         label: "Gầy",
         className: "text-amber-800 bg-amber-50 border-amber-300",
      };
   if (bmi < 23)
      return {
         label: "Bình thường",
         className: "text-emerald-800 bg-emerald-50 border-emerald-300",
      };
   if (bmi < 25)
      return {
         label: "Thừa cân",
         className: "text-amber-800 bg-amber-50 border-amber-300",
      };
   return {
      label: "Béo phì",
      className: "text-rose-800 bg-rose-50 border-rose-300",
   };
};

const getRiskLevelLabel = (level?: string) => {
   switch (level) {
      case "VERY_HIGH":
         return "Nguy cơ rất cao";
      case "HIGH":
         return "Nguy cơ cao";
      case "MODERATE":
         return "Nguy cơ trung bình";
      case "LOW":
         return "Nguy cơ thấp";
      default:
         return level || "Chưa xác định";
   }
};

const getCustomTargetEntries = (
   raw?: Record<string, string> | { [key: string]: string }[],
): { key: string; label: string; value: string }[] => {
   if (!raw) return [];
   const entries: { key: string; label: string; value: string }[] = [];
   const labelMap: Record<string, string> = {
      uricAcid: "Acid Uric",
      restingHeartRate: "Nhịp tim khi nghỉ",
      triglyceride: "Triglyceride",
      microalbumin: "Microalbumin niệu",
   };

   if (Array.isArray(raw)) {
      raw.forEach((item) => {
         if (item && typeof item === "object") {
            Object.entries(item).forEach(([k, v]) => {
               if (k) {
                  entries.push({
                     key: k,
                     label: labelMap[k] || k,
                     value: String(v ?? "—"),
                  });
               }
            });
         }
      });
   } else if (typeof raw === "object") {
      Object.entries(raw).forEach(([k, v]) => {
         if (k) {
            entries.push({
               key: k,
               label: labelMap[k] || k,
               value: String(v ?? "—"),
            });
         }
      });
   }
   return entries;
};

const InfoRow = ({
   label,
   value,
   className,
   valueClassName,
}: {
   label: string;
   value?: React.ReactNode;
   className?: string;
   valueClassName?: string;
}) => (
   <div className={cn("flex flex-col gap-1 p-4 border rounded-sm", className)}>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <div
         className={cn(
            "text-sm font-semibold text-slate-900 wrap-break-word whitespace-pre-wrap",
            valueClassName,
         )}
      >
         {value !== undefined && value !== null && value !== "" ? value : "—"}
      </div>
   </div>
);

export function ExaminationDetail({
   examination: initialExamination,
   healthProfile,
   onEdit,
   onClose,
}: ExaminationDetailProps) {
   const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

   // Tải dữ liệu mới nhất của phiếu khám nếu có ID
   const { data: fetchedExamination } = useGetExaminationByIdQuery(
      initialExamination.id,
      { skip: !initialExamination.id },
   );

   const examination = fetchedExamination || initialExamination;
   const profile = examination.healthProfile || healthProfile;

   const statusInfo = STATUS_CONFIG[examination?.status] || {
      label: examination?.status || "Không rõ",
      className: "bg-slate-100 text-slate-700 border-slate-300",
   };
   const canEdit = examination?.status === "IN_PROGRESS";

   // Tải mục tiêu điều trị
   const targetId = examination.treatmentTargetId;
   const { data: targetById } = useGetTreatmentTargetByIdQuery(
      { id: targetId! },
      { skip: !targetId },
   );
   const { data: targetByAssessment } =
      useGetTreatmentTargetByAccessmentIdQuery(
         { id: examination.assessmentInputId },
         { skip: !examination.assessmentInputId || !!targetId },
      );
   const treatmentTarget = targetById || targetByAssessment;

   const customTargetEntries = useMemo(
      () => getCustomTargetEntries(treatmentTarget?.customTargets),
      [treatmentTarget?.customTargets],
   );

   // Tải thông tin đánh giá phân tầng nguy cơ (nếu có)
   const { data: riskAssessment } = useGetRiskAssessmentDetailQuery(
      examination.assessmentInputId,
      { skip: !examination.assessmentInputId },
   );

   const bpBadge = getBpCategory(
      examination.systolicBp,
      examination.diastolicBp,
   );
   const bmiBadge = getBmiCategory(examination.bmi);
   const patientAge = getAge(profile?.dob);

   const handlePrint = () => {
      window.print();
   };

   return (
      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden print:border-none print:shadow-none print:p-0">
         {/* Top Header Bar */}
         <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                     PHIẾU KHÁM BỆNH
                  </h2>
                  <span
                     className={cn(
                        "px-2.5 py-0.5 rounded text-xs font-semibold border",
                        statusInfo.className,
                     )}
                  >
                     {statusInfo.label}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                     Mã: {examination.id}
                  </span>
               </div>
               <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span>
                     Thời gian khám:{" "}
                     <strong className="text-slate-800 font-semibold">
                        {formatDate(
                           examination.examinationDate || examination.createdAt,
                           true,
                        )}
                     </strong>
                  </span>
                  {examination.facility?.facilityName && (
                     <span>
                        Cơ sở:{" "}
                        <strong className="text-slate-800 font-semibold">
                           {examination.facility.facilityName}
                        </strong>
                     </span>
                  )}
               </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
               <CustomButton
                  type="button"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 text-xs font-medium cursor-pointer"
                  title="In phiếu khám"
               >
                  In phiếu
               </CustomButton>

               {onEdit && canEdit && (
                  <CustomButton
                     type="button"
                     size="sm"
                     onClick={onEdit}
                     className="h-8 text-xs"
                  >
                     Tiếp tục khám
                  </CustomButton>
               )}

               {onClose && (
                  <CustomButton
                     type="button"
                     variant="destructive"
                     size="sm"
                     onClick={onClose}
                     className="h-8 w-20 text-xs"
                  >
                     Đóng
                  </CustomButton>
               )}
            </div>
         </div>

         {/* Patient Identity Banner */}
         {profile && (
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
               <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                     <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-base font-bold text-slate-900 uppercase">
                           {profile.fullName}
                        </span>
                        {profile.gender && (
                           <span className="text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                              {profile.gender === "MALE"
                                 ? "Nam"
                                 : profile.gender === "FEMALE"
                                   ? "Nữ"
                                   : profile.gender}
                           </span>
                        )}
                        {patientAge !== null && (
                           <span className="text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                              {patientAge} tuổi
                              {profile.dob
                                 ? ` (${formatDate(profile.dob)})`
                                 : ""}
                           </span>
                        )}
                     </div>

                     <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                        <span>Mã hồ sơ:</span>
                        <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                           {profile.hospitalPatientCode ||
                              profile.id.slice(0, 8)}
                        </strong>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 text-xs">
                     <InfoRow
                        label="Số điện thoại"
                        value={profile.phoneNumber}
                        valueClassName="text-slate-800 font-medium"
                     />
                     <InfoRow
                        label="CCCD / CMND"
                        value={profile.citizenId}
                        valueClassName="text-slate-800 font-medium"
                     />
                     <InfoRow
                        label="Nhóm máu"
                        value={profile.bloodType}
                        valueClassName={
                           profile.bloodType
                              ? "text-rose-700 font-bold"
                              : "text-slate-800 font-medium"
                        }
                     />
                     <InfoRow
                        label="Tiền sử dị ứng"
                        value={profile.allergy || "Không ghi nhận"}
                        valueClassName={
                           profile.allergy
                              ? "text-rose-700 font-bold"
                              : "text-slate-800 font-medium"
                        }
                     />
                     <InfoRow
                        label="Bác sĩ phụ trách"
                        value={
                           examination.doctor?.fullName || "Bác sĩ phụ trách"
                        }
                        valueClassName="text-slate-800 font-medium"
                     />
                     <InfoRow
                        label="Địa chỉ"
                        value={profile.address}
                        valueClassName="text-slate-800 font-medium truncate"
                     />
                  </div>
               </div>
            </div>
         )}

         {/* Medical Record Body */}
         <div className="p-6 flex flex-col gap-6">
            {/* 1. Thông tin khám bệnh */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                     1. Lý do đến khám & Triệu chứng lâm sàng
                  </h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                     label="Lý do đến khám"
                     value={examination.reasonForVisit}
                     valueClassName="font-bold text-slate-900"
                  />
                  <InfoRow
                     label="Triệu chứng lâm sàng"
                     value={examination.clinicalSymptoms}
                     valueClassName="text-slate-800 font-normal"
                  />
               </div>

               {examination.assessmentInputId && (
                  <div className="p-4 rounded-sm border flex flex-wrap items-center justify-between gap-3 text-xs">
                     <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-slate-700">
                           Phân tầng nguy cơ tim mạch:
                        </span>
                        {riskAssessment?.riskLevel ? (
                           <span
                              className={cn(
                                 "px-2.5 py-0.5 rounded text-xs font-bold border",
                                 riskAssessment.riskLevel === "VERY_HIGH"
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : riskAssessment.riskLevel === "HIGH"
                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                      : "bg-emerald-100 text-emerald-800 border-emerald-300",
                              )}
                           >
                              {getRiskLevelLabel(riskAssessment.riskLevel)}
                           </span>
                        ) : (
                           <span className="text-slate-600 font-medium">
                              Đã liên kết phiếu phân tầng
                           </span>
                        )}
                        {riskAssessment?.riskScore && (
                           <span className="text-slate-600 font-medium">
                              (Điểm nguy cơ: {riskAssessment.riskScore}%)
                           </span>
                        )}
                     </div>

                     {riskAssessment && (
                        <CustomButton
                           type="button"
                           size="sm"
                           onClick={() => setIsRiskModalOpen(true)}
                           className="h-8 px-3 text-xs"
                        >
                           Xem chi tiết phân tầng
                        </CustomButton>
                     )}
                  </div>
               )}
            </div>

            {/* 2. Dấu hiệu sinh tồn & Thể trạng */}
            <div className="pt-6 flex flex-col gap-3">
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                     2. Dấu hiệu sinh tồn & Chỉ số thể trạng
                  </h3>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {/* Huyết áp */}
                  <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1">
                     <span className="text-xs font-medium text-slate-500">
                        Huyết áp
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-900">
                           {examination.systolicBp || examination.diastolicBp
                              ? `${examination.systolicBp || "—"}/${examination.diastolicBp || "—"}`
                              : "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                           mmHg
                        </span>
                     </div>
                     {bpBadge ? (
                        <span
                           className={cn(
                              "mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border w-fit",
                              bpBadge.className,
                           )}
                        >
                           {bpBadge.label}
                        </span>
                     ) : (
                        <span className="h-6" />
                     )}
                  </div>

                  {/* Mạch */}
                  <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1">
                     <span className="text-xs font-medium text-slate-500">
                        Mạch
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-900">
                           {examination.heartRate ?? "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                           lần/phút
                        </span>
                     </div>
                     <span className="h-6" />
                  </div>

                  {/* SpO2 */}
                  <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1">
                     <span className="text-xs font-medium text-slate-500">
                        SpO2
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-900">
                           {examination.spo2 ?? "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                           %
                        </span>
                     </div>
                     <span className="h-6" />
                  </div>

                  {/* Thân nhiệt */}
                  <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1">
                     <span className="text-xs font-medium text-slate-500">
                        Thân nhiệt
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-900">
                           {examination.temperature ?? "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                           °C
                        </span>
                     </div>
                     <span className="h-6" />
                  </div>

                  {/* Chiều cao */}
                  <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1">
                     <span className="text-xs font-medium text-slate-500">
                        Chiều cao
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-900">
                           {examination.heightCm ?? "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                           cm
                        </span>
                     </div>
                     <span className="h-6" />
                  </div>

                  {/* Cân nặng */}
                  <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1">
                     <span className="text-xs font-medium text-slate-500">
                        Cân nặng
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-900">
                           {examination.weightKg ?? "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                           kg
                        </span>
                     </div>
                     <span className="h-6" />
                  </div>

                  {/* BMI */}
                  <div className="p-3 rounded-sm border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-1">
                     <span className="text-xs font-medium text-slate-500">
                        Chỉ số BMI
                     </span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-slate-900">
                           {examination.bmi ?? "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                           kg/m²
                        </span>
                     </div>
                     {bmiBadge ? (
                        <span
                           className={cn(
                              "mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border w-fit",
                              bmiBadge.className,
                           )}
                        >
                           {bmiBadge.label}
                        </span>
                     ) : (
                        <span className="h-6" />
                     )}
                  </div>
               </div>
            </div>

            {/* 3. Chẩn đoán xác định & Hẹn tái khám */}
            <div className="pt-6 flex flex-col gap-3">
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                     3. Chẩn đoán xác định & Hẹn tái khám
                  </h3>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoRow
                     label="Chẩn đoán xác định"
                     value={examination.diagnosis}
                     className="sm:col-span-2"
                     valueClassName="font-bold text-slate-900 text-sm"
                  />
                  <InfoRow
                     label="Mã bệnh (ICD-10)"
                     value={
                        examination.icd10Code ? (
                           <span className="font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded text-xs inline-block">
                              {examination.icd10Code}
                           </span>
                        ) : (
                           "—"
                        )
                     }
                  />
                  <InfoRow
                     label="Ngày hẹn tái khám"
                     value={
                        examination.nextAppointmentDate ? (
                           <span className="font-bold text-emerald-800">
                              {formatDate(examination.nextAppointmentDate)}
                           </span>
                        ) : (
                           "Không hẹn tái khám"
                        )
                     }
                     className="sm:col-span-3 pt-2 border-t border-slate-200/80"
                  />
               </div>
            </div>

            {/* 4. Mục tiêu điều trị & Hướng dẫn lối sống */}
            {treatmentTarget && (
               <div className="pt-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                     <div className="flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                           4. Mục tiêu điều trị & Hướng dẫn lối sống
                        </h3>
                     </div>

                     {treatmentTarget.status === "DOCTOR_VERIFIED" ||
                     treatmentTarget.status === "VERIFIED" ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                           Bác sĩ đã phê duyệt
                        </span>
                     ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                           Chưa phê duyệt
                        </span>
                     )}
                  </div>

                  <div className="flex flex-col gap-4">
                     {/* Bảng các chỉ số mục tiêu */}
                     <div className="grid grid-cols-1 gap-3">
                        <div className="p-3 rounded-sm border border-slate-200 bg-white shadow-2xs">
                           <span className="text-xs text-slate-500 font-medium block mb-1">
                              Huyết áp mục tiêu
                           </span>
                           <span className="text-sm font-bold text-slate-900">
                              {treatmentTarget.bpTarget || "—"}
                           </span>
                        </div>
                        <div className="p-3 rounded-sm border border-slate-200 bg-white shadow-2xs">
                           <span className="text-xs text-slate-500 font-medium block mb-1">
                              Lipid máu mục tiêu
                           </span>
                           <span className="text-sm font-bold text-slate-900">
                              {treatmentTarget.lipidTarget || "—"}
                           </span>
                        </div>
                        <div className="p-3 rounded-sm border border-slate-200 bg-white shadow-2xs">
                           <span className="text-xs text-slate-500 font-medium block mb-1">
                              BMI mục tiêu
                           </span>
                           <span className="text-sm font-bold text-slate-900">
                              {treatmentTarget.bmiTarget || "—"}
                           </span>
                        </div>
                        <div className="p-3 rounded-sm border border-slate-200 bg-white shadow-2xs">
                           <span className="text-xs text-slate-500 font-medium block mb-1">
                              Đường huyết mục tiêu
                           </span>
                           <span className="text-sm font-bold text-slate-900">
                              {treatmentTarget.glycemicTarget || "—"}
                           </span>
                        </div>
                         <div className="p-3 rounded-sm border border-slate-200 bg-white shadow-2xs">
                            <span className="text-xs text-slate-500 font-medium block mb-1">
                               Chức năng thận mục tiêu
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                               {treatmentTarget.renalTarget || "—"}
                            </span>
                         </div>
                         {/* Các mục tiêu bổ sung (Custom Targets) */}
                         {customTargetEntries.map((item) => (
                            <div
                               key={item.key}
                               className="p-3 rounded-sm border border-slate-200 bg-white shadow-2xs"
                            >
                               <div className="flex items-center justify-between gap-1.5 mb-1">
                                  <span className="text-xs text-slate-500 font-medium">
                                     {item.label}
                                  </span>
                                  <span className="text-[10px] font-medium text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200/60">
                                     Mục tiêu bổ sung
                                  </span>
                               </div>
                               <span className="text-sm font-bold text-slate-900">
                                  {item.value || "—"}
                               </span>
                            </div>
                         ))}
                     </div>

                     {/* Hướng dẫn lối sống & Ghi chú */}
                     <div className="grid grid-cols-1 gap-4">
                        <InfoRow
                           label="Tư vấn lối sống & Dinh dưỡng"
                           value={treatmentTarget.dietAdvice}
                           valueClassName="font-normal text-slate-800"
                        />
                        <InfoRow
                           label="Tư vấn vận động & Thể lực"
                           value={treatmentTarget.exerciseAdvice}
                           valueClassName="font-normal text-slate-800"
                        />
                        <InfoRow
                           label="Tư vấn cai thuốc lá"
                           value={treatmentTarget.smokingAdvice}
                           valueClassName="font-normal text-slate-800"
                        />
                        <InfoRow
                           label="Ghi chú của bác sĩ"
                           value={treatmentTarget.doctorNotes}
                           valueClassName="font-normal text-slate-800"
                        />
                        {treatmentTarget.expertNotes && (
                           <div className="md:col-span-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                              <span className="font-bold block mb-0.5">
                                 Ghi chú của chuyên gia:
                              </span>
                              {treatmentTarget.expertNotes}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Modal chi tiết phân tầng yếu tố nguy cơ */}
         {riskAssessment && (
            <RiskAssessmentDetailModal
               isOpen={isRiskModalOpen}
               onClose={() => setIsRiskModalOpen(false)}
               assessment={riskAssessment}
            />
         )}
      </div>
   );
}
