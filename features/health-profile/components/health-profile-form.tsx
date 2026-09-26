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
import { CreateHealthProfile } from "@/store/api/health-profile/type";
import { FormInput } from "@/components/common/form-input";
import { FormSelect } from "@/components/common/form-select";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { toast } from "react-toastify";
import { FormTextarea } from "@/components/common/form-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { OcrProfileExtractedData, OcrProfileModal } from "./ocr-profile-modal";
import { ScanSearch, Sparkles } from "lucide-react";

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

const DISEASE_ITEMS = [
   { name: "hasDiabetes" as const, label: "Đái tháo đường" },
   {
      name: "hasFamilialHypercholesterolemia" as const,
      label: "Tăng cholesterol máu gia đình",
   },
   { name: "hasCoronaryArteryDisease" as const, label: "Bệnh lý mạch vành" },
   { name: "hasMyocardialInfarction" as const, label: "Nhồi máu cơ tim" },
   { name: "hasAcuteCoronarySyndrome" as const, label: "Hội chứng vành cấp" },
   { name: "hasAtherosclerosis" as const, label: "Xơ vữa mạch máu" },
   { name: "hasAorticAneurysm" as const, label: "Phình động mạch chủ" },
   {
      name: "hasPeripheralArteryDisease" as const,
      label: "Bệnh mạch máu ngoại vi",
   },
   { name: "hasStroke" as const, label: "Đột quỵ" },
   { name: "hasTia" as const, label: "Thiếu máu não thoáng qua (TIA)" },
];

const RISK_FACTOR_ITEMS = [
   { name: "isSmoking" as const, label: "Hút thuốc lá" },
   { name: "hasHypertension" as const, label: "Tăng huyết áp" },
   { name: "hasDyslipidemia" as const, label: "Rối loạn mỡ máu" },
];

