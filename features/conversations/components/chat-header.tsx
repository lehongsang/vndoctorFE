"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomButton } from "@/components/common/custom-button";
import { Conversation } from "@/store/api/conversation/type";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
   conversation: Conversation;
   isSomeoneTyping?: boolean;
   isConnected?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
   conversation,
   isSomeoneTyping,
   isConnected = true,
}) => {
   const isCareTeam = conversation.type === "CARE_TEAM";
   const profile = conversation.healthProfile;
   const targetProfileId =
      profile?.id ||
      conversation.healthProfileId ||
      conversation.subscription?.healthProfileId;
   const carePackage = conversation.subscription?.carePackage;
   const packageName = carePackage?.name;
   const packageType = carePackage?.type;

   const getPackageTypeLabel = (type?: string) => {
      if (!type) return null;
      if (type === "STANDARD") return "Cơ bản";
      if (type === "VIP") return "VIP";
      return type;
   };

   const displayName =
      conversation.title ||
      profile?.fullName ||
      (isCareTeam ? "Nhóm Chăm Sóc" : "Bệnh nhân");

   const avatarFallback =
      displayName
         .split(" ")
         .slice(-2)
         .map((part) => part[0])
         .join("")
         .toUpperCase() || "ND";

   return (
      <div className="h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
               <Avatar className="w-10 h-10 border border-slate-200">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                     {avatarFallback}
                  </AvatarFallback>
               </Avatar>
               <span
                  className={cn(
                     "absolute bottom-0 -right-px w-3 h-3 rounded-full border-2 border-white",
                     isConnected ? "bg-emerald-500" : "bg-slate-300",
                  )}
                  title={
                     isConnected ? "Đã kết nối Socket" : "Mất kết nối Socket"
                  }
               />
            </div>

            <div className="min-w-0">
               <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900 truncate">
                     {displayName}
                  </h2>
                  <span
                     className={cn(
                        "text-sm font-medium inline-flex items-center gap-1",
                        isConnected
                           ? "text-emerald-700"
                           : "text-rose-700 animate-pulse",
                     )}
                     title={
                        isConnected
                           ? "Đã kết nối máy chủ chat realtime"
                           : "Mất kết nối máy chủ chat realtime"
                     }
                  >
                     ({isConnected ? "Trực tuyến" : "Mất kết nối"})
                  </span>
               </div>

               <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
                  {isSomeoneTyping ? (
                     <span className="text-primary font-medium text-[11px] animate-pulse">
                        Đang nhập tin nhắn...
                     </span>
                  ) : carePackage ? (
                     <div className="flex items-center gap-1.5 truncate">
                        <span
                           className="font-medium text-slate-700 truncate"
                           title={packageName}
                        >
                           Gói: {packageName}
                        </span>
                        {packageType && (
                           <span
                              className={cn(
                                 "px-1.5 py-1 text-[10px] font-semibold rounded-full shrink-0",
                                 packageType === "VIP"
                                    ? "bg-amber-100 text-amber-800 "
                                    : "bg-blue-100 text-blue-700 ",
                              )}
                           >
                              Loại gói: {getPackageTypeLabel(packageType)}
                           </span>
                        )}
                     </div>
                  ) : (
                     <span className="text-[11px] text-slate-400 italic">
                        Chưa đăng ký gói
                     </span>
                  )}
               </div>
            </div>
         </div>

         {/* Nút thao tác nhanh (gọn gàng, hạn chế icon) */}
         <div className="flex items-center gap-2 shrink-0">
            {targetProfileId && (
               <>
                  <Link
                     href={`/health-profile?selectedId=${targetProfileId}`}
                     target="_blank"
                     rel="noreferrer"
                  >
                     <CustomButton
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                     >
                        Hồ sơ sức khỏe
                     </CustomButton>
                  </Link>

                  <Link
                     href={`/health-profile/examination/${targetProfileId}?action=create`}
                     target="_blank"
                     rel="noreferrer"
                  >
                     <CustomButton size="sm" className="h-8 text-xs">
                        Tạo phiếu khám
                     </CustomButton>
                  </Link>

                  <Link
                     href={`/health-profile/examination/${targetProfileId}`}
                     target="_blank"
                     rel="noreferrer"
                  >
                     <CustomButton
                        size="sm"
                        className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                     >
                        Phân tầng
                     </CustomButton>
                  </Link>
               </>
            )}
         </div>
      </div>
   );
};
