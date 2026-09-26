"use client";

import { useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { useGetCarePackagesQuery } from "@/store/api/care-package/care-package-api";
import { useStaffRegisterMutation } from "@/store/api/coordinate/coordinateApi";
import type { HealthProfile } from "@/store/api/health-profile/type";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "react-toastify";
import { Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyCarePackageModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   profile?: HealthProfile | null;
   onSuccess?: () => void;
}

export function BuyCarePackageModal({
   open,
   onOpenChange,
   profile,
   onSuccess,
}: BuyCarePackageModalProps) {
   const { user } = useAuth();
   const facilityId = user?.facilityId || user?.facility?.id;

   const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
      null,
   );

   const { data: carePackageData, isLoading: isPackagesLoading } =
      useGetCarePackagesQuery(
         {
            facilityId: facilityId || undefined,
            status: "ACTIVE",
            limit: 50,
         },
         {
            skip: !open || !facilityId,
         },
      );

   const [staffRegister, { isLoading: isRegistering }] =
      useStaffRegisterMutation();

   const packages = carePackageData?.data ?? [];

   const handleClose = () => {
      setSelectedPackageId(null);
      onOpenChange(false);
   };

   const handleConfirmRegister = async () => {
      if (!profile?.id) {
         toast.error("Không tìm thấy thông tin hồ sơ sức khỏe");
         return;
      }

      if (!selectedPackageId) {
         toast.warning("Vui lòng chọn một gói điều trị");
         return;
      }

      try {
         await staffRegister({
            body: {
               healthProfileId: profile.id,
               carePackageId: selectedPackageId,
            },
         }).unwrap();

         toast.success("Đăng ký gói điều trị thành công");
         handleClose();
         onSuccess?.();
      } catch (err: unknown) {
         const errorObj = err as {
            data?: { message?: string };
            message?: string;
         };
         toast.error(
            errorObj?.data?.message ||
               errorObj?.message ||
               "Có lỗi xảy ra khi đăng ký gói điều trị",
         );
      }
   };

   const formatPrice = (price?: number) => {
      if (typeof price !== "number") return "0 đ";
      return new Intl.NumberFormat("vi-VN", {
         style: "currency",
         currency: "VND",
      }).format(price);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:min-w-4xl max-h-[90vh] flex flex-col p-6 rounded-sm">
            <DialogHeader className="pb-3 border-b border-slate-200">
               <DialogTitle className="text-base font-bold text-slate-900">
                  Mua gói điều trị
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500">
                  Khách hàng:{" "}
                  <strong className="text-slate-800 font-semibold">
                     {profile?.fullName || "—"}
                  </strong>
                  {profile?.hospitalPatientCode && (
                     <span> (Mã: {profile.hospitalPatientCode})</span>
                  )}
               </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
               {isPackagesLoading ? (
                  <div className="h-48 flex justify-center items-center">
                     <CloverLoading
                        size="md"
                        text="Đang tải danh sách gói..."
                     />
                  </div>
               ) : packages.length === 0 ? (
                  <div className="h-48 flex flex-col justify-center items-center gap-2 text-slate-400 text-xs">
                     <Package className="size-8 text-slate-300 stroke-[1.5]" />
                     <span>
                        Không tìm thấy gói điều trị nào đang hoạt động tại cơ
                        sở.
                     </span>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-px">
                     {packages.map((pkg) => {
                        const isSelected = selectedPackageId === pkg.id;
                        const isVip = pkg.type === "VIP";

                        return (
                           <div
                              key={pkg.id}
                              onClick={() => setSelectedPackageId(pkg.id)}
                              className={cn(
                                 "relative flex flex-col justify-between p-4 rounded-sm border cursor-pointer transition-all duration-150 text-left",
                                 isVip ? "bg-amber-50 " : "",
                                 isSelected &&
                                    (isVip
                                       ? "ring-1 ring-amber-600"
                                       : "ring-1 ring-emerald-600"),
                              )}
                           >
                              {isSelected && (
                                 <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                    <Check className="size-3.5 stroke-3" />
                                 </div>
                              )}

                              <div className="flex flex-col gap-1.5 pr-6">
                                 <span
                                    className={cn(
                                       "text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 w-fit",
                                       isVip
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-blue-100 text-blue-800",
                                    )}
                                 >
                                    {isVip ? "Gói VIP" : "Cơ bản"}
                                 </span>

                                 <h4
                                    className="text-sm font-bold text-slate-900 line-clamp-1"
                                    title={pkg.name}
                                 >
                                    {pkg.name}
                                 </h4>

                                 {pkg.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                       {pkg.description}
                                    </p>
                                 )}
                              </div>

                              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                 <div className="flex flex-col gap-0.5">
                                    <span className="text-slate-500 font-medium">
                                       Thời hạn: {pkg.durationDays} ngày
                                    </span>
                                    {pkg.maxSubscribers ? (
                                       <span className="text-[11px] text-slate-400">
                                          Còn: {pkg.maxSubscribers} suất
                                       </span>
                                    ) : null}
                                 </div>
                                 <span className="text-sm font-bold text-emerald-700">
                                    {formatPrice(pkg.priceAmount)}
                                 </span>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>

            <div className="flex justify-end items-center gap-2">
               <CustomButton
                  variant="destructive"
                  size="sm"
                  onClick={handleClose}
                  disabled={isRegistering}
                  className="w-20"
               >
                  Hủy
               </CustomButton>
               <CustomButton
                  size="sm"
                  onClick={handleConfirmRegister}
                  isLoading={isRegistering}
                  disabled={isRegistering || !selectedPackageId}
               >
                  Xác nhận đăng ký
               </CustomButton>
            </div>
         </DialogContent>
      </Dialog>
   );
}
