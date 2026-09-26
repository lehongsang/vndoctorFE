"use client";

import { useState } from "react";
import { CarePackage } from "@/store/api/care-package/type";
import { CustomButton } from "@/components/common/custom-button";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { CarePackageForm } from "./care-package-form";
import { Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarePackageCardProps {
   carePackage: CarePackage;
   onView?: (pkg: CarePackage) => void;
   onEdit?: (pkg: CarePackage) => void;
   onDelete?: (pkg: CarePackage) => void;
   onToggleStatus?: (pkg: CarePackage) => void;
   isStatusUpdating?: boolean;
}

export function CarePackageCard({
   carePackage,
   onDelete,
}: CarePackageCardProps) {
   const [isConfigOpen, setIsConfigOpen] = useState(false);
   const isVip = carePackage.type === "VIP";
   const isActive = carePackage.status === "ACTIVE";

   const formattedPrice = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
   }).format(carePackage.priceAmount || 0);

   const formattedDate = carePackage.createdAt
      ? new Date(carePackage.createdAt).toLocaleDateString("vi-VN")
      : "—";

   return (
      <div
         className={cn(
            "flex flex-col justify-between p-5 rounded-sm border shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 gap-4 group",
            isVip
               ? "bg-amber-50 border-amber-500"
               : "bg-slate-50 hover:bg-blue-100",
         )}
      >
         <div className="flex flex-col gap-3">
            <div>
               <div className="flex items-start justify-between gap-2">
                  <h3
                     className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-primary transition-colors"
                     title={carePackage.name}
                  >
                     {carePackage.name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                     <span
                        className={cn(
                           "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                           isVip
                              ? "bg-amber-100 text-amber-800 border-amber-400"
                              : "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                     >
                        {isVip && (
                           <Sparkles className="size-3 text-amber-500" />
                        )}
                        {isVip ? "Gói VIP" : "Gói trả phí"}
                     </span>
                  </div>
               </div>

               <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <span className="text-xs">{carePackage.code || "—"}</span>
                  <span>-</span>
                  <span className="flex items-center gap-1">
                     Ngày tạo: {formattedDate}
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                     Giá gói
                  </span>
                  <span className="text-sm font-bold text-primary mt-0.5">
                     {formattedPrice}
                  </span>
               </div>

               <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                     Thời hạn
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5">
                     {carePackage.durationDays} ngày
                  </span>
               </div>

               <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                     Số người tối đa
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5">
                     {carePackage.maxSubscribers ? `${carePackage.maxSubscribers} người` : "Không giới hạn"}
                  </span>
               </div>

               {carePackage.doctorExpert && (
                  <div className="flex flex-col">
                     <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        Chuyên gia
                     </span>
                     <span className="text-sm font-semibold text-slate-800 mt-0.5 truncate" title={carePackage.doctorExpert.fullName}>
                        {carePackage.doctorExpert.fullName}
                     </span>
                  </div>
               )}
            </div>

            {/* Description
            <div className="flex items-start gap-1.5 text-xs text-slate-600">
               <p
                  className="line-clamp-2 leading-relaxed"
                  title={carePackage.description}
               >
                  {carePackage.description ||
                     "Chưa có mô tả chi tiết cho gói này."}
               </p>
            </div> */}
         </div>

         {/* Footer & Actions */}
         <div className="w-full flex items-center justify-between pt-3 border-t border-slate-100">
            <span
               className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  isActive
                     ? "bg-emerald-100 text-emerald-700"
                     : "bg-slate-100 text-slate-700",
               )}
            >
               {isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
            </span>

            {/* Duy nhất 1 button Cấu hình */}
            <CustomButton
               type="button"
               size="sm"
               className="h-8 px-3 text-xs gap-1.5 cursor-pointer font-medium"
               onClick={() => setIsConfigOpen(true)}
               startIcon={<Settings className="size-3.5" />}
            >
               Cấu hình
            </CustomButton>
         </div>

         {/* Modal cấu hình chứa form chỉnh sửa / xóa */}
         <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogContent className="sm:min-w-3xl max-h-[90vh] rounded-sm overflow-y-auto p-6">
               <DialogHeader className="sr-only">
                  <DialogTitle>Cấu hình gói chăm sóc</DialogTitle>
                  <DialogDescription>
                     Chỉnh sửa thông tin hoặc xóa gói chăm sóc{" "}
                     {carePackage.name}
                  </DialogDescription>
               </DialogHeader>

               <CarePackageForm
                  id={carePackage.id}
                  carePackage={carePackage}
                  mode="update"
                  onClose={() => setIsConfigOpen(false)}
                  onDelete={onDelete}
               />
            </DialogContent>
         </Dialog>
      </div>
   );
}
