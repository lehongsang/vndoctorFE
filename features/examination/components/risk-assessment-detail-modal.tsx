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

const getPositiveFactors = (input?: AssessmentInput) => {
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
      factors.push({ label: "Phì đại thất trái (ECG/Siêu âm)" });
   }
   if (input.hasAlbuminuria) {
      factors.push({ label: "Có Albumin niệu / Microalbumin niệu" });
   }
   if (input.hasRetinopathy) {
      factors.push({ label: "Tổn thương võng mạc do THA" });
   }
   if (input.hasSilentBrainInfarct) {
      factors.push({ label: "Nhồi máu não thầm lặng" });
   }
   if (input.stroke) {
      factors.push({ label: "Đột quỵ não / Tai biến mạch máu não" });
   }
   if (input.hasMyocardialInfarction) {
      factors.push({ label: "Nhồi máu cơ tim" });
   }
   if (input.hasAcuteCoronarySyndrome) {
      factors.push({ label: "Hội chứng vành cấp" });
   }
   if (input.hasCoronaryArteryDisease) {
      factors.push({ label: "Bệnh lý động mạch vành mạn" });
   }
   if (input.hasTia) {
      factors.push({ label: "Cơn thiếu máu não thoáng qua (TIA)" });
   }
   if (input.hasAorticAneurysm) {
      factors.push({ label: "Phình động mạch chủ" });
   }
   if (input.hasPeripheralArteryDisease) {
      factors.push({ label: "Bệnh động mạch ngoại vi" });
   }
   if (input.hasAtherosclerosis) {
      factors.push({ label: "Vữa xơ mạch máu lớn" });
   }
   if (input.hasFamilialHypercholesterolemia) {
      factors.push({ label: "Tăng Cholesterol máu gia đình" });
   }

   return factors;
};

const formatMetric = (val?: number | string | null, unit: string = "") => {
   if (val === null || val === undefined || val === "") return "—";
   const num = Number(val);
   if (isNaN(num)) return `${val} ${unit}`.trim();
   return `${num} ${unit}`.trim();
};

const getRiskBadge = (level?: string) => {
   switch (level) {
      case "VERY_HIGH":
         return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
               Rất cao
            </span>
         );
      case "HIGH":
         return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
               Cao
            </span>
         );
      default:
         return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
               Thấp
            </span>
         );
   }
};

export interface RiskAssessmentDetailModalProps {
   isOpen: boolean;
   onClose: () => void;
   assessment?: RiskAssessmentResult | null;
   assessmentId?: string | null;
   onEvaluate?: (assessment: RiskAssessmentResult) => void;
   onStartExamination?: (assessment: RiskAssessmentResult) => void;
   showStartExamination?: boolean;
}

