"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
   CarePackage,
   CarePackageStatus,
   CarePackageType,
} from "@/store/api/care-package/type";
import {
   useCreateCarePackageMutation,
   useUpdateCarePackageMutation,
   useDeleteCarePackageMutation,
   useGetCarePackageDetailQuery,
} from "@/store/api/care-package/care-package-api";
import { useGetAllStaffQuery } from "@/store/api/staff/staff-api";
import { FormInput } from "@/components/common/form-input";
import { FormNumberInput } from "@/components/common/form-number-input";
import { FormSelect } from "@/components/common/form-select";
import { FormCombobox } from "@/components/common/form-combobox";
import { FormTextarea } from "@/components/common/form-textarea";
import { Switch } from "@/components/ui/switch";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "react-toastify";
import { CARE_PACKAGE_TYPE_OPTIONS } from "./care-package-toolbar";

const stripDecimals = (val: unknown, fallback: number = 0): number => {
   if (val === undefined || val === null || val === "") return fallback;
   if (typeof val === "number") return Math.floor(val);
   const parsed = parseFloat(String(val).replace(",", "."));
   return isNaN(parsed) ? fallback : Math.floor(parsed);
};

const carePackageSchema = z
   .object({
      facilityId: z.string().min(1, "Cơ sở y tế không được để trống"),
      name: z.string().min(1, "Tên gói chăm sóc không được để trống"),
      type: z.enum(["STANDARD", "VIP"], {
         message: "Loại gói không được để trống",
      }),
      doctorExpertId: z.string().optional(),
      priceAmount: z
         .number({ message: "Giá tiền phải là số hợp lệ" })
         .min(0, "Giá tiền không được nhỏ hơn 0"),
      durationDays: z
         .number({ message: "Thời hạn phải là số ngày hợp lệ" })
         .int("Số ngày phải là số nguyên")
         .min(1, "Thời hạn tối thiểu là 1 ngày"),
      maxSubscribers: z
         .number({ message: "Số người đăng ký tối đa phải là số hợp lệ" })
         .int("Số người đăng ký tối đa phải là số nguyên")
         .min(1, "Số người đăng ký tối đa tối thiểu là 1"),
      status: z.enum(["ACTIVE", "INACTIVE"]),
      description: z.string().min(1, "Mô tả gói không được để trống"),
   })
   .refine((data) => !(data.type === "VIP" && !data.doctorExpertId), {
      message: "Vui lòng chọn bác sĩ phụ trách cho gói VIP",
      path: ["doctorExpertId"],
   });

type CarePackageFormValues = z.infer<typeof carePackageSchema>;

export interface CarePackageFormProps {
   id?: string;
   carePackageId?: string;
   carePackage?: CarePackage;
   mode?: "create" | "update" | "view";
   onClose: () => void;
   onDelete?: (pkg: CarePackage) => void;
}

