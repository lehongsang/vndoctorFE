"use client";

import * as React from "react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/common/custom-button";

export interface ConfirmModalProps {
   open: boolean;
   onOpenChange?: (open: boolean) => void;
   onClose?: () => void;
   onConfirm: () => void | Promise<void>;
   title?: React.ReactNode;
   description?: React.ReactNode;
   itemName?: string;
   confirmText?: string;
   cancelText?: string;
   isLoading?: boolean;
   loadingText?: string;
   variant?: "danger" | "warning" | "info";
   className?: string;
}

export function ConfirmModal({
   open,
   onOpenChange,
   onClose,
   onConfirm,
   title = "Xác nhận xóa",
   description,
   itemName,
   confirmText = "Xác nhận xóa",
   cancelText = "Hủy bỏ",
   isLoading = false,
   loadingText = "Đang xử lý...",
   variant = "danger",
   className,
}: ConfirmModalProps) {
   const handleClose = () => {
      if (isLoading) return;
      onClose?.();
      onOpenChange?.(false);
   };

   const handleConfirm = async () => {
      await onConfirm();
   };

   const defaultDescription = itemName ? (
      <>
         Bạn có chắc chắn muốn xóa{" "}
         <strong className="text-slate-800 font-semibold">{itemName}</strong>?
         Hành động này không thể hoàn tác sau khi thực hiện.
      </>
   ) : (
      "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục thực hiện?"
   );

   const confirmButtonColor = {
      danger: "bg-rose-600 hover:bg-rose-700 text-white hover:text-white",
      warning: "bg-amber-600 hover:bg-amber-700 text-white hover:text-white",
      info: "bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white",
   }[variant];

   return (
      <Dialog
         open={open}
         onOpenChange={(isOpen) => {
            if (!isOpen) {
               handleClose();
            } else {
               onOpenChange?.(true);
            }
         }}
      >
         <DialogContent className={`max-w-md p-5 rounded-md ${className ?? ""}`}>
            <DialogHeader className="gap-1.5 text-left">
               <DialogTitle className="text-base font-semibold text-slate-900">
                  {title}
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                  {description || defaultDescription}
               </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-3 flex items-center justify-end gap-2">
               <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="h-9 px-4 text-xs text-slate-700 border-slate-300 rounded-md"
               >
                  {cancelText}
               </CustomButton>

               <CustomButton
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  loadingText={loadingText}
                  className={`h-9 px-4 text-xs font-medium rounded-md ${confirmButtonColor}`}
               >
                  {confirmText}
               </CustomButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

export default ConfirmModal;
