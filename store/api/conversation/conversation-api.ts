import { baseApi } from "../base-api";
import {
   Conversation,
   ConversationListResponse,
   CreateDirectConversationDto,
   Message,
   MessageListResponse,
   PinMessageDto,
   QueryConversationDto,
   QueryMessageDto,
   SendMessageDto,
} from "./type";

export const conversationApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getConversations: builder.query<
         ConversationListResponse,
         QueryConversationDto | void
      >({
         query: (params) => ({
            url: "/conversations",
            params: params || {},
         }),
         providesTags: (result) =>
            result?.data
               ? [
                    ...result.data.map(({ id }) => ({
                       type: "Conversations" as const,
                       id,
                    })),
                    { type: "Conversations", id: "LIST" },
                 ]
               : [{ type: "Conversations", id: "LIST" }],
      }),

      // 2. Xem chi tiết phòng chat
      getConversationById: builder.query<Conversation, string>({
         query: (id) => `/conversations/${id}`,
         providesTags: (_, __, id) => [{ type: "Conversations", id }],
      }),

      // 4. Mở phòng chat 1-1 với Bác sĩ
      createDirectConversation: builder.mutation<
         Conversation,
         CreateDirectConversationDto
      >({
         query: (body) => ({
            url: "/conversations/direct",
            method: "POST",
            body,
         }),
         invalidatesTags: [{ type: "Conversations", id: "LIST" }],
      }),

      // 5. Lấy lịch sử tin nhắn trong phòng chat
      getMessages: builder.query<
         MessageListResponse,
         { conversationId: string; params?: QueryMessageDto }
      >({
         query: ({ conversationId, params }) => ({
            url: `/conversations/${conversationId}/messages`,
            params: params || {},
         }),
         providesTags: (_, __, { conversationId }) => [
            { type: "Messages", id: conversationId },
         ],
      }),

      // 6. Gửi tin nhắn qua REST API
      sendMessage: builder.mutation<
         Message,
         { conversationId: string; body: SendMessageDto }
      >({
         query: ({ conversationId, body }) => ({
            url: `/conversations/${conversationId}/messages`,
            method: "POST",
            body,
         }),
         async onQueryStarted(
            { conversationId },
            { dispatch, queryFulfilled },
         ) {
            try {
               const { data: sentMessage } = await queryFulfilled;
               dispatch(
                  conversationApi.util.updateQueryData(
                     "getMessages",
                     { conversationId },
                     (draft) => {
                        if (!draft.data) draft.data = [];
                        if (!draft.data.some((m) => m.id === sentMessage.id)) {
                           draft.data.push(sentMessage);
                        }
                     },
                  ),
               );
            } catch {
               // Có lỗi xảy ra khi gửi
            }
         },
      }),

      // 7. Ghim / Bỏ ghim tin nhắn
      pinMessage: builder.mutation<
         Message,
         { messageId: string; body: PinMessageDto; conversationId?: string }
      >({
         query: ({ messageId, body }) => ({
            url: `/conversations/messages/${messageId}/pin`,
            method: "PATCH",
            body,
         }),
         async onQueryStarted(
            { messageId, body, conversationId },
            { dispatch, queryFulfilled },
         ) {
            if (!conversationId) return;
            const patchResult = dispatch(
               conversationApi.util.updateQueryData(
                  "getMessages",
                  { conversationId },
                  (draft) => {
                     const msg = draft.data?.find((m) => m.id === messageId);
                     if (msg) {
                        msg.isPinned = body.isPinned;
                     }
                  },
               ),
            );
            try {
               await queryFulfilled;
            } catch {
               patchResult.undo();
            }
         },
      }),

      // 8. Thu hồi tin nhắn
      deleteMessage: builder.mutation<
         void,
         { messageId: string; conversationId?: string }
      >({
         query: ({ messageId }) => ({
            url: `/conversations/messages/${messageId}`,
            method: "DELETE",
         }),
         async onQueryStarted(
            { messageId, conversationId },
            { dispatch, queryFulfilled },
         ) {
            if (!conversationId) return;
            const patchResult = dispatch(
               conversationApi.util.updateQueryData(
                  "getMessages",
                  { conversationId },
                  (draft) => {
                     const msg = draft.data?.find((m) => m.id === messageId);
                     if (msg) {
                        msg.isDeleted = true;
                        msg.content = "Tin nhắn đã được thu hồi";
                     }
                  },
               ),
            );
            try {
               await queryFulfilled;
            } catch {
               patchResult.undo();
            }
         },
      }),
   }),
});

export const {
   useGetConversationsQuery,
   useGetConversationByIdQuery,
   useCreateDirectConversationMutation,
   useGetMessagesQuery,
   useLazyGetMessagesQuery,
   useSendMessageMutation,
   usePinMessageMutation,
   useDeleteMessageMutation,
} = conversationApi;
