"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/common/custom-button";
import { FormTextarea } from "@/components/common/form-textarea";
import { useCreateConsultationMutation } from "@/store/api/consultation/consultation-api";
import { Consultation } from "@/store/api/consultation/type";
import { Monitor, User, Stethoscope } from "lucide-react";

interface CreateConsultationModalProps {
   open: boolean;
   onClose: () => void;
   examinationId: string;
   patientName?: string;
   diagnosis?: string;
   onSuccess?: (consultation: Consultation) => void;
}

export function CreateConsultationModal({
   open,
   onClose,
   examinationId,
   patientName,
   diagnosis,
   onSuccess,
}: CreateConsultationModalProps) {
   const [reason, setReason] = useState("");
   const [createConsultation, { isLoading }] = useCreateConsultationMutation();

   const handleSubmit = async () => {
      if (!reason.trim()) {
         toast.error("Vui lòng nhập lý do hội chẩn");
         return;
      }

      try {
         const result = await createConsultation({
            examinationId,
            reason: reason.trim(),
         }).unwrap();

         toast.success("Tạo phiếu yêu cầu hội chẩn thành công!");
         setReason("");
         onClose();
         onSuccess?.(result);
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(
            error.data?.message || "Không thể tạo phiếu yêu cầu hội chẩn",
         );
      }
   };

   return (
      <Dialog
         open={open}
         onOpenChange={(isOpen) => {
            if (!isOpen && !isLoading) {
               setReason("");
               onClose();
            }
         }}
      >
         <DialogContent className="sm:min-w-lg rounded-sm p-5">
            <DialogHeader className="gap-1 text-left">
               <div className="flex items-center gap-2 text-blue-700">
                  <Monitor className="size-5" />
                  <DialogTitle className="text-base font-semibold text-slate-900">
                     Tạo phiếu yêu cầu hội chẩn
                  </DialogTitle>
               </div>
               <DialogDescription className="text-xs text-slate-500">
                  Gửi yêu cầu hội chẩn ca bệnh tới các bác sĩ chuyên gia để nhận ý
                  kiến chuyên môn và kết luận điều trị.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
               <div className="bg-slate-50 p-3 rounded border space-y-1.5">
                  {patientName && (
                     <div className="flex items-center gap-2">
                        <User className="size-3.5 text-slate-500" />
                        <span className="text-slate-500 font-medium">Bệnh nhân:</span>
                        <span className="font-semibold text-slate-900">
                           {patientName}
                        </span>
                     </div>
                  )}
                  {diagnosis && (
                     <div className="flex items-start gap-2">
                        <Stethoscope className="size-3.5 text-slate-500 mt-0.5" />
                        <span className="text-slate-500 font-medium">Chẩn đoán:</span>
                        <span className="font-medium text-slate-800">
                           {diagnosis}
                        </span>
                     </div>
                  )}
               </div>

               <FormTextarea
                  label="Lý do hội chẩn & Yêu cầu chuyên môn"
                  name="reason"
                  placeholder="Mô tả tóm tắt tình trạng ca bệnh, diễn biến phức tạp hoặc các thắc mắc cần xin ý kiến chuyên gia..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs"
                  disabled={isLoading}
                  required
                  rows={5}
               />
            </div>

            <DialogFooter className="border-none flex items-center justify-end gap-2">
               <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                     setReason("");
                     onClose();
                  }}
                  disabled={isLoading}
                  className="h-9 px-4 text-xs"
               >
                  Hủy
               </CustomButton>
               <CustomButton
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  isLoading={isLoading}
                  loadingText="Đang gửi..."
                  disabled={!reason.trim()}
                  className="h-9 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
               >
                  Gửi yêu cầu hội chẩn
               </CustomButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
