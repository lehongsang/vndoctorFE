"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Message, Conversation } from "@/store/api/conversation/type";
import { MessageBubble } from "./message-bubble";
import { PinnedMessagesBar } from "./pinned-messages-bar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CloverLoading } from "@/components/common/clover-loading";
import { MessageSquareDashed, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { RiskAssessmentDetailModal } from "@/features/main-work/components/risk-assessment-detail-modal";
import { useLazyGetRiskAssessmentDetailQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";

const formatChatDateDivider = (dateString?: string): string => {
   if (!dateString) return "";
   try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      if (isToday(date)) return "Hôm nay";
      if (isYesterday(date)) return "Hôm qua";
      const formatted = format(date, "EEEE, 'ngày' dd/MM/yyyy", { locale: vi });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
   } catch {
      return "";
   }
};

const isDifferentDay = (d1?: string, d2?: string): boolean => {
   if (!d1 || !d2) return true;
   try {
      return !isSameDay(new Date(d1), new Date(d2));
   } catch {
      return true;
   }
};

interface ChatMessagesProps {
   conversation?: Conversation | null;
   messages: Message[];
   isLoading: boolean;
   isLoadingMore?: boolean;
   hasMore?: boolean;
   onLoadMore?: () => void;
   isSomeoneTyping?: boolean;
   onReply?: (message: Message) => void;
   onPin?: (message: Message) => void;
   onDelete?: (message: Message) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
   conversation,
   messages,
   isLoading,
   isLoadingMore = false,
   hasMore = false,
   onLoadMore,
   isSomeoneTyping,
   onReply,
   onPin,
   onDelete,
}) => {
   const { user } = useAuth();
   const router = useRouter();
   const [showScrollBottom, setShowScrollBottom] = useState(false);
   const [selectedAssessmentId, setSelectedAssessmentId] = useState<
      string | null
   >(null);
   const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
   const [triggerGetRiskAssessment] = useLazyGetRiskAssessmentDetailQuery();
   const viewportRef = useRef<HTMLDivElement>(null);
   const scrollEndRef = useRef<HTMLDivElement>(null);

   const handleStartExamination = async (assessmentId: string) => {
      let profileId =
         conversation?.healthProfileId ||
         conversation?.subscription?.healthProfileId;

      if (!profileId) {
         try {
            const res = await triggerGetRiskAssessment(assessmentId).unwrap();
            profileId =
               res.healthProfileId ||
               res.healthProfile?.id ||
               res.assessmentInput?.healthProfileId;
         } catch (err) {
            console.error(
               "Failed to load risk assessment for examination:",
               err,
            );
         }
      }

      if (profileId) {
         router.push(
            `/work?profileId=${profileId}&action=create&assessmentId=${assessmentId}`,
         );
      } else {
         router.push(`/work?action=create&assessmentId=${assessmentId}`);
      }
   };

   const handleViewRiskAssessment = (assessmentId: string) => {
      setSelectedAssessmentId(assessmentId);
      setIsRiskModalOpen(true);
   };

   const previousScrollHeightRef = useRef<number | null>(null);
   const previousScrollTopRef = useRef<number | null>(null);
   const isPrependingRef = useRef(false);

   const pinnedMessages = messages.filter((m) => m.isPinned);

   const messageMap = useMemo(() => {
      const map = new Map<string, Message>();
      messages.forEach((m) => map.set(m.id, m));
      return map;
   }, [messages]);

   // Bắt sự kiện cuộn chuột: cuộn xuống gần đáy thì ẩn nút, cuộn lên đỉnh thì tải thêm tin cũ
   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const distanceFromBottom =
         target.scrollHeight - target.scrollTop - target.clientHeight;
      setShowScrollBottom(distanceFromBottom > 120);

      // Khi người dùng cuộn lên gần đầu danh sách (cách top <= 60px)
      if (
         target.scrollTop <= 60 &&
         hasMore &&
         !isLoadingMore &&
         !isLoading &&
         onLoadMore
      ) {
         previousScrollHeightRef.current = target.scrollHeight;
         previousScrollTopRef.current = target.scrollTop;
         isPrependingRef.current = true;
         onLoadMore();
      }
   };

   // Phục hồi vị trí cuộn sau khi tin nhắn cũ được chèn lên đầu để không bị giật màn hình
   useEffect(() => {
      if (
         isPrependingRef.current &&
         viewportRef.current &&
         previousScrollHeightRef.current !== null
      ) {
         const viewport = viewportRef.current;
         const heightDiff =
            viewport.scrollHeight - previousScrollHeightRef.current;
         viewport.scrollTop = heightDiff + (previousScrollTopRef.current || 0);
         isPrependingRef.current = false;
         previousScrollHeightRef.current = null;
         previousScrollTopRef.current = null;
      }
   }, [messages]);

   // Reset cờ prepending nếu kết thúc loading mà không có tin mới
   useEffect(() => {
      if (!isLoadingMore && isPrependingRef.current) {
         const timer = setTimeout(() => {
            isPrependingRef.current = false;
            previousScrollHeightRef.current = null;
            previousScrollTopRef.current = null;
         }, 300);
         return () => clearTimeout(timer);
      }
   }, [isLoadingMore]);

   const scrollToBottom = () => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollBottom(false);
   };

   useEffect(() => {
      // Tự động cuộn xuống cuối khi có tin nhắn mới nếu đang ở gần đáy và không phải đang tải tin cũ
      if (!showScrollBottom && !isPrependingRef.current) {
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
                     <CloverLoading
                        size="md"
                        text="Đang tải lịch sử tin nhắn..."
                     />
                  </div>
               ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2 text-center p-4">
                     <MessageSquareDashed className="w-10 h-10 opacity-30" />
                     <p className="text-sm font-semibold text-slate-600">
                        Chưa có tin nhắn nào trong hội thoại
                     </p>
                     <p className="text-xs text-slate-400 max-w-xs">
                        Bắt đầu gửi tin nhắn trao đổi hoặc chia sẻ phiếu khám,
                        PTYTNC cho bệnh nhân ngay bên dưới.
                     </p>
                  </div>
               ) : (
                  <div className="space-y-1.5">
                     {/* Trạng thái đang tải thêm tin nhắn cũ */}
                     {isLoadingMore && (
                        <div className="flex items-center justify-center py-2 text-xs text-slate-400 gap-2">
                           <CloverLoading
                              size="sm"
                              text="Đang tải tin nhắn cũ..."
                           />
                        </div>
                     )}

                     {/* Đã tải hết tin nhắn cũ */}
                     {!hasMore && messages.length >= 25 && (
                        <div className="text-center py-2 text-[11px] text-slate-400 font-medium select-none">
                           Đã tải hết lịch sử tin nhắn
                        </div>
                     )}

                     {messages.map((message, index) => {
                        const prevMessage =
                           index > 0 ? messages[index - 1] : null;
                        const showDateDivider =
                           !prevMessage ||
                           isDifferentDay(
                              message.createdAt,
                              prevMessage.createdAt,
                           );

                        return (
                           <React.Fragment key={message.id}>
                              {showDateDivider && (
                                 <div className="relative flex items-center justify-center my-3 select-none">
                                    <div className="absolute inset-0 flex items-center">
                                       <div className="w-full border-t border-slate-200/80" />
                                    </div>
                                    <span className="relative px-3 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200 shadow-2xs">
                                       {formatChatDateDivider(
                                          message.createdAt,
                                       )}
                                    </span>
                                 </div>
                              )}
                              <div id={`msg-${message.id}`}>
                                 <MessageBubble
                                    message={message}
                                    conversation={conversation}
                                    currentUser={user}
                                    messagesMap={messageMap}
                                    onScrollToMessage={handleScrollToMessage}
                                    onReply={onReply}
                                    onPin={onPin}
                                    onDelete={onDelete}
                                    onViewRiskAssessment={
                                       handleViewRiskAssessment
                                    }
                                    onStartExamination={handleStartExamination}
                                 />
                              </div>
                           </React.Fragment>
                        );
                     })}

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
               className="absolute right-5 bottom-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-primary transition-all duration-200 cursor-pointer text-xs font-medium animate-in fade-in"
               title="Cuộn xuống tin nhắn mới nhất"
            >
               <ChevronDown className="w-4 h-4 text-primary shrink-0" />
               <span>Tin nhắn mới nhất</span>
            </button>
         )}

         {/* Modal xem chi tiết phân tầng nguy cơ */}
         <RiskAssessmentDetailModal
            isOpen={isRiskModalOpen}
            onClose={() => {
               setIsRiskModalOpen(false);
               setSelectedAssessmentId(null);
            }}
            assessmentId={selectedAssessmentId}
            onStartExamination={(assessment) => {
               setIsRiskModalOpen(false);
               setSelectedAssessmentId(null);
               const profileId =
                  assessment.healthProfileId ||
                  assessment.healthProfile?.id ||
                  assessment.assessmentInput?.healthProfileId ||
                  conversation?.healthProfileId ||
                  conversation?.subscription?.healthProfileId;
               if (profileId) {
                  router.push(
                     `/work?profileId=${profileId}&action=create&assessmentId=${assessment.id}`,
                  );
               } else {
                  router.push(
                     `/work?action=create&assessmentId=${assessment.id}`,
                  );
               }
            }}
         />
      </div>
   );
};
