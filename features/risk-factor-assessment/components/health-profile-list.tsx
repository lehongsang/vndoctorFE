"use client";

import { useState, useEffect } from "react";
import { useGetHealthProfilesQuery } from "@/store/api/health-profile/health-profile-api";
import { CloverLoading } from "@/components/common/clover-loading";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HealthProfile } from "@/store/api/health-profile/type";
import { ArrowLeftRight, Plus } from "lucide-react";
import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { cn } from "@/lib/utils";
import { RiskAssessmentHistory } from "./risk-assessment-history";

function calculateAge(dob?: string | null): number | string {
   if (!dob) return "—";
   const birthYear = new Date(dob).getFullYear();
   if (!isNaN(birthYear) && birthYear > 1900) {
      return Math.max(0, new Date().getFullYear() - birthYear);
   }
   const match = dob.match(/^(\d{4})/);
   if (match) {
      const year = parseInt(match[1], 10);
      if (!isNaN(year) && year > 1900) {
         return Math.max(0, new Date().getFullYear() - year);
      }
   }
   return "—";
}

const HealthProfileCard = ({
   profile,
   isSelected,
   onSelectProfile,
}: {
   profile: HealthProfile;
   isSelected?: boolean;
   onSelectProfile: (profile: HealthProfile) => void;
}) => {
   const age = calculateAge(profile.dob);

   return (
      <div
         onClick={() => onSelectProfile(profile)}
         className={`px-5 py-4 rounded-lg border shadow-sm cursor-pointer my-4 flex flex-col gap-4 ${
            isSelected
               ? "bg-primary text-white border-none"
               : "border-slate-200"
         }`}
      >
         <h2 className="text-lg font-bold">{profile.fullName}</h2>
         <div className="text-sm font-medium flex flex-col gap-2">
            <div className="flex items-center justify-between">
               <span>Mã BN:</span>
               <span>{profile.hospitalPatientCode || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1">
                  <span>Tuổi:</span>
                  <span>{age}</span>
               </div>
               <div className="flex items-center gap-1">
                  <span>Giới tính:</span>
                  <span>
                     {profile.gender === "MALE"
                        ? "Nam"
                        : profile.gender === "FEMALE"
                          ? "Nữ"
                          : "—"}
                  </span>
               </div>
            </div>
         </div>
      </div>
   );
};

export interface HealthProfileListProps {
   selectedProfile?: HealthProfile | null;
   onSelectProfile?: (profile: HealthProfile | null) => void;
   onChangePatient?: () => void;
   onAddNewProfile?: () => void;
   className?: string;
}

export function HealthProfileList({
   selectedProfile,
   onSelectProfile,
   onChangePatient,
   onAddNewProfile,
   className,
}: HealthProfileListProps) {
   const [search, setSearch] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(search.trim());
      }, 350);
      return () => clearTimeout(timer);
   }, [search]);

   const {
      data: healthProfiles,
      isLoading,
      isFetching,
      isError,
   } = useGetHealthProfilesQuery({
      page: 1,
      limit: 20,
      search: debouncedSearch || undefined,
   });

   const healthProfilesList = healthProfiles?.items || [];

   const handleChangePatient = () => {
      if (onChangePatient) {
         onChangePatient();
      } else {
         onSelectProfile?.(null);
      }
   };

   // Khi đã chọn bệnh nhân, chỉ hiển thị bệnh nhân được chọn và nút Đổi bệnh nhân
   if (selectedProfile) {
      return (
         <div className={cn("flex flex-col h-full gap-2", className)}>
            <div className="flex items-center justify-between shrink-0">
               <span className="text-xs font-semibold text-slate-500">
                  Bệnh nhân đang chọn
               </span>
               <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleChangePatient}
                  className="h-7 px-2 text-xs font-medium gap-1 text-slate-700 hover:text-primary cursor-pointer"
               >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Đổi bệnh nhân</span>
               </Button>
            </div>

            <div className="shrink-0">
               <HealthProfileCard
                  profile={selectedProfile}
                  isSelected={true}
                  onSelectProfile={(profile) => onSelectProfile?.(profile)}
               />
            </div>

            <div className="flex-1 min-h-0 pt-1 border-t border-slate-100">
               <RiskAssessmentHistory selectedProfile={selectedProfile} />
            </div>
         </div>
      );
   }

   return (
      <div className={cn("flex flex-col h-full", className)}>
         <div className="flex gap-2 items-center w-full">
            <SearchInput
               placeholder="Nhập tên, SĐT, CCCD , mã BN..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />

            <CustomButton
               size="sm"
               startIcon={<Plus />}
               onClick={onAddNewProfile}
            >
               Thêm
            </CustomButton>
         </div>

         {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
               <CloverLoading size="sm" />
               <span className="text-xs text-slate-500">
                  Đang tải danh sách...
               </span>
            </div>
         ) : isError ? (
            <div className="flex items-center justify-center py-8 text-red-500 text-xs text-center">
               Lỗi khi tải danh sách hồ sơ sức khỏe
            </div>
         ) : healthProfilesList.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">
               Không tìm thấy hồ sơ sức khỏe nào.
            </p>
         ) : (
            <ScrollArea className="h-[calc(100vh-8rem)] -mr-4 pr-4">
               {healthProfilesList.map((profile) => (
                  <HealthProfileCard
                     key={profile.id}
                     profile={profile}
                     onSelectProfile={(profile) => onSelectProfile?.(profile)}
                     isSelected={false}
                  />
               ))}
            </ScrollArea>
         )}
      </div>
   );
}

export default HealthProfileList;
