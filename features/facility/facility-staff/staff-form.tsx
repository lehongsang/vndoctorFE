import { useMemo, useEffect } from "react";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
   Staff,
   StaffRole,
   STAFF_ROLES,
   STAFF_ROLE_OPTIONS,
} from "@/store/api/staff/type";
import { Factility } from "@/store/api/facility/type";
import { FormInput } from "@/components/common/form-input";
import { FormSelect } from "@/components/common/form-select";
import { Switch } from "@/components/ui/switch";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { useAuth } from "@/hooks/use-auth";
import {
   useCreateStaffMutation,
   useUpdateStaffAdminMutation,
   useGetDetailStaffQuery,
} from "@/store/api/staff/staff-api";
import { toast } from "react-toastify";

const ROLE_PRIORITY: Record<StaffRole, number> = {
   VNDOCTOR_ADMIN: 6,
   ADMIN: 5,
   DOCTOR_EXPERT: 4,
   DOCTOR: 3,
   NURSE: 2,
   STAFF: 1,
};

const getStaffSchema = (
   mode: "create" | "update" | "view",
   maxPriority?: number,
) =>
   z.object({
      facilityId: z.string().min(1, "Cơ sở y tế không được để trống"),
      fullName: z.string().min(1, "Họ và tên không được để trống"),
      username: z
         .string()
         .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
         .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Tên đăng nhập không được chứa ký tự đặc biệt hoặc khoảng trắng",
         ),
      password:
         mode === "create"
            ? z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự")
            : z.string().optional(),
      role: z
         .enum(STAFF_ROLES, {
            message: "Vai trò không được để trống",
         })
         .refine(
            (role) => {
               if (mode === "create" && maxPriority !== undefined) {
                  return (ROLE_PRIORITY[role] ?? 1) <= maxPriority;
               }
               return true;
            },
            {
               message:
                  "Bạn không có quyền tạo nhân sự với vai trò cao hơn vai trò của bạn",
            },
         ),
      specialty: z.string().optional(),
      email: z
         .string()
         .min(1, "Email không được để trống")
         .email("Email không đúng định dạng"),
      phoneNumber: z.string().min(1, "Số điện thoại không được để trống"),
      isActive: z.boolean(),
   });

type StaffSchemaType = z.infer<ReturnType<typeof getStaffSchema>>;

export interface StaffFormProps {
   staffId?: string;
   id?: string;
   staff?: Staff;
   facility?: Factility;
   facilityId?: string;
   defaultRole?: StaffRole;
   title?: string;
   mode?: "create" | "update" | "view";
   onClose?: () => void;
}

