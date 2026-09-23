"use client";

import { useState, useEffect } from "react";
import { HealthProfile } from "@/store/api/health-profile/type";
import { Examination } from "@/store/api/examination/type";
import { CustomButton } from "@/components/common/custom-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { ExaminationForm } from "./examination-form";
import { ExaminationDetail } from "./examination-deatail";

const CURRENT_YEAR = new Date().getFullYear();

function calculateAge(dobStr?: string): number | null {
   if (!dobStr) return null;
   const match = dobStr.match(/^(\d{4})/);
   if (!match) return null;
   const birthYear = parseInt(match[1], 10);
   if (isNaN(birthYear) || birthYear < 1900) return null;
   return Math.max(0, CURRENT_YEAR - birthYear);
}

function formatDob(dobStr?: string): string {
   if (!dobStr) return "—";
   const parts = dobStr.split("-");
   if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
   }
   return dobStr;
}

export interface ExaminationWorkspaceViewProps {
   selectedProfile: HealthProfile | null;
   selectedExamination?: Examination | null;
   onStartNewExamination?: () => void;
   onSelectExamination?: (examination: Examination | null) => void;
}

export function ExaminationWorkspaceView({
   selectedProfile,
   selectedExamination,
   onStartNewExamination,
   onSelectExamination,
}: ExaminationWorkspaceViewProps) {
   const [isCreatingNew, setIsCreatingNew] = useState(false);
   const [isEditing, setIsEditing] = useState(false);
   const [prevProfileId, setPrevProfileId] = useState(selectedProfile?.id);
   const [prevExaminationId, setPrevExaminationId] = useState(
      selectedExamination?.id,
   );

   // Reset trạng thái khi đổi bệnh nhân
   if (selectedProfile?.id !== prevProfileId) {
      setPrevProfileId(selectedProfile?.id);
      setIsCreatingNew(false);
      setIsEditing(false);
   }

   // Reset trạng thái khi chọn lượt khám từ lịch sử (mặc định mở chế độ xem chi tiết)
   if (selectedExamination?.id !== prevExaminationId) {
      setPrevExaminationId(selectedExamination?.id);
      setIsEditing(false);
      if (selectedExamination) {
         setIsCreatingNew(false);
      }
   }

   const handleStartNew = () => {
      setIsCreatingNew(true);
      setIsEditing(false);
      onSelectExamination?.(null);
      onStartNewExamination?.();
   };

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         // F2: Tạo lượt khám mới
         if (e.key === "F2") {
            if (!isCreatingNew && selectedProfile) {
               e.preventDefault();
               setIsCreatingNew(true);
               setIsEditing(false);
               onSelectExamination?.(null);
               onStartNewExamination?.();
            }
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [
      isCreatingNew,
      selectedProfile,
      onSelectExamination,
      onStartNewExamination,
   ]);

   if (!selectedProfile) {
      return (
         <div className="h-full min-h-105 flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-base font-bold text-slate-800 mb-1">
               Chưa chọn bệnh nhân
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
               Vui lòng tìm kiếm và chọn bệnh nhân từ danh sách bên trái để xem
               thông tin chi tiết và bắt đầu phiên khám bệnh.
            </p>
         </div>
      );
   }

   const genderText =
      selectedProfile.gender === "MALE"
         ? "Nam"
         : selectedProfile.gender === "FEMALE"
           ? "Nữ"
           : "Khác";

   const age = calculateAge(selectedProfile.dob);

   return (
      <div className="flex flex-col h-full bg-white">
         <div></div>

         {/* Body với ScrollArea cho form phiếu khám / chi tiết phiếu khám */}
         <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-4 flex flex-col gap-4">
               {isCreatingNew ? (
                  <div className="flex flex-col gap-3">
                     <span className="text-lg font-bold text-slate-700">
                        Tạo phiếu khám
                     </span>
                     <ExaminationForm
                        healthProfileId={selectedProfile.id}
                        onSuccess={(savedExam) => {
                           setIsCreatingNew(false);
                           onSelectExamination?.(savedExam);
                        }}
                        onCancel={() => {
                           setIsCreatingNew(false);
                        }}
                     />
                  </div>
               ) : selectedExamination ? (
                  isEditing && selectedExamination.status === "IN_PROGRESS" ? (
                     <div className="flex flex-col gap-3">
                        <span className="text-lg font-bold text-slate-700">
                           Chỉnh sửa phiếu khám
                        </span>
                        <ExaminationForm
                           healthProfileId={selectedProfile.id}
                           initialData={selectedExamination}
                           onSuccess={(savedExam) => {
                              setIsEditing(false);
                              onSelectExamination?.(savedExam);
                           }}
                           onCancel={() => {
                              setIsEditing(false);
                           }}
                        />
                     </div>
                  ) : (
                     <ExaminationDetail
                        examination={selectedExamination}
                        onEdit={
                           selectedExamination.status === "IN_PROGRESS"
                              ? () => setIsEditing(true)
                              : undefined
                        }
                        onClose={() => onSelectExamination?.(null)}
                     />
                  )
               ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                     <h3 className="text-sm font-bold text-slate-700 mb-1">
                        Bắt đầu phiên khám bệnh
                     </h3>
                     <p className="text-xs text-slate-500 max-w-sm mb-4">
                        Chọn một lượt khám từ danh sách lịch sử bên trái để xem
                        chi tiết hoặc nhấn nút bên dưới để tạo phiếu khám mới.
                     </p>
                     <CustomButton
                        type="button"
                        size="sm"
                        onClick={handleStartNew}
                        className="gap-1.5 h-9 text-xs font-semibold cursor-pointer"
                        title="Tạo lượt khám mới (F2)"
                     >
                        <Plus className="w-4 h-4" />
                        <span>Tạo lượt khám mới</span>
                        <kbd>(F2)</kbd>
                     </CustomButton>
                  </div>
               )}
            </div>
         </ScrollArea>
      </div>
   );
}
