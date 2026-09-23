"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Message, Conversation } from "@/store/api/conversation/type";
import { MessageBubble } from "./message-bubble";
import { PinnedMessagesBar } from "./pinned-messages-bar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CloverLoading } from "@/components/common/clover-loading";
import { MessageSquareDashed, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessagesProps {
   conversation?: Conversation | null;
   messages: Message[];
   isLoading: boolean;
   isSomeoneTyping?: boolean;
   onReply?: (message: Message) => void;
   onPin?: (message: Message) => void;
   onDelete?: (message: Message) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
   conversation,
   messages,
   isLoading,
   isSomeoneTyping,
   onReply,
   onPin,
   onDelete,
}) => {
   const { user } = useAuth();
   const [showScrollBottom, setShowScrollBottom] = useState(false);
   const viewportRef = useRef<HTMLDivElement>(null);
   const scrollEndRef = useRef<HTMLDivElement>(null);

   const pinnedMessages = messages.filter((m) => m.isPinned);

   const messageMap = useMemo(() => {
      const map = new Map<string, Message>();
      messages.forEach((m) => map.set(m.id, m));
      return map;
   }, [messages]);

   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const distanceFromBottom =
         target.scrollHeight - target.scrollTop - target.clientHeight;
      // Hiển thị nút trigger nếu cuộn lên cách đáy hơn 120px
      setShowScrollBottom(distanceFromBottom > 120);
   };

   const scrollToBottom = () => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollBottom(false);
   };

   useEffect(() => {
      // Tự động cuộn xuống cuối khi có tin nhắn mới nếu đang ở gần đáy
      if (!showScrollBottom) {
         scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
   }, [messages.length, isSomeoneTyping, showScrollBottom]);

   const handleScrollToMessage = (messageId: string) => {
      const element = document.getElementById(`msg-${messageId}`);
      if (element) {
         element.scrollIntoView({ behavior: "smooth", block: "center" });
         element.classList.add("bg-amber-100/50");
         setTimeout(() => {
            element.classList.remove("bg-amber-100/50");
         }, 2000);
      }
   };

   return (
      <div className="flex-1 relative flex flex-col min-h-0 bg-slate-50/60 overflow-hidden">
         {/* Thanh hiển thị các tin nhắn đã ghim */}
         <PinnedMessagesBar
            pinnedMessages={pinnedMessages}
            onUnpin={onPin}
            onScrollToMessage={handleScrollToMessage}
         />

         {/* Vùng cuộn tin nhắn sử dụng ScrollArea chuẩn */}
         <ScrollArea
            viewportRef={viewportRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 h-full overflow-hidden"
         >
            <div className="p-4 space-y-2">
               {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
                     <CloverLoading size="md" text="Đang tải lịch sử tin nhắn..." />
                  </div>
               ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2 text-center p-4">
                     <MessageSquareDashed className="w-10 h-10 opacity-30" />
                     <p className="text-sm font-semibold text-slate-600">
                        Chưa có tin nhắn nào trong hội thoại
                     </p>
                     <p className="text-xs text-slate-400 max-w-xs">
                        Bắt đầu gửi tin nhắn trao đổi hoặc chia sẻ phiếu khám, PTYTNC cho bệnh nhân ngay bên dưới.
                     </p>
                  </div>
               ) : (
                  <div className="space-y-1.5">
                     {messages.map((message) => (
                        <div key={message.id} id={`msg-${message.id}`}>
                           <MessageBubble
                              message={message}
                              conversation={conversation}
                              currentUser={user}
                              messagesMap={messageMap}
                              onScrollToMessage={handleScrollToMessage}
                              onReply={onReply}
                              onPin={onPin}
                              onDelete={onDelete}
                           />
                        </div>
                     ))}

                     {/* Hiệu ứng đang gõ tin nhắn */}
                     {isSomeoneTyping && (
                        <div className="flex items-center gap-2 p-2 text-slate-400 text-xs">
                           <div className="flex space-x-1 items-center bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-xs shadow-xs">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                           </div>
                        </div>
                     )}

                     <div ref={scrollEndRef} />
                  </div>
               )}
            </div>
         </ScrollArea>

         {/* Nút trigger cuộn xuống tin nhắn mới nhất ở bên phải */}
         {showScrollBottom && (
            <button
               type="button"
               onClick={scrollToBottom}
               className="absolute right-5 bottom-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 hover:text-primary transition-all duration-200 cursor-pointer text-xs font-medium animate-in fade-in"
               title="Cuộn xuống tin nhắn mới nhất"
            >
               <ChevronDown className="w-4 h-4 text-primary shrink-0" />
               <span>Tin nhắn mới nhất</span>
            </button>
         )}
      </div>
   );
};
