"use client";

import { useState } from "react";
import { CustomButton } from "@/components/common/custom-button";
import type { CareSubscriptions } from "@/store/api/coordinate/type";
import { Edit, Eye, Trash } from "lucide-react";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { CloverLoading } from "@/components/common/clover-loading";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { CareSubscriptionDetail } from "./care-subcription-detailt";

interface CoordinateTableColumn {
   id: string;
   header: React.ReactNode;
   headerClassName?: string;
   cellClassName?: string;
   cell: (data: CareSubscriptions, index: number) => React.ReactNode;
}

interface CoordinateTableProps {
   careSubcriptions: CareSubscriptions[];
   isFetching: boolean;
   isLoading: boolean;
   onViewDetail?: (id: string) => void;
   onCloseDetail?: () => void;
   onEdit?: (id: string) => void;
   onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<
   string,
   { label: string; bg: string; text: string; border: string }
> = {
   PENDING: {
      label: "Chờ điều phối",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
   },
   ACTIVE: {
      label: "Đang hoạt động",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
   },
   EXPIRED: {
      label: "Đã hết hạn",
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
   },
   CANCELLED: {
      label: "Đã hủy",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
   },
};

export default function CoordinateTable({
   careSubcriptions,
   isFetching,
   isLoading,
   onViewDetail,
   onCloseDetail,
   onEdit,
   onDelete,
}: CoordinateTableProps) {
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [deletingSubscription, setDeletingSubscription] =
      useState<CareSubscriptions | null>(null);

   const handleViewDetail = (id: string) => {
      setSelectedId(id);
      if (onViewDetail) {
         onViewDetail(id);
      }
   };
   const handleEdit = (id: string) => {
      if (onEdit) {
         onEdit(id);
         return;
      }
      console.log(id);
   };
   const handleDelete = (id: string) => {
      if (onDelete) {
         onDelete(id);
         return;
      }
      console.log(id);
   };

   const columns: CoordinateTableColumn[] = [
      {
         id: "stt",
         header: "STT",
         headerClassName: "pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "pl-4 py-2 text-xs text-slate-600 font-medium",
         cell: (data: CareSubscriptions, index: number) => index + 1,
      },
      {
         id: "name",
         header: "Khách hàng",
         headerClassName: "pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "pl-4 py-2 text-sm text-slate-600 font-medium",
         cell: (data: CareSubscriptions) => data.healthProfile?.fullName || "—",
      },
      {
         id: "package",
         header: "Gói",
         headerClassName: "pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "pl-4 py-2 text-xs text-slate-600 font-medium",
         cell: (data: CareSubscriptions) => (
            <div className="flex items-center gap-1">
               <div>{data.carePackage?.name}</div>
               <span
                  className={`text-xs py-1 px-2 rounded-sm inline-block w-fit ${
                     data.carePackage?.type === "STANDARD"
                        ? "text-blue-600 bg-blue-100 font-medium"
                        : "text-amber-600 bg-amber-100 font-medium"
                  }`}
               >
                  {data.carePackage?.type === "STANDARD" ? "Cơ bản" : "Vip"}
               </span>
            </div>
         ),
      },
      {
         id: "coordinator",
         header: "Điều phối",
         headerClassName: "pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "pl-4 py-2 text-xs text-slate-600 font-medium",
         cell: (data: CareSubscriptions) => {
            const isVip = data.carePackage?.type === "VIP";
            const maxStaff = isVip ? 3 : 2;
            let assignCount = 0;
            if (data?.assignedDoctorId || data?.assignedDoctor) assignCount++;
            if (data?.assignedNurseId || data?.assignedNurse) assignCount++;
            if (data?.assignedExpertId || data?.assignedExpert) assignCount++;
            return (
               <span
                  className={`text-xs py-0.5 px-2 rounded-sm inline-block font-medium border ${
                     assignCount >= maxStaff
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : assignCount > 0
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}
               >
                  {assignCount}/{maxStaff} nhân viên
               </span>
            );
         },
      },
      {
         id: "status",
         header: "Trạng thái",
         headerClassName: "pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "pl-4 py-2 text-xs text-slate-600 font-medium",
         cell: (data: CareSubscriptions) => {
            const config = STATUS_CONFIG[data.status] ?? {
               label: data.status || "—",
               bg: "bg-slate-100",
               text: "text-slate-600",
               border: "border-slate-200",
            };
            return (
               <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
               >
                  {config.label}
               </span>
            );
         },
      },
      {
         id: "action",
         header: "Hành động",
         headerClassName: "pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "pl-4 py-2 text-xs text-slate-600 font-medium",
         cell: (data: CareSubscriptions) => (
            <div className="flex gap-2">
               <CustomButton
                  onClick={() => handleViewDetail(data.id)}
                  size="sm"
                  title="Xem chi tiết"
                  className="h-8 px-2.5 bg-slate-200 text-black hover:bg-slate-300 hover:text-black"
               >
                  <Eye size={16} />
               </CustomButton>
               <CustomButton
                  onClick={() => handleEdit(data.id)}
                  size="sm"
                  title="Điều phối / Chỉnh sửa"
                  className="h-8 px-2.5"
               >
                  <Edit size={16} />
               </CustomButton>
               <CustomButton
                  onClick={() => setDeletingSubscription(data)}
                  size="xs"
                  title="Hủy đăng ký"
                  className="h-8 px-2.5 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
               >
                  <Trash size={16} />
               </CustomButton>
            </div>
         ),
      },
   ];

   if (selectedId) {
      return (
         <CareSubscriptionDetail
            subscriptionId={selectedId}
            onClose={() => {
               setSelectedId(null);
               if (onCloseDetail) onCloseDetail();
            }}
            onEdit={(id) => {
               setSelectedId(null);
               if (onCloseDetail) onCloseDetail();
               if (onEdit) onEdit(id);
            }}
         />
      );
   }

   return (
      <>
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
                        className="h-48 text-center text-sm text-slate-500"
                     >
                        <CloverLoading size="md" text="Đang tải dữ liệu..." />
                     </TableCell>
                  </TableRow>
               ) : careSubcriptions.length === 0 ? (
                  <TableRow>
                     <TableCell
                        colSpan={columns.length}
                        className="h-48 text-center text-sm text-slate-500"
                     >
                        Chưa có dữ liệu nào.
                     </TableCell>
                  </TableRow>
               ) : (
                  careSubcriptions.map((profile, index) => (
                     <TableRow
                        key={profile.id}
                        className="border-b border-slate-300 transition-colors hover:bg-slate-100"
                     >
                        {columns.map((col) => (
                           <TableCell
                              key={col.id}
                              className={col.cellClassName ?? "py-0"}
                           >
                              {col.cell(profile, index)}
                           </TableCell>
                        ))}
                     </TableRow>
                  ))
               )}
            </TableBody>
         </Table>

         <ConfirmModal
            open={Boolean(deletingSubscription)}
            onClose={() => setDeletingSubscription(null)}
            onConfirm={() => {
               if (deletingSubscription) {
                  handleDelete(deletingSubscription.id);
                  setDeletingSubscription(null);
               }
            }}
            itemName={
               deletingSubscription?.healthProfile?.fullName
                  ? `đăng ký của bệnh nhân ${deletingSubscription.healthProfile.fullName}`
                  : "đăng ký gói chăm sóc này"
            }
            title="Xác nhận hủy đăng ký gói chăm sóc"
            confirmText="Hủy đăng ký"
         />
      </>
   );
}
