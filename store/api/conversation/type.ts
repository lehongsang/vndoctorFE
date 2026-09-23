import { HealthProfile } from "../health-profile/type";

export type ConversationType = "CARE_TEAM" | "DIRECT";

export type ConversationStatus = "ACTIVE" | "ARCHIVED" | "CLOSED";

export type MessageType =
   | "TEXT"
   | "IMAGE"
   | "FILE"
   | "EXAMINATION"
   | "RISK_ASSESSMENT"
   | "HEALTH_RECORD"
   | "CARE_REQUEST"
   | "SYSTEM";

export interface ConversationMember {
   id?: string;
   userId: string;
   fullName?: string;
   role?: string;
   avatar?: string;
   joinedAt?: string;
}

export interface SenderUser {
   id: string;
   staffCode?: string;
   username?: string;
   fullName?: string;
   role?: string;
   specialty?: string;
   email?: string;
   phoneNumber?: string;
   facilityId?: string;
   isActive?: boolean;
}

export interface SenderAccount {
   id: string;
   fullName?: string;
   phoneNumber?: string;
   avatar?: string;
}

export interface MessageSender {
   id: string;
   fullName?: string;
   name?: string;
   role?: string;
   avatar?: string;
   email?: string;
   username?: string;
}

export interface Message {
   id: string;
   conversationId: string;
   senderType?: "STAFF" | "PATIENT" | "SYSTEM" | string;
   senderUserId?: string | null;
   senderUser?: SenderUser | null;
   senderAccountId?: string | null;
   senderAccount?: SenderAccount | null;
   senderId?: string;
   userId?: string;
   senderRole?: string;
   senderName?: string;
   content: string;
   messageType: MessageType;
   resourceId?: string | null;
   mediaUrl?: string | null;
   replyToMessageId?: string | null;
   replyToMessage?: Message | null;
   isPinned?: boolean;
   isDeleted?: boolean;
   readBy?: string[];
   createdAt: string;
   updatedAt?: string;
}

export interface ConversationSubscription {
   id: string;
   healthProfileId?: string;
   carePackageId?: string;
   carePackage?: {
      id: string;
      code?: string;
      name?: string;
      type?: string;
   };
   assignedDoctorId?: string | null;
   assignedNurseId?: string | null;
   assignedExpertId?: string | null;
   status?: string;
   startedAt?: string;
   expiresAt?: string;
}

export interface Conversation {
   id: string;
   facilityId?: string;
   type: ConversationType;
   status?: ConversationStatus;
   title?: string;
   healthProfileId?: string;
   healthProfile?: HealthProfile;
   subscriptionId?: string | null;
   subscription?: ConversationSubscription | null;
   directUserId?: string | null;
   directUser?: MessageSender | null;
   members?: ConversationMember[];
   lastMessageId?: string | null;
   lastMessageAt?: string | null;
   lastMessagePreview?: string | null;
   lastMessage?: Message | null;
   unreadCount?: number;
   isPinned?: boolean;
   pinnedAt?: string | null;
   createdAt: string;
   updatedAt: string;
}

export interface QueryConversationDto {
   facilityId?: string;
   type?: ConversationType;
   status?: string;
   search?: string;
   page?: number;
   limit?: number;
}

export interface ConversationListResponse {
   data: Conversation[];
   total: number;
   page: number;
   limit: number;
   totalPages?: number;
}

export interface CreateDirectConversationDto {
   healthProfileId: string;
   directUserId: string;
}

export interface QueryMessageDto {
   page?: number;
   limit?: number;
   before?: string;
}

export interface MessageListResponse {
   data: Message[];
   total?: number;
   page?: number;
   limit?: number;
   hasMore?: boolean;
}

export interface SendMessageDto {
   content: string;
   messageType?: MessageType;
   resourceId?: string;
   mediaUrl?: string;
   replyToMessageId?: string;
}

export interface PinMessageDto {
   isPinned: boolean;
}

export interface SendSocketMessagePayload {
   conversationId: string;
   content: string;
   messageType?: MessageType;
   resourceId?: string;
   mediaUrl?: string;
   replyToMessageId?: string;
}

export interface TypingSocketPayload {
   conversationId: string;
   isTyping: boolean;
}

export interface UserTypingEvent {
   conversationId: string;
   userId: string;
   isTyping: boolean;
}

export interface MessageReadPayload {
   conversationId: string;
   messageId: string;
}

export interface MessageReadReceiptEvent {
   conversationId: string;
   messageId: string;
   userId: string;
   readAt: string;
}
