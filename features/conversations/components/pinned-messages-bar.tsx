"use client";

import React, { useState } from "react";
import { Message } from "@/store/api/conversation/type";
import { Pin, ChevronDown, ChevronUp, X } from "lucide-react";

interface PinnedMessagesBarProps {
   pinnedMessages: Message[];
   onUnpin?: (message: Message) => void;
   onScrollToMessage?: (messageId: string) => void;
}

export const PinnedMessagesBar: React.FC<PinnedMessagesBarProps> = ({
   pinnedMessages,
   onUnpin,
   onScrollToMessage,
}) => {
   const [isExpanded, setIsExpanded] = useState(false);

   if (!pinnedMessages || pinnedMessages.length === 0) {
      return null;
   }

   const latestPinned = pinnedMessages[pinnedMessages.length - 1];

   return (
      <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 transition-all">
         <div className="flex items-center justify-between gap-3 text-xs">
            <div
               className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
               onClick={() => onScrollToMessage?.(latestPinned.id)}
            >
               <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
               <div className="min-w-0 flex-1">
                  <span className="font-bold text-amber-900 mr-2">
                     Tin nhắn đã ghim ({pinnedMessages.length}):
                  </span>
                  <span className="text-amber-800 line-clamp-1">
                     {latestPinned.content || `[${latestPinned.messageType}]`}
                  </span>
               </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
               {pinnedMessages.length > 1 && (
                  <button
                     type="button"
                     onClick={() => setIsExpanded(!isExpanded)}
                     className="p-1 text-amber-700 hover:bg-amber-100 rounded cursor-pointer"
                     title={isExpanded ? "Thu gọn" : "Xem tất cả tin đã ghim"}
                  >
                     {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                     ) : (
                        <ChevronDown className="w-4 h-4" />
                     )}
                  </button>
               )}
               {onUnpin && (
                  <button
                     type="button"
                     onClick={() => onUnpin(latestPinned)}
                     className="p-1 text-amber-700 hover:bg-amber-100 rounded cursor-pointer"
                     title="Bỏ ghim tin này"
                  >
                     <X className="w-3.5 h-3.5" />
                  </button>
               )}
            </div>
         </div>

         {/* Danh sách mở rộng nếu có nhiều hơn 1 tin ghim */}
         {isExpanded && pinnedMessages.length > 1 && (
            <div className="mt-2 pt-2 border-t border-amber-200/70 space-y-1.5 max-h-32 overflow-y-auto">
               {pinnedMessages
                  .slice(0, -1)
                  .reverse()
                  .map((msg) => (
                     <div
                        key={msg.id}
                        className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded hover:bg-amber-100/60"
                     >
                        <span
                           onClick={() => onScrollToMessage?.(msg.id)}
                           className="truncate cursor-pointer text-amber-900 flex-1"
                        >
                           • {msg.content || `[${msg.messageType}]`}
                        </span>
                        {onUnpin && (
                           <button
                              type="button"
                              onClick={() => onUnpin(msg)}
                              className="text-amber-600 hover:text-amber-900 p-0.5"
                              title="Bỏ ghim"
                           >
                              <X className="w-3 h-3" />
                           </button>
                        )}
                     </div>
                  ))}
            </div>
         )}
      </div>
   );
};
