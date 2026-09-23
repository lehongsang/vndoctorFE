import React from "react";
import { formatDistanceToNow, isToday, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Conversation } from "@/store/api/conversation/type";

interface ConversationItemProps {
   conversation: Conversation;
   isSelected: boolean;
   onSelect: (conversation: Conversation) => void;
}

const formatMessageTime = (dateString?: string | null) => {
   if (!dateString) return "";
   try {
      const date = new Date(dateString);
      if (isToday(date)) {
         return format(date, "HH:mm");
      }
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
   } catch {
      return "";
   }
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
   conversation,
   isSelected,
   onSelect,
}) => {
   const isCareTeam = conversation.type === "CARE_TEAM";
   const displayName =
      conversation.title ||
      conversation.healthProfile?.fullName ||
      (isCareTeam ? "Nhóm chăm sóc" : "Hội thoại trực tiếp");

   const avatarFallback =
      displayName
         .split(" ")
         .slice(-2)
         .map((part) => part[0])
         .join("")
         .toUpperCase() || "ND";

   const previewText =
      conversation.lastMessagePreview ||
      conversation.lastMessage?.content ||
      "Chưa có tin nhắn";

   const timeStr = formatMessageTime(
      conversation.lastMessageAt ||
         conversation.lastMessage?.createdAt ||
         conversation.updatedAt,
   );

   return (
      <button
         type="button"
         onClick={() => onSelect(conversation)}
         className={cn(
            "w-full text-left p-3 rounded-md transition-all duration-150 flex items-start gap-3 border cursor-pointer",
            isSelected
               ? "bg-primary/5 border-primary/30 shadow-xs"
               : "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200",
         )}
      >
         {/* Avatar */}
         <div className="relative shrink-0 mt-0.5">
            <Avatar className="w-10 h-10 border border-slate-200">
               <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {avatarFallback}
               </AvatarFallback>
            </Avatar>
         </div>

         <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
               <span
                  className={cn(
                     "font-semibold text-sm truncate",
                     isSelected ? "text-primary" : "text-slate-800",
                  )}
               >
                  {displayName}
               </span>
               <span className="text-[11px] text-slate-400 shrink-0 font-normal">
                  {timeStr}
               </span>
            </div>

            <div className="flex items-center justify-between gap-2">
               <p className="text-xs text-slate-500 truncate">{previewText}</p>

               {conversation.unreadCount && conversation.unreadCount > 0 ? (
                  <Badge
                     variant="default"
                     className="h-4 px-1.5 min-w-4 rounded-full text-[10px] font-bold bg-primary text-white flex items-center justify-center shrink-0"
                  >
                     {conversation.unreadCount > 99
                        ? "99+"
                        : conversation.unreadCount}
                  </Badge>
               ) : null}
            </div>

            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
               <Badge
                  variant="default"
                  className={cn(
                     "text-[10px] px-1.5 py-0 font-medium rounded",
                     isCareTeam
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800",
                  )}
               >
                  {isCareTeam ? "Gói chăm sóc" : "1-1 Bác sĩ"}
               </Badge>

               {conversation.healthProfile?.fullName && (
                  <span className="text-[11px] text-slate-500 truncate max-w-35">
                     BN: {conversation.healthProfile.fullName}
                  </span>
               )}
            </div>
         </div>
      </button>
   );
};
