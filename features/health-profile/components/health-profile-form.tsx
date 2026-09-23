"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
   useCreateHealthProfileMutation,
   useUpdateHealthProfileMutation,
   useGetDetailHealthProfileQuery,
} from "@/store/api/health-profile/health-profile-api";
import { FormInput } from "@/components/common/form-input";
import { FormSelect } from "@/components/common/form-select";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { toast } from "react-toastify";
import { ChronicDiseaseCheckboxGrid } from "./chronic-disease-checkbox-grid";
import { FormTextarea } from "@/components/common/form-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CustomCalendar } from "@/components/common/custom-calendar";
import { ScanLine } from "lucide-react";
import {
   OcrProfileModal,
   OcrProfileExtractedData,
} from "./ocr-profile-modal";

const RELATIONSHIP_OPTIONS = [
   { label: "Bản thân", value: "SELF" },
   { label: "Bố", value: "FATHER" },
   { label: "Mẹ", value: "MOTHER" },
   { label: "Con", value: "CHILD" },
   { label: "Vợ / Chồng", value: "SPOUSE" },
   { label: "Khác", value: "OTHER" },
];

const GENDER_OPTIONS = [
   { label: "Nam", value: "MALE" },
   { label: "Nữ", value: "FEMALE" },
   { label: "Khác", value: "OTHER" },
];

const BLOOD_TYPE_OPTIONS = [
   { label: "Chưa xác định", value: "UNKNOWN" },
   { label: "Nhóm máu A", value: "A" },
   { label: "Nhóm máu B", value: "B" },
   { label: "Nhóm máu AB", value: "AB" },
   { label: "Nhóm máu O", value: "O" },
];

const profileSchema = z.object({
   fullName: z
      .string()
      .min(5, "Họ và tên ít nhất 5 ký tự")
      .max(50, "Họ và tên không được vượt quá 50 ký tự"),
   dob: z
      .string()
      .min(1, "Ngày sinh không được để trống")
      .refine(
         (val) => {
            const selectedDate = new Date(val);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return selectedDate <= today;
         },
         { message: "Ngày sinh không được là ngày trong tương lai" },
      ),
   gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      message: "Vui lòng chọn giới tính",
   }),
   relationship: z.enum(
      ["SELF", "FATHER", "MOTHER", "CHILD", "SPOUSE", "OTHER"],
      {
         message: "Vui lòng chọn mối quan hệ",
      },
   ),
   citizenId: z
      .string()
      .optional()
      .refine(
         (val) => !val || /^[0-9]{12}$/.test(val),
         "Số CCCD bắt buộc phải có đúng 12 chữ số",
      ),
   phoneNumber: z
      .string()
      .optional()
      .refine(
         (val) => !val || /^(0[35789]|84[35789])[0-9]{8}$/.test(val),
         "Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)",
      ),
   address: z.string().optional(),
   bloodType: z.enum(["UNKNOWN", "A", "B", "AB", "O"]),
   allergy: z.string().optional(),
   medicalHistory: z.string().optional(),
   isSmoking: z.boolean(),
   hasHypertension: z.boolean(),
   hasDyslipidemia: z.boolean(),
   hasDiabetes: z.boolean(),
   chronicDiseaseIds: z.array(z.string()),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface HealthProfileFormProps {
   profileId?: string;
   mode: "create" | "update" | "view";
   onClose: () => void;
}

