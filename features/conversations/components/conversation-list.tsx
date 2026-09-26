"use client";

import React, { useState, useMemo } from "react";
import { SearchInput } from "@/components/common/search-input";
import { CustomButton } from "@/components/common/custom-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationItem } from "./conversation-item";
import { CreateDirectConversationDialog } from "./create-direct-conversation-dialog";
import { Conversation, ConversationType } from "@/store/api/conversation/type";
import { MessageSquare } from "lucide-react";
import { CloverLoading } from "@/components/common/clover-loading";

interface ConversationListProps {
   conversations: Conversation[];
   isLoading: boolean;
   selectedConversationId?: string | null;
   searchQuery?: string;
   onSearchChange?: (query: string) => void;
   selectedType?: "ALL" | ConversationType;
   onTypeChange?: (type: "ALL" | ConversationType) => void;
   onSelectConversation: (conversation: Conversation) => void;
   onRefresh?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
   conversations,
   isLoading,
   selectedConversationId,
   searchQuery: propSearchQuery,
   onSearchChange,
   selectedType: propSelectedType,
   onTypeChange,
   onSelectConversation,
   onRefresh,
}) => {
   const [internalSearch, setInternalSearch] = useState("");
   const [internalType, setInternalType] = useState<"ALL" | ConversationType>(
      "ALL",
   );
   const [isCreateOpen, setIsCreateOpen] = useState(false);

   const searchQuery =
      propSearchQuery !== undefined ? propSearchQuery : internalSearch;
   const selectedType =
      propSelectedType !== undefined ? propSelectedType : internalType;

   const handleSearch = (val: string) => {
      if (onSearchChange) {
         onSearchChange(val);
      } else {
         setInternalSearch(val);
      }
   };

   const handleTypeChange = (type: "ALL" | ConversationType) => {
      if (onTypeChange) {
         onTypeChange(type);
      } else {
         setInternalType(type);
      }
   };

   // Nếu search/filter đã do API xử lý thì hiển thị trực tiếp conversations từ API
   const displayConversations = useMemo(() => {
      if (onSearchChange || onTypeChange) {
         return conversations;
      }

      return conversations.filter((conv) => {
         if (selectedType !== "ALL" && conv.type !== selectedType) {
            return false;
         }

         if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const titleMatch = conv.title?.toLowerCase().includes(query);
            const patientNameMatch = conv.healthProfile?.fullName
               ?.toLowerCase()
               .includes(query);
            const patientPhoneMatch =
               conv.healthProfile?.phoneNumber?.includes(query);
            return Boolean(titleMatch || patientNameMatch || patientPhoneMatch);
         }

         return true;
      });
   }, [conversations, selectedType, searchQuery, onSearchChange, onTypeChange]);

   return (
      <div className="flex flex-col h-full bg-white border-r border-slate-200">
         {/* Header */}
         <div className="px-4 py-3 flex items-center justify-between">
            <div>
               <h1 className="text-base font-bold text-slate-800">
                  Hội thoại y tế
               </h1>
            </div>
            <div className="flex items-center gap-1">
               <CustomButton
                  size="sm"
                  variant="default"
                  onClick={() => setIsCreateOpen(true)}
                  className="h-8"
               >
                  Chat mới
               </CustomButton>
            </div>
         </div>

         {/* Tìm kiếm */}
         <div className="px-4 pb-2">
            <SearchInput
               defaultValue={searchQuery}
               onDebounce={handleSearch}
               onClear={() => handleSearch("")}
               placeholder="Tìm kiếm phòng chat, bệnh nhân..."
               className="w-full text-xs"
            />
         </div>

         {/* Filter Tabs */}
         <div className="px-4 pb-2 flex items-center gap-1 text-xs shrink-0 overflow-x-auto no-scrollbar">
            <CustomButton
               type="button"
               size="xs"
               className="h-8"
               onClick={() => handleTypeChange("ALL")}
               variant={selectedType === "ALL" ? "default" : "outline"}
            >
               Tất cả
            </CustomButton>
            <CustomButton
               type="button"
               size="xs"
               className="h-8"
               onClick={() => handleTypeChange("CARE_TEAM")}
               variant={selectedType === "CARE_TEAM" ? "default" : "outline"}
            >
               Gói chăm sóc
            </CustomButton>
            <CustomButton
               type="button"
               size="xs"
               className="h-8"
               onClick={() => handleTypeChange("DIRECT")}
               variant={selectedType === "DIRECT" ? "default" : "outline"}
            >
               Trực tiếp
            </CustomButton>
         </div>

         <p className="text-xs text-slate-400 px-4 pb-3">
            {conversations.length} cuộc hội thoại
         </p>

         {/* Danh sách phòng chat */}
         <ScrollArea className="flex-1 min-h-0 max-h-full overflow-hidden px-4">
            <div className="py-1 space-y-1.5">
               {isLoading ? (
                  <div className="flex flex-col items-center justify-center min-h-50 text-slate-400 gap-2">
                     <CloverLoading
                        size="sm"
                        text={
                           searchQuery
                              ? "Đang tìm kiếm hội thoại..."
                              : "Đang tải danh sách..."
                        }
                     />
                  </div>
               ) : displayConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2 text-center p-4">
                     <MessageSquare className="w-8 h-8 opacity-30" />
                     <span className="text-xs">
                        {searchQuery
                           ? `Không tìm thấy kết quả cho "${searchQuery}"`
                           : "Chưa có cuộc hội thoại nào"}
                     </span>
                  </div>
               ) : (
                  displayConversations.map((conv) => (
                     <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isSelected={conv.id === selectedConversationId}
                        onSelect={onSelectConversation}
                     />
                  ))
               )}
            </div>
         </ScrollArea>

         {/* Modal tạo hội thoại mới */}
         <CreateDirectConversationDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={(newConv) => {
               onSelectConversation(newConv);
               onRefresh?.();
            }}
         />
      </div>
   );
};
