"use client";

import { useMemo, useState } from "react";
import CloverLoading from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import { FormCombobox } from "@/components/common/form-combobox";
import {
   useAssignStaffMutation,
   useGetDetailCareSubcriptionQuery,
   useUpdateStaffSubscriptionMutation,
} from "@/store/api/coordinate/coordinateApi";
import type { Staff } from "@/store/api/staff/type";
import { useGetAllStaffQuery } from "@/store/api/staff/staff-api";
import { toast } from "react-toastify";
import { Sparkles, Pencil, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoordinateFormProps {
   subscriptionId?: string;
   onClose?: () => void;
   onSuccess?: () => void;
}

const RowItem = ({
   label,
   value,
   className,
}: {
   label: string;
   value?: React.ReactNode;
   className?: string;
}) => (
   <div
      className={cn(
         "flex flex-col gap-1 px-4 py-3 rounded-md bg-white border border-slate-100 shadow-2xs",
         className,
      )}
   >
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
         <span>{label}</span>
      </div>
      <div className="text-md font-medium text-slate-800 wrap-break-word">
         {value || (
            <span className="text-slate-400 font-normal italic">
               Chưa cập nhật
            </span>
         )}
      </div>
   </div>
);

export function CoordinateForm({
   subscriptionId,
   onClose,
   onSuccess,
}: CoordinateFormProps) {
   const {
      data: subcription,
      isLoading: isSubLoading,
      isFetching: isSubFetching,
   } = useGetDetailCareSubcriptionQuery(
      { id: subscriptionId || "" },
      { skip: !subscriptionId },
   );

   const [searchStaff, setSearchStaff] = useState("");
   const [pageStaff] = useState(1);
   const [limitStaff] = useState(50);

   const [isEditingDoctor, setIsEditingDoctor] = useState(false);
   const [isEditingNurse, setIsEditingNurse] = useState(false);

   const { data: staffAssign, isLoading: isStaffAssignLoading } =
      useGetAllStaffQuery(
         {
            search: searchStaff,
            page: pageStaff,
            limit: limitStaff,
         },
         {
            skip: !subscriptionId,
         },
      );

   const [staff, setStaff] = useState<{
      subscriptionId: string | null;
      doctor: Staff | null;
      nurse: Staff | null;
   }>({
      subscriptionId: null,
      doctor: null,
      nurse: null,
   });

   const [assignStaff, { isLoading: isAssigning }] = useAssignStaffMutation();
   const [updateStaff, { isLoading: isUpdating }] =
      useUpdateStaffSubscriptionMutation();

   const isSubmitting = isAssigning || isUpdating;

   if (subcription && staff.subscriptionId !== subcription.id) {
      setStaff({
         subscriptionId: subcription.id,
         doctor: subcription.assignedDoctor ?? null,
         nurse: subcription.assignedNurse ?? null,
      });
   }

   const doctorOptions = useMemo(() => {
      const items = staffAssign?.items ?? [];
      const opts = items
         .filter((s) => s.role === "DOCTOR")
         .map((doc) => ({
            label: doc.fullName,
            subLabel: doc.specialty
               ? `Chuyên khoa: ${doc.specialty}`
               : `Mã: ${doc.staffCode}`,
            value: doc.id,
         }));
      if (staff.doctor && !opts.some((o) => o.value === staff.doctor?.id)) {
         opts.unshift({
            label: staff.doctor.fullName,
            subLabel: staff.doctor.specialty
               ? `Chuyên khoa: ${staff.doctor.specialty}`
               : `Mã: ${staff.doctor.staffCode}`,
            value: staff.doctor.id,
         });
      }
      return opts;
   }, [staffAssign, staff.doctor]);

   const nurseOptions = useMemo(() => {
      const items = staffAssign?.items ?? [];
      const opts = items
         .filter((s) => s.role === "NURSE")
         .map((nurse) => ({
            label: nurse.fullName,
            subLabel: nurse.specialty
               ? `Chuyên khoa: ${nurse.specialty}`
               : `Mã: ${nurse.staffCode}`,
            value: nurse.id,
         }));
      if (staff.nurse && !opts.some((o) => o.value === staff.nurse?.id)) {
         opts.unshift({
            label: staff.nurse.fullName,
            subLabel: staff.nurse.specialty
               ? `Chuyên khoa: ${staff.nurse.specialty}`
               : `Mã: ${staff.nurse.staffCode}`,
            value: staff.nurse.id,
         });
      }
      return opts;
   }, [staffAssign, staff.nurse]);

   if (isSubLoading || isSubFetching) {
      return (
         <div className="p-12 flex justify-center items-center rounded-lg border border-slate-200 bg-white">
            <CloverLoading size="md" text="Đang tải thông tin điều phối..." />
         </div>
      );
   }

   if (!subcription) {
      return (
         <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-lg border border-slate-200">
            Không tìm thấy thông tin đăng ký gói chăm sóc.
         </div>
      );
   }

   const isVip = subcription.carePackage?.type === "VIP";
   const isActive = subcription.status === "ACTIVE";

   const handleSubmit = async () => {
      if (!subscriptionId) return;

      if (!staff.doctor) {
         toast.warning("Vui lòng chọn bác sĩ phụ trách");
         return;
      }

      if (!staff.nurse) {
         toast.warning("Vui lòng chọn điều dưỡng phụ trách");
         return;
      }

      const body = {
         assignedDoctorId: staff.doctor.id,
         assignedNurseId: staff.nurse.id,
         assignedExpertId: isVip
            ? (subcription.assignedExpert?.id ??
              subcription.assignedExpertId ??
              null)
            : null,
      };

      try {
         if (!isActive) {
            // Chưa active -> dùng api assign-and-activate
            await assignStaff({
               id: subcription.id,
               body,
            }).unwrap();
            toast.success("Điều phối và kích hoạt gói thành công");
         } else {
            // Đã active -> dùng api care-team
            await updateStaff({
               id: subcription.id,
               body,
            }).unwrap();
            toast.success("Cập nhật đội ngũ điều phối thành công");
         }
         onSuccess?.();
      } catch (error) {
         const err = error as { data?: { message?: string } };
         toast.error(err?.data?.message || "Có lỗi xảy ra vui lòng thử lại");
      }
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
         {/* Thông tin hồ sơ & Gói khám */}
         <div className="flex flex-col gap-4 p-5 rounded-lg border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
               <h3 className="text-sm font-semibold text-slate-800">
                  Thông tin đăng ký
               </h3>
            </div>

            <div className="flex flex-col gap-3">
               <RowItem
                  label="Họ và tên"
                  value={subcription.healthProfile?.fullName}
               />
               <RowItem
                  label="Ngày sinh"
                  value={subcription.healthProfile?.dob}
               />
               <RowItem
                  label="Giới tính"
                  value={subcription.healthProfile?.gender}
               />
               <RowItem
                  label="Gói đã mua"
                  value={subcription.carePackage?.name}
               />
               <RowItem
                  label="Loại hình gói"
                  value={
                     <span
                        className={cn(
                           "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
                           isVip
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200",
                        )}
                     >
                        {isVip && (
                           <Sparkles className="size-3 text-amber-600" />
                        )}
                        {subcription.carePackage?.type || "Chưa xác định"}
                     </span>
                  }
               />
            </div>
         </div>

         {/* Phân công nhân sự */}
         <div className="flex flex-col justify-between col-span-1 lg:col-span-2 p-5 rounded-lg border border-slate-200 bg-white gap-6">
            <div className="flex flex-col gap-5">
               <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800">
                     Phân công nhân sự phụ trách
                  </h3>
               </div>

               {/* Bác sĩ chuyên gia (cố định nếu là VIP) */}
               {isVip && (
                  <div className="flex flex-col gap-1.5 p-3.5 rounded-sm bg-amber-50/50 border border-amber-200/80">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                           <Sparkles className="size-3.5 text-amber-600" />
                           <span>Bác sĩ chuyên gia</span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                           Cố định theo gói
                        </span>
                     </div>

                     {subcription.assignedExpert?.fullName ? (
                        <div className="flex flex-col gap-0.5 mt-1">
                           <span className="text-sm font-semibold text-slate-800">
                              {subcription.assignedExpert.fullName}
                           </span>
                           {subcription.assignedExpert.specialty && (
                              <span className="text-xs text-slate-500">
                                 Chuyên khoa:{" "}
                                 {subcription.assignedExpert.specialty}
                              </span>
                           )}
                        </div>
                     ) : (
                        <span className="text-sm text-slate-400 italic mt-1">
                           Chưa có chuyên gia
                        </span>
                     )}
                  </div>
               )}

               {/* Bác sĩ theo dõi */}
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                     <span>Bác sĩ theo dõi</span>
                  </div>

                  {staff.doctor && !isEditingDoctor ? (
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="size-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs shrink-0">
                              BS
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800">
                                 {staff.doctor.fullName}
                              </span>
                              {staff.doctor.specialty ? (
                                 <span className="text-xs text-slate-500">
                                    Chuyên khoa: {staff.doctor.specialty}
                                 </span>
                              ) : (
                                 <span className="text-xs text-slate-400">
                                    Mã: {staff.doctor.staffCode}
                                 </span>
                              )}
                           </div>
                        </div>
                        <CustomButton
                           size="sm"
                           startIcon={<Pencil className="size-3.5" />}
                           onClick={() => setIsEditingDoctor(true)}
                        >
                           Thay đổi
                        </CustomButton>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2">
                        <div className="flex-1">
                           <FormCombobox
                              placeholder="Chọn bác sĩ theo dõi..."
                              searchPlaceholder="Tìm theo tên bác sĩ..."
                              emptyText="Không tìm thấy bác sĩ phù hợp."
                              options={doctorOptions}
                              value={staff.doctor?.id || ""}
                              onValueChange={(val) => {
                                 const found =
                                    (staffAssign?.items ?? []).find(
                                       (s) => s.id === val,
                                    ) ||
                                    (staff.doctor?.id === val
                                       ? staff.doctor
                                       : null);
                                 setStaff((prev) => ({
                                    ...prev,
                                    doctor: found || null,
                                 }));
                                 setIsEditingDoctor(false);
                              }}
                              onSearchChange={setSearchStaff}
                              serverSearch
                              isLoading={isStaffAssignLoading}
                              clearable
                           />
                        </div>
                        {staff.doctor && (
                           <CustomButton
                              size="sm"
                              variant="destructive"
                              onClick={() => setIsEditingDoctor(false)}
                           >
                              Hủy
                           </CustomButton>
                        )}
                     </div>
                  )}
               </div>

               {/* Điều dưỡng */}
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                     <span>Điều dưỡng phụ trách</span>
                  </div>

                  {staff.nurse && !isEditingNurse ? (
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="size-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                              ĐD
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800">
                                 {staff.nurse.fullName}
                              </span>
                              {staff.nurse.specialty ? (
                                 <span className="text-xs text-slate-500">
                                    Chuyên khoa: {staff.nurse.specialty}
                                 </span>
                              ) : (
                                 <span className="text-xs text-slate-400">
                                    Mã: {staff.nurse.staffCode}
                                 </span>
                              )}
                           </div>
                        </div>
                        <CustomButton
                           size="sm"
                           startIcon={<Pencil className="size-3.5" />}
                           onClick={() => setIsEditingNurse(true)}
                        >
                           Thay đổi
                        </CustomButton>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2">
                        <div className="flex-1">
                           <FormCombobox
                              placeholder="Chọn điều dưỡng..."
                              searchPlaceholder="Tìm theo tên điều dưỡng..."
                              emptyText="Không tìm thấy điều dưỡng phù hợp."
                              options={nurseOptions}
                              value={staff.nurse?.id || ""}
                              onValueChange={(val) => {
                                 const found =
                                    (staffAssign?.items ?? []).find(
                                       (s) => s.id === val,
                                    ) ||
                                    (staff.nurse?.id === val
                                       ? staff.nurse
                                       : null);
                                 setStaff((prev) => ({
                                    ...prev,
                                    nurse: found || null,
                                 }));
                                 setIsEditingNurse(false);
                              }}
                              onSearchChange={setSearchStaff}
                              serverSearch
                              isLoading={isStaffAssignLoading}
                              clearable
                           />
                        </div>
                        {staff.nurse && (
                           <CustomButton
                              size="sm"
                              variant="destructive"
                              onClick={() => setIsEditingNurse(false)}
                           >
                              Hủy
                           </CustomButton>
                        )}
                     </div>
                  )}
               </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
               <CustomButton
                  variant="destructive"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-22"
               >
                  Đóng
               </CustomButton>
               <CustomButton
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  startIcon={<ArrowUpRight />}
               >
                  {!isActive ? "Điều phối & Kích hoạt" : "Cập nhật điều phối"}
               </CustomButton>
            </div>
         </div>
      </div>
   );
}
