import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getChatSocket } from "@/lib/socket";
import {
   Message,
   MessageType,
   SendSocketMessagePayload,
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

   const currentConvIdRef = useRef<string | null | undefined>(conversationId);
   const onNewMessageRef = useRef(onNewMessage);

   useEffect(() => {
      currentConvIdRef.current = conversationId;
   }, [conversationId]);

   useEffect(() => {
      onNewMessageRef.current = onNewMessage;
   }, [onNewMessage]);

   useEffect(() => {
      if (!accessToken) return;

      const socket = getChatSocket(accessToken);
      if (!socket) return;

      const handleConnect = () => {
         setIsConnected(true);
         if (currentConvIdRef.current) {
            socket.emit("join_room", {
               conversationId: currentConvIdRef.current,
            });
         }
      };

      const handleDisconnect = () => {
         setIsConnected(false);
      };

      const handleNewMessage = (raw: unknown) => {
         const message = ((raw && typeof raw === "object" && "data" in raw && (raw as { data: unknown }).data)
            ? (raw as { data: Message }).data
            : raw) as Message;

         if (!message) return;

         onNewMessageRef.current?.(message);
      };

      const handleUserTyping = (event: UserTypingEvent) => {
         if (
            currentConvIdRef.current &&
            event.conversationId === currentConvIdRef.current &&
            event.userId !== user?.id
         ) {
            setTypingUsers((prev) => ({
               ...prev,
               [event.userId]: event.isTyping,
            }));
         }
      };

      const handleReadReceipt = (_event: MessageReadReceiptEvent) => {
         // Cập nhật trạng thái đã đọc nếu cần
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handleUserTyping);
      socket.on("message_read_receipt", handleReadReceipt);

      if (socket.connected) {
         setIsConnected(true);
         if (currentConvIdRef.current) {
            socket.emit("join_room", {
               conversationId: currentConvIdRef.current,
            });
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

   // Room join / leave khi conversationId thay đổi
   useEffect(() => {
      if (!conversationId || !accessToken) return;

      const socket = getChatSocket(accessToken);
      if (!socket) return;

      socket.emit("join_room", { conversationId });

      return () => {
         socket.emit("leave_room", { conversationId });
      };
   }, [conversationId, accessToken]);

   // Gửi tin nhắn qua Socket (chuẩn theo CHAT_MODULE_GUIDE.md)
   const sendSocketMessage = useCallback(
      (params: {
         content: string;
         messageType?: MessageType;
         resourceId?: string;
         mediaUrl?: string;
         replyToMessageId?: string;
      }) => {
         if (!conversationId) return;
         const socket = getChatSocket(accessToken);
         if (!socket) return;

         const msgType = params.messageType || "TEXT";
         const payload: SendSocketMessagePayload & { type: string } = {
            conversationId,
            content: params.content,
            type: msgType,
            messageType: msgType,
            resourceId: params.resourceId,
            mediaUrl: params.mediaUrl,
            replyToMessageId: params.replyToMessageId,
         };

         socket.emit("send_message", payload);
      },
      [conversationId, accessToken],
   );

   // Phát tín hiệu typing
   const emitTyping = useCallback(
      (isTyping: boolean) => {
         if (!conversationId) return;
         const socket = getChatSocket(accessToken);
         if (!socket) return;

         socket.emit("typing", { conversationId, isTyping });

         if (isTyping) {
            if (typingTimeoutRef.current) {
               clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
               socket.emit("typing", { conversationId, isTyping: false });
            }, 3000);
         }
      },
      [conversationId, accessToken],
   );

   // Đánh dấu đã đọc
   const emitMessageRead = useCallback(
      (messageId: string) => {
         if (!conversationId) return;
         const socket = getChatSocket(accessToken);
         if (!socket) return;

         socket.emit("message_read", { conversationId, messageId });
      },
      [conversationId, accessToken],
   );

   const isSomeoneTyping = Object.values(typingUsers).some(Boolean);

   return {
      isConnected,
      isSomeoneTyping,
      typingUsers,
      sendSocketMessage,
      emitTyping,
      emitMessageRead,
   };
}
