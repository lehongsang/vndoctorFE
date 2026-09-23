"use client";

import { Examination } from "@/store/api/examination/type";
import { CustomButton } from "@/components/common/custom-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, ArrowRight } from "lucide-react";

export interface ExaminationDetailProps {
   examination: Examination;
   onEdit?: () => void;
   onClose?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
   IN_PROGRESS: {
      label: "Đang khám",
      className: "bg-amber-50 text-amber-700 border-amber-200",
   },
   COMPLETED: {
      label: "Hoàn thành",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
   },
   CANCELLED: {
      label: "Đã hủy",
      className: "bg-rose-50 text-rose-700 border-rose-200",
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

const RowItem = ({
   label,
   value,
   className,
}: {
   label: string;
   value?: React.ReactNode;
   className?: string;
}) => (
   <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="text-sm font-medium text-slate-800 wrap-break-word">
         {value || "—"}
      </div>
   </div>
);

const VitalCard = ({
   label,
   value,
   unit,
   icon: Icon,
}: {
   label: string;
   value?: React.ReactNode;
   unit?: string;
   icon?: React.ElementType;
}) => (
   <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
      {Icon && (
         <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
            <Icon className="w-4 h-4 text-primary" />
         </div>
      )}
      <div className="flex flex-col min-w-0">
         <span className="text-xs text-slate-500 font-medium truncate">
            {label}
         </span>
         <span className="text-sm font-bold text-slate-800">
            {value ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
         </span>
      </div>
   </div>
);

const DetailSection = ({
   title,
   children,
}: {
   title: string;
   children: React.ReactNode;
}) => (
   <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {children}
   </div>
);

export function ExaminationDetail({
   examination,
   onEdit,
   onClose,
}: ExaminationDetailProps) {
   const statusInfo = STATUS_CONFIG[examination?.status] || {
      label: examination?.status || "Không rõ",
      className: "bg-slate-100 text-slate-600 border-slate-200",
   };
   const canEdit = examination?.status === "IN_PROGRESS";

   return (
      <div className="flex flex-col gap-6">
         {/* Thanh header chi tiết */}
         <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-slate-800">
                     Chi tiết lượt khám
                  </span>
                  <span
                     className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.className}`}
                  >
                     {statusInfo.label}
                  </span>
               </div>
               <span className="text-xs text-slate-500">
                  Thời gian khám:{" "}
                  {formatDate(
                     examination.examinationDate || examination.createdAt,
                     true,
                  )}
               </span>
            </div>

            <div className="flex items-center gap-2">
               {onClose && (
                  <CustomButton
                     type="button"
                     variant="destructive"
                     size="sm"
                     onClick={onClose}
                     className="h-8 text-xs gap-1 cursor-pointer"
                  >
                     <X className="w-3.5 h-3.5" />
                     Đóng
                  </CustomButton>
               )}
               {onEdit && canEdit && (
                  <CustomButton
                     type="button"
                     size="sm"
                     onClick={onEdit}
                     className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                     Tiếp tục khám
                     <ArrowRight />
                  </CustomButton>
               )}
            </div>
         </div>

         {/* Phần 1: Thông tin khám */}
         <DetailSection title="1. Thông tin khám">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50/60 border border-slate-200">
               <RowItem
                  label="Lý do đến khám"
                  value={examination.reasonForVisit}
                  className="sm:col-span-2"
               />
               <RowItem
                  label="Triệu chứng lâm sàng"
                  value={examination.clinicalSymptoms}
                  className="sm:col-span-2"
               />
               <RowItem
                  label="Cơ sở y tế"
                  value={examination.facility?.facilityName}
               />
               <RowItem
                  label="Bác sĩ thực hiện"
                  value={
                     <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 border border-slate-200">
                           <AvatarFallback className="text-[10px] font-bold">
                              {examination.doctor?.fullName
                                 ? examination.doctor.fullName
                                      .slice(0, 2)
                                      .toUpperCase()
                                 : "BS"}
                           </AvatarFallback>
                        </Avatar>
                        <span>
                           {examination.doctor?.fullName || "Chưa phân công"}
                        </span>
                     </div>
                  }
               />
               {examination.assessmentInputId && (
                  <RowItem
                     label="Phiếu phân tầng yếu tố nguy cơ"
                     value={
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                           Đã liên kết phiếu phân tầng
                        </span>
                     }
                  />
               )}
            </div>
         </DetailSection>

         {/* Phần 2: Chỉ số sinh tồn*/}
         <DetailSection title="2. Chỉ số sinh tồn">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               <VitalCard
                  label="Huyết áp"
                  value={
                     examination.systolicBp || examination.diastolicBp
                        ? `${examination.systolicBp || "—"}/${examination.diastolicBp || "—"}`
                        : undefined
                  }
                  unit="mmHg"
               />
               <VitalCard
                  label="Mạch"
                  value={examination.heartRate}
                  unit="lần/phút"
               />
               <VitalCard label="SpO2" value={examination.spo2} unit="%" />
               <VitalCard
                  label="Thân nhiệt"
                  value={examination.temperature}
                  unit="°C"
               />
               <VitalCard
                  label="Chiều cao"
                  value={examination.heightCm}
                  unit="cm"
               />
               <VitalCard
                  label="Cân nặng"
                  value={examination.weightKg}
                  unit="kg"
               />
               <VitalCard
                  label="Chỉ số BMI"
                  value={examination.bmi}
                  unit="kg/m²"
               />
            </div>
         </DetailSection>

         {/* Phần 3: Chẩn đoán & Tái khám */}
         <DetailSection title="3. Chẩn đoán & Tái khám">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50/60 border border-slate-200">
               <RowItem label="Chẩn đoán" value={examination.diagnosis} />
               <RowItem label="Mã ICD-10" value={examination.icd10Code} />
               <RowItem
                  label="Ngày hẹn tái khám"
                  value={formatDate(examination.nextAppointmentDate)}
               />
            </div>
         </DetailSection>
      </div>
   );
}
