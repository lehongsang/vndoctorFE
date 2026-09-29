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
import { CareRequest } from "@/store/api/care-request/type";
import { FormTextarea } from "@/components/common/form-textarea";

interface ResolveModalProps {
   open: boolean;
   request: CareRequest | null;
   onClose: () => void;
   onConfirm: (resolutionNote: string) => Promise<void>;
   isLoading?: boolean;
}

export function ResolveModal({
   open,
   request,
   onClose,
   onConfirm,
   isLoading = false,
}: ResolveModalProps) {
   const [resolutionNote, setResolutionNote] = useState("");

   const handleConfirm = async () => {
      await onConfirm(resolutionNote.trim());
      setResolutionNote("");
   };

   return (
      <Dialog
         open={open}
         onOpenChange={(isOpen) => {
            if (!isOpen && !isLoading) {
               setResolutionNote("");
               onClose();
            }
         }}
      >
         <DialogContent className="sm:min-w-md rounded-sm p-5">
            <DialogHeader className="gap-1 text-left">
               <DialogTitle className="text-base font-semibold text-slate-900">
                  Hoàn thành yêu cầu chăm sóc
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500">
                  Cập nhật kết quả hoặc hướng dẫn dành cho bệnh nhân{" "}
                  <strong className="text-slate-700">
                     {request?.requestCode ? `(${request.requestCode})` : ""}
                  </strong>
                  .
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
               <FormTextarea
                  label="Nội dung kết quả / Lời dặn"
                  name="resolutionNote"
                  placeholder="Nhập chi tiết kết quả xử lý yêu cầu hoặc lời dặn của bác sĩ/điều dưỡng..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="text-xs"
                  disabled={isLoading}
                  required
                  rows={5}
               />
            </div>

            <DialogFooter className="border-none flex items-center justify-end gap-2">
               <CustomButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                     setResolutionNote("");
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
                  loadingText="Đang lưu..."
                  disabled={!resolutionNote.trim()}
                  className="h-9 px-4 text-xs"
               >
                  Xác nhận hoàn thành
               </CustomButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
