"use client";

import React, { useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { SearchInput } from "@/components/common/search-input";
import { CustomButton } from "@/components/common/custom-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetHealthProfilesQuery } from "@/store/api/health-profile/health-profile-api";
import { useCreateDirectConversationMutation } from "@/store/api/conversation/conversation-api";
import { useAuth } from "@/hooks/use-auth";
import { HealthProfile } from "@/store/api/health-profile/type";
import { Conversation } from "@/store/api/conversation/type";
import { toast } from "react-toastify";
import { User } from "lucide-react";
import { CloverLoading } from "@/components/common/clover-loading";

interface CreateDirectConversationDialogProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: (conversation: Conversation) => void;
}

export const CreateDirectConversationDialog: React.FC<
   CreateDirectConversationDialogProps
> = ({ isOpen, onClose, onSuccess }) => {
   const { user } = useAuth();
   const [search, setSearch] = useState("");
   const [selectedPatient, setSelectedPatient] = useState<HealthProfile | null>(
      null,
   );

   const {
      data: healthProfileData,
      isLoading: isLoadingProfiles,
      isFetching: isFetchingProfiles,
   } = useGetHealthProfilesQuery({
      page: 1,
      limit: 20,
      search: search || undefined,
   });

   const [createDirect, { isLoading: isCreating }] =
      useCreateDirectConversationMutation();

   const profiles: HealthProfile[] = healthProfileData?.items || [];

   const handleCreate = async () => {
      if (!selectedPatient || !user?.id) {
         toast.warning("Vui lòng chọn hồ sơ bệnh nhân");
         return;
      }

      try {
         const result = await createDirect({
            healthProfileId: selectedPatient.id,
            directUserId: user.id,
         }).unwrap();

         toast.success("Đã mở cuộc hội thoại thành công");
         onSuccess(result);
         onClose();
      } catch {
         toast.error("Không thể mở hội thoại. Vui lòng thử lại!");
      }
   };

   return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className="sm:min-w-2xl bg-white">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                  Mở hội thoại trực tiếp 1-1 với Bệnh nhân
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500">
                  Chọn hồ sơ sức khỏe của bệnh nhân để bắt đầu nhắn tin tư vấn
                  trực tiếp.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
               <SearchInput
                  defaultValue={search}
                  onDebounce={(val) => setSearch(val.trim())}
                  placeholder="Tìm kiếm theo tên bệnh nhân, SĐT, mã BN..."
                  className="w-full"
               />

               <ScrollArea className="h-60 rounded-lg border border-slate-200 p-2">
                  {isLoadingProfiles || isFetchingProfiles ? (
                     <div className="flex items-center justify-center h-40">
                        <CloverLoading
                           size="sm"
                           text="Đang tải danh sách bệnh nhân..."
                        />
                     </div>
                  ) : profiles.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs">
                        <User className="w-8 h-8 mb-2 opacity-40" />
                        Không tìm thấy bệnh nhân nào
                     </div>
                  ) : (
                     <div className="space-y-1">
                        {profiles.map((profile) => {
                           const isSelected =
                              selectedPatient?.id === profile.id;
                           return (
                              <button
                                 key={profile.id}
                                 type="button"
                                 onClick={() => setSelectedPatient(profile)}
                                 className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-colors cursor-pointer border ${
                                    isSelected
                                       ? "bg-primary/10 border-primary text-primary"
                                       : "bg-white hover:bg-slate-50 border-transparent text-slate-800"
                                 }`}
                              >
                                 <Avatar className="w-9 h-9 border border-slate-200">
                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">
                                       {profile.fullName
                                          .slice(0, 2)
                                          .toUpperCase()}
                                    </AvatarFallback>
                                 </Avatar>
                                 <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs truncate">
                                       {profile.fullName}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate">
                                       {profile.phoneNumber || "Chưa có SĐT"} •{" "}
                                       {profile.gender === "MALE"
                                          ? "Nam"
                                          : profile.gender === "FEMALE"
                                            ? "Nữ"
                                            : ""}{" "}
                                       {profile.hospitalPatientCode &&
                                          `• Mã: ${profile.hospitalPatientCode}`}
                                    </p>
                                 </div>
                              </button>
                           );
                        })}
                     </div>
                  )}
               </ScrollArea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
               <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isCreating}
               >
                  Hủy
               </CustomButton>
               <CustomButton
                  variant="default"
                  size="sm"
                  onClick={handleCreate}
                  disabled={!selectedPatient || isCreating}
                  isLoading={isCreating}
                  loadingText="Đang mở..."
                  className="gap-2"
               >
                  Bắt đầu trò chuyện
               </CustomButton>
            </div>
         </DialogContent>
      </Dialog>
   );
};
