import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HealthProfileList } from "./components/health-profile-list";
import { HealthProfile } from "@/store/api/health-profile/type";
import { useGetDetailHealthProfileQuery } from "@/store/api/health-profile/health-profile-api";
import { CloverLoading } from "@/components/common/clover-loading";
import RiskFactorAssessmentForm from "./components/risk-factor-assessment-form";
import { CustomButton } from "@/components/common/custom-button";
import { ExaminationForm } from "./components/examination-form";
import { Examination } from "@/store/api/examination/type";
import { ExaminationDetail } from "./components/examination-deatail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExaminationService } from "./components/service";

export const MainWorkPage = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const profileId = searchParams.get("profileId");
   const action = searchParams.get("action");
   const optionParam = searchParams.get("option") || searchParams.get("tab");
   const assessmentId =
      searchParams.get("assessmentId") ||
      searchParams.get("assessmentInputId");

   const [localProfile, setLocalProfile] = useState<HealthProfile | null>(null);
   const [prevProfileId, setPrevProfileId] = useState(profileId);
   const [prevOptionParam, setPrevOptionParam] = useState(optionParam);
   const [selectedOption, setSelectedOption] = useState<
      "history" | "accessment"
   >(
      optionParam === "accessment" || optionParam === "assessment"
         ? "accessment"
         : "history",
   );
   const [isCreateExamination, setIsCreateExamination] = useState(false);
   const [editingExamination, setEditingExamination] =
      useState<Examination | null>(null);
   const [examination, setExamination] = useState<Examination | null>(null);

   if (prevProfileId !== profileId) {
      setPrevProfileId(profileId);
      setIsCreateExamination(false);
      setEditingExamination(null);
      setExamination(null);
   }

   if (prevOptionParam !== optionParam) {
      setPrevOptionParam(optionParam);
      if (optionParam === "accessment" || optionParam === "assessment") {
         setSelectedOption("accessment");
      } else if (optionParam === "history") {
         setSelectedOption("history");
      }
   }

   const { data: fetchedProfile, isLoading: isFetchingProfile } =
      useGetDetailHealthProfileQuery(profileId ?? "", {
         skip: !profileId,
      });

   // Derive selectedProfile directly during render without useEffect to avoid cascading renders
   const selectedProfile = profileId
      ? (fetchedProfile ??
        (localProfile?.id === profileId ? localProfile : null))
      : null;

   const handleSelectProfile = (profile: HealthProfile) => {
      setLocalProfile(profile);
      setIsCreateExamination(false);
      setEditingExamination(null);
      setExamination(null);
      router.replace(`/work?profileId=${profile.id}`);
   };

   const handleChangeProfile = () => {
      setLocalProfile(null);
      setIsCreateExamination(false);
      setEditingExamination(null);
      setExamination(null);
      router.replace("/work");
   };

   const handleStartCreateExamination = (
      initialVitals?: Partial<Examination>,
   ) => {
      if (!selectedProfile) return;
      setSelectedOption("history");
      setIsCreateExamination(true);
      setEditingExamination(
         initialVitals ? (initialVitals as Examination) : null,
      );
      setExamination(null);
   };

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "F2") {
            e.preventDefault();
            if (
               selectedProfile &&
               !isCreateExamination &&
               !editingExamination &&
               !examination
            ) {
               handleStartCreateExamination();
            }
         }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [selectedProfile, isCreateExamination, editingExamination, examination]);

   const autoStartedKeyRef = useRef<string | null>(null);

   useEffect(() => {
      const key = `${profileId}-${action}-${assessmentId}`;
      if (
         action === "create" &&
         selectedProfile &&
         autoStartedKeyRef.current !== key &&
         !isCreateExamination &&
         !editingExamination &&
         !examination
      ) {
         autoStartedKeyRef.current = key;
         handleStartCreateExamination(
            assessmentId
               ? ({ assessmentInputId: assessmentId } as Partial<Examination>)
               : undefined,
         );
      }
   }, [
      action,
      assessmentId,
      profileId,
      selectedProfile,
      isCreateExamination,
      editingExamination,
      examination,
   ]);

   return (
      <div className="grid grid-cols-12 h-[calc(100vh-4rem)] overflow-hidden">
         <div className="col-span-3 border-r border-slate-200 shadow-md">
            <HealthProfileList
               selectedProfile={selectedProfile}
               isLoadingSelected={Boolean(
                  profileId && isFetchingProfile && !selectedProfile,
               )}
               onSelectProfile={handleSelectProfile}
               onChangeProfile={handleChangeProfile}
               option={selectedOption}
               onChangeOption={setSelectedOption}
               onChangeExamination={(ex) => {
                  setExamination(ex);
                  setEditingExamination(null);
                  setIsCreateExamination(false);
               }}
               onEditExamination={(ex) => {
                  setEditingExamination(ex);
                  setExamination(null);
                  setIsCreateExamination(false);
               }}
            />
         </div>
         <ScrollArea className="col-span-9 overflow-auto h-[calc(100vh-4rem)] p-4 pb-0">
            {profileId && isFetchingProfile && !selectedProfile ? (
               <div className="flex flex-col items-center justify-center h-full py-16 gap-2">
                  <CloverLoading size="md" />
                  <span className="text-xs text-slate-500">
                     Đang tải thông tin hồ sơ khám bệnh...
                  </span>
               </div>
            ) : (
               <>
                  {selectedOption === "accessment" && (
                     <RiskFactorAssessmentForm
                        selectedProfile={selectedProfile}
                        onClearProfile={handleChangeProfile}
                        onStartExaminationWithAssessment={(
                           _assessment,
                           initialVitals,
                        ) => {
                           handleStartCreateExamination(initialVitals);
                        }}
                     />
                  )}
                  {selectedOption === "history" && (
                     <div className="flex flex-col gap-4">
                        {selectedProfile &&
                           !isCreateExamination &&
                           !editingExamination &&
                           !examination && (
                              <div className="flex h-[calc(100vh-10rem)] gap-2 justify-center items-center">
                                 <CustomButton
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                       handleStartCreateExamination()
                                    }
                                    className="flex items-center gap-1.5 w-fit px-6"
                                 >
                                    Tạo đợt khám mới (F2)
                                 </CustomButton>
                              </div>
                           )}
                        {(isCreateExamination || editingExamination) &&
                           !examination &&
                           selectedProfile && (
                              <div className="grid grid-cols-4">
                                 <div className="col-span-3 px-0.5">
                                    <ExaminationForm
                                       healthProfileId={
                                          selectedProfile?.id || ""
                                       }
                                       initialData={editingExamination}
                                       onCancel={() => {
                                          setIsCreateExamination(false);
                                          setEditingExamination(null);
                                       }}
                                       onSuccess={() => {
                                          setIsCreateExamination(false);
                                          setEditingExamination(null);
                                       }}
                                    />
                                 </div>
                                 <div className="col-span-1">
                                    <ExaminationService
                                       healthProfile={selectedProfile}
                                    />
                                 </div>
                              </div>
                           )}
                        {examination && selectedProfile && (
                           <ExaminationDetail
                              examination={examination}
                              healthProfile={selectedProfile}
                              onClose={() => setExamination(null)}
                              onEdit={() => {
                                 if (examination.status === "IN_PROGRESS") {
                                    setEditingExamination(examination);
                                    setExamination(null);
                                 }
                              }}
                           />
                        )}
                     </div>
                  )}
               </>
            )}
         </ScrollArea>
      </div>
   );
};
