"use client";

import { useState } from "react";
import { CustomButton } from "@/components/common/custom-button";
import type { CareSubscriptions } from "@/store/api/coordinate/type";
import { ArrowUpRight } from "lucide-react";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { CloverLoading } from "@/components/common/clover-loading";
import { CareSubscriptionDetail } from "./care-subcription-detailt";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";

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
}

const STATUS_CONFIG: Record<
   string,
   { label: string; bg: string; text: string }
> = {
   PENDING: {
      label: "Chờ điều phối",
      bg: "bg-amber-100",
      text: "text-amber-700",
   },
   ACTIVE: {
      label: "Đang hoạt động",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
   },
   EXPIRED: {
      label: "Đã hết hạn",
      bg: "bg-slate-100",
      text: "text-slate-600",
   },
   CANCELLED: {
      label: "Đã hủy",
      bg: "bg-rose-100",
      text: "text-rose-700",
   },
};

export default function CoordinateTable({
   careSubcriptions,
   isFetching,
   isLoading,
   onViewDetail,
   onCloseDetail,
   onEdit,
}: CoordinateTableProps) {
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [viewingRejectionReason, setViewingRejectionReason] = useState<{
      profileName?: string;
      packageName?: string;
      reason: string;
   } | null>(null);

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
         headerClassName:
            "pl-4 text-xs font-semibold text-slate-600 min-w-44 max-w-xs",
         cellClassName:
            "pl-4 py-2 text-xs text-slate-600 font-medium whitespace-normal break-words max-w-xs",
         cell: (data: CareSubscriptions) => (
            <div className="flex items-center gap-1.5 flex-wrap whitespace-normal wrap-break-word">
               <span className="whitespace-normal wrap-break-word">
                  {data.carePackage?.name}
               </span>
               <span
                  className={`text-xs py-1 px-2 rounded-sm inline-block shrink-0 w-fit ${
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
                  className={`text-xs inline-block font-medium ${
                     assignCount >= maxStaff
                        ? "text-emerald-700"
                        : assignCount > 0
                          ? "text-blue-700"
                          : "text-amber-700"
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
            };
            return data.registeredByStaffId ? (
               <div className="flex items-center">
                  {data.isPatientConfirmed ? (
                     <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
                     >
                        {config.label}
                     </span>
                  ) : data.rejectionReason ? (
                     <button
                        type="button"
                        onClick={(e) => {
                           e.stopPropagation();
                           setViewingRejectionReason({
                              profileName: data.healthProfile?.fullName,
                              packageName: data.carePackage?.name,
                              reason:
                                 data.rejectionReason ||
                                 "Không có thông tin lý do cụ thể.",
                           });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors cursor-pointer"
                        title="Bấm để xem lý do từ chối"
                     >
                        <span>Bị từ chối</span>
                        <span className="text-[10px] underline underline-offset-2">
                           (Xem lý do)
                        </span>
                     </button>
                  ) : (
                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Chờ App xác nhận
                     </span>
                  )}
               </div>
            ) : (
               <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
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
                  className="h-8 px-3 bg-slate-200 text-black hover:bg-slate-300 hover:text-black"
               >
                  Xem
               </CustomButton>
               {!data?.rejectionReason && (
                  <CustomButton
                     onClick={() => handleEdit(data.id)}
                     size="sm"
                     title="Điều phối / Chỉnh sửa"
                     className="h-8 px-2.5"
                     startIcon={<ArrowUpRight />}
                  >
                     Điều phối
                  </CustomButton>
               )}
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

         {/* Modal xem chi tiết lý do từ chối gói */}
         <Dialog
            open={Boolean(viewingRejectionReason)}
            onOpenChange={(open) => !open && setViewingRejectionReason(null)}
         >
            <DialogContent className="sm:max-w-md p-5 rounded-sm">
               <DialogHeader>
                  <DialogTitle className="text-sm font-bold text-rose-700">
                     Lý do bệnh nhân từ chối gói điều trị
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                     {viewingRejectionReason?.profileName && (
                        <>
                           Bệnh nhân:{" "}
                           <span className="font-medium text-slate-700">
                              {viewingRejectionReason.profileName}
                           </span>
                        </>
                     )}
                     {viewingRejectionReason?.packageName && (
                        <>
                           {" "}
                           - Gói:{" "}
                           <span className="font-medium text-slate-700">
                              {viewingRejectionReason.packageName}
                           </span>
                        </>
                     )}
                  </DialogDescription>
               </DialogHeader>

               <div className="mt-2 p-3 bg-rose-50/60 border border-rose-200/80 rounded-sm">
                  <p className="text-xs text-rose-950 whitespace-pre-wrap leading-relaxed">
                     {viewingRejectionReason?.reason}
                  </p>
               </div>

               <div className="mt-2 flex justify-end">
                  <CustomButton
                     size="sm"
                     variant="outline"
                     className="h-8 px-3 text-xs"
                     onClick={() => setViewingRejectionReason(null)}
                  >
                     Đóng
                  </CustomButton>
               </div>
            </DialogContent>
         </Dialog>
      </>
   );
}
