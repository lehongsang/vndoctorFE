"use client";

import { useState } from "react";
import { format } from "date-fns";
import { RiskAssessmentResult } from "@/store/api/risk-factor-assessment/type";
import { useGetStaffRiskAssessmentsQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { CustomButton } from "@/components/common/custom-button";
import { CustomPagination } from "@/components/common/custom-pagination";
import { CloverLoading } from "@/components/common/clover-loading";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import RiskAssessmentEvaluationModal from "./risk-assessment-evaluation-modal";
import RiskAssessmentDetailModal from "./risk-assessment-detail-modal";

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

         <RiskAssessmentDetailModal
            assessment={selectedItem}
            isOpen={Boolean(selectedItem)}
            onClose={() => setSelectedItem(null)}
         />

         {/* Modal Thẩm định & Xác nhận phân tầng */}
         <RiskAssessmentEvaluationModal
            isOpen={Boolean(evaluatingItem)}
            onClose={() => setEvaluatingItem(null)}
            assessment={evaluatingItem}
         />
      </div>
   );
}
