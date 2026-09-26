import React, { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
   Message,
   MessageType,
   Conversation,
} from "@/store/api/conversation/type";
import { User } from "@/store/slices/auth-slice";
import { STAFF_ROLE_LABELS, StaffRole } from "@/types/staff";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmModal } from "@/components/common/confirm-modal";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
   MoreVertical,
   ExternalLink,
   Download,
   Eye,
   Stethoscope,
   Activity,
   CornerDownRight,
} from "lucide-react";

interface MessageBubbleProps {
   message: Message;
   conversation?: Conversation | null;
   currentUser?: User | null;
   isMe?: boolean;
   messagesMap?: Map<string, Message>;
   onScrollToMessage?: (messageId: string) => void;
   onReply?: (message: Message) => void;
   onPin?: (message: Message) => void;
   onDelete?: (message: Message) => void;
   onViewRiskAssessment?: (resourceId: string) => void;
   onStartExamination?: (resourceId: string) => void;
}

// Render nội dung tin nhắn đính kèm đơn giản, hạn chế icon thừa
const renderMessageContent = (
   type: MessageType,
   content: string,
   resourceId?: string | null,
   mediaUrl?: string | null,
   callbacks?: {
      onViewRiskAssessment?: (resourceId: string) => void;
      onStartExamination?: (resourceId: string) => void;
   },
   profileId?: string,
) => {
   switch (type) {
      case "IMAGE":
         return (
            <div className="mt-1 overflow-hidden rounded-lg max-w-xs">
               {mediaUrl && (
                  <a
                     href={mediaUrl}
                     target="_blank"
                     rel="noreferrer"
                     className="block"
                  >
                     <Image
                        src={mediaUrl}
                        alt="Đính kèm"
                        width={360}
                        height={240}
                        className="rounded-lg object-cover max-h-56 w-auto hover:opacity-95 transition-opacity"
                        unoptimized
                     />
                  </a>
               )}
               {content && content !== "Đã gửi hình ảnh" && (
                  <p className="mt-1 text-xs">{content}</p>
               )}
            </div>
         );

      case "FILE":
         return (
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 mt-1 max-w-xs text-slate-800">
               <div className="min-w-0">
                  <p className="font-semibold text-xs truncate">
                     {content || "Tài liệu đính kèm"}
                  </p>
                  <span className="text-[10px] text-slate-400">
                     Tệp tin tài liệu
                  </span>
               </div>
               {mediaUrl && (
                  <a
                     href={mediaUrl}
                     target="_blank"
                     rel="noreferrer"
                     download
                     className="text-primary hover:underline text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                     <Download className="w-3.5 h-3.5" /> Tải về
                  </a>
               )}
            </div>
         );

      case "EXAMINATION": {
         const examUrl = profileId
            ? `/health-profile/examination/${profileId}?id=${resourceId}`
            : `/health-profile`;
         return (
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/60 text-slate-800 mt-1 max-w-sm">
               <span className="text-[11px] font-bold text-primary block mb-1">
                  [Phiếu khám bệnh]
               </span>
               <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {content || "Thông tin phiếu khám lâm sàng đã được đính kèm."}
               </p>
               {resourceId && (
                  <div className="mt-2 pt-1.5 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                     <span className="text-slate-500">
                        Mã: {resourceId.slice(0, 8)}...
                     </span>
                     <a
                        href={examUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-semibold flex items-center gap-1"
                     >
                        Xem phiếu <ExternalLink className="w-3 h-3" />
                     </a>
                  </div>
               )}
            </div>
         );
      }

      case "RISK_ASSESSMENT":
         return (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-slate-900 mt-0.5 max-w-sm shadow-xs">
               <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-amber-200/80">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                     <Activity className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                     <span>Phiếu phân tầng nguy cơ PTYTNC</span>
                  </div>
               </div>
               <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {content ||
                     "Kết quả đánh giá phân tầng nguy cơ tim mạch của bệnh nhân."}
               </p>
               {resourceId && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2 text-xs">
                     <span className="text-slate-500 font-mono text-[11px]">
                        Mã: {resourceId.slice(0, 8)}...
                     </span>
                     <div className="flex items-center gap-1.5">
                        <button
                           type="button"
                           onClick={() =>
                              callbacks?.onViewRiskAssessment?.(resourceId)
                           }
                           className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                           title="Xem chi tiết phân tầng nguy cơ"
                        >
                           <Eye className="w-3.5 h-3.5 text-amber-700" />
                           Chi tiết
                        </button>
                        <button
                           type="button"
                           onClick={() =>
                              callbacks?.onStartExamination?.(resourceId)
                           }
                           className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary hover:bg-primary/90 text-white transition-colors cursor-pointer shadow-2xs"
                           title="Tiến hành khám ngay cho bệnh nhân"
                        >
                           <Stethoscope className="w-3.5 h-3.5" />
                           Khám ngay
                        </button>
                     </div>
                  </div>
               )}
            </div>
         );

      case "HEALTH_RECORD":
         return (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/60 text-slate-800 mt-1 max-w-sm">
               <span className="text-[11px] font-bold text-rose-700 block mb-1">
                  [Chỉ số sinh hiệu]
               </span>
               <p className="text-xs text-slate-700 leading-relaxed">
                  {content || "Chỉ số đo huyết áp / nhịp tim / đường huyết"}
               </p>
            </div>
         );

      case "CARE_REQUEST":
         return (
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/60 text-slate-800 mt-1 max-w-sm">
               <span className="text-[11px] font-bold text-purple-700 block mb-1">
                  [Yêu cầu chăm sóc y tế]
               </span>
               <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {content}
               </p>
            </div>
         );

      default:
         return (
            <p className="text-xs sm:text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
               {content}
            </p>
         );
   }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
   message,
   conversation,
   currentUser,
   isMe: isMeProp,
   messagesMap,
   onScrollToMessage,
   onReply,
   onPin,
   onDelete,
   onViewRiskAssessment,
   onStartExamination,
}) => {
   const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

   // 1. Phân định người gửi (Tôi vs Người khác) dựa vào senderUserId / senderUser từ API
   const myStoredUser: Record<string, string | undefined> =
      typeof window !== "undefined"
         ? (() => {
              try {
                 return JSON.parse(localStorage.getItem("user") || "{}");
              } catch {
                 return {};
              }
           })()
         : {};

   const currentId = currentUser?.id || myStoredUser?.id || "";
   const currentUsername =
      currentUser?.username || myStoredUser?.username || "";

   const senderUserId =
      message.senderUserId ||
      message.senderUser?.id ||
      message.senderId ||
      message.userId ||
      "";
   const senderUsername = message.senderUser?.username;

   const resolvedIsMe =
      isMeProp !== undefined
         ? isMeProp
         : Boolean(
              (currentId && senderUserId === currentId) ||
              (currentUsername &&
                 senderUsername &&
                 senderUsername === currentUsername),
           );

   // Tra cứu thông tin người gửi nếu message.senderUser chưa kịp populate từ socket
   const matchedStaff = (() => {
      if (message.senderUser?.fullName) return message.senderUser;
      if (!senderUserId) return null;

      // 1. Kiểm tra từ directUser của hội thoại
      if (
         conversation?.directUser &&
         (conversation.directUserId === senderUserId ||
            conversation.directUser.id === senderUserId)
      ) {
         return {
            id: conversation.directUser.id,
            fullName:
               conversation.directUser.fullName ||
               conversation.directUser.name ||
               conversation.directUser.username,
            role: conversation.directUser.role,
            username: conversation.directUser.username,
         };
      }

      // 2. Kiểm tra từ members của hội thoại
      const member = conversation?.members?.find(
         (m) => m.userId === senderUserId,
      );
      if (member) {
         return {
            id: member.userId,
            fullName: member.fullName,
            role: member.role,
         };
      }

      // 3. Tra cứu từ các tin nhắn khác đã có trong hội thoại (messagesMap)
      if (messagesMap) {
         for (const m of messagesMap.values()) {
            if (
               (m.senderUserId === senderUserId ||
                  m.senderUser?.id === senderUserId) &&
               m.senderUser?.fullName
            ) {
               return m.senderUser;
            }
         }
      }

      return null;
   })();

   // 2. Lấy Tên và Vai trò chuẩn xác từ dữ liệu API
   let senderName = "Người gửi";
   let senderRoleLabel = "";

   if (resolvedIsMe) {
      const myName = currentUser?.fullName || myStoredUser?.fullName || "Bạn";
      senderName = `${myName}`;
      const myRole = (currentUser?.role ||
         myStoredUser?.role ||
         "DOCTOR") as StaffRole;
      senderRoleLabel = STAFF_ROLE_LABELS[myRole] || myRole || "Bác sĩ";
   } else if (
      message.senderType === "STAFF" ||
      message.senderUser ||
      matchedStaff
   ) {
      senderName =
         message.senderUser?.fullName ||
         matchedStaff?.fullName ||
         message.senderUser?.username ||
         matchedStaff?.username ||
         message.senderName ||
         "Bác sĩ";
      const staffRole = (message.senderUser?.role ||
         matchedStaff?.role ||
         message.senderRole ||
         "DOCTOR") as StaffRole;
      senderRoleLabel = STAFF_ROLE_LABELS[staffRole] || staffRole || "Bác sĩ";
   } else if (message.senderType === "PATIENT" || message.senderAccountId) {
      senderName =
         message.senderAccount?.fullName ||
         conversation?.healthProfile?.fullName ||
         "Bệnh nhân";
      senderRoleLabel = "Bệnh nhân";
   } else {
      senderName =
         conversation?.healthProfile?.fullName ||
         message.senderName ||
         "Thành viên";
      senderRoleLabel = message.senderType === "STAFF" ? "Bác sĩ" : "Bệnh nhân";
   }

   // Lấy chữ cái viết tắt cho Avatar (tính toán trực tiếp, không dùng hook sau early return)
   const cleanName = senderName.replace(/\(.*?\)/g, "").trim();
   const nameParts = cleanName.split(/\s+/).filter(Boolean);
   const avatarInitials =
      nameParts.length >= 2
         ? (
              nameParts[nameParts.length - 2][0] +
              nameParts[nameParts.length - 1][0]
           ).toUpperCase()
         : cleanName.slice(0, 2).toUpperCase() || "ND";

   const timeFormatted = message.createdAt
      ? format(new Date(message.createdAt), "HH:mm")
      : "";

   // 3. Tin nhắn hệ thống (SYSTEM)
   if (message.messageType === "SYSTEM" || message.senderType === "SYSTEM") {
      return (
         <div className="flex justify-center my-3 px-4">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs max-w-xl text-center leading-relaxed">
               {message.content}
            </span>
         </div>
      );
   }

   // 4. Tin nhắn đã thu hồi: hiển thị đúng bên gửi (phải) hoặc bên nhận (trái kèm avatar)
   if (message.isDeleted) {
      return (
         <div
            className={cn(
               "flex my-1.5 px-1 items-center gap-2",
               resolvedIsMe ? "justify-end" : "justify-start",
            )}
         >
            {!resolvedIsMe && (
               <Avatar className="w-7 h-7 shrink-0 opacity-60 border border-slate-200">
                  <AvatarFallback className="text-[10px] font-bold bg-slate-100 text-slate-400">
                     {avatarInitials}
                  </AvatarFallback>
               </Avatar>
            )}
            <div
               className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs italic text-slate-400 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs",
                  resolvedIsMe ? "rounded-tr-xs" : "rounded-tl-xs",
               )}
            >
               <span>Tin nhắn đã được thu hồi</span>
               {timeFormatted && (
                  <span className="text-[10px] not-italic text-slate-400/80 ml-1">
                     {timeFormatted}
                  </span>
               )}
            </div>
         </div>
      );
   }

   // 5. Xác định tin nhắn được reply (từ message.replyToMessage hoặc tra cứu qua messagesMap)
   const repliedMessage =
      message.replyToMessage ||
      (message.replyToMessageId
         ? messagesMap?.get(message.replyToMessageId)
         : null);

   let repliedSenderName = "tin nhắn";
   if (repliedMessage) {
      const repliedSenderId =
         repliedMessage.senderUserId ||
         repliedMessage.senderUser?.id ||
         repliedMessage.senderId ||
         repliedMessage.senderAccountId;

      const isReplyingToSelf = Boolean(
         senderUserId && repliedSenderId && senderUserId === repliedSenderId,
      );
      const isReplyingToViewer = Boolean(
         currentId && repliedSenderId === currentId && !resolvedIsMe,
      );

      if (isReplyingToSelf) {
         repliedSenderName = "chính mình";
      } else if (isReplyingToViewer) {
         repliedSenderName = "bạn";
      } else {
         // Tra cứu tên chuẩn của người được trả lời
         let name =
            repliedMessage.senderUser?.fullName ||
            repliedMessage.senderAccount?.fullName ||
            repliedMessage.senderName;

         // Tra cứu từ directUser nếu là chat trực tiếp
         if (
            !name &&
            conversation?.directUser &&
            (conversation.directUserId === repliedSenderId ||
               conversation.directUser.id === repliedSenderId)
         ) {
            name =
               conversation.directUser.fullName ||
               conversation.directUser.name ||
               conversation.directUser.username;
         }

         // Tra cứu từ danh sách thành viên Care Team
         if (!name && conversation?.members && repliedSenderId) {
            const member = conversation.members.find(
               (m) => m.userId === repliedSenderId,
            );
            if (member) name = member.fullName;
         }

         // Tra cứu từ thông tin bệnh nhân
         if (
            !name &&
            conversation?.healthProfile &&
            (repliedMessage.senderType === "PATIENT" ||
               conversation.healthProfileId === repliedSenderId ||
               conversation.healthProfile.accountId === repliedSenderId)
         ) {
            name = conversation.healthProfile.fullName;
         }

         // Tra cứu chéo từ messagesMap
         if (!name && messagesMap && repliedSenderId) {
            for (const m of messagesMap.values()) {
               if (
                  (m.senderUserId === repliedSenderId ||
                     m.senderUser?.id === repliedSenderId) &&
                  m.senderUser?.fullName
               ) {
                  name = m.senderUser.fullName;
                  break;
               }
            }
         }

         repliedSenderName =
            name ||
            (repliedMessage.senderType === "STAFF" ? "Bác sĩ" : "Bệnh nhân");
      }
   }

   return (
      <div
         className={cn(
            "group relative flex items-start gap-2 my-2 px-1",
            resolvedIsMe ? "justify-end" : "justify-start",
         )}
      >
         {/* Avatar (chỉ hiển thị cho người khác) */}
         {!resolvedIsMe && (
            <Avatar className="w-8 h-8 shrink-0 mt-0.5 border border-slate-200">
               <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {avatarInitials}
               </AvatarFallback>
            </Avatar>
         )}

         {/* Bong bóng tin nhắn */}
         <div
            className={cn(
               "flex flex-col max-w-[85%] sm:max-w-[75%]",
               resolvedIsMe ? "items-end" : "items-start",
            )}
         >
            {/* Tên & Vai trò (chỉ hiển thị cho người khác, không hiển thị khi tôi là người gửi) */}
            {!resolvedIsMe && (
               <div className="flex items-center gap-1.5 mb-1 px-1 justify-start">
                  <span className="text-xs font-semibold text-slate-800">
                     {senderName}
                  </span>
                  {senderRoleLabel && senderRoleLabel !== senderName && (
                     <span
                        className={cn(
                           "text-[10px] px-1.5 py-0.2 rounded-md font-medium",
                           message.senderType === "PATIENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                     >
                        {senderRoleLabel}
                     </span>
                  )}
               </div>
            )}

            {/* Thẻ tin nhắn đã ghim */}
            {message.isPinned && (
               <span className="text-[10px] text-amber-700 font-semibold mb-1 px-1">
                  [Đã ghim]
               </span>
            )}

            {/* Trả lời tin nhắn khác */}
            {repliedMessage ? (
               <button
                  type="button"
                  onClick={() =>
                     repliedMessage.id && onScrollToMessage?.(repliedMessage.id)
                  }
                  className={cn(
                     "group/reply text-left text-xs px-2.5 py-2 rounded-xl transition-colors cursor-pointer mb-1 max-w-full",
                     resolvedIsMe
                        ? "self-end bg-primary/10 border-primary text-slate-700 hover:bg-primary/15"
                        : "self-start bg-slate-100 border-slate-400 text-slate-700 hover:bg-slate-200",
                  )}
                  title="Nhấp để cuộn đến tin nhắn gốc"
               >
                  <span className="font-semibold flex items-center text-[10px] text-primary group-hover/reply:underline">
                     <span className="text-slate-700 mr-1 flex gap-1">
                        <CornerDownRight className="w-3 h-3" /> Trả lời
                     </span>{" "}
                     {repliedSenderName}
                  </span>
                  <span className="truncate block max-w-xs text-slate-600 text-xs">
                     {repliedMessage.content ||
                        (repliedMessage.messageType === "IMAGE"
                           ? "[Hình ảnh]"
                           : repliedMessage.messageType === "FILE"
                             ? "[Tệp tài liệu]"
                             : repliedMessage.messageType === "EXAMINATION"
                               ? "[Phiếu khám]"
                               : `[${repliedMessage.messageType}]`)}
                  </span>
               </button>
            ) : message.replyToMessageId ? (
               <button
                  type="button"
                  onClick={() =>
                     message.replyToMessageId &&
                     onScrollToMessage?.(message.replyToMessageId)
                  }
                  className={cn(
                     "text-left text-xs px-2.5 py-1 border-l-2 mb-1 max-w-full italic text-[11px] cursor-pointer",
                     resolvedIsMe
                        ? "self-end bg-primary/5 border-primary/40 text-slate-500 hover:bg-primary/10"
                        : "self-start bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200",
                  )}
                  title="Nhấp để cuộn đến tin nhắn gốc"
               >
                  <span>Trả lời một tin nhắn trước đó</span>
               </button>
            ) : null}

            {/* Khung nội dung & Menu thao tác bên cạnh (trái nếu là tin nhắn của mình, phải nếu là người khác) */}
            <div className="flex items-center gap-1.5">
               {resolvedIsMe && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                     <DropdownMenu>
                        <DropdownMenuTrigger
                           className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer outline-none"
                           title="Thao tác"
                        >
                           <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                           align="end"
                           className="w-36 text-xs"
                        >
                           {onReply && (
                              <DropdownMenuItem
                                 onClick={() => onReply(message)}
                                 className="cursor-pointer"
                              >
                                 Trả lời
                              </DropdownMenuItem>
                           )}
                           {onPin && (
                              <DropdownMenuItem
                                 onClick={() => onPin(message)}
                                 className="cursor-pointer"
                              >
                                 {message.isPinned ? "Bỏ ghim" : "Ghim tin"}
                              </DropdownMenuItem>
                           )}
                           {onDelete && (
                              <DropdownMenuItem
                                 onClick={() => setIsConfirmDeleteOpen(true)}
                                 className="text-destructive cursor-pointer"
                              >
                                 Thu hồi
                              </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               )}

               {/* Khung nội dung */}
               <div
                  className={cn(
                     "relative rounded-2xl px-3.5 py-2.5 shadow-2xs transition-all",
                     resolvedIsMe
                        ? "bg-primary text-white rounded-tr-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs",
                  )}
               >
                  {renderMessageContent(
                     message.messageType,
                     message.content,
                     message.resourceId,
                     message.mediaUrl,
                     {
                        onViewRiskAssessment,
                        onStartExamination,
                     },
                     conversation?.healthProfileId ||
                        conversation?.healthProfile?.id ||
                        conversation?.subscription?.healthProfileId,
                  )}

                  {/* Giờ gửi */}
                  <div
                     className={cn(
                        "text-[10px] mt-1 flex items-center gap-1",
                        resolvedIsMe
                           ? "justify-end text-white/75"
                           : "justify-start text-slate-400",
                     )}
                  >
                     <span>{timeFormatted}</span>
                  </div>
               </div>

               {!resolvedIsMe && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                     <DropdownMenu>
                        <DropdownMenuTrigger
                           className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer outline-none"
                           title="Thao tác"
                        >
                           <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                           align="start"
                           className="w-36 text-xs"
                        >
                           {onReply && (
                              <DropdownMenuItem
                                 onClick={() => onReply(message)}
                                 className="cursor-pointer"
                              >
                                 Trả lời
                              </DropdownMenuItem>
                           )}
                           {onPin && (
                              <DropdownMenuItem
                                 onClick={() => onPin(message)}
                                 className="cursor-pointer"
                              >
                                 {message.isPinned ? "Bỏ ghim" : "Ghim tin"}
                              </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               )}
            </div>
         </div>

         {/* Modal xác nhận thu hồi */}
         <ConfirmModal
            open={isConfirmDeleteOpen}
            onClose={() => setIsConfirmDeleteOpen(false)}
            onConfirm={() => {
               onDelete?.(message);
               setIsConfirmDeleteOpen(false);
            }}
            title="Thu hồi tin nhắn"
            description="Bạn có chắc chắn muốn thu hồi tin nhắn này không? Tin nhắn sẽ không thể khôi phục."
            confirmText="Thu hồi"
            variant="danger"
         />
      </div>
   );
};
