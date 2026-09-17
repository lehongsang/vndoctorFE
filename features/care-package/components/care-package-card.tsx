"use client";

import { useState } from "react";
import { CarePackage } from "@/store/api/care-package/type";
import { CustomButton } from "@/components/common/custom-button";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarePackageCardProps {
   carePackage: CarePackage;
   onView?: (pkg: CarePackage) => void;
   onEdit: (pkg: CarePackage) => void;
   onDelete: (pkg: CarePackage) => void;
   onToggleStatus: (pkg: CarePackage) => void;
   isStatusUpdating?: boolean;
}

export function CarePackageCard({
   carePackage,
   onView,
   onEdit,
   onDelete,
   onToggleStatus,
   isStatusUpdating = false,
}: CarePackageCardProps) {
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
      <div className="flex flex-col justify-between p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 gap-4 group">
         <div className="flex flex-col gap-3">
            <div>
               <div className="flex items-start justify-between gap-2">
                  <h3
                     className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-primary transition-colors"
                     title={carePackage.name}
                  >
                     {carePackage.name}
                  </h3>
                  <span
                     className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 border",
                        isVip
                           ? "bg-amber-50 text-amber-700 border-amber-200"
                           : "bg-blue-50 text-blue-700 border-blue-200",
                     )}
                  >
                     {isVip && <Sparkles className="size-3 text-amber-500" />}
                     {isVip ? "Gói VIP" : "Gói trả phí"}
                  </span>
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
            </div>

            {carePackage.doctorExpert && (
               <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                     Chuyên gia
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5">
                     {carePackage.doctorExpert?.fullName || "—"}
                  </span>
               </div>
            )}

            {/* Description */}
            <div className="flex items-start gap-1.5 text-xs text-slate-600">
               <p
                  className="line-clamp-2 leading-relaxed"
                  title={carePackage.description}
               >
                  {carePackage.description ||
                     "Chưa có mô tả chi tiết cho gói này."}
               </p>
            </div>
         </div>

         {/* Footer & Actions */}
         <div className="w-full flex items-center justify-between pt-3 border-t border-slate-100">
            {/* Quick Status Toggle */}
            <div className="flex items-center gap-2">
               <Switch
                  checked={isActive}
                  disabled={isStatusUpdating}
                  onCheckedChange={() => onToggleStatus(carePackage)}
                  aria-label="Chuyển trạng thái gói"
               />
               <span
                  className={cn(
                     "text-xs font-medium",
                     isActive ? "text-emerald-600" : "text-slate-400",
                  )}
               >
                  {isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
               </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-1.5">
               <CustomButton
                  variant="outline"
                  onClick={() =>
                     onView ? onView(carePackage) : onEdit(carePackage)
                  }
                  className="h-8 px-3"
               >
                  Xem
               </CustomButton>
               <CustomButton
                  onClick={() => onEdit(carePackage)}
                  className="h-8 px-3"
               >
                  Sửa
               </CustomButton>

               <CustomButton
                  onClick={() => setIsDeleteOpen(true)}
                  className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
               >
                  Xóa
               </CustomButton>
            </div>
         </div>

         <ConfirmModal
            open={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={() => {
               onDelete(carePackage);
               setIsDeleteOpen(false);
            }}
            itemName={carePackage.name}
            title="Xác nhận xóa gói chăm sóc"
         />
      </div>
   );
}
