import { useState } from "react";
import { CustomButton } from "@/components/common/custom-button";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { FACILITY_TYPE_OPTIONS, Factility } from "@/store/api/facility/type";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Trash2, ArrowLeft } from "lucide-react";
import { FacilityForm } from "./facility-form";
import { StaffForm } from "../facility-staff/staff-form";

interface IProps {
   facility: Factility;
   onDelete?: (facility: Factility) => void;
}

export const FacilityCard = ({ facility, onDelete }: IProps) => {
   const [isConfigOpen, setIsConfigOpen] = useState(false);
   const [configView, setConfigView] = useState<"facility" | "createAdmin">(
      "facility",
   );
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);

   const handleOpenConfig = () => {
      setConfigView("facility");
      setIsConfigOpen(true);
   };

   const facilityTypeLabel =
      FACILITY_TYPE_OPTIONS.find((opt) => opt.value === facility.facilityType)
         ?.label || facility.facilityType;

   return (
      <div className="flex flex-col justify-between p-5 bg-white rounded-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 gap-4">
         <div className="flex flex-col gap-3">
            <div>
               <h3
                  className="font-bold text-base text-slate-900 line-clamp-1"
                  title={facility.facilityName}
               >
                  {facility.facilityName}
               </h3>
               <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                     {facilityTypeLabel}
                  </span>
                  <span
                     className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        facility.isActive
                           ? "bg-emerald-100 text-emerald-700"
                           : "bg-slate-100 text-slate-600"
                     }`}
                  >
                     {facility.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                  </span>
               </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs">
               <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 shrink-0">Mã cơ sở:</span>
                  <span className="text-slate-700 font-normal">
                     {facility.facilityCode}
                  </span>
               </div>
               <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 shrink-0">Điện thoại:</span>
                  <span className="text-slate-800 font-normal text-right truncate">
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

         <div className="w-full flex items-center justify-end pt-3 border-t border-slate-100">
            <CustomButton
               onClick={handleOpenConfig}
               startIcon={<Settings className="w-4 h-4" />}
               className="h-9 px-4"
            >
               Cấu hình
            </CustomButton>
         </div>

         {/* Modal Cấu hình hiển thị chi tiết cơ sở, sửa và lưu trực tiếp hoặc tạo QTV / xóa */}
         <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogContent className="sm:min-w-3xl max-h-[90vh] overflow-y-auto rounded-sm p-4">
               <DialogHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                     {configView === "createAdmin" && (
                        <CustomButton
                           type="button"
                           size="sm"
                           className="h-8 w-8"
                           onClick={() => setConfigView("facility")}
                           title="Quay lại cấu hình cơ sở"
                        >
                           <ArrowLeft className="w-4 h-4" />
                        </CustomButton>
                     )}
                     <DialogTitle className="text-lg font-bold">
                        {configView === "createAdmin"
                           ? `Tạo tài khoản quản trị: ${facility.facilityName}`
                           : `Cấu hình cơ sở: ${facility.facilityName}`}
                     </DialogTitle>
                  </div>

                  {configView === "facility" && onDelete && (
                     <CustomButton
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-rose-600 border-rose-200 bg-rose-50/60 hover:bg-rose-100 hover:text-rose-700 text-xs"
                        startIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => {
                           setIsConfigOpen(false);
                           setIsDeleteOpen(true);
                        }}
                     >
                        Xóa cơ sở
                     </CustomButton>
                  )}
               </DialogHeader>

               {configView === "createAdmin" ? (
                  <StaffForm
                     key={`staff-admin-${facility.id}`}
                     facility={facility}
                     facilityId={facility.id}
                     defaultRole="ADMIN"
                     onClose={() => setConfigView("facility")}
                  />
               ) : (
                  <FacilityForm
                     key={`config-${facility.id}`}
                     facility={facility}
                     facilityId={facility.id}
                     mode="update"
                     hideTitle
                     onClose={() => setIsConfigOpen(false)}
                     onCreateAdmin={() => setConfigView("createAdmin")}
                  />
               )}
            </DialogContent>
         </Dialog>

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
