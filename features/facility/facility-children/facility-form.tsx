import { useMemo, useEffect } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Factility, FacilityType } from "@/store/api/facility/type";
import { FormInput } from "@/components/common/form-input";
import { FormSelect } from "@/components/common/form-select";
import { Switch } from "@/components/ui/switch";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import {
   useCreateFacilityMutation,
   useUpdateFacilityMutation,
   useGetDetailFacilityQuery,
} from "@/store/api/facility/facility-api";
import { toast } from "react-toastify";

const FACILITY_TYPES = [
   "CENTRAL_HOSPITAL",
   "PROVINCIAL_HOSPITAL",
   "DISTRICT_HOSPITAL",
   "COMMUNE_HEALTH_STATION",
   "CLINIC",
   "OTHER",
] as const;

const FACILITY_TYPE_OPTIONS: { label: string; value: FacilityType }[] = [
   { label: "Bệnh viện tuyến Trung ương", value: "CENTRAL_HOSPITAL" },
   { label: "Bệnh viện tuyến Tỉnh / Thành phố", value: "PROVINCIAL_HOSPITAL" },
   { label: "Bệnh viện tuyến Quận / Huyện", value: "DISTRICT_HOSPITAL" },
   { label: "Trạm y tế Xã / Phường", value: "COMMUNE_HEALTH_STATION" },
   { label: "Phòng khám", value: "CLINIC" },
   { label: "Cơ sở y tế khác", value: "OTHER" },
];

const facility_shema = z.object({
   facilityName: z.string().min(1, "Tên cơ sở không được để trống"),
   facilityCode: z.string().optional(),
   facilityType: z.enum(FACILITY_TYPES, {
      message: "Loại cơ sở không được để trống",
   }),
   parentId: z.string().optional(),
   phoneNumber: z.string().min(1, "Số điện thoại không được để trống"),
   address: z.string().min(1, "Địa chỉ không được để trống"),
   isActive: z.boolean(),
});

type FacilitySchemaType = z.infer<typeof facility_shema>;

export interface FacilityFormProps {
   facilityId?: string;
   id?: string;
   facility?: Factility;
   parentId?: string;
   parentFacilityId?: string;
   parentFacility?: Factility;
   mode?: "create" | "update" | "view";
   onClose?: () => void;
   onCreatedSuccess?: (newFacility: Factility) => void;
}

