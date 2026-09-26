"use client";

import { useMemo, useState } from "react";
import CloverLoading from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomCalendar } from "@/components/common/custom-calendar";
import {
   useGetExaminationsQuery,
   useLazyGetExaminationByIdQuery,
} from "@/store/api/examination/examination-api";
import { Examination, ExaminationStatus } from "@/store/api/examination/type";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExaminationHistoryProps {
   healthProfileId: string;
   selectedExaminationId?: string;
   onSelectExamination: (examination: Examination) => void;
   onEditExamination?: (examination: Examination) => void;
}

const STATUS_BUTTONS: { value: ExaminationStatus | "ALL"; label: string }[] = [
   { value: "ALL", label: "Tất cả" },
   { value: "IN_PROGRESS", label: "Đang khám" },
   { value: "COMPLETED", label: "Hoàn thành" },
   { value: "CANCELLED", label: "Đã hủy" },
];

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
      className: "bg-slate-100 text-slate-600 border-slate-200",
   },
};

const formatExamDate = (dateStr?: string) => {
   if (!dateStr) return "—";
   try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
   } catch {
      return dateStr;
   }
};

const ExaminationItem = ({
   examination,
   isSelected,
   onSelectExamination,
   onEditExamination,
   isLoadingThis,
}: {
   examination: Examination;
   isSelected?: boolean;
   onSelectExamination: (examination: Examination) => void;
   onEditExamination?: (examination: Examination) => void;
   isLoadingThis?: boolean;
}) => {
   const isInProgress = examination?.status === "IN_PROGRESS";
   const statusInfo = STATUS_CONFIG[examination?.status] || {
      label: examination?.status || "Không rõ",
      className: "bg-slate-100 text-slate-600 border-slate-200",
   };

   const handleClick = () => {
      if (isInProgress && onEditExamination) {
         onEditExamination(examination);
      } else {
         onSelectExamination(examination);
      }
   };

   return (
      <div
         key={examination.id}
         onClick={handleClick}
         className={`flex flex-col gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-all ${
            isSelected
               ? "border-primary bg-primary/5 shadow-xs"
               : "border-slate-200 hover:border-slate-300 bg-white"
         }`}
      >
         <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-700">
               Lần khám:{" "}
               {formatExamDate(
                  examination?.examinationDate || examination?.createdAt,
               )}
            </span>
            <span className="text-base font-semibold text-slate-800">
               {examination?.facility?.facilityName || "Cơ sở y tế"}
            </span>
            <span className="text-xs font-medium text-slate-600 line-clamp-2">
               Chẩn đoán: {examination?.diagnosis || "Chưa có chẩn đoán"}
            </span>
         </div>

         <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 bg-slate-100 border border-slate-200 shrink-0">
               <AvatarFallback className="text-xs font-semibold text-slate-600">
                  {examination?.doctor?.fullName
                     ? examination.doctor.fullName.slice(0, 2).toUpperCase()
                     : "BS"}
               </AvatarFallback>
            </Avatar>
            <div className="text-xs font-medium flex flex-col">
               <span className="text-[11px] text-slate-400">
                  Người thực hiện
               </span>
               <span className="text-primary font-semibold">
                  {examination?.doctor?.fullName || "Chưa phân công"}
               </span>
            </div>
         </div>

         <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
               <span className="text-xs text-slate-500">Trạng thái:</span>
               <span
                  className={`w-fit px-2 py-1 rounded-full text-[11px] font-bold ${statusInfo.className}`}
               >
                  {statusInfo.label}
               </span>
            </div>
            <CustomButton
               type="button"
               onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
               }}
               isLoading={isLoadingThis}
               loadingText={isInProgress ? "Đang tải..." : "Đang mở..."}
               size="sm"
               className={cn(
                  "h-8 text-xs px-2.5 font-medium cursor-pointer",
                  isInProgress &&
                     "bg-amber-600 hover:bg-amber-700 text-white border-amber-600",
               )}
            >
               {isInProgress ? "Tiếp tục khám" : "Xem chi tiết"}
            </CustomButton>
         </div>
      </div>
   );
};

