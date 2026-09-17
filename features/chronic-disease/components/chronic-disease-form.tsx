"use client";

import { useEffect } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
   useCreateChronicDiseaseMutation,
   useUpdateChronicDiseaseMutation,
   useGetDetailChronicDiseaseQuery,
} from "@/store/api/chronic-diseases/chronic-diseases-api";
import { FormInput } from "@/components/common/form-input";
import { Switch } from "@/components/ui/switch";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { toast } from "react-toastify";

const getChronicDiseaseSchema = (isCreate: boolean) =>
   z.object({
      code: isCreate
         ? z.string().min(1, "Mã bệnh không được để trống")
         : z.string().optional(),
      name: z.string().min(1, "Tên bệnh không được để trống"),
      icd10Code: z.string().min(1, "Mã ICD-10 không được để trống"),
      category: z.string().min(1, "Nhóm bệnh không được để trống"),
      displayOrder: z.number().min(0, "Thứ tự hiển thị phải lớn hơn hoặc bằng 0"),
      isActive: z.boolean(),
   });

type ChronicDiseaseFormValues = z.infer<
   ReturnType<typeof getChronicDiseaseSchema>
>;

interface ChronicDiseaseFormProps {
   diseaseId?: string;
   mode?: "create" | "update" | "view";
   onClose: () => void;
}