export function RiskAssessmentDetailModal({
   isOpen,
   onClose,
   assessment: propAssessment,
   assessmentId,
   onEvaluate,
   onStartExamination,
   showStartExamination = true,
}: RiskAssessmentDetailModalProps) {
   const { data: fetchedAssessment, isLoading } =
      useGetRiskAssessmentDetailQuery(assessmentId ?? "", {
         skip: !assessmentId || !!propAssessment || !isOpen,
      });

   const assessment = propAssessment || fetchedAssessment || null;

   if (!isOpen) return null;

   if (isLoading && !assessment) {
      return (
         <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:min-w-md rounded-lg p-8 flex flex-col items-center justify-center gap-3">
               <CloverLoading size="md" />
               <span className="text-xs text-slate-500 font-medium">
                  Đang tải thông tin phân tầng nguy cơ...
               </span>
            </DialogContent>
         </Dialog>
      );
   }

   if (!assessment) return null;

   const input = assessment.assessmentInput;
   const positiveFactors = getPositiveFactors(input);

   const dateStr = assessment.evaluatedAt || assessment.createdAt;
   let formattedDate = "—";
   if (dateStr) {
      try {
         formattedDate = format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss");
      } catch {
         formattedDate = dateStr;
      }
   }

   const handleStartExam = () => {
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

   return (
      <Dialog
         open={isOpen}
         onOpenChange={(open) => {
            if (!open) onClose();
         }}
      >
         <DialogContent className="sm:min-w-2xl rounded-sm p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200">
               <DialogTitle className="text-base font-bold text-slate-900">
                  Chi tiết phân tầng nguy cơ tim mạch
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500">
                  Thời gian: {formattedDate}
               </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[72vh]">
               <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* 1. Kết quả phân tầng tổng quan */}
                  <div
                     className={cn(
                        "p-3.5 rounded-sm border flex flex-col gap-2",
                        assessment.riskLevel === "VERY_HIGH"
                           ? "bg-rose-50/80 border-rose-300 text-rose-950"
                           : assessment.riskLevel === "HIGH"
                             ? "bg-amber-50/80 border-amber-300 text-amber-950"
                             : "bg-emerald-50/80 border-emerald-300 text-emerald-950",
                     )}
                  >
                     <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-xs">
                              Phân tầng nguy cơ:
                           </span>
                           {getRiskBadge(assessment.riskLevel)}
                           <span className="text-[11px] text-slate-600">
                              (
                              {input?.hasUnderlyingDisease
                                 ? "Bệnh nền Non-ASCVD"
                                 : "Thang điểm SCORE2"}
                              )
                           </span>
                        </div>
                        {assessment.riskScore !== null &&
                           assessment.riskScore !== undefined &&
                           assessment.riskScore !== "" &&
                           Number(assessment.riskScore) !== 0 && (
                              <div className="text-xs">
                                 Xác suất biến cố 10 năm:{" "}
                                 <span className="text-base font-extrabold text-slate-900">
                                    {assessment.riskScore}%
                                 </span>
                              </div>
                           )}
                     </div>

                     <p className="text-[11px] text-slate-500">
                        * Phân tầng yếu tố nguy cơ theo thang điểm Score 2;
                        Score-OP; Score-dia được Khuyến cáo của hiệp hội tim
                        mạch châu Âu ESC
                     </p>
                  </div>

                  {/* 2. Thẩm định & Kết luận chuyên môn của bác sĩ */}
                  {(assessment.doctor ||
                     assessment.conclusion ||
                     assessment.recommendations) && (
                     <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                           <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                              Thẩm định chuyên môn
                           </span>
                           {assessment.doctor && (
                              <span className="text-[11px] text-slate-600">
                                 Bác sĩ:{" "}
                                 <strong className="text-slate-800 font-semibold">
                                    {assessment.doctor.fullName}
                                 </strong>
                              </span>
                           )}
                        </div>

                        {assessment.conclusion && (
                           <div className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">
                                 Kết luận:{" "}
                              </span>
                              {assessment.conclusion}
                           </div>
                        )}

                        {assessment.recommendations && (
                           <div className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">
                                 Khuyến nghị điều trị:{" "}
                              </span>
                              {assessment.recommendations}
                           </div>
                        )}
                     </div>
                  )}

                  {/* 3. Chỉ số lâm sàng & Xét nghiệm cốt lõi (Chỉ hiển thị các trường có giá trị khác 0/null/empty) */}
                  {(() => {
                     const metrics: { label: string; value: string }[] = [];

                     const isValidNumber = (val?: number | string | null) => {
                        if (val === null || val === undefined || val === "")
                           return false;
                        const num = Number(val);
                        return !isNaN(num) && num !== 0;
                     };

                     const hasSystolic = isValidNumber(input?.systolicBp);
                     const hasDiastolic = isValidNumber(input?.diastolicBp);
                     if (hasSystolic || hasDiastolic) {
                        metrics.push({
                           label: "Huyết áp",
                           value: `${hasSystolic ? input?.systolicBp : "—"}/${hasDiastolic ? input?.diastolicBp : "—"} mmHg`,
                        });
                     }
                     if (isValidNumber(input?.totalCholesterol)) {
                        metrics.push({
                           label: "Cholesterol TP",
                           value: formatMetric(
                              input?.totalCholesterol,
                              "mmol/L",
                           ),
                        });
                     }
                     if (isValidNumber(input?.hdlCholesterol)) {
                        metrics.push({
                           label: "HDL-Cholesterol",
                           value: formatMetric(input?.hdlCholesterol, "mmol/L"),
                        });
                     }
                     if (isValidNumber(input?.ldlCholesterol)) {
                        metrics.push({
                           label: "LDL-Cholesterol",
                           value: formatMetric(input?.ldlCholesterol, "mmol/L"),
                        });
                     }
                     if (isValidNumber(input?.triglycerides)) {
                        metrics.push({
                           label: "Triglycerides",
                           value: formatMetric(input?.triglycerides, "mmol/L"),
                        });
                     }
                     if (isValidNumber(input?.glucoseFasting)) {
                        metrics.push({
                           label: "Đường huyết đói",
                           value: formatMetric(input?.glucoseFasting, "mmol/L"),
                        });
                     }
                     if (isValidNumber(input?.egfr)) {
                        metrics.push({
                           label: "eGFR (Cầu thận)",
                           value: formatMetric(input?.egfr, "mL/min"),
                        });
                     }
                     if (isValidNumber(input?.acr)) {
                        metrics.push({
                           label: "Tỷ lệ ACR",
                           value: formatMetric(input?.acr, "mg/g"),
                        });
                     }
                     if (isValidNumber(input?.bmi)) {
                        metrics.push({
                           label: "BMI / Thể trạng",
                           value: `${input?.bmi} kg/m²`,
                        });
                     }
                     if (input?.isSmoking != null) {
                        metrics.push({
                           label: "Hút thuốc lá",
                           value: input.isSmoking ? "Có hút thuốc" : "Không",
                        });
                     }

                     if (metrics.length === 0) return null;

                     return (
                        <div className="flex flex-col gap-2">
                           <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
                              Chỉ số lâm sàng & Xét nghiệm chính
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {metrics.map((item, idx) => (
                                 <div
                                    key={idx}
                                    className="p-2 bg-slate-50 rounded border border-slate-200"
                                 >
                                    <span className="text-slate-500 block text-[11px]">
                                       {item.label}
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                       {item.value}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })()}

                  {/* 4. Yếu tố nguy cơ & Bệnh lý nền ghi nhận (Chỉ hiển thị khi có yếu tố) */}
                  {positiveFactors.length > 0 && (
                     <div className="flex flex-col gap-2">
                        <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
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

                  {/* 5. Cảnh báo nguy cơ cao (Red Flags nếu có) */}
                  {assessment.redFlags && assessment.redFlags.length > 0 && (
                     <div className="flex flex-col gap-2 pt-1">
                        <div className="font-bold text-rose-700 uppercase tracking-wide text-[11px]">
                           Cảnh báo nguy cơ cao
                        </div>
                        <div className="flex flex-col gap-0.5">
                           {assessment.redFlags.map((flag, idx) => (
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
                  >
                     Khám ngay
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
                     {assessment.doctor
                        ? "Thẩm định lại"
                        : "Thẩm định & Xác nhận"}
                  </CustomButton>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}

export default RiskAssessmentDetailModal;
