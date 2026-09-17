"use client";

import { useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/common/custom-button";
import { FormInput } from "@/components/common/form-input";
import { useLinkToAppMutation } from "@/store/api/health-profile/health-profile-api";
import type { HealthProfile } from "@/store/api/health-profile/type";
import { toast } from "react-toastify";

interface LinkAppModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   profile?: HealthProfile | null;
   onSuccess?: () => void;
}

interface LinkAppFormProps {
   profile: HealthProfile;
   onClose: () => void;
   onSuccess?: () => void;
}

function LinkAppForm({ profile, onClose, onSuccess }: LinkAppFormProps) {
   const [phoneNumber, setPhoneNumber] = useState("");
   const [error, setError] = useState<string | null>(null);

   const [linkToApp, { isLoading }] = useLinkToAppMutation();

   const validatePhoneNumber = (phone: string) => {
      const trimmed = phone.trim();
      if (!trimmed) {
         return "Số điện thoại không được để trống";
      }
      const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(trimmed)) {
         return "Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09)";
      }
      return null;
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const validationError = validatePhoneNumber(phoneNumber);
      if (validationError) {
         setError(validationError);
         return;
      }

      setError(null);

      try {
         await linkToApp({
            healthProfileId: profile.id,
            phoneNumber: phoneNumber.trim(),
         }).unwrap();

         toast.success("Gửi yêu cầu liên kết ứng dụng thành công");
         onClose();
         onSuccess?.();
      } catch (err: unknown) {
         const errorObj = err as {
            data?: { message?: string };
            message?: string;
         };
         toast.error(
            errorObj?.data?.message ||
               errorObj?.message ||
               "Có lỗi xảy ra khi liên kết ứng dụng",
         );
      }
   };

   return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
         <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-md flex flex-col gap-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Bệnh nhân:</span>
               <span className="font-semibold text-slate-800 text-sm">
                  {profile.fullName}
               </span>
            </div>
            {profile.citizenId && (
               <div className="flex items-center justify-between">
                  <span className="text-slate-500">CCCD/CMND:</span>
                  <span className="font-mono text-slate-700">
                     {profile.citizenId}
                  </span>
               </div>
            )}
            {profile.phoneNumber && (
               <div className="flex items-center justify-between">
                  <span className="text-slate-500">SĐT hồ sơ:</span>
                  <span className="text-slate-700 font-medium">
                     {profile.phoneNumber}
                  </span>
               </div>
            )}
         </div>

         <FormInput
            id="link-app-phone"
            label="Số điện thoại liên kết App"
            required
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
               setPhoneNumber(e.target.value);
               if (error) setError(null);
            }}
            placeholder="Nhập số điện thoại đăng ký App..."
            disabled={isLoading}
            error={error || undefined}
         />

         <DialogFooter className="mt-1 flex items-center justify-end gap-2">
            <CustomButton
               type="button"
               variant="outline"
               size="sm"
               onClick={onClose}
               disabled={isLoading}
               className="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
            >
               Hủy
            </CustomButton>

            <CustomButton
               type="submit"
               size="sm"
               isLoading={isLoading}
               loadingText="Đang liên kết..."
               className="h-10 px-4"
            >
               Xác nhận liên kết
            </CustomButton>
         </DialogFooter>
      </form>
   );
}

export function LinkAppModal({
   open,
   onOpenChange,
   profile,
   onSuccess,
}: LinkAppModalProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-md p-5 rounded-md">
            <DialogHeader className="gap-1">
               <DialogTitle className="text-base font-semibold text-slate-900">
                  Liên kết tài khoản ứng dụng
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500">
                  Liên kết hồ sơ sức khỏe bệnh nhân với tài khoản người dùng
                  trên ứng dụng VNDoctor qua số điện thoại.
               </DialogDescription>
            </DialogHeader>

            {profile && (
               <LinkAppForm
                  key={profile.id}
                  profile={profile}
                  onClose={() => onOpenChange(false)}
                  onSuccess={onSuccess}
               />
            )}
         </DialogContent>
      </Dialog>
   );
}

export default LinkAppModal;