export function ChronicDiseaseForm({
   diseaseId,
   mode = "create",
   onClose,
}: ChronicDiseaseFormProps) {
   const isView = mode === "view";
   const isUpdate = mode === "update";
   const isCreate = mode === "create";

   const { data: detailData, isLoading: isLoadingDetail } =
      useGetDetailChronicDiseaseQuery(
         { id: diseaseId ?? "" },
         {
            skip: !diseaseId || isCreate,
         },
      );

   const [createDisease, { isLoading: isCreating }] =
      useCreateChronicDiseaseMutation();
   const [updateDisease, { isLoading: isUpdating }] =
      useUpdateChronicDiseaseMutation();

   const {
      register,
      handleSubmit,
      control,
      reset,
      formState: { errors },
   } = useForm<ChronicDiseaseFormValues>({
      resolver: zodResolver(getChronicDiseaseSchema(isCreate)),
      defaultValues: {
         code: "",
         name: "",
         icd10Code: "",
         category: "",
         displayOrder: 0,
         isActive: true,
      },
   });

   useEffect(() => {
      if (detailData && (isUpdate || isView)) {
         reset({
            code: detailData.code || "",
            name: detailData.name || "",
            icd10Code: detailData.icd10Code || "",
            category: detailData.category || "",
            displayOrder: detailData.displayOrder ?? 0,
            isActive: detailData.isActive ?? true,
         });
      }
   }, [detailData, isUpdate, isView, reset]);

   const handleReset = () => {
      if (detailData && isUpdate) {
         reset({
            code: detailData.code || "",
            name: detailData.name || "",
            icd10Code: detailData.icd10Code || "",
            category: detailData.category || "",
            displayOrder: detailData.displayOrder ?? 0,
            isActive: detailData.isActive ?? true,
         });
      } else {
         reset({
            code: "",
            name: "",
            icd10Code: "",
            category: "",
            displayOrder: 0,
            isActive: true,
         });
      }
   };

   const onSubmit = async (values: ChronicDiseaseFormValues) => {
      if (isView) return;

      try {
         if (isUpdate && diseaseId) {
            await updateDisease({
               id: diseaseId,
               data: {
                  name: values.name,
                  icd10Code: values.icd10Code,
                  category: values.category,
                  displayOrder: values.displayOrder,
                  isActive: values.isActive,
               },
            }).unwrap();
            toast.success("Cập nhật bệnh mãn tính thành công");
         } else {
            await createDisease({
               ...values,
               code: values.code ?? "",
               isActive: true,
            }).unwrap();
            toast.success("Tạo mới bệnh mãn tính thành công");
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
               : "Có lỗi xảy ra khi lưu thông tin bệnh";
         toast.error(errorMessage);
      }
   };

   if (isLoadingDetail) {
      return (
         <div className="p-12 flex justify-center items-center bg-white rounded-xl border border-slate-200">
            <CloverLoading size="md" text="Đang tải dữ liệu bệnh..." />
         </div>
      );
   }

   const title =
      mode === "create"
         ? "Tạo mới bệnh mãn tính"
         : mode === "update"
           ? "Chỉnh sửa bệnh mãn tính"
           : "Xem chi tiết bệnh mãn tính";

   return (
      <div>
         <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
            <div>
               <h2 className="text-base font-semibold text-slate-900">
                  {title}
               </h2>
               <p className="text-xs text-slate-500">
                  {mode === "create"
                     ? "Nhập các thông tin cần thiết để tạo bệnh mãn tính mới"
                     : `Mã định danh: ${diseaseId}`}
               </p>
            </div>
         </div>

         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {!isUpdate && (
                  <FormInput
                     label="Mã bệnh"
                     required={isCreate}
                     disabled={isView}
                     placeholder="Ví dụ: DTD_T2, THA, HEN_PQ..."
                     error={errors.code?.message}
                     {...register("code")}
                  />
               )}

               <FormInput
                  label="Tên bệnh mãn tính"
                  required={!isView}
                  disabled={isView}
                  placeholder="Ví dụ: Đái tháo đường típ 2, Tăng huyết áp..."
                  error={errors.name?.message}
                  {...register("name")}
               />

               <FormInput
                  label="Mã ICD-10"
                  required={!isView}
                  disabled={isView}
                  placeholder="Ví dụ: E11, I10, J45..."
                  error={errors.icd10Code?.message}
                  {...register("icd10Code")}
               />

               <FormInput
                  label="Nhóm bệnh / Phân loại"
                  required={!isView}
                  disabled={isView}
                  placeholder="Ví dụ: Nội tiết - Chuyển hóa, Tim mạch..."
                  error={errors.category?.message}
                  {...register("category")}
               />

               <FormInput
                  label="Thứ tự hiển thị"
                  type="number"
                  required={!isView}
                  disabled={isView}
                  placeholder="0"
                  error={errors.displayOrder?.message}
                  {...register("displayOrder", { valueAsNumber: true })}
               />

               {!isCreate && (
                  <div className="flex flex-col gap-1.5 justify-center">
                     <label
                        htmlFor="isActive"
                        className="text-sm font-bold text-slate-700"
                     >
                        Trạng thái hoạt động
                     </label>
                     <Controller
                        control={control}
                        name="isActive"
                        render={({ field }) => (
                           <div className="flex items-center gap-2 mt-1">
                              <Switch
                                 id="isActive"
                                 disabled={isView}
                                 checked={field.value}
                                 onCheckedChange={field.onChange}
                              />
                              <span className="text-xs text-slate-600">
                                 {field.value ? "Hoạt động" : "Tạm khóa"}
                              </span>
                           </div>
                        )}
                     />
                  </div>
               )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
               {isView ? (
                  <CustomButton
                     type="button"
                     onClick={onClose}
                     className="w-24"
                  >
                     Đóng
                  </CustomButton>
               ) : (
                  <>
                     <CustomButton
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        className="w-20 bg-slate-200 text-black hover:bg-slate-300 hover:text-black"
                     >
                        Reset
                     </CustomButton>
                     <CustomButton
                        type="button"
                        onClick={onClose}
                        className="w-20 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
                     >
                        Hủy
                     </CustomButton>
                     <CustomButton
                        type="submit"
                        isLoading={isCreating || isUpdating}
                        className="w-20"
                     >
                        Lưu
                     </CustomButton>
                  </>
               )}
            </div>
         </form>
      </div>
   );
}

export default ChronicDiseaseForm;
