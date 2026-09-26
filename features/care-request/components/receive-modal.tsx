"use client";

import React, { useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/common/custom-button";
import { Textarea } from "@/components/ui/textarea";
import { CareRequest } from "@/store/api/care-request/type";
import { useAuth } from "@/hooks/use-auth";

interface ReceiveModalProps {
   open: boolean;
   request: CareRequest | null;
   onClose: () => void;
   onConfirm: (data: { assignedUserId: string; note: string }) => Promise<void>;
   isLoading?: boolean;
}

export function ReceiveModal({
   open,
   request,
   onClose,
   onConfirm,
   isLoading = false,
}: ReceiveModalProps) {
   const { user } = useAuth();
   const [note, setNote] = useState("");

   const handleConfirm = async () => {
      if (!user?.id) return;
      await onConfirm({
         assignedUserId: user.id,
         note: note.trim(),
      });
      setNote("");
   };

   return (
      <Dialog
         open={open}
         onOpenChange={(isOpen) => {
            if (!isOpen && !isLoading) {
               setNote("");
               onClose();
            }
         }}
      >
         <DialogContent className="max-w-md p-5">
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
                  <div className="text-slate-500">Nhân viên tiếp nhận:</div>
                  <div className="font-medium text-slate-900 mt-0.5">
                     {user?.fullName || "—"} ({user?.staffCode || "Nhân viên"})
                  </div>
               </div>

               <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                     Ghi chú tiếp nhận (tùy chọn)
                  </label>
                  <Textarea
                     rows={3}
                     placeholder="Nhập ghi chú ban đầu..."
                     value={note}
                     onChange={(e) => setNote(e.target.value)}
                     className="text-xs"
                     disabled={isLoading}
                  />
               </div>
            </div>

            <DialogFooter className="mt-2 flex items-center justify-end gap-2">
               <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                     setNote("");
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
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  loadingText="Đang xử lý..."
                  className="h-9 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white"
               >
                  Xác nhận tiếp nhận
               </CustomButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