export function CarePackageForm({
   id,
   carePackageId,
   carePackage,
   mode = "create",
   onClose,
   onDelete,
}: CarePackageFormProps) {
   const targetPackageId = id || carePackageId || carePackage?.id;
   const isView = mode === "view";

   const {
      data: fetchedPackage,
      isLoading: isLoadingDetail,
      isFetching: isFetchingDetail,
   } = useGetCarePackageDetailQuery(targetPackageId as string, {
      skip: !targetPackageId,
   });

   const currentPackage = fetchedPackage || carePackage;
   const { user } = useAuth();
   const defaultFacilityId =
      currentPackage?.facilityId || user?.facilityId || "";

   const defaultValues: CarePackageFormValues = useMemo(() => {
      if (mode === "create" && !targetPackageId) {
         return {
            facilityId: defaultFacilityId,
            name: "",
            type: "STANDARD" as CarePackageType,
            doctorExpertId: "",
            priceAmount: 0,
            durationDays: 30,
            maxSubscribers: 100,
            status: "ACTIVE" as CarePackageStatus,
            description: "",
         };
      }
      return {
         facilityId: currentPackage?.facilityId || defaultFacilityId,
         name: currentPackage?.name || "",
         type: (currentPackage?.type || "STANDARD") as CarePackageType,
         doctorExpertId: currentPackage?.doctorExpertId || "",
         priceAmount: stripDecimals(currentPackage?.priceAmount, 0),
         durationDays: stripDecimals(currentPackage?.durationDays, 30),
         maxSubscribers: stripDecimals(currentPackage?.maxSubscribers, 100),
         status: (currentPackage?.status || "ACTIVE") as CarePackageStatus,
         description: currentPackage?.description || "",
      };
   }, [mode, targetPackageId, currentPackage, defaultFacilityId]);

   const {
      register,
      handleSubmit,
      control,
      reset,
      setValue,
      formState: { errors },
   } = useForm<CarePackageFormValues>({
      values: defaultValues,
      resolver: zodResolver(carePackageSchema),
   });

   useEffect(() => {
      if (mode === "create" && !targetPackageId) {
         reset({
            facilityId: defaultFacilityId,
            name: "",
            type: "STANDARD",
            doctorExpertId: "",
            priceAmount: 0,
            durationDays: 30,
            maxSubscribers: 100,
            status: "ACTIVE",
            description: "",
         });
      } else if (currentPackage) {
         reset({
            facilityId: currentPackage.facilityId || defaultFacilityId,
            name: currentPackage.name || "",
            type: (currentPackage.type || "STANDARD") as CarePackageType,
            doctorExpertId: currentPackage.doctorExpertId || "",
            priceAmount: stripDecimals(currentPackage.priceAmount, 0),
            durationDays: stripDecimals(currentPackage.durationDays, 30),
            maxSubscribers: stripDecimals(currentPackage.maxSubscribers, 100),
            status: (currentPackage.status || "ACTIVE") as CarePackageStatus,
            description: currentPackage.description || "",
         });
      }
   }, [mode, targetPackageId, currentPackage, defaultFacilityId, reset]);

   const selectedType = useWatch({ control, name: "type" });

   const [doctorSearch, setDoctorSearch] = useState("");
   const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("");

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedDoctorSearch(doctorSearch);
      }, 350);
      return () => clearTimeout(timer);
   }, [doctorSearch]);

   const {
      data: staffData,
      isLoading: isLoadingStaff,
      isFetching: isFetchingStaff,
   } = useGetAllStaffQuery(
      {
         facilityId: defaultFacilityId || undefined,
         search: debouncedDoctorSearch.trim() || undefined,
         role: "DOCTOR_EXPERT",
         limit: 50,
         isActive: true,
      },
      {
         skip: !defaultFacilityId || selectedType !== "VIP",
      },
   );

   const doctorOptions = useMemo(() => {
      const items = staffData?.items ?? [];
      const opts = items
         .filter((s) => s.role === "DOCTOR_EXPERT")
         .map((doc) => ({
            label: doc.fullName,
            subLabel: doc.specialty
               ? `Chuyên khoa: ${doc.specialty}`
               : "Bác sĩ chuyên gia",
            value: doc.id,
         }));

      if (
         currentPackage?.doctorExpert &&
         !opts.some((o) => o.value === currentPackage.doctorExpert?.id)
      ) {
         opts.unshift({
            label: currentPackage.doctorExpert.fullName,
            subLabel: currentPackage.doctorExpert.specialty
               ? `Chuyên khoa: ${currentPackage.doctorExpert.specialty}`
               : "Bác sĩ chuyên gia",
            value: currentPackage.doctorExpert.id,
         });
      }

      return opts;
   }, [staffData, currentPackage]);

   const [createPackage, { isLoading: isCreating }] =
      useCreateCarePackageMutation();
   const [updatePackage, { isLoading: isUpdating }] =
      useUpdateCarePackageMutation();
   const [deletePackage, { isLoading: isDeletingPackage }] =
      useDeleteCarePackageMutation();

   const [isDeleteOpen, setIsDeleteOpen] = useState(false);

   if (
      targetPackageId &&
      (isLoadingDetail || (!currentPackage && isFetchingDetail))
   ) {
      return (
         <div className="flex items-center justify-center min-h-64 p-8 bg-white rounded-xl border border-slate-200 mt-4">
            <CloverLoading
               size="md"
               text="Đang tải thông tin gói chăm sóc..."
            />
         </div>
      );
   }

   const handleDelete = async () => {
      if (!targetPackageId) return;
      if (onDelete && currentPackage) {
         onDelete(currentPackage);
         setIsDeleteOpen(false);
         onClose();
         return;
      }
      try {
         await deletePackage(targetPackageId).unwrap();
         toast.success("Xóa gói chăm sóc thành công!");
         setIsDeleteOpen(false);
         onClose();
      } catch (error: unknown) {
         console.error("Lỗi khi xóa gói chăm sóc:", error);
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi xoá gói chăm sóc.";
         toast.error(errorMessage);
      }
   };

   const onSubmit = async (data: CarePackageFormValues) => {
      if (isView) return;
      try {
         const payloadDoctorExpertId =
            data.type === "VIP" ? data.doctorExpertId || undefined : undefined;

         if (mode === "create") {
            await createPackage({
               facilityId: data.facilityId,
               name: data.name,
               type: data.type,
               doctorExpertId: payloadDoctorExpertId,
               priceAmount: data.priceAmount,
               durationDays: data.durationDays,
               maxSubscribers: data.maxSubscribers,
               status: data.status,
               description: data.description,
            }).unwrap();
            toast.success("Thêm mới gói chăm sóc thành công!");
         } else if (targetPackageId) {
            await updatePackage({
               id: targetPackageId,
               body: {
                  name: data.name,
                  type: data.type,
                  facilityId: data.facilityId,
                  doctorExpertId: payloadDoctorExpertId,
                  priceAmount: data.priceAmount,
                  durationDays: data.durationDays,
                  maxSubscribers: data.maxSubscribers,
                  status: data.status,
                  description: data.description,
               },
            }).unwrap();
            toast.success("Cập nhật gói chăm sóc thành công!");
         }
         onClose();
      } catch (error: unknown) {
         console.error("Lỗi khi lưu gói chăm sóc:", error);
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi lưu thông tin gói chăm sóc, vui lòng thử lại.";
         toast.error(errorMessage);
      }
   };

   return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
         <div className="w-full">
            <span className="text-xl font-bold">
               {mode === "create"
                  ? "Thêm mới gói chăm sóc"
                  : isView
                    ? "Chi tiết gói chăm sóc"
                    : "Cập nhật gói chăm sóc"}
            </span>
         </div>
         <input type="hidden" {...register("facilityId")} />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
               label="Tên gói chăm sóc"
               required
               placeholder="Ví dụ: Gói theo dõi huyết áp & tim mạch định kỳ"
               disabled={isView}
               {...register("name")}
               error={errors.name?.message}
            />
            <Controller
               control={control}
               name="type"
               render={({ field, fieldState }) => (
                  <FormSelect
                     label="Loại gói"
                     required
                     placeholder="Chọn loại gói"
                     options={CARE_PACKAGE_TYPE_OPTIONS}
                     value={field.value}
                     disabled={isView}
                     onValueChange={(val) => {
                        field.onChange(val);
                        if (val !== "VIP") {
                           setValue("doctorExpertId", "");
                        }
                     }}
                     error={fieldState.error?.message}
                  />
               )}
            />

            {/* Bác sĩ phụ trách (Chỉ hiển thị khi chọn gói VIP) */}
            {selectedType === "VIP" && (
               <Controller
                  control={control}
                  name="doctorExpertId"
                  render={({ field, fieldState }) => (
                     <FormCombobox
                        label="Bác sĩ phụ trách (Gói VIP)"
                        required
                        placeholder={
                           isLoadingStaff
                              ? "Đang tải danh sách bác sĩ..."
                              : doctorOptions.length === 0
                                ? "Chưa có bác sĩ chuyên gia trong cơ sở"
                                : "Chọn bác sĩ phụ trách gói VIP"
                        }
                        searchPlaceholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
                        emptyText={
                           isFetchingStaff
                              ? "Đang tìm kiếm bác sĩ..."
                              : "Không tìm thấy bác sĩ phù hợp"
                        }
                        options={doctorOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        onSearchChange={setDoctorSearch}
                        serverSearch
                        error={fieldState.error?.message}
                        isLoading={isLoadingStaff || isFetchingStaff}
                        loadingText={
                           debouncedDoctorSearch
                              ? "Đang tìm kiếm bác sĩ..."
                              : "Đang tải danh sách bác sĩ..."
                        }
                        clearable
                        disabled={
                           isView ||
                           (doctorOptions.length === 0 &&
                              !isLoadingStaff &&
                              !isFetchingStaff &&
                              !debouncedDoctorSearch)
                        }
                     />
                  )}
               />
            )}

            {/* Mã gói (nếu cập nhật hoặc xem) */}
            {(mode === "update" || isView) && (
               <FormInput
                  label="Mã gói hệ thống"
                  disabled
                  value={currentPackage?.code || "—"}
                  className="bg-slate-100 text-slate-500 cursor-not-allowed font-mono italic"
               />
            )}

            {/* Giá gói */}
            <Controller
               control={control}
               name="priceAmount"
               render={({ field, fieldState }) => (
                  <FormNumberInput
                     label="Giá gói (VNĐ)"
                     required
                     thousandSeparator="."
                     decimalSeparator=","
                     decimalScale={0}
                     suffix=" đ"
                     allowNegative={false}
                     disabled={isView}
                     placeholder="Nhập giá tiền gói (VD: 500.000 đ)"
                     value={stripDecimals(field.value, 0)}
                     onValueChange={(values) => {
                        field.onChange(values.floatValue ?? 0);
                     }}
                     error={fieldState.error?.message}
                  />
               )}
            />

            {/* Thời hạn (ngày) */}
            <Controller
               control={control}
               name="durationDays"
               render={({ field, fieldState }) => (
                  <FormNumberInput
                     label="Thời hạn hiệu lực (Ngày)"
                     required
                     thousandSeparator="."
                     decimalSeparator=","
                     decimalScale={0}
                     suffix=" ngày"
                     allowNegative={false}
                     allowLeadingZeros={false}
                     disabled={isView}
                     placeholder="Nhập số ngày hiệu lực (VD: 30 ngày)"
                     value={stripDecimals(field.value, 0)}
                     onValueChange={(values) => {
                        field.onChange(values.floatValue ?? 0);
                     }}
                     error={fieldState.error?.message}
                  />
               )}
            />

            {/* Số người đăng ký tối đa */}
            <Controller
               control={control}
               name="maxSubscribers"
               render={({ field, fieldState }) => (
                  <FormNumberInput
                     label="Số người đăng ký tối đa"
                     required
                     thousandSeparator="."
                     decimalSeparator=","
                     decimalScale={0}
                     suffix=" người"
                     allowNegative={false}
                     allowLeadingZeros={false}
                     disabled={isView}
                     placeholder="Nhập số người tối đa (VD: 100)"
                     value={stripDecimals(field.value, 0)}
                     onValueChange={(values) => {
                        field.onChange(values.floatValue ?? 0);
                     }}
                     error={fieldState.error?.message}
                  />
               )}
            />
         </div>

         {(mode === "update" || isView) && (
            <div className="flex items-center gap-2">
               <label
                  htmlFor="status"
                  className="text-sm font-bold text-slate-700"
               >
                  Trạng thái
               </label>
               <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                     <Switch
                        id="status"
                        checked={field.value === "ACTIVE"}
                        disabled={isView}
                        onCheckedChange={(checked) =>
                           field.onChange(checked ? "ACTIVE" : "INACTIVE")
                        }
                     />
                  )}
               />
            </div>
         )}

         {/* Mô tả */}
         <FormTextarea
            label="Mô tả chi tiết quyền lợi gói"
            required
            rows={4}
            disabled={isView}
            placeholder="Mô tả các dịch vụ, quyền lợi thăm khám, nhắc thuốc đi kèm trong gói..."
            {...register("description")}
            error={errors.description?.message}
         />

         {/* Form Actions */}
         {isView ? (
            <div className="flex items-center justify-end">
               <CustomButton
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-20"
               >
                  Đóng
               </CustomButton>
            </div>
         ) : (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
               <div>
                  {targetPackageId && (
                     <CustomButton
                        type="button"
                        onClick={() => setIsDeleteOpen(true)}
                        className="w-20 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
                     >
                        Xóa gói
                     </CustomButton>
                  )}
               </div>

               <div className="flex items-center gap-2">
                  <CustomButton
                     type="button"
                     variant="outline"
                     onClick={() => reset(defaultValues)}
                     className="min-w-20 bg-slate-200 text-black hover:bg-slate-300 hover:text-black"
                  >
                     Đặt lại
                  </CustomButton>
                  <CustomButton
                     type="button"
                     variant="destructive"
                     onClick={onClose}
                     className="w-20"
                  >
                     Hủy
                  </CustomButton>
                  <CustomButton
                     type="submit"
                     isLoading={isCreating || isUpdating}
                     loadingText="Đang lưu..."
                     className="w-28"
                  >
                     Lưu thay đổi
                  </CustomButton>
               </div>
            </div>
         )}

         {/* Modal xác nhận xóa */}
         <ConfirmModal
            open={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={handleDelete}
            itemName={currentPackage?.name || "gói chăm sóc này"}
            title="Xác nhận xóa gói chăm sóc"
            isLoading={isDeletingPackage}
         />
      </form>
   );
}