const profileSchema = z.object({
   fullName: z
      .string()
      .trim()
      .min(2, "Họ và tên ít nhất 2 ký tự")
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
         "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09)",
      ),
   address: z.string().optional(),
   bloodType: z.enum(["UNKNOWN", "A", "B", "AB", "O"]),
   height: z
      .number()
      .min(0, "Chiều cao tối thiểu là 0 cm")
      .max(250, "Chiều cao không vượt quá 250 cm"),
   weight: z
      .number()
      .min(0, "Cân nặng tối thiểu là 0 kg")
      .max(300, "Cân nặng không vượt quá 300 kg"),
   allergy: z.string().optional(),
   medicalHistory: z.string().optional(),
   isSmoking: z.boolean(),
   hasHypertension: z.boolean(),
   hasDyslipidemia: z.boolean(),
   hasDiabetes: z.boolean(),
   hasStroke: z.boolean(),
   hasMyocardialInfarction: z.boolean(),
   hasAcuteCoronarySyndrome: z.boolean(),
   hasCoronaryArteryDisease: z.boolean(),
   hasTia: z.boolean(),
   hasAorticAneurysm: z.boolean(),
   hasPeripheralArteryDisease: z.boolean(),
   hasAtherosclerosis: z.boolean(),
   hasFamilialHypercholesterolemia: z.boolean(),
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
   const [ocrFilledFields, setOcrFilledFields] = useState<
      Partial<Record<keyof ProfileFormValues, boolean>>
   >({});

   const renderOcrBadge = (field: keyof ProfileFormValues) => {
      if (!ocrFilledFields[field]) return null;
      return (
         <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 shrink-0 border border-violet-200">
            <Sparkles className="w-2.5 h-2.5 text-violet-600 inline-block" />
            Từ OCR
         </span>
      );
   };

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
         height: 0,
         weight: 0,
         allergy: "",
         medicalHistory: "",
         isSmoking: false,
         hasHypertension: false,
         hasDyslipidemia: false,
         hasDiabetes: false,
         hasStroke: false,
         hasMyocardialInfarction: false,
         hasAcuteCoronarySyndrome: false,
         hasCoronaryArteryDisease: false,
         hasTia: false,
         hasAorticAneurysm: false,
         hasPeripheralArteryDisease: false,
         hasAtherosclerosis: false,
         hasFamilialHypercholesterolemia: false,
      },
   });

   const handleApplyOcrData = (data: OcrProfileExtractedData) => {
      const newlyFilled: Partial<Record<keyof ProfileFormValues, boolean>> = {};

      if (data.fullName) {
         setValue("fullName", data.fullName, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.fullName = true;
      }
      if (data.dob) {
         setValue("dob", data.dob, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.dob = true;
      }
      if (data.gender) {
         setValue("gender", data.gender, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.gender = true;
      }
      if (data.citizenId) {
         setValue("citizenId", data.citizenId, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.citizenId = true;
      }
      if (data.phoneNumber) {
         setValue("phoneNumber", data.phoneNumber, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.phoneNumber = true;
      }
      if (data.address) {
         setValue("address", data.address, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.address = true;
      }
      if (data.bloodType) {
         setValue("bloodType", data.bloodType, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.bloodType = true;
      }
      if (data.allergy) {
         setValue("allergy", data.allergy, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.allergy = true;
      }
      if (data.medicalHistory) {
         setValue("medicalHistory", data.medicalHistory, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.medicalHistory = true;
      }
      if (typeof data.isSmoking === "boolean") {
         setValue("isSmoking", data.isSmoking, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.isSmoking) newlyFilled.isSmoking = true;
      }
      if (typeof data.hasHypertension === "boolean") {
         setValue("hasHypertension", data.hasHypertension, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasHypertension) newlyFilled.hasHypertension = true;
      }
      if (typeof data.hasDyslipidemia === "boolean") {
         setValue("hasDyslipidemia", data.hasDyslipidemia, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasDyslipidemia) newlyFilled.hasDyslipidemia = true;
      }
      if (typeof data.hasDiabetes === "boolean") {
         setValue("hasDiabetes", data.hasDiabetes, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasDiabetes) newlyFilled.hasDiabetes = true;
      }
      if (typeof data.height === "number" && data.height > 0) {
         setValue("height", data.height, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.height = true;
      }
      if (typeof data.weight === "number" && data.weight > 0) {
         setValue("weight", data.weight, {
            shouldValidate: true,
            shouldDirty: true,
         });
         newlyFilled.weight = true;
      }
      if (typeof data.hasCoronaryArteryDisease === "boolean") {
         setValue("hasCoronaryArteryDisease", data.hasCoronaryArteryDisease, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasCoronaryArteryDisease)
            newlyFilled.hasCoronaryArteryDisease = true;
      }
      if (typeof data.hasMyocardialInfarction === "boolean") {
         setValue("hasMyocardialInfarction", data.hasMyocardialInfarction, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasMyocardialInfarction)
            newlyFilled.hasMyocardialInfarction = true;
      }
      if (typeof data.hasAcuteCoronarySyndrome === "boolean") {
         setValue("hasAcuteCoronarySyndrome", data.hasAcuteCoronarySyndrome, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasAcuteCoronarySyndrome)
            newlyFilled.hasAcuteCoronarySyndrome = true;
      }
      if (typeof data.hasStroke === "boolean") {
         setValue("hasStroke", data.hasStroke, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasStroke) newlyFilled.hasStroke = true;
      }
      if (typeof data.hasTia === "boolean") {
         setValue("hasTia", data.hasTia, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasTia) newlyFilled.hasTia = true;
      }
      if (typeof data.hasAtherosclerosis === "boolean") {
         setValue("hasAtherosclerosis", data.hasAtherosclerosis, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasAtherosclerosis) newlyFilled.hasAtherosclerosis = true;
      }
      if (typeof data.hasAorticAneurysm === "boolean") {
         setValue("hasAorticAneurysm", data.hasAorticAneurysm, {
            shouldValidate: true,
            shouldDirty: true,
         });
         if (data.hasAorticAneurysm) newlyFilled.hasAorticAneurysm = true;
      }
      if (typeof data.hasPeripheralArteryDisease === "boolean") {
         setValue(
            "hasPeripheralArteryDisease",
            data.hasPeripheralArteryDisease,
            {
               shouldValidate: true,
               shouldDirty: true,
            },
         );
         if (data.hasPeripheralArteryDisease)
            newlyFilled.hasPeripheralArteryDisease = true;
      }
      if (typeof data.hasFamilialHypercholesterolemia === "boolean") {
         setValue(
            "hasFamilialHypercholesterolemia",
            data.hasFamilialHypercholesterolemia,
            {
               shouldValidate: true,
               shouldDirty: true,
            },
         );
         if (data.hasFamilialHypercholesterolemia)
            newlyFilled.hasFamilialHypercholesterolemia = true;
      }

      setOcrFilledFields((prev) => ({ ...prev, ...newlyFilled }));
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
            height: Number(detailData.height) || 0,
            weight: Number(detailData.weight) || 0,
            allergy: detailData.allergy || "",
            medicalHistory: detailData.medicalHistory || "",
            isSmoking: Boolean(detailData.isSmoking),
            hasHypertension: Boolean(detailData.hasHypertension),
            hasDyslipidemia: Boolean(detailData.hasDyslipidemia),
            hasDiabetes: Boolean(detailData.hasDiabetes),
            hasStroke: Boolean(detailData.hasStroke),
            hasMyocardialInfarction: Boolean(
               detailData.hasMyocardialInfarction,
            ),
            hasAcuteCoronarySyndrome: Boolean(
               detailData.hasAcuteCoronarySyndrome,
            ),
            hasCoronaryArteryDisease: Boolean(
               detailData.hasCoronaryArteryDisease,
            ),
            hasTia: Boolean(detailData.hasTia),
            hasAorticAneurysm: Boolean(detailData.hasAorticAneurysm),
            hasPeripheralArteryDisease: Boolean(
               detailData.hasPeripheralArteryDisease,
            ),
            hasAtherosclerosis: Boolean(detailData.hasAtherosclerosis),
            hasFamilialHypercholesterolemia: Boolean(
               detailData.hasFamilialHypercholesterolemia,
            ),
         });
      }
   }, [detailData, isUpdate, isView, reset]);

   const onSubmit = async (values: ProfileFormValues) => {
      if (isView) return;

      try {
         const payload: CreateHealthProfile = {
            fullName: values.fullName.trim(),
            dob: values.dob,
            gender: values.gender,
            relationship: values.relationship,
            citizenId: values.citizenId?.trim() || "",
            phoneNumber: values.phoneNumber?.trim() || "",
            address: values.address?.trim() || "",
            bloodType: values.bloodType,
            height: Number(values.height) || 0,
            weight: Number(values.weight) || 0,
            allergy: values.allergy?.trim() || "",
            medicalHistory: values.medicalHistory?.trim() || "",
            isSmoking: Boolean(values.isSmoking),
            hasHypertension: Boolean(values.hasHypertension),
            hasDyslipidemia: Boolean(values.hasDyslipidemia),
            hasDiabetes: Boolean(values.hasDiabetes),
            hasStroke: Boolean(values.hasStroke),
            hasMyocardialInfarction: Boolean(values.hasMyocardialInfarction),
            hasAcuteCoronarySyndrome: Boolean(values.hasAcuteCoronarySyndrome),
            hasCoronaryArteryDisease: Boolean(values.hasCoronaryArteryDisease),
            hasTia: Boolean(values.hasTia),
            hasAorticAneurysm: Boolean(values.hasAorticAneurysm),
            hasPeripheralArteryDisease: Boolean(
               values.hasPeripheralArteryDisease,
            ),
            hasAtherosclerosis: Boolean(values.hasAtherosclerosis),
            hasFamilialHypercholesterolemia: Boolean(
               values.hasFamilialHypercholesterolemia,
            ),
         };

         if (isUpdate && profileId) {
            await updateProfile({
               id: profileId,
               data: payload,
            }).unwrap();
            toast.success("Cập nhật hồ sơ sức khỏe thành công");
         } else {
            await createProfile(payload).unwrap();
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
      <div className="bg-white shadow-sm rounded-sm p-4 sm:p-6">
         {/* Form Header */}
         <div className="flex items-center justify-between flex-wrap gap-2 pb-3">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {!isView && (
               <CustomButton
                  type="button"
                  size="sm"
                  onClick={() => setIsOcrModalOpen(true)}
                  startIcon={<ScanSearch />}
               >
                  OCR Phân tích file
               </CustomButton>
            )}
         </div>

         <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Thông tin hành chính & chỉ số thể chất */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
               <FormInput
                  label={
                     <span className="flex items-center gap-1.5">
                        <span>Họ và tên</span>
                        {renderOcrBadge("fullName")}
                     </span>
                  }
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  disabled={isView}
                  error={errors.fullName?.message}
                  {...register("fullName")}
               />

               <FormInput
                  label={
                     <span className="flex items-center gap-1.5">
                        <span>Ngày sinh</span>
                        {renderOcrBadge("dob")}
                     </span>
                  }
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
                        label={
                           <span className="flex items-center gap-1.5">
                              <span>Giới tính</span>
                              {renderOcrBadge("gender")}
                           </span>
                        }
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
                        label={
                           <span className="flex items-center gap-1.5">
                              <span>Mối quan hệ</span>
                              {renderOcrBadge("relationship")}
                           </span>
                        }
                        disabled={isView}
                        options={RELATIONSHIP_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.relationship?.message}
                     />
                  )}
               />

               <FormInput
                  label={
                     <span className="flex items-center gap-1.5">
                        <span>Số CCCD</span>
                        {renderOcrBadge("citizenId")}
                     </span>
                  }
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
                  label={
                     <span className="flex items-center gap-1.5">
                        <span>Số điện thoại</span>
                        {renderOcrBadge("phoneNumber")}
                     </span>
                  }
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

               <FormInput
                  label={
                     <span className="flex items-center gap-1.5">
                        <span>Chiều cao (cm)</span>
                        {renderOcrBadge("height")}
                     </span>
                  }
                  type="number"
                  placeholder="Ví dụ: 170"
                  min={0}
                  max={250}
                  step="any"
                  disabled={isView}
                  error={errors.height?.message}
                  {...register("height", {
                     valueAsNumber: true,
                     setValueAs: (v) =>
                        v === "" || isNaN(Number(v)) ? 0 : Number(v),
                  })}
               />

               <FormInput
                  label={
                     <span className="flex items-center gap-1.5">
                        <span>Cân nặng (kg)</span>
                        {renderOcrBadge("weight")}
                     </span>
                  }
                  type="number"
                  placeholder="Ví dụ: 65"
                  min={0}
                  max={300}
                  step="any"
                  disabled={isView}
                  error={errors.weight?.message}
                  {...register("weight", {
                     valueAsNumber: true,
                     setValueAs: (v) =>
                        v === "" || isNaN(Number(v)) ? 0 : Number(v),
                  })}
               />

               <Controller
                  name="bloodType"
                  control={control}
                  render={({ field }) => (
                     <FormSelect
                        label={
                           <span className="flex items-center gap-1.5">
                              <span>Nhóm máu</span>
                              {renderOcrBadge("bloodType")}
                           </span>
                        }
                        disabled={isView}
                        options={BLOOD_TYPE_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        error={errors.bloodType?.message}
                     />
                  )}
               />

               <div className="md:col-span-3">
                  <FormInput
                     label={
                        <span className="flex items-center gap-1.5">
                           <span>Địa chỉ cư trú</span>
                           {renderOcrBadge("address")}
                        </span>
                     }
                     placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                     disabled={isView}
                     error={errors.address?.message}
                     {...register("address")}
                  />
               </div>

               <div className="col-span-full flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-800">
                     Yếu tố nguy cơ
                  </label>
                  <div className="md:col-span-full grid grid-cols-1 sm:grid-cols-3 gap-5">
                     {RISK_FACTOR_ITEMS.map((item) => (
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
                                    "flex items-center justify-between py-2.5 px-4 rounded-sm border text-left select-none transition-colors",
                                    isView
                                       ? "cursor-not-allowed opacity-80"
                                       : "cursor-pointer hover:bg-slate-50",
                                    field.value
                                       ? "border-emerald-600 bg-emerald-50/20"
                                       : "border-slate-300 bg-slate-50/40",
                                 )}
                              >
                                 <span className="text-xs sm:text-sm font-medium text-slate-800 pr-2 flex items-center gap-1.5">
                                    <span>{item.label}</span>
                                    {renderOcrBadge(item.name)}
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
                                       className="size-4.5 rounded border-slate-400 data-checked:bg-emerald-600 data-checked:text-white"
                                    />
                                 </div>
                              </div>
                           )}
                        />
                     ))}
                  </div>
               </div>

               {/* Yếu tố nguy cơ & Bệnh lý */}
               <div className="col-span-full pt-2 flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-800 ">
                     Bệnh lý mạn tính
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                     {DISEASE_ITEMS.map((item) => (
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
                                    "flex items-center justify-between py-2.5 px-4 rounded-sm border text-left select-none transition-colors",
                                    isView
                                       ? "cursor-not-allowed opacity-80"
                                       : "cursor-pointer hover:bg-slate-50",
                                    field.value
                                       ? "border-emerald-600 bg-emerald-50/20"
                                       : "border-slate-300 bg-slate-50/40",
                                 )}
                              >
                                 <span className="text-xs sm:text-sm font-medium text-slate-800 pr-2 flex items-center gap-1.5">
                                    <span>{item.label}</span>
                                    {renderOcrBadge(item.name)}
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
                                       className="size-4.5 rounded border-slate-400 data-checked:bg-emerald-600 data-checked:text-white"
                                    />
                                 </div>
                              </div>
                           )}
                        />
                     ))}
                  </div>
               </div>

               <div className="col-span-full grid grid-cols-1 gap-4">
                  <FormTextarea
                     label={
                        <span className="flex items-center gap-1.5">
                           <span>Tiền sử bệnh lý khác</span>
                           {renderOcrBadge("medicalHistory")}
                        </span>
                     }
                     placeholder="Nhập chi tiết các bệnh lý khác, phẫu thuật (nếu có)..."
                     disabled={isView}
                     error={errors.medicalHistory?.message}
                     {...register("medicalHistory")}
                  />

                  <FormTextarea
                     label={
                        <span className="flex items-center gap-1.5">
                           <span>Tiền sử dị ứng</span>
                           {renderOcrBadge("allergy")}
                        </span>
                     }
                     placeholder="Dị ứng thuốc, thực phẩm, phấn hoa... (nếu có)"
                     disabled={isView}
                     error={errors.allergy?.message}
                     {...register("allergy")}
                  />
               </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
               <CustomButton
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-26 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
               >
                  Hủy
               </CustomButton>
               {!isView && (
                  <CustomButton
                     type="submit"
                     isLoading={isCreating || isUpdating}
                     className="w-26"
                  >
                     {isUpdate ? "Cập nhật" : "Lưu"}
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
