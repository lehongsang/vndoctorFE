"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
   RiskAssessmentResult,
   AssessmentInput,
} from "@/store/api/risk-factor-assessment/type";
import { useGetStaffRiskAssessmentsQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { CustomButton } from "@/components/common/custom-button";
import { CustomPagination } from "@/components/common/custom-pagination";
import { CloverLoading } from "@/components/common/clover-loading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import RiskAssessmentEvaluationModal from "./risk-assessment-evaluation-modal";

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

export interface RiskAssessmentHistoryProps {
   healthProfileId?: string;
   selectedAssessmentId?: string;
   onSelectAssessment?: (assessment: RiskAssessmentResult) => void;
}

const RiskAssessmentCardItem = ({
   record,
   isSelected,
   onSelect,
   onEvaluate,
   onViewDetails,
}: {
   record: RiskAssessmentResult;
   isSelected?: boolean;
   onSelect?: (record: RiskAssessmentResult) => void;
   onEvaluate: (record: RiskAssessmentResult) => void;
   onViewDetails: (record: RiskAssessmentResult) => void;
}) => {
   const dateStr = record.evaluatedAt || record.createdAt;
   const formattedDate = dateStr
      ? format(new Date(dateStr), "dd/MM/yyyy HH:mm")
      : "—";

   const hasDisease = record.assessmentInput?.hasUnderlyingDisease;
   const bp =
      record.assessmentInput?.systolicBp && record.assessmentInput?.diastolicBp
         ? `${record.assessmentInput.systolicBp}/${record.assessmentInput.diastolicBp} mmHg`
         : null;

   const riskColorConfig = {
      VERY_HIGH: {
         badge: "bg-rose-50 text-rose-700 border-rose-200",
         label: "Nguy cơ rất cao",
         border: "hover:border-rose-300",
      },
      HIGH: {
         badge: "bg-amber-50 text-amber-700 border-amber-200",
         label: "Nguy cơ cao",
         border: "hover:border-amber-300",
      },
      LOW: {
         badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
         label: "Nguy cơ thấp",
         border: "hover:border-emerald-300",
      },
   };

   const riskInfo = riskColorConfig[
      record.riskLevel as keyof typeof riskColorConfig
   ] || {
      badge: "bg-slate-50 text-slate-700 border-slate-200",
      label: record.riskLevel || "Chưa rõ",
      border: "hover:border-slate-300",
   };

   return (
      <div
         onClick={() => {
            if (onSelect) onSelect(record);
            else onViewDetails(record);
         }}
         className={cn(
            "flex flex-col gap-2.5 p-3 rounded-lg border bg-white transition-all cursor-pointer shadow-2xs",
            isSelected
               ? "border-primary bg-primary/5 ring-1 ring-primary/20"
               : cn("border-slate-200", riskInfo.border),
         )}
      >
         {/* Row 1: Header - Ngày đánh giá & Phân loại */}
         <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
               {formattedDate}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
               {hasDisease ? "Non-ASCVD" : "SCORE2"}
            </span>
         </div>

         {/* Row 2: Mức nguy cơ & Điểm 10 năm */}
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
               <span
                  className={cn(
                     "px-2 py-0.5 rounded-full text-xs font-bold border",
                     riskInfo.badge,
                  )}
               >
                  {riskInfo.label}
               </span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-[11px] text-slate-500">
                  Biến cố 10 năm:
               </span>
               <span className="text-xs font-extrabold text-slate-900">
                  {record.riskScore}%
               </span>
            </div>
         </div>

         {/* Row 3: Chỉ số tóm tắt nếu có */}
         {bp && (
            <div className="text-[11px] text-slate-600 flex items-center gap-1 flex-wrap">
               <span className="text-slate-400">HA:</span>
               <span className="font-semibold text-slate-700">{bp}</span>
               {record.assessmentInput?.totalCholesterol && (
                  <>
                     <span className="text-slate-300">•</span>
                     <span className="text-slate-400">Cholesterol TP:</span>
                     <span className="font-semibold text-slate-700">
                        {record.assessmentInput.totalCholesterol} mmol/L
                     </span>
                  </>
               )}
            </div>
         )}

         {/* Row 4: Người thực hiện & Thao tác */}
         <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
               <Avatar className="w-6 h-6 bg-slate-100 border border-slate-200 shrink-0">
                  <AvatarFallback className="text-[10px] font-semibold text-slate-600">
                     {record.doctor?.fullName
                        ? record.doctor.fullName.slice(0, 2).toUpperCase()
                        : "HT"}
                  </AvatarFallback>
               </Avatar>
               <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-slate-400 leading-tight">
                     Người thực hiện
                  </span>
                  <span className="text-xs font-medium text-slate-800 truncate">
                     {record.doctor?.fullName || (
                        <span className="text-amber-600 font-normal">
                           Chờ thẩm định
                        </span>
                     )}
                  </span>
               </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
               <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  onClick={(e) => {
                     e.stopPropagation();
                     onEvaluate(record);
                  }}
               >
                  {record.doctor ? "Thẩm định lại" : "Thẩm định"}
               </CustomButton>
               <CustomButton
                  type="button"
                  size="sm"
                  className="h-7 text-xs px-2 font-medium cursor-pointer"
                  onClick={(e) => {
                     e.stopPropagation();
                     onViewDetails(record);
                  }}
               >
                  Chi tiết
               </CustomButton>
            </div>
         </div>
      </div>
   );
};

export function RiskAssessmentHistory({
   healthProfileId,
   selectedAssessmentId,
   onSelectAssessment,
}: RiskAssessmentHistoryProps) {
   const [page, setPage] = useState<number>(1);
   const [selectedItem, setSelectedItem] =
      useState<RiskAssessmentResult | null>(null);
   const [evaluatingItem, setEvaluatingItem] =
      useState<RiskAssessmentResult | null>(null);

   const { data, isLoading } = useGetStaffRiskAssessmentsQuery(
      {
         healthProfileId,
         page,
         limit: 10,
      },
      { skip: !healthProfileId },
   );

   if (!healthProfileId) {
      return (
         <div className="py-8 px-4 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-lg">
            Vui lòng chọn một hồ sơ bệnh nhân từ danh sách để xem lịch sử phân
            tầng.
         </div>
      );
   }

   if (isLoading) {
      return (
         <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <CloverLoading size="sm" variant="primary" />
            <span>Đang tải lịch sử đánh giá...</span>
         </div>
      );
   }

   const items: RiskAssessmentResult[] = data?.data || data?.items || [];
   const total = data?.total ?? items.length;
   const totalPages = Math.ceil(total / 10) || 1;

   const getRiskBadge = (level: string) => {
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

   const formatMetric = (val?: number | string | null, unit: string = "") => {
      if (val === null || val === undefined || val === "") return "—";
      const num = Number(val);
      if (isNaN(num)) return `${val} ${unit}`.trim();
      return `${num} ${unit}`.trim();
   };

   const input = selectedItem?.assessmentInput;

   return (
      <div className="flex flex-col gap-2">
         <div className="flex items-center justify-between px-1 mb-2">
            <h4 className="text-xs font-semibold text-slate-500">
               Lịch sử phân tầng ({total})
            </h4>
         </div>

         {items.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-lg">
               Chưa có lịch sử phân tầng nguy cơ nào cho bệnh nhân này.
            </div>
         ) : (
            <ScrollArea className="h-[calc(100vh-22rem)] -mr-4 pr-4">
               <div className="flex flex-col gap-2.5 pb-2">
                  {items.map((record) => (
                     <RiskAssessmentCardItem
                        key={record.id}
                        record={record}
                        isSelected={selectedAssessmentId === record.id}
                        onSelect={onSelectAssessment}
                        onEvaluate={(item) => setEvaluatingItem(item)}
                        onViewDetails={(item) => setSelectedItem(item)}
                     />
                  ))}
               </div>
            </ScrollArea>
         )}

         {totalPages > 1 && (
            <div className="pt-1">
               <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={10}
                  onPageChange={setPage}
               />
            </div>
         )}

         {/* Modal xem chi tiết phân tầng nguy cơ sử dụng ScrollArea */}
         <Dialog
            open={Boolean(selectedItem)}
            onOpenChange={(open) => {
               if (!open) setSelectedItem(null);
            }}
         >
            <DialogContent className="sm:min-w-2xl rounded-sm p-0 gap-0 overflow-hidden">
               <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200">
                  <DialogTitle className="text-base font-bold text-slate-900">
                     Chi tiết phân tầng nguy cơ tim mạch
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                     Thời gian:{" "}
                     {selectedItem?.evaluatedAt || selectedItem?.createdAt
                        ? format(
                             new Date(
                                selectedItem.evaluatedAt ||
                                   selectedItem.createdAt ||
                                   "",
                             ),
                             "dd/MM/yyyy HH:mm:ss",
                          )
                        : "—"}
                  </DialogDescription>
               </DialogHeader>

               {selectedItem &&
                  (() => {
                     const positiveFactors = getPositiveFactors(input);
                     return (
                        <>
                           <ScrollArea className="max-h-[72vh]">
                              <div className="p-4 sm:p-5 space-y-4 text-xs">
                                 {/* 1. Kết quả phân tầng tổng quan */}
                                 <div
                                    className={cn(
                                       "p-3.5 rounded-lg border flex flex-col gap-2",
                                       selectedItem.riskLevel === "VERY_HIGH"
                                          ? "bg-rose-50/80 border-rose-300 text-rose-950"
                                          : selectedItem.riskLevel === "HIGH"
                                            ? "bg-amber-50/80 border-amber-300 text-amber-950"
                                            : "bg-emerald-50/80 border-emerald-300 text-emerald-950",
                                    )}
                                 >
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                       <div className="flex items-center gap-2">
                                          <span className="font-bold text-xs">
                                             Phân tầng nguy cơ:
                                          </span>
                                          {getRiskBadge(selectedItem.riskLevel)}
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
                                             {selectedItem.riskScore}%
                                          </span>
                                       </div>
                                    </div>

                                    <p className="text-[11px] text-slate-500 italic">
                                       * Kết quả đánh giá này dựa trên các chỉ
                                       số của hiệp hội tim mạch châu âu
                                    </p>
                                 </div>

                                 {/* 2. Thẩm định & Kết luận chuyên môn của bác sĩ */}
                                 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                                       <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                                          Thẩm định chuyên môn
                                       </span>
                                       <span className="text-[11px]">
                                          {selectedItem.doctor ? (
                                             <span className="text-slate-600">
                                                Bác sĩ:{" "}
                                                <strong className="text-slate-800 font-semibold">
                                                   {
                                                      selectedItem.doctor
                                                         .fullName
                                                   }
                                                </strong>
                                             </span>
                                          ) : (
                                             <span className="text-amber-600 font-medium">
                                                Chưa qua thẩm định
                                             </span>
                                          )}
                                       </span>
                                    </div>

                                    {selectedItem.conclusion ? (
                                       <div className="text-xs text-slate-700">
                                          <span className="font-semibold text-slate-900">
                                             Kết luận:{" "}
                                          </span>
                                          {selectedItem.conclusion}
                                       </div>
                                    ) : (
                                       <div className="text-xs text-slate-400 italic">
                                          Chưa có kết luận từ bác sĩ
                                       </div>
                                    )}

                                    {selectedItem.recommendations && (
                                       <div className="text-xs text-slate-700">
                                          <span className="font-semibold text-slate-900">
                                             Khuyến nghị điều trị:{" "}
                                          </span>
                                          {selectedItem.recommendations}
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
                                             {input?.systolicBp ||
                                             input?.diastolicBp
                                                ? `${input?.systolicBp || "—"}/${input?.diastolicBp || "—"} mmHg`
                                                : "—"}
                                          </span>
                                       </div>
                                       <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                          <span className="text-slate-500 block text-[11px]">
                                             Cholesterol TP
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {formatMetric(
                                                input?.totalCholesterol,
                                                "mmol/L",
                                             )}
                                          </span>
                                       </div>
                                       <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                          <span className="text-slate-500 block text-[11px]">
                                             HDL-Cholesterol
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {formatMetric(
                                                input?.hdlCholesterol,
                                                "mmol/L",
                                             )}
                                          </span>
                                       </div>
                                       <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                          <span className="text-slate-500 block text-[11px]">
                                             Đường huyết đói
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {formatMetric(
                                                input?.glucoseFasting,
                                                "mmol/L",
                                             )}
                                          </span>
                                       </div>
                                       <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                          <span className="text-slate-500 block text-[11px]">
                                             eGFR (Cầu thận)
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {formatMetric(
                                                input?.egfr,
                                                "mL/min",
                                             )}
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
                                             {input?.bmi
                                                ? `${input.bmi} kg/m²`
                                                : "—"}
                                          </span>
                                       </div>
                                       <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                          <span className="text-slate-500 block text-[11px]">
                                             Hút thuốc lá
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {input?.isSmoking
                                                ? "Có hút thuốc"
                                                : "Không"}
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
                                          {positiveFactors.map(
                                             (factor, idx) => (
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
                                             ),
                                          )}
                                       </div>
                                    ) : (
                                       <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 text-center">
                                          Không ghi nhận tổn thương cơ quan đích
                                          hoặc biến cố tim mạch nặng lúc đánh
                                          giá.
                                       </div>
                                    )}
                                 </div>

                                 {/* 5. Cảnh báo nguy cơ cao (Red Flags nếu có) */}
                                 {selectedItem.redFlags &&
                                    selectedItem.redFlags.length > 0 && (
                                       <div className="flex flex-col gap-2 pt-1">
                                          <div className="font-bold text-rose-700 uppercase tracking-wide text-[11px] pb-1 border-b border-rose-200">
                                             Cảnh báo nguy cơ cao (Red Flags)
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                             {selectedItem.redFlags.map(
                                                (flag, idx) => (
                                                   <div
                                                      key={idx}
                                                      className="p-2 bg-white rounded border border-rose-200 text-xs flex items-center justify-between gap-2"
                                                   >
                                                      <span className="font-medium text-slate-800">
                                                         {flag.title ||
                                                            flag.metric}
                                                      </span>
                                                      <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-rose-100 text-rose-700">
                                                         {flag.value}
                                                      </span>
                                                   </div>
                                                ),
                                             )}
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
                                 onClick={() => setSelectedItem(null)}
                                 className="text-xs h-8 px-3 cursor-pointer"
                              >
                                 Đóng
                              </CustomButton>

                              <CustomButton
                                 type="button"
                                 size="sm"
                                 className="h-8 text-xs font-semibold px-4 cursor-pointer"
                                 onClick={() => {
                                    const item = selectedItem;
                                    setSelectedItem(null);
                                    setEvaluatingItem(item);
                                 }}
                              >
                                 {selectedItem.doctor
                                    ? "Thẩm định lại"
                                    : "Thẩm định & Xác nhận"}
                              </CustomButton>
                           </div>
                        </>
                     );
                  })()}
            </DialogContent>
         </Dialog>

         {/* Modal Thẩm định & Xác nhận phân tầng */}
         <RiskAssessmentEvaluationModal
            isOpen={Boolean(evaluatingItem)}
            onClose={() => setEvaluatingItem(null)}
            assessment={evaluatingItem}
         />
      </div>
   );
}
