"use client";

import React, { useState, useRef, useEffect } from "react";
import { Message, MessageType } from "@/store/api/conversation/type";
import { CustomButton } from "@/components/common/custom-button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/common/form-input";
import { Send, Paperclip, X } from "lucide-react";

interface MessageInputProps {
   onSendMessage: (payload: {
      content: string;
      messageType?: MessageType;
      resourceId?: string;
      mediaUrl?: string;
      replyToMessageId?: string;
   }) => Promise<void> | void;
   onTyping?: (isTyping: boolean) => void;
   replyingMessage?: Message | null;
   onCancelReply?: () => void;
   disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
   onSendMessage,
   onTyping,
   replyingMessage,
   onCancelReply,
   disabled = false,
}) => {
   const [content, setContent] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [customModalType, setCustomModalType] = useState<MessageType>("IMAGE");
   const [modalTitle, setModalTitle] = useState("");
   const [modalContent, setModalContent] = useState("");
   const [modalResourceId, setModalResourceId] = useState("");
   const [modalMediaUrl, setModalMediaUrl] = useState("");

   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const isSubmittingRef = useRef(false);

   useEffect(() => {
      if (replyingMessage) {
         textareaRef.current?.focus();
      }
   }, [replyingMessage]);

   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter" && !e.shiftKey) {
         e.preventDefault();
         handleSend();
      }
   };

   const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      if (onTyping) {
         onTyping(e.target.value.length > 0);
      }
   };

   const handleSend = async () => {
      const trimmed = content.trim();
      if (!trimmed || isSubmittingRef.current || disabled) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      // Xóa nội dung tức thì để trải nghiệm phản hồi ngay 0ms
      setContent("");
      if (onCancelReply) onCancelReply();
      if (onTyping) onTyping(false);

      try {
         await onSendMessage({
            content: trimmed,
            messageType: "TEXT",
            replyToMessageId: replyingMessage?.id,
         });
      } catch {
         // Nếu gửi thất bại, khôi phục lại nội dung để người dùng không bị mất chữ
         setContent(trimmed);
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
         // Giữ con trỏ chuột luôn ở ô nhập tin nhắn sau khi gửi
         setTimeout(() => {
            textareaRef.current?.focus();
         }, 0);
      }
   };

   const openSpecialAttachmentModal = (type: MessageType) => {
      setCustomModalType(type);
      setModalContent("");
      setModalResourceId("");
      setModalMediaUrl("");

      switch (type) {
         case "IMAGE":
            setModalTitle("Gửi hình ảnh y tế / đơn thuốc");
            break;
         case "FILE":
            setModalTitle("Đính kèm tệp tin / hồ sơ tài liệu");
            break;
         case "EXAMINATION":
            setModalTitle("Đính kèm liên kết Phiếu khám bệnh");
            break;
         case "RISK_ASSESSMENT":
            setModalTitle("Đính kèm liên kết Phiếu phân tầng nguy cơ");
            break;
         case "HEALTH_RECORD":
            setModalTitle("Đính kèm chỉ số đo sinh hiệu");
            break;
         case "CARE_REQUEST":
            setModalTitle("Gửi thẻ yêu cầu chăm sóc y tế");
            break;
         default:
            setModalTitle("Đính kèm");
      }
      setIsModalOpen(true);
   };

   const handleSendSpecialAttachment = async () => {
      if (
         !modalContent.trim() &&
         !modalMediaUrl.trim() &&
         !modalResourceId.trim()
      ) {
         return;
      }

      if (isSubmittingRef.current || disabled) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      const payload = {
         content: modalContent.trim() || `Thẻ ${customModalType}`,
         messageType: customModalType,
         resourceId: modalResourceId.trim() || undefined,
         mediaUrl: modalMediaUrl.trim() || undefined,
         replyToMessageId: replyingMessage?.id,
      };

      setIsModalOpen(false);
      if (onCancelReply) onCancelReply();

      try {
         await onSendMessage(payload);
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
         setTimeout(() => {
            textareaRef.current?.focus();
         }, 0);
      }
   };

   return (
      <div className="bg-white px-4">
         {/* Thanh preview khi đang trả lời tin nhắn */}
         {replyingMessage && (
            <div className="flex items-center justify-between bg-slate-50  border border-slate-200 rounded-lg px-3 py-1.5 mb-2 text-xs">
               <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-semibold text-primary shrink-0">
                     <span className="text-slate-700 mr-1">Trả lời</span>{" "}
                     {replyingMessage.senderUser?.fullName ||
                        replyingMessage.senderAccount?.fullName ||
                        replyingMessage.senderName ||
                        (replyingMessage.senderType === "STAFF"
                           ? "Bác sĩ"
                           : "Bệnh nhân")}{" "}
                     :
                  </span>
                  <span className="text-slate-600 truncate">
                     {replyingMessage.content ||
                        `[${replyingMessage.messageType}]`}
                  </span>
               </div>
               <button
                  type="button"
                  onClick={onCancelReply}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0 ml-2"
                  title="Hủy trả lời"
               >
                  <X className="w-3.5 h-3.5" />
               </button>
            </div>
         )}

         {/* Khung soạn thảo */}
         <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-md p-2 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            {/* Nút menu đính kèm chuyên biệt y tế */}
            <DropdownMenu>
               <DropdownMenuTrigger
                  disabled={disabled}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors shrink-0 outline-none"
                  title="Đính kèm tài liệu y tế"
               >
                  <Paperclip className="w-5 h-5" />
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-52 text-xs">
                  <DropdownMenuItem
                     onClick={() => openSpecialAttachmentModal("IMAGE")}
                     className="cursor-pointer"
                  >
                     Hình ảnh / Đơn thuốc
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onClick={() => openSpecialAttachmentModal("FILE")}
                     className="cursor-pointer"
                  >
                     Tệp tin / Hồ sơ tài liệu
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onClick={() => openSpecialAttachmentModal("EXAMINATION")}
                     className="cursor-pointer"
                  >
                     Phiếu khám bệnh
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onClick={() =>
                        openSpecialAttachmentModal("RISK_ASSESSMENT")
                     }
                     className="cursor-pointer"
                  >
                     Phiếu phân tầng nguy cơ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onClick={() => openSpecialAttachmentModal("HEALTH_RECORD")}
                     className="cursor-pointer"
                  >
                     Chỉ số sinh hiệu
                  </DropdownMenuItem>
                  <DropdownMenuItem
                     onClick={() => openSpecialAttachmentModal("CARE_REQUEST")}
                     className="cursor-pointer"
                  >
                     Yêu cầu chăm sóc
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>

            {/* Input văn bản đa dòng */}
            <textarea
               ref={textareaRef}
               rows={1}
               value={content}
               onChange={handleChange}
               onKeyDown={handleKeyDown}
               disabled={disabled}
               placeholder="Nhập tin nhắn tư vấn y tế (Enter để gửi, Shift+Enter xuống dòng)..."
               className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 resize-none py-2 px-1 max-h-32 min-h-9"
            />

            {/* Nút gửi */}
            <CustomButton
               size="sm"
               onClick={handleSend}
               disabled={!content.trim() || disabled || isSubmitting}
               isLoading={isSubmitting}
               startIcon={<Send className="w-4 h-4" />}
            >
               Gửi
            </CustomButton>
         </div>

         {/* Modal gửi đính kèm / thẻ y tế chuyên dụng */}
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-md bg-white">
               <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-800">
                     {modalTitle}
                  </DialogTitle>
               </DialogHeader>
               <div className="space-y-3 py-2 text-xs">
                  <FormInput
                     label="Nội dung / Mô tả hiển thị"
                     value={modalContent}
                     onChange={(e) => setModalContent(e.target.value)}
                     placeholder="Nhập ghi chú hoặc mô tả..."
                     className="text-xs h-10"
                  />

                  {(customModalType === "IMAGE" ||
                     customModalType === "FILE" ||
                     customModalType === "HEALTH_RECORD") && (
                     <FormInput
                        label="Đường dẫn hình ảnh / File URL (mediaUrl)"
                        value={modalMediaUrl}
                        onChange={(e) => setModalMediaUrl(e.target.value)}
                        placeholder="https://storage.vndoctor.vn/..."
                        className="text-xs h-10"
                     />
                  )}

                  {(customModalType === "EXAMINATION" ||
                     customModalType === "RISK_ASSESSMENT") && (
                     <FormInput
                        label="Mã thực thể y tế (resourceId / UUID)"
                        value={modalResourceId}
                        onChange={(e) => setModalResourceId(e.target.value)}
                        placeholder="Nhập mã phiếu khám hoặc PTYTNC..."
                        className="text-xs h-10"
                     />
                  )}
               </div>

               <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <CustomButton
                     variant="outline"
                     size="sm"
                     onClick={() => setIsModalOpen(false)}
                     disabled={isSubmitting}
                  >
                     Hủy
                  </CustomButton>
                  <CustomButton
                     variant="default"
                     size="sm"
                     onClick={handleSendSpecialAttachment}
                     disabled={isSubmitting}
                     isLoading={isSubmitting}
                     loadingText="Đang gửi..."
                  >
                     Gửi đính kèm
                  </CustomButton>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   );
};
