import { useState } from "react";
import { CustomButton } from "@/components/common/custom-button";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { FACILITY_TYPE_OPTIONS, Factility } from "@/store/api/facility/type";

interface IProps {
   facility: Factility;
   onViewDetail?: (facility: Factility) => void;
   onEdit?: (facility: Factility) => void;
   onCreateAdmin?: (facility: Factility) => void;
   onDelete?: (facility: Factility) => void;
}

export const FacilityCard = ({
   facility,
   onViewDetail,
   onEdit,
   onCreateAdmin,
   onDelete,
}: IProps) => {
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);

   const facilityTypeLabel =
      FACILITY_TYPE_OPTIONS.find((opt) => opt.value === facility.facilityType)
         ?.label || facility.facilityType;

   return (
      <div className="flex flex-col justify-between p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 gap-4">
         <div className="flex flex-col gap-3">
            <div>
               <h3
                  className="font-bold text-base text-slate-900 line-clamp-1"
                  title={facility.facilityName}
               >
                  {facility.facilityName}
               </h3>
               <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                     {facilityTypeLabel}
                  </span>
                  <span
                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        facility.isActive
                           ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                           : "bg-slate-100 text-slate-600 border-slate-200"
                     }`}
                  >
                     <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                           facility.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                     />
                     {facility.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                  </span>
               </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs">
               <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 shrink-0">Mã cơ sở:</span>
                  <span className="text-slate-700 font-mono font-medium px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60">
                     {facility.facilityCode}
                  </span>
               </div>
               <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 shrink-0">Điện thoại:</span>
                  <span className="text-slate-800 font-medium text-right truncate">
                     {facility.phoneNumber || "—"}
                  </span>
               </div>
               <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 shrink-0">Địa chỉ:</span>
                  <span
                     className="text-slate-800 font-normal text-right line-clamp-2"
                     title={facility.address || undefined}
                  >
                     {facility.address || "—"}
                  </span>
               </div>
            </div>
         </div>

         <div className="w-full flex items-center justify-end gap-2 pt-3 border-t border-slate-100 flex-wrap">
            {onCreateAdmin && (
               <CustomButton
                  variant="outline"
                  onClick={() => onCreateAdmin(facility)}
                  className="h-9 px-3 text-blue-700 border-blue-200 bg-blue-50/60 hover:bg-blue-100 hover:text-blue-800"
               >
                  Tạo QTV
               </CustomButton>
            )}
            <CustomButton
               variant="outline"
               onClick={() => onViewDetail?.(facility)}
               className="h-9 px-3"
            >
               Xem
            </CustomButton>
            <CustomButton
               onClick={() => onEdit?.(facility)}
               className="h-9 px-3"
            >
               Sửa
            </CustomButton>
            <CustomButton
               onClick={() => setIsDeleteOpen(true)}
               className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
            >
               Xóa
            </CustomButton>
         </div>

         <ConfirmModal
            open={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={() => {
               onDelete?.(facility);
               setIsDeleteOpen(false);
            }}
            itemName={facility.facilityName}
            title="Xác nhận xóa cơ sở"
         />
      </div>
   );
};