export function ExaminationHistory({
   healthProfileId,
   selectedExaminationId,
   onSelectExamination,
   onEditExamination,
}: ExaminationHistoryProps) {
   const [page, setPage] = useState(1);
   const [limit] = useState(10);
   const [status, setStatus] = useState<ExaminationStatus | "ALL">("ALL");
   const [fromDate, setFromDate] = useState<string>("");
   const [toDate, setToDate] = useState<string>("");
   const [loadingExamId, setLoadingExamId] = useState<string | null>(null);

   const [getExaminationById] = useLazyGetExaminationByIdQuery();

   const handleSelectWithApi = async (exam: Examination) => {
      setLoadingExamId(exam.id);
      try {
         const fullData = await getExaminationById(exam.id, false).unwrap();
         onSelectExamination(fullData);
      } catch (error) {
         console.error("Failed to load examination detail:", error);
         onSelectExamination(exam);
      } finally {
         setLoadingExamId(null);
      }
   };

   const handleEditWithApi = async (exam: Examination) => {
      setLoadingExamId(exam.id);
      try {
         const fullData = await getExaminationById(exam.id, false).unwrap();
         if (onEditExamination) {
            onEditExamination(fullData);
         } else {
            onSelectExamination(fullData);
         }
      } catch (error) {
         console.error("Failed to load examination for update:", error);
         if (onEditExamination) {
            onEditExamination(exam);
         } else {
            onSelectExamination(exam);
         }
      } finally {
         setLoadingExamId(null);
      }
   };

   const {
      data: examinations,
      isFetching,
      isLoading,
   } = useGetExaminationsQuery({
      healthProfileId,
      page,
      limit,
      status: status === "ALL" ? undefined : status,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
   });

   const examinationList = useMemo(() => {
      return examinations?.data || [];
   }, [examinations]);

   const hasActiveFilter =
      status !== "ALL" || Boolean(fromDate) || Boolean(toDate);

   const handleResetFilters = () => {
      setStatus("ALL");
      setFromDate("");
      setToDate("");
      setPage(1);
   };

   return (
      <ScrollArea className="h-[calc(100vh-22rem)] -mr-4 pr-4">
         <div className="flex flex-col gap-3 pb-2">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">
                     Lịch sử khám bệnh
                  </span>
                  {typeof examinations?.total === "number" && (
                     <span className="text-xs font-semibold text-slate-700">
                        ({examinations.total})
                     </span>
                  )}
               </div>
               {hasActiveFilter && (
                  <button
                     type="button"
                     onClick={handleResetFilters}
                     className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                     title="Đặt lại bộ lọc"
                  >
                     <RotateCcw className="w-3 h-3" />
                     <span>Đặt lại</span>
                  </button>
               )}
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">
                     Trạng thái
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                     {STATUS_BUTTONS.map((item) => {
                        const isActive = status === item.value;
                        return (
                           <CustomButton
                              key={item.value}
                              type="button"
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              onClick={() => {
                                 setStatus(item.value);
                                 setPage(1);
                              }}
                              className={cn(
                                 "h-7 text-xs font-medium px-2 justify-center cursor-pointer",
                                 isActive
                                    ? "font-semibold shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 border-slate-200 bg-white",
                              )}
                           >
                              {item.label}
                           </CustomButton>
                        );
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <CustomCalendar
                     label="Từ ngày"
                     value={fromDate}
                     onChange={(dateStr) => {
                        setFromDate(dateStr);
                        setPage(1);
                     }}
                     placeholder="Chọn ngày"
                     size="sm"
                  />
                  <CustomCalendar
                     label="Đến ngày"
                     value={toDate}
                     onChange={(dateStr) => {
                        setToDate(dateStr);
                        setPage(1);
                     }}
                     placeholder="Chọn ngày"
                     size="sm"
                  />
               </div>
            </div>

            {/* Danh sách lượt khám */}
            <div className="flex-1">
               {isLoading || isFetching ? (
                  <div className="flex items-center justify-center py-6">
                     <CloverLoading size="sm" />
                  </div>
               ) : examinationList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                     Không tìm thấy lượt khám nào
                  </div>
               ) : (
                  <div className="flex flex-col gap-2.5">
                     {examinationList?.map((examination) => (
                        <ExaminationItem
                           key={examination.id}
                           examination={examination}
                           isSelected={selectedExaminationId === examination.id}
                           onSelectExamination={handleSelectWithApi}
                           onEditExamination={handleEditWithApi}
                           isLoadingThis={loadingExamId === examination.id}
                        />
                     ))}
                  </div>
               )}
            </div>
         </div>
      </ScrollArea>
   );
}
