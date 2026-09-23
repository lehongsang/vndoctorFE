"use client";

import * as React from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";
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
   const router = useRouter();

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
         if (profileId) {
            router.push(
               `/work?profileId=${profileId}&action=create&assessmentId=${assessment.id}`,
            );
         } else {
            router.push(`/work?action=create&assessmentId=${assessment.id}`);
         }
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
                        <div className="text-xs">
                           Xác suất biến cố 10 năm:{" "}
                           <span className="text-base font-extrabold text-slate-900">
                              {assessment.riskScore}%
                           </span>
                        </div>
                     </div>

                     <p className="text-[11px] text-slate-500 italic">
                        * Kết quả đánh giá này dựa trên các chỉ số của hiệp hội
                        tim mạch châu âu
                     </p>
                  </div>

                  {/* 2. Thẩm định & Kết luận chuyên môn của bác sĩ */}
                  <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 flex flex-col gap-2">
                     <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                           Thẩm định chuyên môn
                        </span>
                        <span className="text-[11px]">
                           {assessment.doctor ? (
                              <span className="text-slate-600">
                                 Bác sĩ:{" "}
                                 <strong className="text-slate-800 font-semibold">
                                    {assessment.doctor.fullName}
                                 </strong>
                              </span>
                           ) : (
                              <span className="text-amber-600 font-medium">
                                 Chưa qua thẩm định
                              </span>
                           )}
                        </span>
                     </div>

                     {assessment.conclusion ? (
                        <div className="text-xs text-slate-700">
                           <span className="font-semibold text-slate-900">
                              Kết luận:{" "}
                           </span>
                           {assessment.conclusion}
                        </div>
                     ) : (
                        <div className="text-xs text-slate-400 italic">
                           Chưa có kết luận từ bác sĩ
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

                  {/* 3. Chỉ số lâm sàng & Xét nghiệm cốt lõi */}
                  <div className="flex flex-col gap-2">
                     <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
                        Chỉ số lâm sàng & Xét nghiệm chính
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Huyết áp
                           </span>
                           <span className="font-semibold text-slate-800">
                              {input?.systolicBp || input?.diastolicBp
                                 ? `${input?.systolicBp || "—"}/${input?.diastolicBp || "—"} mmHg`
                                 : "—"}
                           </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Cholesterol TP
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input?.totalCholesterol, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              HDL-Cholesterol
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input?.hdlCholesterol, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Đường huyết đói
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input?.glucoseFasting, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              eGFR (Cầu thận)
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input?.egfr, "mL/min")}
                           </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Tỷ lệ ACR
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input?.acr, "mg/g")}
                           </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              BMI / Thể trạng
                           </span>
                           <span className="font-semibold text-slate-800">
                              {input?.bmi ? `${input.bmi} kg/m²` : "—"}
                           </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Hút thuốc lá
                           </span>
                           <span className="font-semibold text-slate-800">
                              {input?.isSmoking ? "Có hút thuốc" : "Không"}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* 4. Yếu tố nguy cơ & Bệnh lý nền ghi nhận (Chỉ hiển thị các yếu tố CÓ) */}
                  <div className="flex flex-col gap-2">
                     <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
                        Yếu tố nguy cơ & Bệnh nền ghi nhận
                     </div>
                     {positiveFactors.length > 0 ? (
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
                     ) : (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 text-center">
                           Không ghi nhận tổn thương cơ quan đích hoặc biến cố
                           tim mạch nặng lúc đánh giá.
                        </div>
                     )}
                  </div>

                  {/* 5. Cảnh báo nguy cơ cao (Red Flags nếu có) */}
                  {assessment.redFlags && assessment.redFlags.length > 0 && (
                     <div className="flex flex-col gap-2 pt-1">
                        <div className="font-bold text-rose-700 uppercase tracking-wide text-[11px] pb-1 border-b border-rose-200">
                           Cảnh báo nguy cơ cao (Red Flags)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {assessment.redFlags.map((flag, idx) => (
                              <div
                                 key={idx}
                                 className="p-2 bg-white rounded border border-rose-200 text-xs flex items-center justify-between gap-2"
                              >
                                 <span className="font-medium text-slate-800">
                                    {flag.title || flag.metric}
                                 </span>
                                 <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-rose-100 text-rose-700">
                                    {flag.value}
                                 </span>
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
                     <Stethoscope className="w-3.5 h-3.5" />
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
