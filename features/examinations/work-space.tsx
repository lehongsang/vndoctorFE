"use client";

import { useState } from "react";
import { HealthProfile } from "@/store/api/health-profile/type";
import { Examination } from "@/store/api/examination/type";
import { ExaminationWorkspaceView } from "./components/examination-workspace-view";
import { HealthProfileList } from "./components/healthprofile-list";
import { ExaminationHistory } from "./components/examination-history";
import { ExaminationService } from "./services";

const WorkSpace = () => {
   const [selectedProfile, setSelectedProfile] = useState<HealthProfile | null>(
      null,
   );
   const [selectedExamination, setSelectedExamination] =
      useState<Examination | null>(null);

   const handleSelectProfile = (profile: HealthProfile | null) => {
      setSelectedProfile(profile);
      if (!profile) {
         setSelectedExamination(null);
      }
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch h-[calc(100vh-4rem)] overflow-hidden">
         <div className="lg:col-span-3 border-r border-slate-200 overflow-y-auto h-full flex flex-col gap-4 bg-white">
            <HealthProfileList
               selectedProfile={selectedProfile}
               onSelectProfile={handleSelectProfile}
               onChangePatient={() => handleSelectProfile(null)}
            />
            {selectedProfile && (
               <ExaminationHistory
                  healthProfileId={selectedProfile.id}
                  onSelectExamination={setSelectedExamination}
               />
            )}
         </div>

         <div className="lg:col-span-7 h-full overflow-hidden">
            <ExaminationWorkspaceView
               selectedProfile={selectedProfile}
               selectedExamination={selectedExamination}
               onSelectExamination={setSelectedExamination}
               onStartNewExamination={() => setSelectedExamination(null)}
            />
         </div>

         <div className="lg:col-span-2">
            <ExaminationService />
         </div>
      </div>
   );
};

export default WorkSpace;
