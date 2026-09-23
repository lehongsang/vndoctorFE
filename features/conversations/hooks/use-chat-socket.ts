import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getChatSocket } from "@/lib/socket";
import {
   Message,
   MessageType,
   UserTypingEvent,
   MessageReadReceiptEvent,
} from "@/store/api/conversation/type";

interface UseChatSocketProps {
   conversationId?: string | null;
   onNewMessage?: (message: Message) => void;
}

export function useChatSocket({
   conversationId,
   onNewMessage,
}: UseChatSocketProps = {}) {
   const { accessToken, user } = useAuth();
   const [isConnected, setIsConnected] = useState(false);
   const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
   const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

   const [prevConvId, setPrevConvId] = useState(conversationId);
   if (conversationId !== prevConvId) {
      setPrevConvId(conversationId);
      setTypingUsers({});
   }

   const convIdRef = useRef(conversationId);
   const onNewMessageRef = useRef(onNewMessage);

   useEffect(() => {
      convIdRef.current = conversationId;
   }, [conversationId]);

   useEffect(() => {
      onNewMessageRef.current = onNewMessage;
   }, [onNewMessage]);

   // 1. Quản lý kết nối Socket & Event Listeners
   useEffect(() => {
      if (!accessToken) return;

      const socket = getChatSocket(accessToken);
      if (!socket) return;

      const handleConnect = () => {
         setIsConnected(true);
         if (convIdRef.current) {
            socket.emit("join_room", { conversationId: convIdRef.current });
         }
      };

      const handleDisconnect = () => setIsConnected(false);

      const handleNewMessage = (raw: unknown) => {
         if (!raw || typeof raw !== "object") return;
         const data =
            "data" in raw && (raw as { data: unknown }).data
               ? (raw as { data: Record<string, unknown> }).data
               : (raw as Record<string, unknown>);

         const normalizedConvId =
            (data.conversationId as string) ||
            (data.conversation_id as string) ||
            ((data.conversation as { id?: string })?.id as string) ||
            convIdRef.current ||
            "";

         const normalizedMsg: Message = {
            ...(data as unknown as Message),
            conversationId: normalizedConvId,
         };

         onNewMessageRef.current?.(normalizedMsg);
      };

      const handleUserTyping = (event: UserTypingEvent) => {
         if (
            convIdRef.current &&
            event.conversationId === convIdRef.current &&
            event.userId !== user?.id
         ) {
            setTypingUsers((prev) => ({
               ...prev,
               [event.userId]: event.isTyping,
            }));
         }
      };

      const handleReadReceipt = (_event: MessageReadReceiptEvent) => {};

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handleUserTyping);
      socket.on("message_read_receipt", handleReadReceipt);

      if (socket.connected) {
         setIsConnected(true);
         if (convIdRef.current) {
            socket.emit("join_room", { conversationId: convIdRef.current });
         }
      }

      return () => {
         socket.off("connect", handleConnect);
         socket.off("disconnect", handleDisconnect);
         socket.off("new_message", handleNewMessage);
         socket.off("user_typing", handleUserTyping);
         socket.off("message_read_receipt", handleReadReceipt);
      };
   }, [accessToken, user?.id]);

   // 2. Tham gia phòng chat khi conversationId thay đổi
   useEffect(() => {
      if (!conversationId || !accessToken) return;
      const socket = getChatSocket(accessToken);
      if (!socket) return;

      socket.emit("join_room", { conversationId });

      return () => {
         socket.emit("leave_room", { conversationId });
      };
   }, [conversationId, accessToken]);

   // 3. Phát tin nhắn qua WebSocket
   const sendSocketMessage = useCallback(
      (params: {
         content: string;
         messageType?: MessageType;
         resourceId?: string;
         mediaUrl?: string;
         replyToMessageId?: string;
      }) => {
         if (!conversationId) return false;
         const socket = getChatSocket(accessToken);
         if (!socket || !socket.connected) return false;

         const msgType = params.messageType || "TEXT";
         socket.emit("send_message", {
            conversationId,
            content: params.content,
            type: msgType,
            messageType: msgType,
            resourceId: params.resourceId,
            mediaUrl: params.mediaUrl,
            replyToMessageId: params.replyToMessageId,
         });
         return true;
      },
      [conversationId, accessToken],
   );

   // 4. Phát tín hiệu đang soạn tin (typing)
   const emitTyping = useCallback(
      (isTyping: boolean) => {
         if (!conversationId) return;
         const socket = getChatSocket(accessToken);
         if (!socket) return;

         socket.emit("typing", { conversationId, isTyping });

         if (isTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
               socket.emit("typing", { conversationId, isTyping: false });
            }, 3000);
         }
      },
      [conversationId, accessToken],
   );

   // 5. Đánh dấu đã đọc
   const emitMessageRead = useCallback(
      (messageId: string) => {
         if (!conversationId) return;
         const socket = getChatSocket(accessToken);
         if (!socket) return;

         socket.emit("message_read", { conversationId, messageId });
      },
      [conversationId, accessToken],
   );

   return {
      isConnected,
      isSomeoneTyping: Object.values(typingUsers).some(Boolean),
      typingUsers,
      sendSocketMessage,
      emitTyping,
      emitMessageRead,
   };
}

