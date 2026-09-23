"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
   const packageName = conversation.subscription?.carePackage?.name;

   const displayName =
      conversation.title ||
      profile?.fullName ||
      (isCareTeam ? "Nhóm Chăm Sóc" : "Bệnh nhân");

   const avatarFallback = displayName
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
                     "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                     isConnected ? "bg-emerald-500" : "bg-slate-300",
                  )}
                  title={isConnected ? "Đã kết nối Socket" : "Mất kết nối Socket"}
               />
            </div>

            <div className="min-w-0">
               <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900 truncate">
                     {displayName}
                  </h2>
                  <Badge
                     variant="outline"
                     className={cn(
                        "text-[10px] px-1.5 py-0 font-medium rounded border",
                        isCareTeam
                           ? "bg-amber-50 text-amber-800 border-amber-200"
                           : "bg-blue-50 text-blue-800 border-blue-200",
                     )}
                  >
                     {isCareTeam ? "Gói chăm sóc" : "1-1 Bác sĩ"}
                  </Badge>
                  {packageName && (
                     <span className="hidden sm:inline-block text-[11px] text-slate-500 truncate max-w-xs">
                        ({packageName})
                     </span>
                  )}
               </div>

               <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
                  {isSomeoneTyping ? (
                     <span className="text-primary font-medium text-[11px] animate-pulse">
                        Đang nhập tin nhắn...
                     </span>
                  ) : (
                     <>
                        {profile?.fullName && (
                           <span className="font-medium text-slate-700">
                              BN: {profile.fullName}
                           </span>
                        )}
                        {profile?.phoneNumber && (
                           <span>• {profile.phoneNumber}</span>
                        )}
                        {profile?.dob && (
                           <span>
                              • {profile.gender === "MALE" ? "Nam" : profile.gender === "FEMALE" ? "Nữ" : ""}{" "}
                              {new Date(profile.dob).getFullYear()}
                           </span>
                        )}
                     </>
                  )}
               </div>
            </div>
         </div>

         {/* Nút thao tác nhanh (gọn gàng, hạn chế icon) */}
         <div className="flex items-center gap-2 shrink-0">
            {profile?.id && (
               <Link
                  href={`/health-profile?selectedId=${profile.id}`}
                  target="_blank"
                  rel="noreferrer"
               >
                  <CustomButton
                     size="sm"
                     variant="outline"
                     className="h-8 text-xs font-medium text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                     Hồ sơ sức khỏe
                  </CustomButton>
               </Link>
            )}

            <Link
               href="/risk-factor-assessment"
               target="_blank"
               rel="noreferrer"
            >
               <CustomButton
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium text-amber-800 border-amber-200 hover:bg-amber-50 cursor-pointer"
               >
                  PTYTNC
               </CustomButton>
            </Link>
         </div>
      </div>
   );
};
