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
import { CareRequest } from "@/store/api/care-request/type";
import { useAuth } from "@/hooks/use-auth";
import { FormTextarea } from "@/components/common/form-textarea";

interface ReceiveModalProps {
   open: boolean;
   request: CareRequest | null;
   onClose: () => void;
   onConfirm: (data: { assignedUserId: string; note: string }) => Promise<void>;
   isLoading?: boolean;
   doctorId?: string;
}

function ReceiveModalContent({
   request,
   onClose,
   onConfirm,
   doctorId,
   isLoading = false,
}: Omit<ReceiveModalProps, "open">) {
   const { user } = useAuth();
   const [note, setNote] = useState("");
   const [assignedUserId, setAssignedUserId] = useState<string>(user?.id || "");

   const handleConfirm = async () => {
      if (!assignedUserId) {
         toast.error("Vui lòng chọn người tiếp nhận yêu cầu");
         return;
      }
      await onConfirm({
         assignedUserId: assignedUserId,
         note: note.trim(),
      });
   };

   const handleChangeRequest = () => {
      if (assignedUserId === user?.id) {
         if (doctorId) {
            setAssignedUserId(doctorId);
         } else {
            toast.warn("Gói chăm sóc này chưa được chỉ định bác sĩ phụ trách");
         }
      } else {
         setAssignedUserId(user?.id || "");
      }
   };

   return (
      <DialogContent className="sm:min-w-2xl rounded-sm p-5">
         <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-base font-semibold text-slate-900">
               Tiếp nhận yêu cầu chăm sóc
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
               Bạn sẽ được phân công trực tiếp để xử lý yêu cầu{" "}
               <strong className="text-slate-700">
                  {request?.requestCode ? `(${request.requestCode})` : ""}
               </strong>
               .
            </DialogDescription>
         </DialogHeader>

         <div className="space-y-3 py-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded border">
               <div className="text-slate-500">Người phụ trách:</div>
               {assignedUserId === user?.id ? (
                  <div className="font-medium text-slate-900 mt-0.5">
                     {user?.fullName || "—"} ({user?.staffCode || "Nhân viên"})
                  </div>
               ) : (
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                     <span className="font-medium text-slate-900">
                        Bác sĩ phụ trách
                     </span>
                  </div>
               )}
               <CustomButton
                  type="button"
                  size="sm"
                  onClick={handleChangeRequest}
                  className="h-7 px-3 text-xs mt-2"
               >
                  {assignedUserId === user?.id
                     ? "Chuyển sang bác sĩ phụ trách"
                     : "Chuyển sang nhân viên phụ trách"}
               </CustomButton>
            </div>

            <FormTextarea
               label="Ghi chú tiếp nhận (tùy chọn)"
               name="note"
               placeholder="Nhập ghi chú..."
               value={note}
               onChange={(e) => setNote(e.target.value)}
               className="text-xs"
               disabled={isLoading}
               rows={5}
            />
         </div>

         <DialogFooter className="border-none flex items-center justify-end gap-2">
            <CustomButton
               type="button"
               variant="destructive"
               size="sm"
               onClick={onClose}
               disabled={isLoading}
               className="h-9 px-6 text-xs"
            >
               Đóng
            </CustomButton>
            <CustomButton
               type="button"
               size="sm"
               onClick={handleConfirm}
               isLoading={isLoading}
               loadingText="Đang xử lý..."
               className="h-9 px-4 text-xs"
            >
               Xác nhận tiếp nhận
            </CustomButton>
         </DialogFooter>
      </DialogContent>
   );
}

export function ReceiveModal({
   open,
   request,
   onClose,
   onConfirm,
   doctorId,
   isLoading = false,
}: ReceiveModalProps) {
   return (
      <Dialog
         open={open}
         onOpenChange={(isOpen) => {
            if (!isOpen && !isLoading) {
               onClose();
            }
         }}
      >
         {open && (
            <ReceiveModalContent
               key={`${request?.id || "modal"}`}
               request={request}
               onClose={onClose}
               onConfirm={onConfirm}
               doctorId={doctorId}
               isLoading={isLoading}
            />
         )}
      </Dialog>
   );
}
