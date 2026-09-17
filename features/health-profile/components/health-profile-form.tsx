"use client";

import { useEffect } from "react";
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
import { ChronicDiseaseCombobox } from "./chronic-disease-combobox";
import { FormTextarea } from "@/components/common/form-textarea";

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
   fullName: z.string().min(1, "Họ và tên không được để trống"),
   dob: z.string().min(1, "Ngày sinh không được để trống"),
   gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      message: "Vui lòng chọn giới tính",
   }),
   relationship: z.enum(
      ["SELF", "FATHER", "MOTHER", "CHILD", "SPOUSE", "OTHER"],
      {
         message: "Vui lòng chọn mối quan hệ",
      },
   ),
   citizenId: z.string().min(1, "Số CCCD/CMND không được để trống"),
   phoneNumber: z
      .string()
      .min(1, "Số điện thoại không được để trống")
      .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "Số điện thoại không hợp lệ"),
   address: z.string().min(1, "Địa chỉ không được để trống"),
   bloodType: z.enum(["UNKNOWN", "A", "B", "AB", "O"]),
   allergy: z.string(),
   medicalHistory: z.string(),
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

   const {
      register,
      handleSubmit,
      control,
      reset,
      formState: { errors },
   } = useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
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
         chronicDiseaseIds: [],
      },
   });

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
            chronicDiseaseIds: Array.isArray(detailData.profileChronicDisease)
               ? detailData.profileChronicDisease.map((d) => d.id)
               : [],
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
                  allergy: values.allergy || "",
                  medicalHistory: values.medicalHistory || "",
               },
            }).unwrap();
            toast.success("Cập nhật hồ sơ sức khỏe thành công");
         } else {
            await createProfile({
               ...values,
               allergy: values.allergy || "",
               medicalHistory: values.medicalHistory || "",
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
         <div className="flex items-center gap-3 mb-6">
            <div>
               <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
               <p className="text-xs text-slate-500">
                  {mode === "create"
                     ? "Nhập các thông tin cần thiết để tạo hồ sơ sức khỏe mới"
                     : `Mã hồ sơ: ${profileId}`}
               </p>
            </div>
         </div>

         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Thông tin cá nhân */}
            <div>
               <h3 className="text-sm font-semibold text-slate-800 mb-3 border-l-3 border-emerald-500 pl-2">
                  Thông tin nhân khẩu
               </h3>
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
                           required
                           disabled={isView}
                           options={RELATIONSHIP_OPTIONS}
                           value={field.value}
                           onValueChange={field.onChange}
                           error={errors.relationship?.message}
                        />
                     )}
                  />

                  <FormInput
                     label="Số CCCD / CMND"
                     required
                     placeholder="Ví dụ: 001201000123"
                     disabled={isView}
                     error={errors.citizenId?.message}
                     {...register("citizenId")}
                  />

                  <FormInput
                     label="Số điện thoại"
                     required
                     placeholder="Ví dụ: 0912345678"
                     disabled={isView}
                     error={errors.phoneNumber?.message}
                     {...register("phoneNumber")}
                  />

                  <div className="md:col-span-2 lg:col-span-3">
                     <FormInput
                        label="Địa chỉ cư trú"
                        required
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        disabled={isView}
                        error={errors.address?.message}
                        {...register("address")}
                     />
                  </div>
               </div>
            </div>

            {/* Thông tin y tế */}
            <div>
               <h3 className="text-sm font-semibold text-slate-800 mb-3 border-l-3 border-emerald-500 pl-2">
                  Thông tin y tế cơ bản
               </h3>
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

                  <div className="md:col-span-2">
                     <FormInput
                        label="Tiền sử dị ứng"
                        placeholder="Dị ứng thuốc, thức ăn, phấn hoa... (nếu có)"
                        disabled={isView}
                        error={errors.allergy?.message}
                        {...register("allergy")}
                     />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                     <Controller
                        name="chronicDiseaseIds"
                        control={control}
                        render={({ field }) => (
                           <ChronicDiseaseCombobox
                              label="Bệnh mạn tính"
                              disabled={isView}
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.chronicDiseaseIds?.message}
                              initialDiseases={
                                 Array.isArray(
                                    detailData?.profileChronicDisease,
                                 )
                                    ? detailData.profileChronicDisease
                                    : []
                              }
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
      </div>
   );
}

export default HealthProfileForm;
