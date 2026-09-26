"use client";

import { useRouter } from "next/navigation";
import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { MessageSquare, Plus, Users } from "lucide-react";
import { HealthProfile } from "@/store/api/health-profile/type";
import { useAuth } from "@/hooks/use-auth";
import {
   useGetConversationsQuery,
   useCreateDirectConversationMutation,
} from "@/store/api/conversation/conversation-api";
import { ConversationType } from "@/store/api/conversation/type";
import { cn } from "@/lib/utils";

interface ServiceItemsProps {
   code?: string;
   name?: string;
   price?: number;
   type?: string;
}

const ServiceItems = (service: ServiceItemsProps) => {
   return (
      <div className="flex flex-col gap-1 p-3 border rounded-sm">
         <span className="text-sm">
            {service.code} - {service.name}
         </span>
         <div className="flex gap-1 flex-col text-sm">
            <span>Giá: {service.price}</span>
            <CustomButton className="h-8">
               <Plus />
            </CustomButton>
         </div>
      </div>
   );
};

export interface ExaminationServiceProps {
   healthProfile?: HealthProfile | null;
}

export function ExaminationService({
   healthProfile,
}: ExaminationServiceProps = {}) {
   const router = useRouter();
   const { user } = useAuth();

   const carePackage = healthProfile?.subscription?.carePackage;
   const isVip = carePackage?.type === "VIP";
   const targetType: ConversationType = isVip ? "CARE_TEAM" : "DIRECT";

   const [createDirectConversation, { isLoading: isCreatingConv }] =
      useCreateDirectConversationMutation();

   // Tải danh sách hội thoại để tìm chính xác cuộc trò chuyện của bệnh nhân này
   const { data: conversationData, isFetching: isSearchingConv } =
      useGetConversationsQuery(
         {
            type: targetType,
            search: healthProfile?.fullName || undefined,
         },
         {
            skip: !healthProfile?.id,
         },
      );

   const matchedConversation =
      healthProfile?.id && conversationData?.data
         ? conversationData.data.find(
              (c) =>
                 c.healthProfileId === healthProfile.id &&
                 c.type === targetType,
           ) ||
           conversationData.data.find(
              (c) => c.healthProfileId === healthProfile.id,
           ) ||
           null
         : null;

   const handleNavigateToChat = async () => {
      if (!healthProfile?.id) {
         router.push(`/online-consult?type=${targetType}`);
         return;
      }

      // 1. Nếu đã có đoạn chat tương ứng -> điều hướng và chọn ngay
      if (matchedConversation?.id) {
         router.push(
            `/online-consult?type=${targetType}&profileId=${healthProfile.id}&conversationId=${matchedConversation.id}`,
         );
         return;
      }

      // 2. Nếu chưa có đoạn chat và là gói thường (hoặc DIRECT), tạo mới đoạn chat trực tiếp 1-1
      if (!isVip && user?.id) {
         try {
            const newConv = await createDirectConversation({
               healthProfileId: healthProfile.id,
               directUserId: user.id,
            }).unwrap();

            if (newConv?.id) {
               router.push(
                  `/online-consult?type=DIRECT&profileId=${healthProfile.id}&conversationId=${newConv.id}`,
               );
               return;
            }
         } catch {
            // Nếu có lỗi khi gọi tạo đoạn chat thì fallback sang chuyển trang kèm profileId
         }
      }

      // 3. Với gói VIP (CARE_TEAM) hoặc fallback
      const params = new URLSearchParams();
      params.set("type", targetType);
      params.set("profileId", healthProfile.id);
      router.push(`/online-consult?${params.toString()}`);
   };

   const isBusy = isSearchingConv || isCreatingConv;

   return (
      <div className="flex flex-col gap-4 sticky top-0">
         <div className="flex items-center flex-col gap-2 py-4 border-b border-slate-100">
            {carePackage && (
               <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span
                     className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-semibold border",
                        isVip
                           ? "bg-amber-50 text-amber-800 border-amber-300"
                           : "bg-blue-50 text-blue-800 border-blue-300",
                     )}
                  >
                     {isVip ? "Gói VIP" : "Gói thường"}
                  </span>
                  {carePackage.name && (
                     <span
                        className="font-medium text-slate-700 max-w-32 truncate"
                        title={carePackage.name}
                     >
                        ({carePackage.name})
                     </span>
                  )}
               </div>
            )}

            {isVip ? (
               <CustomButton
                  onClick={handleNavigateToChat}
                  isLoading={isBusy}
                  className="w-56"
               >
                  <Users className="w-4 h-4 mr-1.5" />
                  Đến nhóm quản lý điều trị
               </CustomButton>
            ) : (
               <CustomButton
                  onClick={handleNavigateToChat}
                  isLoading={isBusy}
                  className="w-56"
               >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Trao đổi trực tiếp với BN
               </CustomButton>
            )}
         </div>
         <div className="p-4 flex flex-col gap-4">
            <h1 className="font-bold text-lg">Chỉ định điều trị</h1>
            <SearchInput placeholder="Tìm kiếm dịch vụ" />
            <div className="flex gap-2 flex-wrap">
               <CustomButton className="h-8 w-fit">Cận lâm sàng</CustomButton>
               <CustomButton className="h-8 w-fit">Thuốc</CustomButton>
               <CustomButton className="h-8 w-fit">Thủ thuật</CustomButton>
               <CustomButton className="h-8 w-fit">Dịch vụ</CustomButton>
            </div>

            <div className="flex flex-col gap-4">
               <ServiceItems
                  code="CLS01"
                  name="Xét nghiệm máu"
                  price={100000}
                  type="Cận lâm sàng"
               />
            </div>
         </div>
      </div>
   );
}