export const FacilityForm = ({
   facilityId,
   id,
   facility,
   parentId,
   parentFacilityId,
   parentFacility,
   mode = "create",
   onClose,
   onCreatedSuccess,
}: FacilityFormProps) => {
   const targetFacilityId = facilityId || id || facility?.id;
   const targetParentId =
      parentId ||
      parentFacilityId ||
      parentFacility?.id ||
      facility?.parentId;

   const isView = mode === "view";

   const {
      data: fetchedFacility,
      isLoading: isLoadingFacility,
      isFetching: isFetchingFacility,
   } = useGetDetailFacilityQuery(targetFacilityId as string, {
      skip: !targetFacilityId || mode === "create",
   });

   const {
      data: fetchedParentFacility,
      isLoading: isLoadingParent,
      isFetching: isFetchingParent,
   } = useGetDetailFacilityQuery(targetParentId as string, {
      skip:
         !targetParentId ||
         mode !== "create" ||
         Boolean(parentFacility?.facilityName),
   });

   const currentFacility = fetchedFacility || facility;
   const currentParentFacility = fetchedParentFacility || parentFacility;

   const defaultValues: FacilitySchemaType = useMemo(() => {
      if (mode === "create") {
         return {
            facilityName: "",
            facilityCode: "",
            facilityType: "" as FacilityType,
            parentId: currentParentFacility?.id ?? targetParentId ?? "",
            phoneNumber: "",
            address: "",
            isActive: true,
         };
      }
      return {
         facilityName: currentFacility?.facilityName ?? "",
         facilityCode: currentFacility?.facilityCode ?? "",
         facilityType: (currentFacility?.facilityType ?? "") as FacilityType,
         parentId:
            currentFacility?.parentId ??
            currentParentFacility?.id ??
            targetParentId ??
            "",
         phoneNumber: currentFacility?.phoneNumber ?? "",
         address: currentFacility?.address ?? "",
         isActive: currentFacility?.isActive ?? true,
      };
   }, [mode, currentFacility, currentParentFacility, targetParentId]);

   const {
      register,
      handleSubmit,
      control,
      reset,
      formState: { errors },
   } = useForm<FacilitySchemaType>({
      values: defaultValues,
      resolver: zodResolver(facility_shema),
   });

   useEffect(() => {
      if (mode === "create") {
         reset({
            facilityName: "",
            facilityCode: "",
            facilityType: "" as FacilityType,
            parentId: currentParentFacility?.id ?? targetParentId ?? "",
            phoneNumber: "",
            address: "",
            isActive: true,
         });
      } else if (currentFacility) {
         reset({
            facilityName: currentFacility.facilityName ?? "",
            facilityCode: currentFacility.facilityCode ?? "",
            facilityType: (currentFacility.facilityType ?? "") as FacilityType,
            parentId:
               currentFacility.parentId ??
               currentParentFacility?.id ??
               targetParentId ??
               "",
            phoneNumber: currentFacility.phoneNumber ?? "",
            address: currentFacility.address ?? "",
            isActive: currentFacility.isActive ?? true,
         });
      }
   }, [mode, currentFacility, currentParentFacility, targetParentId, reset]);

   const handleReset = () => {
      reset(defaultValues);
   };

   const [createFacility, { isLoading: isCreatingFacility }] =
      useCreateFacilityMutation();
   const [updateFacility, { isLoading: isUpdatingFacility }] =
      useUpdateFacilityMutation();

   const isDetailLoading =
      (mode !== "create" &&
         (isLoadingFacility || (!currentFacility && isFetchingFacility))) ||
      (mode === "create" &&
         Boolean(
            targetParentId &&
               !currentParentFacility?.facilityName &&
               (isLoadingParent || isFetchingParent),
         ));

   if (isDetailLoading) {
      return (
         <div className="flex items-center justify-center min-h-64 p-8 bg-white rounded-xl border border-slate-200 mt-4">
            <CloverLoading size="md" text="Đang tải thông tin cơ sở..." />
         </div>
      );
   }

   const onSubmit = async (data: FacilitySchemaType) => {
      if (isView) return;
      try {
         if (mode === "create") {
            const created = await createFacility({
               facilityName: data.facilityName,
               facilityType: data.facilityType,
               parentId: data.parentId || undefined,
               phoneNumber: data.phoneNumber,
               address: data.address,
               isActive: data.isActive,
            }).unwrap();

            toast.success("Thêm mới cơ sở con thành công!");

            if (onCreatedSuccess) {
               onCreatedSuccess(created);
               return;
            }
         } else if (targetFacilityId) {
            await updateFacility({
               id: targetFacilityId,
               body: {
                  facilityName: data.facilityName,
                  facilityType: data.facilityType,
                  parentId: data.parentId || undefined,
                  phoneNumber: data.phoneNumber,
                  address: data.address,
                  isActive: data.isActive,
               },
            }).unwrap();

            toast.success("Cập nhật thông tin cơ sở thành công!");
         }
         onClose?.();
      } catch (error: unknown) {
         console.error("Lỗi khi lưu cơ sở:", error);
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi lưu cơ sở, vui lòng thử lại.";
         toast.error(errorMessage);
      }
   };

   return (
      <form
         onSubmit={handleSubmit(onSubmit)}
         className="flex flex-col gap-4 mt-4"
      >
         <div className="w-full border-b-2 border-b-primary pb-2">
            <span className="text-xl font-bold">
               {mode === "create"
                  ? "Thêm mới cơ sở con"
                  : isView
                     ? "Chi tiết cơ sở y tế"
                     : "Cập nhật thông tin cơ sở"}
            </span>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <FormInput
               key="input-facility-name"
               label="Tên cơ sở"
               required={!isView}
               disabled={isView}
               placeholder="Nhập tên cơ sở y tế"
               {...register("facilityName")}
               error={errors.facilityName?.message}
            />
            <FormInput
               key="input-facility-code"
               label="Mã cơ sở"
               disabled
               value={
                  mode !== "create"
                     ? currentFacility?.facilityCode || ""
                     : "Hệ thống tự động tạo mã"
               }
               className="bg-slate-100 text-slate-500 cursor-not-allowed italic"
            />
            <Controller
               control={control}
               name="facilityType"
               render={({ field, fieldState }) => (
                  <FormSelect
                     label="Loại cơ sở"
                     required={!isView}
                     disabled={isView}
                     placeholder="Chọn loại cơ sở y tế"
                     options={FACILITY_TYPE_OPTIONS}
                     value={field.value}
                     onValueChange={field.onChange}
                     error={fieldState.error?.message}
                  />
               )}
            />
            <div>
               <input type="hidden" {...register("parentId")} />
               <FormInput
                  key="input-parent-facility"
                  label="Cơ sở cha"
                  disabled
                  value={
                     currentParentFacility?.facilityName ||
                     currentFacility?.parentId ||
                     "Trực thuộc Bộ / Sở Y tế"
                  }
                  error={errors.parentId?.message}
                  className="bg-slate-100 text-slate-600 cursor-not-allowed"
               />
            </div>
            <FormInput
               key="input-phone-number"
               label="Số điện thoại"
               required={!isView}
               disabled={isView}
               placeholder="Ví dụ: 02438253531"
               {...register("phoneNumber")}
               error={errors.phoneNumber?.message}
            />
            <FormInput
               key="input-address"
               label="Địa chỉ"
               required={!isView}
               disabled={isView}
               placeholder="Nhập địa chỉ cơ sở"
               {...register("address")}
               error={errors.address?.message}
            />
            {(mode === "update" || isView) && (
               <div className="flex flex-col gap-1.5">
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
                        <Switch
                           id="isActive"
                           disabled={isView}
                           checked={field.value}
                           onCheckedChange={field.onChange}
                        />
                     )}
                  />
               </div>
            )}
         </div>
         <div className="flex justify-end gap-2">
            {isView ? (
               <CustomButton
                  type="button"
                  onClick={onClose}
                  className="min-w-20"
               >
                  Đóng
               </CustomButton>
            ) : (
               <>
                  <CustomButton
                     type="button"
                     variant="outline"
                     onClick={handleReset}
                     className="min-w-20 bg-slate-200 text-black hover:bg-slate-300 hover:text-black"
                  >
                     Reset
                  </CustomButton>
                  <CustomButton
                     type="button"
                     onClick={onClose}
                     className="min-w-20 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
                  >
                     Hủy
                  </CustomButton>
                  <CustomButton
                     type="submit"
                     isLoading={isCreatingFacility || isUpdatingFacility}
                     className="min-w-20"
                  >
                     Lưu
                  </CustomButton>
               </>
            )}
         </div>
      </form>
   );
};

export default FacilityForm;
