"use client";

import { useState } from "react";
import { HealthProfile } from "@/store/api/health-profile/type";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HealthProfileList } from "./components/health-profile-list";
import { RiskFactorAssessmentForm } from "./components/risk-factor-assessment-form";

export const RiskFactorAssessmentFeature = () => {
   const [selectedProfile, setSelectedProfile] = useState<HealthProfile | null>(
      null,
   );

   return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch h-[calc(100vh-4rem)] overflow-hidden">
         <div className="lg:col-span-1 p-4 border-r border-slate-200 overflow-hidden h-full flex flex-col bg-white">
            <HealthProfileList
               selectedProfile={selectedProfile}
               onSelectProfile={setSelectedProfile}
               onChangePatient={() => setSelectedProfile(null)}
            />
         </div>
         <ScrollArea className="lg:col-span-3 h-[calc(100vh-4rem)]">
            <div className="py-4">
               <RiskFactorAssessmentForm
                  key={selectedProfile?.id ?? "none"}
                  selectedProfile={selectedProfile}
                  onClearProfile={() => setSelectedProfile(null)}
               />
            </div>
         </ScrollArea>
      </div>
   );
};

export default RiskFactorAssessmentFeature;