export function HealthProfileForm({
   profileId,
   mode,
   onClose,
}: HealthProfileFormProps) {
   const isView = mode === "view";
   const isUpdate = mode === "update";

   const { data: detailData, isLoading: isLoadingDetail } =
      useGetDetailHealthProfileQuery(profileId ?? "", {
         skip: !profileId || mode === "create",
      });

   const [createProfile, { isLoading: isCreating }] =
      useCreateHealthProfileMutation();
   const [updateProfile, { isLoading: isUpdating }] =
      useUpdateHealthProfileMutation();

   const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

   const {
      register,
      handleSubmit,
      control,
      reset,
      setValue,
      formState: { errors },
   } = useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      mode: "onTouched",
      defaultValues: {
         fullName: "",
         dob: "",
         gender: "MALE",
         relationship: "SELF",
         citizenId: "",
         phoneNumber: "",
         address: "",
         bloodType: "UNKNOWN",
         allergy: "",
         medicalHistory: "",
         isSmoking: false,
         hasHypertension: false,
         hasDyslipidemia: false,
         hasDiabetes: false,
         chronicDiseaseIds: [],
      },
   });

   const handleApplyOcrData = (data: OcrProfileExtractedData) => {
      if (data.fullName) {
         setValue("fullName", data.fullName, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.dob) {
         setValue("dob", data.dob, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.gender) {
         setValue("gender", data.gender, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.citizenId) {
         setValue("citizenId", data.citizenId, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.phoneNumber) {
         setValue("phoneNumber", data.phoneNumber, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.address) {
         setValue("address", data.address, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.bloodType) {
         setValue("bloodType", data.bloodType, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.allergy) {
         setValue("allergy", data.allergy, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (data.medicalHistory) {
         setValue("medicalHistory", data.medicalHistory, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (typeof data.isSmoking === "boolean") {
         setValue("isSmoking", data.isSmoking, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (typeof data.hasHypertension === "boolean") {
         setValue("hasHypertension", data.hasHypertension, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (typeof data.hasDyslipidemia === "boolean") {
         setValue("hasDyslipidemia", data.hasDyslipidemia, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
      if (typeof data.hasDiabetes === "boolean") {
         setValue("hasDiabetes", data.hasDiabetes, {
            shouldValidate: true,
            shouldDirty: true,
         });
      }
   };

   useEffect(() => {
      if (detailData && (isUpdate || isView)) {
         let formattedDob = detailData.dob || "";
         if (formattedDob.includes("T")) {
            formattedDob = formattedDob.split("T")[0];
         }
         reset({
            fullName: detailData.fullName || "",
            dob: formattedDob,
            gender: detailData.gender || "MALE",
            relationship: detailData.relationship || "SELF",
            citizenId: detailData.citizenId || "",
            phoneNumber: detailData.phoneNumber || "",
            address: detailData.address || "",
            bloodType:
               (detailData.bloodType as "UNKNOWN" | "A" | "B" | "AB" | "O") ||
               "UNKNOWN",
            allergy: detailData.allergy || "",
            medicalHistory: detailData.medicalHistory || "",
            isSmoking: Boolean(detailData.isSmoking),
            hasHypertension: Boolean(detailData.hasHypertension),
            hasDyslipidemia: Boolean(detailData.hasDyslipidemia),
            hasDiabetes: Boolean(detailData.hasDiabetes),
            chronicDiseaseIds:
               detailData?.profileChronicDisease?.diseaseIds || [],
         });
      }
   }, [detailData, isUpdate, isView, reset]);

   const onSubmit = async (values: ProfileFormValues) => {
      if (isView) return;

      try {
         if (isUpdate && profileId) {
            await updateProfile({
               id: profileId,
               data: {
                  id: profileId,
                  ...values,
                  citizenId: values.citizenId || "",
                  phoneNumber: values.phoneNumber || "",
                  address: values.address || "",
                  allergy: values.allergy || "",
                  medicalHistory: values.medicalHistory || "",
                  isSmoking: Boolean(values.isSmoking),
                  hasHypertension: Boolean(values.hasHypertension),
                  hasDyslipidemia: Boolean(values.hasDyslipidemia),
                  hasDiabetes: Boolean(values.hasDiabetes),
                  chronicDiseaseIds: values.chronicDiseaseIds || [],
               },
            }).unwrap();
            toast.success("Cập nhật hồ sơ sức khỏe thành công");
         } else {
            await createProfile({
               ...values,
               citizenId: values.citizenId || "",
               phoneNumber: values.phoneNumber || "",
               address: values.address || "",
               allergy: values.allergy || "",
               medicalHistory: values.medicalHistory || "",
               isSmoking: Boolean(values.isSmoking),
               hasHypertension: Boolean(values.hasHypertension),
               hasDyslipidemia: Boolean(values.hasDyslipidemia),
               hasDiabetes: Boolean(values.hasDiabetes),
               chronicDiseaseIds: values.chronicDiseaseIds || [],
            }).unwrap();
            toast.success("Tạo mới hồ sơ sức khỏe thành công");
         }
         onClose();
      } catch (error: unknown) {
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi lưu hồ sơ";
         toast.error(errorMessage);
      }
   };

   if (isLoadingDetail) {
      return (
         <div className="p-12 flex justify-center items-center bg-white rounded-xl border border-slate-200">
            <CloverLoading size="md" text="Đang tải dữ liệu hồ sơ..." />
         </div>
      );
   }

   const title =
      mode === "create"
         ? "Tạo mới hồ sơ sức khỏe"
         : mode === "update"
           ? "Chỉnh sửa hồ sơ sức khỏe"
           : "Xem hồ sơ sức khỏe";

   return (
      <div>
         <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
               <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>
            {!isView && (
               <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="border-primary/40 text-primary hover:bg-primary/5 hover:border-primary gap-1.5 shadow-2xs cursor-pointer font-medium"
               >
                  <ScanLine className="w-4 h-4 text-primary" />
                  <span>Quét OCR điền nhanh</span>
               </CustomButton>
            )}
         </div>

         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Thông tin cá nhân */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <FormInput
                  label="Họ và tên"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  disabled={isView}
                  error={errors.fullName?.message}
                  {...register("fullName")}
               />

               <FormInput
                  label="Ngày sinh"
                  type="date"
                  required
                  max={new Date().toLocaleDateString("en-CA")}
                  disabled={isView}
                  error={errors.dob?.message}
                  {...register("dob")}
               />

               <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                     <FormSelect
                        label="Giới tính"
                        required
                        disabled={isView}
                        options={GENDER_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.gender?.message}
                     />
                  )}
               />

               <Controller
                  name="relationship"
                  control={control}
                  render={({ field }) => (
                     <FormSelect
                        label="Mối quan hệ"
                        disabled={isView}
                        options={RELATIONSHIP_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.relationship?.message}
                     />
                  )}
               />

               <FormInput
                  label="Số CCCD"
                  placeholder="Nhập 12 chữ số CCCD"
                  maxLength={12}
                  disabled={isView}
                  error={errors.citizenId?.message}
                  {...register("citizenId", {
                     onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, "");
                     },
                  })}
               />

               <FormInput
                  label="Số điện thoại"
                  placeholder="Ví dụ: 0912345678"
                  maxLength={10}
                  disabled={isView}
                  error={errors.phoneNumber?.message}
                  {...register("phoneNumber", {
                     onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, "");
                     },
                  })}
               />

               <div className="md:col-span-2 lg:col-span-3">
                  <FormInput
                     label="Địa chỉ cư trú"
                     placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                     disabled={isView}
                     error={errors.address?.message}
                     {...register("address")}
                  />
               </div>
            </div>

            {/* Thông tin y tế */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <Controller
                  name="bloodType"
                  control={control}
                  render={({ field }) => (
                     <FormSelect
                        label="Nhóm máu"
                        disabled={isView}
                        options={BLOOD_TYPE_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.bloodType?.message}
                     />
                  )}
               />

               {/* Yếu tố nguy cơ bệnh lý */}
               <div className="md:col-span-2">
                  <label className="text-xs sm:text-sm text-slate-600 mb-2 block">
                     Yếu tố nguy cơ bệnh lý
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                     {[
                        {
                           name: "isSmoking" as const,
                           label: "Hút thuốc lá",
                        },
                        {
                           name: "hasHypertension" as const,
                           label: "Tăng huyết áp",
                        },
                        {
                           name: "hasDyslipidemia" as const,
                           label: "Rối loạn lipid máu",
                        },
                        {
                           name: "hasDiabetes" as const,
                           label: "Đái tháo đường",
                        },
                     ].map((item) => (
                        <Controller
                           key={item.name}
                           name={item.name}
                           control={control}
                           render={({ field }) => (
                              <div
                                 role="button"
                                 tabIndex={0}
                                 onClick={() =>
                                    !isView && field.onChange(!field.value)
                                 }
                                 onKeyDown={(e) => {
                                    if (
                                       !isView &&
                                       (e.key === "Enter" || e.key === " ")
                                    ) {
                                       e.preventDefault();
                                       field.onChange(!field.value);
                                    }
                                 }}
                                 className={cn(
                                    "flex items-center justify-between p-3 sm:px-4 rounded-sm border bg-slate-100 transition-all select-none text-left",
                                    isView
                                       ? "cursor-not-allowed opacity-80"
                                       : "cursor-pointer hover:border-slate-300 hover:bg-slate-50/40",
                                    field.value
                                       ? "border-emerald-400 bg-emerald-50/20"
                                       : "border-slate-200",
                                 )}
                              >
                                 <span className="text-sm font-medium text-slate-800 pr-2">
                                    {item.label}
                                 </span>
                                 <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center shrink-0"
                                 >
                                    <Checkbox
                                       checked={field.value}
                                       onCheckedChange={(checked) =>
                                          !isView &&
                                          field.onChange(Boolean(checked))
                                       }
                                       disabled={isView}
                                       className="size-5 rounded! border-slate-500 data-checked:bg-emerald-600 data-checked:text-white"
                                    />
                                 </div>
                              </div>
                           )}
                        />
                     ))}
                  </div>
               </div>

               <div className="md:col-span-2 lg:col-span-3 pt-2">
                  <Controller
                     name="chronicDiseaseIds"
                     control={control}
                     render={({ field }) => (
                        <ChronicDiseaseCheckboxGrid
                           disabled={isView}
                           value={field.value}
                           onChange={field.onChange}
                           error={errors.chronicDiseaseIds?.message}
                           healthProfileId={profileId}
                        />
                     )}
                  />
               </div>

               <div className="md:col-span-2 lg:col-span-3">
                  <FormTextarea
                     label="Tiền sử bệnh lý"
                     placeholder="Nhập chi tiết tiền sử bệnh lý của bệnh nhân..."
                     disabled={isView}
                     error={errors.medicalHistory?.message}
                     {...register("medicalHistory")}
                  />
               </div>

               <div className="md:col-span-2 lg:col-span-full">
                  <FormTextarea
                     label="Tiền sử dị ứng"
                     placeholder="Dị ứng thuốc, thức ăn, phấn hoa... (nếu có)"
                     disabled={isView}
                     error={errors.allergy?.message}
                     {...register("allergy")}
                  />
               </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
               <CustomButton
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-20 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
               >
                  Hủy
               </CustomButton>
               {!isView && (
                  <CustomButton
                     type="submit"
                     isLoading={isCreating || isUpdating}
                     className="w-20"
                  >
                     Lưu
                  </CustomButton>
               )}
            </div>
         </form>

         {/* Modal OCR quét CCCD / Bệnh án */}
         <OcrProfileModal
            isOpen={isOcrModalOpen}
            onClose={() => setIsOcrModalOpen(false)}
            onApply={handleApplyOcrData}
         />
      </div>
   );
}

export default HealthProfileForm;