export const StaffForm = ({
   staffId,
   id,
   staff,
   facility,
   facilityId,
   defaultRole,
   title,
   mode = "create",
   onClose,
}: StaffFormProps) => {
   const effectiveStaffId = staffId || id || staff?.id;
   const isView = mode === "view";

   const {
      data: staffDetail,
      isLoading: isLoadingDetail,
      isFetching: isFetchingDetail,
   } = useGetDetailStaffQuery(effectiveStaffId as string, {
      skip: !effectiveStaffId || mode === "create",
   });

   const currentStaff = staffDetail || staff;

   const currentFacilityId =
      facilityId || facility?.id || currentStaff?.facilityId || "";

   const defaultValues: StaffSchemaType = useMemo(() => {
      if (mode === "create") {
         return {
            facilityId: currentFacilityId,
            fullName: "",
            username: "",
            password: "",
            role: (defaultRole ?? "") as StaffRole,
            specialty: "",
            email: "",
            phoneNumber: "",
            isActive: true,
         };
      }
      return {
         facilityId: currentStaff?.facilityId || currentFacilityId,
         fullName: currentStaff?.fullName ?? "",
         username: currentStaff?.username ?? "",
         password: "",
         role: (currentStaff?.role ?? defaultRole ?? "") as StaffRole,
         specialty: currentStaff?.specialty ?? "",
         email: currentStaff?.email ?? "",
         phoneNumber: currentStaff?.phoneNumber ?? "",
         isActive: currentStaff?.isActive ?? true,
      };
   }, [mode, currentFacilityId, defaultRole, currentStaff]);

   const { user: currentUser } = useAuth();
   const currentUserRole = currentUser?.role as StaffRole | undefined;

   const maxPriority = useMemo(() => {
      if (!currentUserRole || !(currentUserRole in ROLE_PRIORITY)) {
         return 6;
      }
      return ROLE_PRIORITY[currentUserRole];
   }, [currentUserRole]);

   const availableRoleOptions = useMemo(() => {
      if (maxPriority === undefined) return STAFF_ROLE_OPTIONS;
      return STAFF_ROLE_OPTIONS.filter(
         (opt) => (ROLE_PRIORITY[opt.value] ?? 1) <= maxPriority,
      );
   }, [maxPriority]);

   const {
      register,
      handleSubmit,
      control,
      reset,
      formState: { errors },
   } = useForm<StaffSchemaType>({
      values: defaultValues,
      resolver: zodResolver(getStaffSchema(mode, maxPriority)),
   });

   useEffect(() => {
      if (mode === "create") {
         reset({
            facilityId: currentFacilityId || "",
            fullName: "",
            username: "",
            password: "",
            role: (defaultRole ?? "") as StaffRole,
            specialty: "",
            email: "",
            phoneNumber: "",
            isActive: true,
         });
      } else if (currentStaff) {
         reset({
            facilityId: currentStaff.facilityId || currentFacilityId || "",
            fullName: currentStaff.fullName ?? "",
            username: currentStaff.username ?? "",
            password: "",
            role: (currentStaff.role ?? defaultRole ?? "") as StaffRole,
            specialty: currentStaff.specialty ?? "",
            email: currentStaff.email ?? "",
            phoneNumber: currentStaff.phoneNumber ?? "",
            isActive: currentStaff.isActive ?? true,
         });
      }
   }, [currentStaff, currentFacilityId, defaultRole, mode, reset]);

   const handleReset = () => {
      reset(defaultValues);
   };

   const [createStaff, { isLoading: isCreatingStaff }] =
      useCreateStaffMutation();
   const [updateStaffAdmin, { isLoading: isUpdatingStaff }] =
      useUpdateStaffAdminMutation();

   if (
      (mode === "update" || mode === "view") &&
      (isLoadingDetail || (!currentStaff && isFetchingDetail))
   ) {
      return (
         <div className="flex items-center justify-center min-h-64 p-8 bg-white rounded-xl border border-slate-200 mt-4">
            <CloverLoading size="md" text="Đang tải thông tin nhân sự..." />
         </div>
      );
   }

   const onSubmit = async (data: StaffSchemaType) => {
      if (isView) return;
      try {
         if (mode === "create") {
            await createStaff({
               facilityId: data.facilityId,
               fullName: data.fullName,
               email: data.email,
               username: data.username,
               password: data.password || "",
               role: data.role,
               specialty: data.specialty || "",
               phoneNumber: data.phoneNumber,
            }).unwrap();
            toast.success("Thêm mới nhân sự thành công!");
         } else if (effectiveStaffId) {
            await updateStaffAdmin({
               id: effectiveStaffId,
               fullName: data.fullName,
               email: data.email,
               role: data.role,
               specialty: data.specialty || "",
               phoneNumber: data.phoneNumber,
               isActive: data.isActive,
            }).unwrap();
            toast.success("Cập nhật thông tin nhân sự thành công!");
         }
         onClose?.();
      } catch (error: unknown) {
         console.error("Lỗi khi lưu thông tin nhân sự:", error);
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi lưu thông tin nhân sự, vui lòng thử lại.";
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
               {title ||
                  (mode === "create"
                     ? "Thêm mới nhân sự"
                     : isView
                        ? "Chi tiết nhân sự"
                        : "Cập nhật thông tin nhân sự")}
            </span>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <FormInput
               key="input-fullname"
               label="Họ và tên"
               required={!isView}
               disabled={isView}
               placeholder="Nhập họ và tên nhân sự"
               {...register("fullName")}
               error={errors.fullName?.message}
            />
            <Controller
               control={control}
               name="role"
               render={({ field, fieldState }) => (
                  <FormSelect
                     label="Vai trò"
                     required={!isView}
                     disabled={isView}
                     placeholder="Chọn vai trò nhân sự"
                     options={availableRoleOptions}
                     value={field.value}
                     onValueChange={field.onChange}
                     error={fieldState.error?.message}
                  />
               )}
            />
            <FormInput
               key={mode === "create" ? "input-username-create" : "input-username-view"}
               label="Tên đăng nhập"
               required={mode === "create"}
               disabled={mode !== "create"}
               placeholder={
                  mode === "create"
                     ? "Nhập tên đăng nhập hệ thống"
                     : currentStaff?.username || ""
               }
               {...register("username")}
               className={
                  mode !== "create"
                     ? "bg-slate-100 text-slate-500 cursor-not-allowed italic"
                     : ""
               }
               error={errors.username?.message}
            />
            {mode === "create" ? (
               <FormInput
                  key="input-password-create"
                  label="Mật khẩu"
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  {...register("password")}
                  error={errors.password?.message}
               />
            ) : (
               <FormInput
                  key="input-password-view"
                  label="Mật khẩu"
                  disabled
                  value="••••••••"
                  className="bg-slate-100 text-slate-400 cursor-not-allowed"
               />
            )}
            <FormInput
               key="input-specialty"
               label="Chuyên khoa / Chức danh"
               disabled={isView}
               placeholder="Ví dụ: Đa khoa, Nội tiết, Điều dưỡng..."
               {...register("specialty")}
               error={errors.specialty?.message}
            />
            <div>
               <input type="hidden" {...register("facilityId")} />
               <FormInput
                  key="input-facility-name"
                  label="Cơ sở y tế trực thuộc"
                  disabled
                  value={
                     facility?.facilityName ||
                     currentStaff?.facility?.facilityName ||
                     "Cơ sở hiện tại"
                  }
                  error={errors.facilityId?.message}
                  className="bg-slate-100 text-slate-600 cursor-not-allowed"
               />
            </div>
            <FormInput
               label="Email"
               required={!isView}
               disabled={isView}
               type="email"
               placeholder="example@vndoctor.vn"
               {...register("email")}
               error={errors.email?.message}
            />
            <FormInput
               label="Số điện thoại"
               required={!isView}
               disabled={isView}
               placeholder="Ví dụ: 0912345678"
               {...register("phoneNumber")}
               error={errors.phoneNumber?.message}
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
                     isLoading={isCreatingStaff || isUpdatingStaff}
                     className="w-20"
                  >
                     Lưu
                  </CustomButton>
               </>
            )}
         </div>
      </form>
   );
};

export default StaffForm;
