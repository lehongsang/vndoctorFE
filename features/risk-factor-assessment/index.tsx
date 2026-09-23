"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HealthProfile } from "@/store/api/health-profile/type";
import { useGetDetailHealthProfileQuery } from "@/store/api/health-profile/health-profile-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HealthProfileList } from "./components/health-profile-list";
import { RiskFactorAssessmentForm } from "./components/risk-factor-assessment-form";

export const RiskFactorAssessmentFeature = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const profileId =
      searchParams.get("profileId") ||
      searchParams.get("selectedId") ||
      searchParams.get("id");

   const [localProfile, setLocalProfile] = useState<HealthProfile | null>(null);

   const { data: fetchedProfile } = useGetDetailHealthProfileQuery(
      profileId ?? "",
      { skip: !profileId },
   );

   const selectedProfile = profileId
      ? (fetchedProfile ??
        (localProfile?.id === profileId ? localProfile : null))
      : localProfile;

   const handleSelectProfile = (profile: HealthProfile | null) => {
      setLocalProfile(profile);
      if (profile?.id) {
         router.replace(`/risk-factor-assessment?profileId=${profile.id}`);
      } else {
         router.replace("/risk-factor-assessment");
      }
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch h-[calc(100vh-4rem)] overflow-hidden">
         <div className="lg:col-span-1 p-4 border-r border-slate-200 overflow-hidden h-full flex flex-col bg-white">
            <HealthProfileList
               selectedProfile={selectedProfile}
               onSelectProfile={handleSelectProfile}
               onChangePatient={() => handleSelectProfile(null)}
            />
         </div>
         <ScrollArea className="lg:col-span-3 h-[calc(100vh-4rem)]">
            <div className="py-4">
               <RiskFactorAssessmentForm
                  key={selectedProfile?.id ?? "none"}
                  selectedProfile={selectedProfile}
                  onClearProfile={() => handleSelectProfile(null)}
               />
            </div>
         </ScrollArea>
      </div>
   );
};

export default RiskFactorAssessmentFeature;
