"use client";

import React from "react";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { Consultation } from "@/store/api/consultation/type";
import { formatDate } from "@/lib/utils";

export interface ConsultationTableProps {
   data: Consultation[];
   isLoading: boolean;
   isFetching: boolean;
   page: number;
   limit: number;
   onViewDetail: (item: Consultation) => void;
   onProvideConclusion?: (item: Consultation) => void;
}

export const STATUS_CONFIG: Record<
   string,
   { label: string; bg: string; text: string; border?: string }
> = {
   PENDING: {
      label: "Chờ hội chẩn",
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-200",
   },
   IN_PROGRESS: {
      label: "Đang hội chẩn",
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-200",
   },
   COMPLETED: {
      label: "Đã có kết luận",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
   },
   RESOLVED: {
      label: "Đã có kết luận",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-200",
   },
   CANCELLED: {
      label: "Đã hủy",
      bg: "bg-rose-100",
      text: "text-rose-700",
      border: "border-rose-200",
   },
};

export const STATUS_MAP = STATUS_CONFIG;
export const CONSULTATION_STATUS_CONFIG = STATUS_CONFIG;

interface ConsultationColumn {
   id: string;
   header: React.ReactNode;
   headerClassName?: string;
   cellClassName?: string;
   cell: (item: Consultation, index: number) => React.ReactNode;
}

export function ConsultationTable({
   data,
   isLoading,
   isFetching,
   page,
   limit,
   onViewDetail,
   onProvideConclusion,
}: ConsultationTableProps) {
   const columns: ConsultationColumn[] = [
      {
         id: "stt",
         header: "STT",
         headerClassName: "w-14 pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "w-14 pl-4 text-xs text-slate-600 font-medium",
         cell: (_item, index) => (page - 1) * limit + index + 1,
      },
      {
         id: "patient",
         header: "Bệnh nhân",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-44",
         cellClassName: "py-2.5",
         cell: (item) => {
            const patient =
               item.healthProfile || item.examination?.healthProfile;
            const patientName =
               patient?.fullName || item.consultationCode || "—";
            const phoneNumber = patient?.phoneNumber;

            return (
               <div className="flex flex-col gap-0.5">
                  <span
                     className="font-medium text-sm text-blue-800 hover:text-blue-900 underline cursor-pointer"
                     onClick={() => onViewDetail(item)}
                  >
                     {patientName}
                  </span>
                  {phoneNumber && (
                     <span className="text-xs text-slate-500 font-normal">
                        {phoneNumber}
                     </span>
                  )}
               </div>
            );
         },
      },
      {
         id: "reason",
         header: "Lý do & Nội dung hội chẩn",
         headerClassName:
            "text-xs font-semibold text-slate-600 min-w-64 max-w-sm",
         cellClassName: "py-2.5 whitespace-normal break-words max-w-sm",
         cell: (item) => (
            <div className="flex flex-col gap-0.5 whitespace-normal wrap-break-word max-w-sm">
               <span className="font-medium text-xs text-slate-900 whitespace-normal wrap-break-word">
                  {item.reason || "—"}
               </span>
               {item.conclusion && (
                  <span className="text-xs text-emerald-700 font-medium whitespace-normal wrap-break-word">
                     [Kết luận: {item.conclusion}]
                  </span>
               )}
            </div>
         ),
      },
      {
         id: "requestingDoctor",
         header: "Bác sĩ yêu cầu",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-36",
         cellClassName: "py-2.5",
         cell: (item) => (
            <span className="text-xs text-slate-700 font-medium">
               {item.requestingDoctor?.fullName ||
                  item.examination?.doctor?.fullName || (
                     <span className="text-slate-400 italic">
                        Bác sĩ điều trị
                     </span>
                  )}
            </span>
         ),
      },
      {
         id: "status",
         header: "Trạng thái",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-32",
         cellClassName: "py-2.5",
         cell: (item) => {
            const statusConfig = STATUS_CONFIG[item.status] || {
               label: item.status,
               bg: "bg-slate-100",
               text: "text-slate-600",
            };
            return (
               <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
               >
                  {statusConfig.label}
               </span>
            );
         },
      },
      {
         id: "createdAt",
         header: "Thời gian gửi",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-36",
         cellClassName: "py-2.5",
         cell: (item) => (
            <span className="text-xs text-slate-600 font-medium">
               {item.requestedAt || item.createdAt
                  ? formatDate(item.requestedAt || item.createdAt, true)
                  : "—"}
            </span>
         ),
      },
      {
         id: "resolvedAt",
         header: "Thời gian xử lý",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-36",
         cellClassName: "py-2.5",
         cell: (item) => {
            const time =
               item.respondedAt ||
               (item.status === "COMPLETED" || item.status === "RESOLVED"
                  ? item.updatedAt
                  : undefined);
            return (
               <span className="text-xs text-slate-600 font-medium">
                  {time ? (
                     formatDate(time, true)
                  ) : (
                     <span className="text-slate-400 italic">Chưa xử lý</span>
                  )}
               </span>
            );
         },
      },
      {
         id: "actions",
         header: "Thao tác",
         headerClassName:
            "text-right text-xs font-semibold text-slate-600 pr-4",
         cellClassName: "py-2 text-right pr-4",
         cell: (item) => (
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
               {onProvideConclusion &&
                  (item.status === "PENDING" ||
                     item.status === "IN_PROGRESS") && (
                     <CustomButton
                        size="sm"
                        className="h-8 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => onProvideConclusion(item)}
                     >
                        Hội chẩn
                     </CustomButton>
                  )}

               <CustomButton
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => onViewDetail(item)}
               >
                  Chi tiết
               </CustomButton>
            </div>
         ),
      },
   ];

   return (
      <div className="w-full">
         <Table>
            <TableHeader>
               <TableRow className="hover:bg-transparent hover:shadow-none">
                  {columns.map((col) => (
                     <TableHead key={col.id} className={col.headerClassName}>
                        {col.header}
                     </TableHead>
                  ))}
               </TableRow>
            </TableHeader>
            <TableBody>
               {isFetching || isLoading ? (
                  <TableRow>
                     <TableCell
                        colSpan={columns.length}
                        className="h-48 text-center"
                     >
                        <CloverLoading
                           size="md"
                           text="Đang tải danh sách phiếu hội chẩn..."
                        />
                     </TableCell>
                  </TableRow>
               ) : data.length === 0 ? (
                  <TableRow>
                     <TableCell
                        colSpan={columns.length}
                        className="h-48 text-center text-sm text-slate-500"
                     >
                        Chưa có phiếu hội chẩn nào.
                     </TableCell>
                  </TableRow>
               ) : (
                  data.map((item, index) => (
                     <TableRow
                        key={item.id}
                        
                     >
                        {columns.map((col) => (
                           <TableCell
                              key={col.id}
                              className={col.cellClassName ?? "py-0"}
                           >
                              {col.cell(item, index)}
                           </TableCell>
                        ))}
                     </TableRow>
                  ))
               )}
            </TableBody>
         </Table>
      </div>
   );
}

export default ConsultationTable;
