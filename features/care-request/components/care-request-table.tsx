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
import { CareRequest, CareRequestStatus } from "@/store/api/care-request/type";
import { formatDate } from "@/lib/utils";

export interface CareRequestTableProps {
   data: CareRequest[];
   isLoading: boolean;
   isFetching: boolean;
   page: number;
   limit: number;
   onViewDetail: (item: CareRequest) => void;
   onReceive: (item: CareRequest) => void;
   onResolve: (item: CareRequest) => void;
   onCancel: (item: CareRequest) => void;
}

export const STATUS_CONFIG: Record<
   CareRequestStatus,
   { label: string; bg: string; text: string; border: string }
> = {
   PENDING: {
      label: "Chờ tiếp nhận",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
   },
   IN_PROGRESS: {
      label: "Đang xử lý",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
   },
   RESOLVED: {
      label: "Đã hoàn thành",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
   },
   CANCELLED: {
      label: "Đã hủy",
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
   },
};

export const STATUS_MAP = STATUS_CONFIG;

interface CareRequestColumn {
   id: string;
   header: React.ReactNode;
   headerClassName?: string;
   cellClassName?: string;
   cell: (item: CareRequest, index: number) => React.ReactNode;
}

export function CareRequestTable({
   data,
   isLoading,
   isFetching,
   page,
   limit,
   onViewDetail,
   onReceive,
   onResolve,
   onCancel,
}: CareRequestTableProps) {
   const columns: CareRequestColumn[] = [
      {
         id: "stt",
         header: "STT",
         headerClassName: "w-14 pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "w-14 pl-4 text-xs text-slate-600 font-medium",
         cell: (_item, index) => (page - 1) * limit + index + 1,
      },
      {
         id: "requestCode",
         header: "Mã yêu cầu",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-36",
         cellClassName: "py-2.5",
         cell: (item) => (
            <span
               className="font-medium text-sm text-blue-800 underline cursor-pointer"
               onClick={() => onViewDetail(item)}
            >
               {item.requestCode || "—"}
            </span>
         ),
      },
      {
         id: "title",
         header: "Tiêu đề & Nội dung",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-64",
         cellClassName: "py-2.5",
         cell: (item) => (
            <div className="flex flex-col gap-0.5 max-w-md">
               <span className="font-medium text-xs text-slate-900 truncate">
                  {item.title}
               </span>
               <span className="text-xs text-slate-500 line-clamp-1">
                  {item.description}
               </span>
               {item.mediaUrls && item.mediaUrls.length > 0 && (
                  <span className="text-[11px] text-blue-600 font-medium">
                     [{item.mediaUrls.length} tệp đính kèm]
                  </span>
               )}
            </div>
         ),
      },
      {
         id: "assignedUser",
         header: "Người tiếp nhận",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-36",
         cellClassName: "py-2.5",
         cell: (item) => (
            <span className="text-xs text-slate-700 font-medium">
               {item.assignedUser?.fullName || (
                  <span className="text-slate-400 italic">Chưa tiếp nhận</span>
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
               border: "border-slate-200",
            };
            return (
               <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
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
               {item.createdAt ? formatDate(item.createdAt, true) : "—"}
            </span>
         ),
      },
      {
         id: "actions",
         header: "Thao tác",
         headerClassName: "text-right text-xs font-semibold text-slate-600 pr-4",
         cellClassName: "py-2 text-right pr-4",
         cell: (item) => (
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
               <CustomButton
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => onViewDetail(item)}
               >
                  Chi tiết
               </CustomButton>

               {item.status === "PENDING" && (
                  <CustomButton
                     size="sm"
                     className="h-8 px-2.5 text-xs"
                     onClick={() => onReceive(item)}
                  >
                     Tiếp nhận
                  </CustomButton>
               )}

               {item.status === "IN_PROGRESS" && (
                  <CustomButton
                     size="sm"
                     className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                     onClick={() => onResolve(item)}
                  >
                     Hoàn thành
                  </CustomButton>
               )}

               {(item.status === "PENDING" || item.status === "IN_PROGRESS") && (
                  <CustomButton
                     variant="outline"
                     size="sm"
                     className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                     onClick={() => onCancel(item)}
                  >
                     Hủy
                  </CustomButton>
               )}
            </div>
         ),
      },
   ];

   return (
      <div className="w-full">
         <Table>
            <TableHeader className="bg-slate-50/60">
               <TableRow className="hover:bg-transparent border-b border-slate-300">
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
                           text="Đang tải danh sách yêu cầu chăm sóc..."
                        />
                     </TableCell>
                  </TableRow>
               ) : data.length === 0 ? (
                  <TableRow>
                     <TableCell
                        colSpan={columns.length}
                        className="h-48 text-center text-sm text-slate-500"
                     >
                        Chưa có yêu cầu chăm sóc nào.
                     </TableCell>
                  </TableRow>
               ) : (
                  data.map((item, index) => (
                     <TableRow
                        key={item.id}
                        className="border-b border-slate-300 transition-colors hover:bg-slate-100"
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

export default CareRequestTable;
