"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
   conversationApi,
   useGetConversationsQuery,
   useGetConversationByIdQuery,
   useGetMessagesQuery,
   useLazyGetMessagesQuery,
   useSendMessageMutation,
   usePinMessageMutation,
   useDeleteMessageMutation,
} from "@/store/api/conversation/conversation-api";
import { useAppDispatch } from "@/store/hooks";
import {
   Conversation,
   ConversationType,
   Message,
   MessageType,
   QueryConversationDto,
} from "@/store/api/conversation/type";
import { ConversationList } from "./components/conversation-list";
import { ChatHeader } from "./components/chat-header";
import { ChatMessages } from "./components/chat-messages";
import { MessageInput } from "./components/message-input";
import { useChatSocket } from "./hooks/use-chat-socket";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

export const ConversationWorkspace: React.FC = () => {
   const dispatch = useAppDispatch();
   const { user } = useAuth();
   const searchParams = useSearchParams();
   const paramConversationId = searchParams.get("conversationId");
   const paramProfileId =
      searchParams.get("profileId") || searchParams.get("healthProfileId");
   const paramType = searchParams.get("type") as ConversationType | null;

   const initialType =
      paramType && (paramType === "CARE_TEAM" || paramType === "DIRECT")
         ? paramType
         : "ALL";

   const [selectedId, setSelectedId] = useState<string | null>(
      paramConversationId || null,
   );
   const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
   const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedType, setSelectedType] = useState<"ALL" | ConversationType>(
      initialType,
   );

   // Đồng bộ query params khi chuyển trang mà không gây cascading render
   const [prevParamType, setPrevParamType] = useState(paramType);
   if (paramType !== prevParamType) {
      setPrevParamType(paramType);
      if (paramType === "CARE_TEAM" || paramType === "DIRECT") {
         setSelectedType(paramType);
      }
   }

   const [prevParamConvId, setPrevParamConvId] = useState(paramConversationId);
   if (paramConversationId !== prevParamConvId) {
      setPrevParamConvId(paramConversationId);
      if (paramConversationId) {
         setSelectedId(paramConversationId);
      }
   }

   // Đọc thông tin user dự phòng từ localStorage nếu Redux đang hydrate
   const storedUser = useMemo(() => {
      if (typeof window === "undefined") return null;
      try {
         const raw = localStorage.getItem("user");
         return raw ? JSON.parse(raw) : null;
      } catch {
         return null;
      }
   }, []);

   const effectiveUser = user || storedUser;
   const effectiveFullName =
      effectiveUser?.fullName ||
      effectiveUser?.name ||
      effectiveUser?.username ||
      "Bác sĩ";
   const effectiveUserId = effectiveUser?.id || "";
   const effectiveRole = effectiveUser?.role || "DOCTOR";

   // 1. Lấy danh sách phòng chat kèm params tìm kiếm và lọc loại từ API backend
   const conversationParams = useMemo(() => {
      const params: QueryConversationDto = {};
      if (user?.facilityId) params.facilityId = user.facilityId;
      if (selectedType !== "ALL") params.type = selectedType;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      return params;
   }, [user, selectedType, searchQuery]);

   const {
      data: conversationData,
      isLoading: isLoadingConversations,
      isFetching: isFetchingConversations,
      refetch: refetchConversations,
   } = useGetConversationsQuery(conversationParams);

   const conversations = useMemo(
      () => conversationData?.data || [],
      [conversationData?.data],
   );

   // Tìm cuộc hội thoại tương ứng theo profileId nếu chưa có selectedId
   const matchedByProfile = useMemo(() => {
      if (!paramProfileId) return null;
      return (
         conversations.find(
            (c) =>
               c.healthProfileId === paramProfileId &&
               (!paramType || c.type === paramType),
         ) ||
         conversations.find((c) => c.healthProfileId === paramProfileId) ||
         null
      );
   }, [conversations, paramProfileId, paramType]);

   // Lấy ID hội thoại đang chọn (hoặc theo param URL, hoặc theo profileId, hoặc mặc định là hội thoại đầu tiên)
   const activeId =
      selectedId ||
      matchedByProfile?.id ||
      paramConversationId ||
      (conversations.length > 0 ? conversations[0].id : null);

   const selectedConversation = useMemo(
      () => conversations.find((c) => c.id === activeId) || null,
      [conversations, activeId],
   );

   // Quản lý trạng thái phân trang tin nhắn cũ (infinite scroll upwards)
   const [isEndReached, setIsEndReached] = useState(false);
   const [isLoadingOlder, setIsLoadingOlder] = useState(false);

   // Điều chỉnh state khi activeId thay đổi ngay trong render (chuẩn React 19, không dùng effect gây cascading render)
   const [prevActiveId, setPrevActiveId] = useState(activeId);
   if (activeId !== prevActiveId) {
      setPrevActiveId(activeId);
      setRealtimeMessages([]);
      setReplyingMessage(null);
      setIsEndReached(false);
      setIsLoadingOlder(false);
   }

   const handleSelectConversation = useCallback((conv: Conversation) => {
      setSelectedId(conv.id);
      setRealtimeMessages([]);
      setReplyingMessage(null);
   }, []);

   // Lấy chi tiết cuộc hội thoại (nếu có bổ sung thêm thông tin)
   const { data: conversationDetail } = useGetConversationByIdQuery(
      activeId || "",
      { skip: !activeId },
   );

   // Hội thoại đang hoạt động với đầy đủ thông tin nhất có thể
   const activeConversation: Conversation | null = useMemo(() => {
      if (!selectedConversation && !conversationDetail) return null;
      return {
         ...(selectedConversation || {}),
         ...(conversationDetail || {}),
         healthProfile:
            selectedConversation?.healthProfile ||
            conversationDetail?.healthProfile,
         subscription:
            selectedConversation?.subscription ||
            conversationDetail?.subscription,
      } as Conversation;
   }, [selectedConversation, conversationDetail]);

   const displayConversations = useMemo(() => {
      if (
         activeConversation &&
         !conversations.some((c) => c.id === activeConversation.id)
      ) {
         return [activeConversation, ...conversations];
      }
      return conversations;
   }, [conversations, activeConversation]);

   // 2. Lấy danh sách tin nhắn của hội thoại đang chọn
   const { data: messagesData, isLoading: isLoadingMessages } =
      useGetMessagesQuery(
         { conversationId: activeConversation?.id || "" },
         { skip: !activeConversation?.id },
      );

   const [triggerGetMessages] = useLazyGetMessagesQuery();

   // Tính toán hasMoreOlder trực tiếp trong render (React 19 pattern: You Might Not Need an Effect)
   const hasMoreOlder = useMemo(() => {
      if (isEndReached) return false;
      if (!messagesData?.data) return true;
      if (messagesData.data.length < 30) return false;
      if (
         messagesData.total !== undefined &&
         messagesData.data.length >= messagesData.total
      ) {
         return false;
      }
      return true;
   }, [isEndReached, messagesData?.data, messagesData?.total]);

   // 3. Socket: Callback khi nhận tin nhắn realtime mới
   const handleNewRealtimeMessage = useCallback(
      (message: Message) => {
         // Cập nhật tin nhắn cuối cùng và thứ tự trong danh sách bên trái
         dispatch(
            conversationApi.util.updateQueryData(
               "getConversations",
               conversationParams,
               (draft) => {
                  if (!draft.data) return;
                  const convIndex = draft.data.findIndex(
                     (c) => c.id === message.conversationId,
                  );
                  if (convIndex !== -1) {
                     const conv = { ...draft.data[convIndex] };
                     conv.lastMessage = message;
                     conv.lastMessagePreview = message.content;
                     conv.lastMessageAt = message.createdAt;
                     conv.updatedAt = message.createdAt;
                     if (message.conversationId !== activeId) {
                        conv.unreadCount = (conv.unreadCount || 0) + 1;
                     }
                     draft.data.splice(convIndex, 1);
                     draft.data.unshift(conv);
                  }
               },
            ),
         );

         // Cập nhật cache getMessages của RTK Query
         dispatch(
            conversationApi.util.updateQueryData(
               "getMessages",
               { conversationId: message.conversationId },
               (draft) => {
                  if (!draft.data) draft.data = [];
                  if (!draft.data.some((m) => m.id === message.id)) {
                     draft.data.push(message);
                  }
               },
            ),
         );

         // Cập nhật state nếu thuộc cuộc hội thoại đang mở
         const isActive = message.conversationId === activeId;

         if (isActive) {
            setRealtimeMessages((prev) => {
               if (prev.some((m) => m.id === message.id)) return prev;

               // Thay thế tin tạm (temp-) cùng nội dung nếu có
               const tempIndex = prev.findIndex(
                  (m) =>
                     m.id.startsWith("temp-") &&
                     m.content === message.content,
               );

               if (tempIndex !== -1) {
                  const next = [...prev];
                  next[tempIndex] = {
                     ...message,
                     replyToMessage:
                        prev[tempIndex].replyToMessage ||
                        message.replyToMessage,
                     replyToMessageId:
                        message.replyToMessageId ||
                        prev[tempIndex].replyToMessageId,
                  };
                  return next;
               }

               return [...prev, message];
            });
         }
      },
      [dispatch, conversationParams, activeId],
   );

   const {
      isConnected,
      isSomeoneTyping,
      sendSocketMessage,
      emitTyping,
      emitMessageRead,
   } = useChatSocket({
      conversationId: activeConversation?.id,
      onNewMessage: handleNewRealtimeMessage,
   });

   // Kết hợp tin nhắn từ REST API & Realtime Socket (loại trừ trùng ID và tin tạm)
   const allMessages = useMemo(() => {
      const apiMsgs = messagesData?.data || [];
      const msgMap = new Map<string, Message>();
      apiMsgs.forEach((msg) => msgMap.set(msg.id, msg));
      realtimeMessages.forEach((msg) => {
         if (!msgMap.has(msg.id)) {
            if (
               msg.id.startsWith("temp-") &&
               apiMsgs.some(
                  (apiMsg) =>
                     apiMsg.content === msg.content &&
                     Math.abs(
                        new Date(apiMsg.createdAt).getTime() -
                           new Date(msg.createdAt).getTime(),
                     ) < 15000,
               )
            ) {
               return;
            }
            msgMap.set(msg.id, msg);
         }
      });
      return Array.from(msgMap.values()).sort(
         (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
   }, [messagesData?.data, realtimeMessages]);

   // Đánh dấu đã đọc tin nhắn mới nhất
   useEffect(() => {
      if (allMessages.length > 0 && activeConversation?.id) {
         const lastMsg = allMessages[allMessages.length - 1];
         if (lastMsg && lastMsg.senderId !== effectiveUserId) {
            emitMessageRead(lastMsg.id);
         }
      }
   }, [allMessages, activeConversation?.id, effectiveUserId, emitMessageRead]);

   // Tải thêm tin nhắn cũ hơn khi người dùng cuộn lên trên cùng
   const handleLoadOlderMessages = useCallback(async () => {
      if (!activeConversation || isLoadingOlder || !hasMoreOlder) return;

      const persistentMessages = allMessages.filter(
         (m) => !m.id.startsWith("temp-"),
      );
      if (persistentMessages.length === 0) return;

      const oldestMsg = persistentMessages[0];
      const beforeCursor = oldestMsg.createdAt || oldestMsg.id;

      setIsLoadingOlder(true);
      try {
         const res = await triggerGetMessages({
            conversationId: activeConversation.id,
            params: { before: beforeCursor, limit: 30 },
         }).unwrap();

         const olderData = res.data || [];
         if (olderData.length < 30) {
            setIsEndReached(true);
         }

         if (olderData.length > 0) {
            dispatch(
               conversationApi.util.updateQueryData(
                  "getMessages",
                  { conversationId: activeConversation.id },
                  (draft) => {
                     if (!draft.data) draft.data = [];
                     const existingIds = new Set(draft.data.map((m) => m.id));
                     const uniqueOlder = olderData.filter(
                        (m) => !existingIds.has(m.id),
                     );
                     draft.data = [...uniqueOlder, ...draft.data];
                  },
               ),
            );
         }
      } catch (err) {
         console.error("Lỗi khi tải tin nhắn cũ:", err);
      } finally {
         setIsLoadingOlder(false);
      }
   }, [
      activeConversation,
      isLoadingOlder,
      hasMoreOlder,
      allMessages,
      triggerGetMessages,
      dispatch,
   ]);

   // 4. Mutations
   const [sendRestMessage] = useSendMessageMutation();
   const [pinMessageMutation] = usePinMessageMutation();
   const [deleteMessageMutation] = useDeleteMessageMutation();

   // Gửi tin nhắn: Ưu tiên WebSocket Gateway để phát sóng realtime tức thì; Fallback REST API nếu socket ngắt kết nối
   const handleSendMessage = async (payload: {
      content: string;
      messageType?: MessageType;
      resourceId?: string;
      mediaUrl?: string;
      replyToMessageId?: string;
   }) => {
      if (!activeConversation) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
         id: tempId,
         conversationId: activeConversation.id,
         content: payload.content,
         messageType: payload.messageType || "TEXT",
         resourceId: payload.resourceId,
         mediaUrl: payload.mediaUrl,
         replyToMessageId: payload.replyToMessageId,
         replyToMessage: replyingMessage || undefined,
         senderType: "STAFF",
         senderUserId: effectiveUserId,
         senderUser: {
            id: effectiveUserId,
            fullName: effectiveFullName,
            role: effectiveRole,
            staffCode: effectiveUser?.staffCode,
            username: effectiveUser?.username,
         },
         isPinned: false,
         isDeleted: false,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      };

      // 1. Chèn tức thì vào UI (Optimistic UI 0ms)
      setRealtimeMessages((prev) => [...prev, optimisticMessage]);

      // 2. Thử gửi qua WebSocket trước để server broadcast realtime tới phòng chat
      const sentViaSocket = sendSocketMessage(payload);

      if (!sentViaSocket) {
         // Nếu socket chưa kết nối, fallback gửi qua REST API
         try {
            const sent = await sendRestMessage({
               conversationId: activeConversation.id,
               body: payload,
            }).unwrap();

            const enrichedSent: Message = {
               ...sent,
               senderType: "STAFF",
               senderUserId: sent.senderUserId || effectiveUserId,
               senderUser: {
                  id: effectiveUserId,
                  fullName: effectiveFullName,
                  role: effectiveRole,
                  staffCode: effectiveUser?.staffCode,
                  username: effectiveUser?.username,
               },
               replyToMessageId: sent.replyToMessageId || payload.replyToMessageId,
               replyToMessage: sent.replyToMessage || replyingMessage,
               isDeleted: false,
            };

            setRealtimeMessages((prev) => {
               const filtered = prev.filter((m) => m.id !== tempId);
               if (!filtered.some((m) => m.id === enrichedSent.id)) {
                  filtered.push(enrichedSent);
               }
               return filtered;
            });
         } catch {
            setRealtimeMessages((prev) => prev.filter((m) => m.id !== tempId));
            toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
         }
      }
   };

   // Ghim / Bỏ ghim tin nhắn với Optimistic Update
   const handlePinMessage = async (message: Message) => {
      setRealtimeMessages((prev) =>
         prev.map((m) =>
            m.id === message.id ? { ...m, isPinned: !message.isPinned } : m,
         ),
      );
      try {
         await pinMessageMutation({
            messageId: message.id,
            body: { isPinned: !message.isPinned },
            conversationId: activeConversation?.id,
         }).unwrap();
         toast.success(
            message.isPinned ? "Đã bỏ ghim tin nhắn" : "Đã ghim tin nhắn",
         );
      } catch {
         setRealtimeMessages((prev) =>
            prev.map((m) =>
               m.id === message.id ? { ...m, isPinned: message.isPinned } : m,
            ),
         );
         toast.error("Thao tác ghim tin nhắn thất bại");
      }
   };

   // Thu hồi tin nhắn với Optimistic Update
   const handleDeleteMessage = async (message: Message) => {
      setRealtimeMessages((prev) =>
         prev.map((m) =>
            m.id === message.id
               ? { ...m, isDeleted: true, content: "Tin nhắn đã được thu hồi" }
               : m,
         ),
      );
      try {
         await deleteMessageMutation({
            messageId: message.id,
            conversationId: activeConversation?.id,
         }).unwrap();
         toast.success("Đã thu hồi tin nhắn");
      } catch {
         setRealtimeMessages((prev) =>
            prev.map((m) =>
               m.id === message.id
                  ? { ...m, isDeleted: false, content: message.content }
                  : m,
            ),
         );
         toast.error("Không thể thu hồi tin nhắn");
      }
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-4rem)] overflow-hidden bg-white">
         {/* Cột trái: Danh sách phòng chat */}
         <div className="lg:col-span-4 xl:col-span-3 h-full overflow-hidden">
            <ConversationList
               conversations={displayConversations}
               isLoading={isLoadingConversations && displayConversations.length === 0}
               selectedConversationId={activeId}
               searchQuery={searchQuery}
               onSearchChange={setSearchQuery}
               selectedType={selectedType}
               onTypeChange={setSelectedType}
               onSelectConversation={handleSelectConversation}
               onRefresh={refetchConversations}
            />
         </div>

         {/* Cột phải: Khung hội thoại & Tin nhắn */}
         <div className="lg:col-span-8 xl:col-span-9 h-full flex flex-col overflow-hidden bg-white">
            {activeConversation ? (
               <>
                  <ChatHeader
                     conversation={activeConversation}
                     isSomeoneTyping={isSomeoneTyping}
                     isConnected={isConnected}
                  />

                  <ChatMessages
                     conversation={activeConversation}
                     messages={allMessages}
                     isLoading={isLoadingMessages && allMessages.length === 0}
                     isLoadingMore={isLoadingOlder}
                     hasMore={hasMoreOlder}
                     onLoadMore={handleLoadOlderMessages}
                     isSomeoneTyping={isSomeoneTyping}
                     onReply={setReplyingMessage}
                     onPin={handlePinMessage}
                     onDelete={handleDeleteMessage}
                  />

                  <MessageInput
                     onSendMessage={handleSendMessage}
                     onTyping={emitTyping}
                     replyingMessage={replyingMessage}
                     onCancelReply={() => setReplyingMessage(null)}
                  />
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                     <MessageSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700">
                     Chưa chọn cuộc hội thoại nào
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                     Hãy chọn một cuộc hội thoại từ danh sách bên trái hoặc bắt
                     đầu cuộc trò chuyện mới với bệnh nhân.
                  </p>
               </div>
            )}
         </div>
      </div>
   );
};

export default ConversationWorkspace;
