"use client";

import { format } from "date-fns";
import {
   RiskAssessmentResult,
   AssessmentInput,
} from "@/store/api/risk-factor-assessment/type";
import { useGetRiskAssessmentDetailQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
   RiskLevelBadge,
   getRiskContainerClass,
   RISK_EXPLANATION_TEXT,
   formatRiskRate,
   checkHasUnderlyingDisease,
} from "@/components/common/risk-level-badge";
import { toast } from "react-toastify";
import { checkHealthProfileCarePackage } from "@/lib/care-package-utils";
import { AlertTriangle } from "lucide-react";

const TARGET_ORGAN_DAMAGE_FIELDS: {
   key: keyof AssessmentInput;
   label: string;
}[] = [
   {
      key: "hasLeftVentricularHypertrophy",
      label: "Phì đại thất trái trên siêu âm tim hoặc điện tim",
   },
   {
      key: "hasAlbuminuria",
      label: "Có Albumin/Microalbumin niệu",
   },
   {
      key: "hasRetinopathy",
      label: "Có tổn thương đáy mắt",
   },
   {
      key: "hasSilentBrainInfarct",
      label: "Tổn thương thầm lặng trên não (slient infact)",
   },
];

const CARDIOVASCULAR_EVENT_FIELDS: {
   key: keyof AssessmentInput;
   label: string;
}[] = [
   { key: "stroke", label: "Đột quỵ não" },
   { key: "hasMyocardialInfarction", label: "Nhồi máu cơ tim" },
   { key: "hasAcuteCoronarySyndrome", label: "Hội chứng vành cấp" },
   { key: "hasCoronaryArteryDisease", label: "Bệnh lý mạch vành" },
   { key: "hasTia", label: "Cơn thiếu máu não cục bộ thoáng qua (TIA)" },
   { key: "hasAorticAneurysm", label: "Phình động mạch chủ" },
   { key: "hasPeripheralArteryDisease", label: "Bệnh mạch máu ngoại vi" },
   { key: "hasAtherosclerosis", label: "Vữa xơ mạch máu" },
   {
      key: "hasFamilialHypercholesterolemia",
      label: "Tăng mỡ máu gia đình",
   },
];

const hasValue = (val: unknown): boolean => {
   if (val === null || val === undefined || val === false || val === 0)
      return false;
   if (typeof val === "string") return val.trim().length > 0;
   if (typeof val === "number") return !isNaN(val);
   return true;
};

const formatMetric = (val?: number | string | null, unit: string = "") => {
   if (val === null || val === undefined || val === 0 || val === "") return "—";
   const num = Number(val);
   if (isNaN(num)) return `${val} ${unit}`.trim();
   return `${num} ${unit}`.trim();
};

interface MetricItem {
   label: string;
   value: string | React.ReactNode;
   variant?: "default" | "danger" | "warning";
}

const renderMetricCards = (
   items: MetricItem[],
   gridCols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
) => {
   if (items.length === 0) return null;
   return (
      <div className={cn("grid gap-2", gridCols)}>
         {items.map((item, idx) => (
            <div
               key={idx}
               className={cn(
                  "p-2 rounded border text-xs",
                  item.variant === "danger"
                     ? "bg-rose-50/70 border-rose-200 text-rose-950"
                     : item.variant === "warning"
                       ? "bg-amber-50/70 border-amber-200 text-amber-950"
                       : "bg-slate-50 border-slate-200 text-slate-800",
               )}
            >
               <span className="text-slate-500 block text-[11px] mb-0.5">
                  {item.label}
               </span>
               <span
                  className={cn(
                     "font-semibold",
                     item.variant === "danger"
                        ? "text-rose-600"
                        : item.variant === "warning"
                          ? "text-amber-900"
                          : "text-slate-800",
                  )}
               >
                  {item.value}
               </span>
            </div>
         ))}
      </div>
   );
};

const renderConditionCards = (
   items: { label: string; tag?: string }[],
   gridCols = "grid-cols-1 sm:grid-cols-2",
) => {
   if (items.length === 0) return null;
   return (
      <div className={cn("grid gap-2", gridCols)}>
         {items.map((item, idx) => (
            <div
               key={idx}
               className="p-2 rounded border text-xs flex items-center justify-between gap-2 bg-rose-50/80 border-rose-200 text-rose-900"
            >
               <span className="font-medium text-[11px]">{item.label}</span>
            </div>
         ))}
      </div>
   );
};

export interface RiskAssessmentDetailModalProps {
   isOpen: boolean;
   onClose: () => void;
   assessment?: RiskAssessmentResult | null;
   assessmentId?: string | null;
   onEvaluate?: (assessment: RiskAssessmentResult) => void;
   onStartExamination?: (assessment: RiskAssessmentResult) => void;
   showStartExamination?: boolean;
   onEdit?: (assessment: RiskAssessmentResult) => void;
}

export function RiskAssessmentDetailModal({
   isOpen,
   onClose,
   assessment: propAssessment,
   assessmentId,
   onEvaluate,
   onStartExamination,
   showStartExamination = true,
   onEdit,
}: RiskAssessmentDetailModalProps) {
   const targetId = propAssessment?.id || assessmentId || "";
   const { data: fetchedAssessment, isLoading } =
      useGetRiskAssessmentDetailQuery(targetId, {
         skip: !targetId || !isOpen,
      });

   const assessment = fetchedAssessment || propAssessment || null;

   if (!isOpen) return null;

   if (isLoading && !assessment) {
      return (
         <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:min-w-3xl rounded-lg p-8 flex flex-col items-center justify-center gap-3">
               <CloverLoading size="md" />
               <span className="text-xs text-slate-500 font-medium">
                  Đang tải thông tin phân tầng nguy cơ...
               </span>
            </DialogContent>
         </Dialog>
      );
   }

   if (!assessment) return null;

   const input = (assessment.assessmentInput ||
      assessment ||
      {}) as AssessmentInput;
   const hasUnderlying = checkHasUnderlyingDisease(assessment);

   const dateStr = assessment.evaluatedAt || assessment.createdAt;
   let formattedDate = "—";
   if (dateStr) {
      try {
         formattedDate = format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss");
      } catch {
         formattedDate = dateStr;
      }
   }

   const packageCheck = assessment?.healthProfile
      ? checkHealthProfileCarePackage(assessment.healthProfile)
      : null;

   const handleStartExam = () => {
      if (packageCheck && !packageCheck.canCreateExamination) {
         toast.warning(
            packageCheck.reason ||
               "Hồ sơ này chưa có gói điều trị hợp lệ để tạo phiếu khám.",
         );
         return;
      }
      onClose();
      if (onStartExamination) {
         onStartExamination(assessment);
      } else {
         const profileId =
            assessment.healthProfileId ||
            assessment.healthProfile?.id ||
            assessment.assessmentInput?.healthProfileId;
         const url = profileId
            ? `/health-profile/examination/${profileId}?action=create&assessmentId=${assessment.id}`
            : `/health-profile/examination?action=create&assessmentId=${assessment.id}`;
         window.open(url, "_blank");
      }
   };

   // Tính BMI nếu chưa có
   const computedBmi =
      input.bmi != null
         ? input.bmi
         : input.heightCm && input.weightKg && Number(input.heightCm) > 0
           ? (
                Number(input.weightKg) /
                Math.pow(Number(input.heightCm) / 100, 2)
             ).toFixed(1)
           : null;

   const isMissingNonHdl =
      !hasUnderlying &&
      (!input.nonHdlCholesterol ||
         !input.totalCholesterol ||
         !input.hdlCholesterol);

   return (
      <Dialog
         open={isOpen}
         onOpenChange={(open) => {
            if (!open) onClose();
         }}
      >
         <DialogContent className="sm:min-w-4xl max-w-4xl rounded-sm p-px gap-0 overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200">
               <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between gap-2">
                  <span>Chi tiết phân tầng nguy cơ tim mạch</span>
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500">
                  Thời gian đánh giá: {formattedDate}
               </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
               <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* 1. Kết quả phân tầng tổng quan */}
                  <div
                     className={cn(
                        "p-4 rounded-sm border flex flex-col gap-2.5",
                        getRiskContainerClass(assessment.riskLevel),
                     )}
                  >
                     <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                           <span className="font-bold text-xs sm:text-sm">
                              Nguy cơ biến cố tim mạch trong 10 năm:
                           </span>
                           <RiskLevelBadge level={assessment.riskLevel} />
                        </div>
                        {assessment.riskScore !== null &&
                           assessment.riskScore !== undefined &&
                           assessment.riskScore !== "" && (
                              <div className="text-xs flex items-center gap-1.5 flex-wrap">
                                 <span className="text-slate-700 font-bold">
                                    Tỷ lệ biến cố:
                                 </span>
                                 <span className="text-2xl font-extrabold text-primary">
                                    {formatRiskRate(
                                       assessment.riskScore,
                                       hasUnderlying,
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

                     {isMissingNonHdl && (
                        <div className="flex items-start gap-2 p-2.5 rounded bg-amber-50/90 border border-amber-300 text-amber-900 text-xs">
                           <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                           <div>
                              <span className="font-semibold text-amber-950">
                                 Lưu ý phân tầng:
                              </span>{" "}
                              Thiếu dữ liệu Non-HDL-Cholesterol do không nhập 1
                              trong 2 hoặc không nhập cả 2 chỉ số: Cholesterol
                              toàn phần và HDL-Cholesterol.
                           </div>
                        </div>
                     )}

                     <p className="text-[11px] text-slate-900 italic">
                        * Phân tầng yếu tố nguy cơ theo thang điểm Score 2;
                        Score-OP; Score-dia được Khuyến cáo của hiệp hội tim
                        mạch châu Âu ESC
                     </p>
                  </div>

                  {/* 2. Thẩm định & Kết luận chuyên môn của bác sĩ (nếu có) */}
                  {(assessment.doctor || assessment.doctorNote) && (
                     <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 flex flex-col gap-2">
                        <div className="flex items-center gap-2 ">
                           {assessment.doctor && (
                              <span className="text-[11px] text-slate-600">
                                 Bác sĩ xác nhận:{" "}
                                 <strong className="text-slate-800 font-semibold">
                                    {assessment.doctor.fullName}
                                 </strong>
                              </span>
                           )}
                        </div>

                        {assessment.doctorNote && (
                           <div className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">
                                 Ghi chú:{" "}
                              </span>
                              {assessment.doctorNote}
                           </div>
                        )}
                     </div>
                  )}

                  {/* 3. Cảnh báo nguy cơ cao (Red Flags nếu có) */}
                  {assessment.redFlags && assessment.redFlags.length > 0 && (
                     <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-sm flex flex-col gap-2">
                        <div className="font-bold text-rose-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                           <AlertTriangle className="w-4 h-4 text-rose-600" />
                           Cảnh báo nguy cơ cao
                        </div>
                        <div className="flex flex-col gap-1 pl-1">
                           {assessment.redFlags.map((flag, idx) => (
                              <div
                                 key={idx}
                                 className="text-xs text-rose-900 flex items-baseline font-medium"
                              >
                                 • {flag.title || flag.metric}: {flag.value}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* 4. DỮ LIỆU ĐẦU VÀO: NGƯỜI BỆNH CHƯA CÓ BỆNH NỀN (SCORE2) */}
                  {!hasUnderlying &&
                     (() => {
                        const patientInfoItems: MetricItem[] = [];
                        if (hasValue(input.age)) {
                           patientInfoItems.push({
                              label: "Tuổi",
                              value: `${input.age} tuổi`,
                           });
                        }
                        if (Boolean(input.gender)) {
                           patientInfoItems.push({
                              label: "Giới tính",
                              value: input.gender,
                           });
                        }
                        if (input.isSmoking === true) {
                           patientInfoItems.push({
                              label: "Hút thuốc lá",
                              value: "Có hút thuốc",
                              variant: "danger",
                           });
                        }
                        if (hasValue(input.heightCm)) {
                           patientInfoItems.push({
                              label: "Chiều cao",
                              value: formatMetric(input.heightCm, "cm"),
                           });
                        }
                        if (hasValue(input.weightKg)) {
                           patientInfoItems.push({
                              label: "Cân nặng",
                              value: formatMetric(input.weightKg, "kg"),
                           });
                        }
                        if (computedBmi) {
                           patientInfoItems.push({
                              label: "Chỉ số BMI",
                              value: `${computedBmi} kg/m²`,
                           });
                        }

                        const lipidLabItems: MetricItem[] = [];
                        if (
                           hasValue(input.systolicBp) ||
                           hasValue(input.diastolicBp)
                        ) {
                           const bpVal =
                              input.systolicBp && input.diastolicBp
                                 ? `${input.systolicBp}/${input.diastolicBp} mmHg`
                                 : input.systolicBp
                                   ? `${input.systolicBp} mmHg`
                                   : `${input.diastolicBp} mmHg`;
                           lipidLabItems.push({
                              label: "Huyết áp",
                              value: bpVal,
                           });
                        }
                        if (hasValue(input.totalCholesterol)) {
                           lipidLabItems.push({
                              label: "Cholesterol toàn phần",
                              value: formatMetric(
                                 input.totalCholesterol,
                                 "mmol/L",
                              ),
                           });
                        }
                        if (hasValue(input.hdlCholesterol)) {
                           lipidLabItems.push({
                              label: "HDL-Cholesterol",
                              value: formatMetric(
                                 input.hdlCholesterol,
                                 "mmol/L",
                              ),
                           });
                        }
                        if (hasValue(input.nonHdlCholesterol)) {
                           lipidLabItems.push({
                              label: "Non-HDL-Cholesterol",
                              value: formatMetric(
                                 input.nonHdlCholesterol,
                                 "mmol/L",
                              ),
                           });
                        }
                        if (hasValue(input.ldlCholesterol)) {
                           lipidLabItems.push({
                              label: "LDL-Cholesterol",
                              value: formatMetric(
                                 input.ldlCholesterol,
                                 "mmol/L",
                              ),
                           });
                        }
                        if (hasValue(input.triglycerides)) {
                           lipidLabItems.push({
                              label: "Triglycerides",
                              value: formatMetric(
                                 input.triglycerides,
                                 "mmol/L",
                              ),
                           });
                        }
                        if (hasValue(input.glucoseFasting)) {
                           lipidLabItems.push({
                              label: "Đường huyết lúc đói",
                              value: formatMetric(
                                 input.glucoseFasting,
                                 "mmol/L",
                              ),
                           });
                        }

                        if (
                           patientInfoItems.length === 0 &&
                           lipidLabItems.length === 0
                        ) {
                           return null;
                        }

                        return (
                           <div className="flex flex-col gap-3 pt-1 border-t border-slate-200">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                 <span>
                                    Dữ liệu đầu vào: Người bệnh chưa có bệnh nền
                                 </span>
                              </div>

                              {/* Nhóm 1: Thông tin người bệnh & Thể trạng */}
                              {patientInfoItems.length > 0 && (
                                 <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                       Thông tin người bệnh & Thể trạng (
                                       {patientInfoItems.length})
                                    </span>
                                    {renderMetricCards(
                                       patientInfoItems,
                                       "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
                                    )}
                                 </div>
                              )}

                              {/* Nhóm 2: Chỉ số huyết áp & Xét nghiệm cận lâm sàng */}
                              {lipidLabItems.length > 0 && (
                                 <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                       Chỉ số huyết áp & Xét nghiệm cận lâm sàng
                                       ({lipidLabItems.length})
                                    </span>
                                    {renderMetricCards(
                                       lipidLabItems,
                                       "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
                                    )}
                                 </div>
                              )}
                           </div>
                        );
                     })()}

                  {/* 5. DỮ LIỆU ĐẦU VÀO: NGƯỜI BỆNH CÓ BỆNH NỀN (NON-ASCVD) */}
                  {hasUnderlying &&
                     (() => {
                        // 1. Tổn thương cơ quan đích (chỉ các mục = true)
                        const organDamageItems =
                           TARGET_ORGAN_DAMAGE_FIELDS.filter((item) =>
                              Boolean(input[item.key]),
                           ).map((item) => ({ label: item.label, tag: "Có" }));

                        // 2. Đái tháo đường & Thận (chỉ các mục có dữ liệu / true)
                        const diabetesKidneyItems: MetricItem[] = [];
                        if (Boolean(input.diabetes)) {
                           diabetesKidneyItems.push({
                              label: "Tình trạng ĐTĐ",
                              value: "Có mắc ĐTĐ",
                              variant: "warning",
                           });
                        }
                        if (hasValue(input.diabetesDurationYears)) {
                           diabetesKidneyItems.push({
                              label: "Số năm mắc ĐTĐ",
                              value: `${input.diabetesDurationYears} năm`,
                           });
                        }
                        if (Boolean(input.glycemicControl)) {
                           diabetesKidneyItems.push({
                              label: "Kiểm soát đường máu",
                              value: String(input.glycemicControl),
                           });
                        }
                        if (hasValue(input.egfr)) {
                           diabetesKidneyItems.push({
                              label: "eGFR",
                              value: formatMetric(input.egfr, "mL/min/1.73m²"),
                           });
                        }
                        if (hasValue(input.acr)) {
                           diabetesKidneyItems.push({
                              label: "ACR niệu",
                              value: formatMetric(input.acr, "mg/g"),
                           });
                        }

                        // 3. Tiền sử biến cố tim mạch nặng & Vữa xơ (chỉ các mục = true)
                        const cardioEventItems =
                           CARDIOVASCULAR_EVENT_FIELDS.filter((item) =>
                              Boolean(input[item.key]),
                           ).map((item) => ({ label: item.label, tag: "Có" }));

                        // 4. Các chỉ số sinh lý / cận lâm sàng kèm theo (nếu có nhập)
                        const accompanyingMetrics: MetricItem[] = [];
                        if (hasValue(input.age)) {
                           accompanyingMetrics.push({
                              label: "Tuổi",
                              value: `${input.age} tuổi`,
                           });
                        }
                        if (Boolean(input.gender)) {
                           accompanyingMetrics.push({
                              label: "Giới tính",
                              value: input.gender,
                           });
                        }
                        if (input.isSmoking === true) {
                           accompanyingMetrics.push({
                              label: "Hút thuốc lá",
                              value: "Có hút thuốc",
                              variant: "danger",
                           });
                        }
                        if (hasValue(input.heightCm)) {
                           accompanyingMetrics.push({
                              label: "Chiều cao",
                              value: formatMetric(input.heightCm, "cm"),
                           });
                        }
                        if (hasValue(input.weightKg)) {
                           accompanyingMetrics.push({
                              label: "Cân nặng",
                              value: formatMetric(input.weightKg, "kg"),
                           });
                        }

                        const hasAnyData =
                           organDamageItems.length > 0 ||
                           diabetesKidneyItems.length > 0 ||
                           cardioEventItems.length > 0 ||
                           accompanyingMetrics.length > 0;

                        if (!hasAnyData) return null;

                        return (
                           <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                 <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                                    <span>
                                       Dữ liệu đầu vào: Người bệnh có bệnh nền
                                    </span>
                                 </div>
                              </div>

                              {/* 1. Dấu hiệu tổn thương cơ quan đích */}
                              {organDamageItems.length > 0 && (
                                 <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-500">
                                       Dấu hiệu tổn thương cơ quan đích (
                                       {organDamageItems.length})
                                    </span>
                                    {renderConditionCards(organDamageItems)}
                                 </div>
                              )}

                              {/* 2. Đái tháo đường & Thận */}
                              {diabetesKidneyItems.length > 0 && (
                                 <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-500">
                                       Thông tin Đái tháo đường & Thận (
                                       {diabetesKidneyItems.length})
                                    </span>
                                    {renderMetricCards(
                                       diabetesKidneyItems,
                                       "grid-cols-2 sm:grid-cols-3",
                                    )}
                                 </div>
                              )}

                              {/* 3. Tiền sử biến cố tim mạch nặng & Vữa xơ */}
                              {cardioEventItems.length > 0 && (
                                 <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-500">
                                       Tiền sử biến cố tim mạch nặng & Vữa xơ (
                                       {cardioEventItems.length})
                                    </span>
                                    {renderConditionCards(cardioEventItems)}
                                 </div>
                              )}

                              {/* 4. Chỉ số sinh lý & Cận lâm sàng kèm theo */}
                              {accompanyingMetrics.length > 0 && (
                                 <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-500">
                                       Chỉ số sinh lý & Cận lâm sàng kèm theo (
                                       {accompanyingMetrics.length})
                                    </span>
                                    {renderMetricCards(
                                       accompanyingMetrics,
                                       "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
                                    )}
                                 </div>
                              )}
                           </div>
                        );
                     })()}
               </div>
            </ScrollArea>

            {/* Footer với các nút hành động */}
            <div className="p-3 sm:px-5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
               <CustomButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onClose}
                  className="text-xs h-8 px-3 cursor-pointer"
               >
                  Đóng
               </CustomButton>
               {showStartExamination && (
                  <CustomButton
                     type="button"
                     size="sm"
                     className="h-8 text-xs font-semibold px-4 cursor-pointer bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
                     onClick={handleStartExam}
                     title={
                        packageCheck && !packageCheck.canCreateExamination
                           ? packageCheck.reason
                           : undefined
                     }
                  >
                     Khám ngay
                  </CustomButton>
               )}

               {onEdit && (
                  <CustomButton
                     type="button"
                     size="sm"
                     className="h-8 text-xs "
                     onClick={() => {
                        onClose();
                        onEdit(assessment);
                     }}
                  >
                     Đánh giá lại
                  </CustomButton>
               )}

               {onEvaluate && (
                  <CustomButton
                     type="button"
                     size="sm"
                     className="h-8 text-xs font-semibold px-4 cursor-pointer"
                     onClick={() => {
                        onClose();
                        onEvaluate(assessment);
                     }}
                  >
                     {assessment.doctor ? "Xác nhận lại" : "Xác nhận"}
                  </CustomButton>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}

export default RiskAssessmentDetailModal;
