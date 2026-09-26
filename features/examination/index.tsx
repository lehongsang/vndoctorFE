import { useGetDetailHealthProfileQuery } from "@/store/api/health-profile/health-profile-api";
import { useParams, useSearchParams } from "next/navigation";
import { ExaminationInfo } from "./components/examination-info";
import CloverLoading from "@/components/common/clover-loading";
import { useState, useMemo } from "react";
import { Examination } from "@/store/api/examination/type";
import { ExaminationHistory } from "./components/examination-history";
import { CustomButton } from "@/components/common/custom-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExaminationDetail } from "./components/examination-deatail";
import { ExaminationForm } from "./components/examination-form";
import RiskFactorAssessmentForm from "./components/risk-factor-assessment-form";
import { HealthProfile } from "@/store/api/health-profile/type";
import { ExaminationService } from "./components/service";
import { RiskAssessmentHistory } from "./components/risk-assessment-history";
import { useGetRiskAssessmentDetailQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { ArrowLeft } from "lucide-react";

export const ExaminationPage = () => {
   const params = useParams<{
      id?: string;
      action?: string;
      assessmentId?: string;
   }>();
   const searchParams = useSearchParams();

   const id = params?.id;
   const action = params?.action || searchParams.get("action");
   const assessmentId =
      params?.assessmentId || searchParams.get("assessmentId");

   const [examination, setExamination] = useState<Examination | null>(null);

   const [selectedOption, setSelectedOption] = useState<
      "assessment" | "history"
   >("history");
   const [isCreateExamination, setIsCreateExamination] =
      useState<boolean>(false);
   const [editingExamination, setEditingExamination] =
      useState<Examination | null>(null);

   const { data, isLoading } = useGetDetailHealthProfileQuery(id || "");
   const HealthProfile = data as HealthProfile;

   const { data: assessmentData } = useGetRiskAssessmentDetailQuery(
      assessmentId || "",
      { skip: !assessmentId },
   );

   const assessmentInitialData: Examination | null = useMemo(() => {
      if (!assessmentData && !assessmentId) return null;
      const input = assessmentData?.assessmentInput;
      return {
         assessmentInputId:
            assessmentData?.assessmentInputId ||
            assessmentData?.assessmentInput?.id ||
            assessmentData?.id ||
            assessmentId,
         systolicBp:
            input?.systolicBp != null ? Number(input.systolicBp) : undefined,
         diastolicBp:
            input?.diastolicBp != null ? Number(input.diastolicBp) : undefined,
         heightCm: input?.heightCm != null ? Number(input.heightCm) : undefined,
         weightKg: input?.weightKg != null ? Number(input.weightKg) : undefined,
         bmi: input?.bmi != null ? Number(input.bmi) : undefined,
         status: "IN_PROGRESS",
      } as Examination;
   }, [assessmentData, assessmentId]);

   const effectiveIsCreate =
      isCreateExamination || (action === "create" && !examination);
   const effectiveEditingData = editingExamination ?? assessmentInitialData;

   const handleStartCreateExamination = (
      initialVitals?: Partial<Examination>,
   ) => {
      if (!HealthProfile) return;
      setIsCreateExamination(true);
      setEditingExamination(
         initialVitals ? (initialVitals as Examination) : null,
      );
      setExamination(null);
   };

   if (isLoading)
      return (
         <div>
            <CloverLoading size="sm" />
         </div>
      );

   return (
      <div className="grid grid-cols-12 w-full h-[calc(100vh-4rem)] overflow-hidden">
         <div className="col-span-3 flex flex-col gap-4 px-4 pt-2">
            <CustomButton
               className="w-fit"
               startIcon={<ArrowLeft />}
               onClick={() => {
                  window.history.back();
               }}
            >
               Quay lại
            </CustomButton>
            {HealthProfile && <ExaminationInfo profile={HealthProfile} />}
            <div className="flex gap-2">
               <CustomButton
                  onClick={() => setSelectedOption("history")}
                  variant={selectedOption === "history" ? "default" : "outline"}
                  className="h-9"
               >
                  Đợt khám
               </CustomButton>
               <CustomButton
                  onClick={() => setSelectedOption("assessment")}
                  variant={
                     selectedOption === "assessment" ? "default" : "outline"
                  }
                  className="h-9"
               >
                  Phân tầng
               </CustomButton>
            </div>
            {selectedOption === "history" ? (
               <ExaminationHistory
                  healthProfileId={id || ""}
                  onSelectExamination={(examination) =>
                     setExamination(examination)
                  }
               />
            ) : (
               <RiskAssessmentHistory healthProfileId={id || ""} />
            )}
         </div>
         <ScrollArea className="col-span-9 overflow-auto h-[calc(100vh-4rem)] p-4 pb-0">
            {id && isLoading && !HealthProfile ? (
               <div className="flex flex-col items-center justify-center h-full py-16 gap-2">
                  <CloverLoading size="md" />
                  <span className="text-xs text-slate-500">
                     Đang tải thông tin hồ sơ khám bệnh...
                  </span>
               </div>
            ) : (
               <>
                  {selectedOption === "assessment" && (
                     <RiskFactorAssessmentForm
                        selectedProfile={HealthProfile}
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
                        {HealthProfile &&
                           !effectiveIsCreate &&
                           !effectiveEditingData &&
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
                        {(effectiveIsCreate || effectiveEditingData) &&
                           !examination &&
                           HealthProfile && (
                              <div className="grid grid-cols-4">
                                 <div className="col-span-3 px-0.5">
                                    <ExaminationForm
                                       healthProfileId={HealthProfile?.id || ""}
                                       initialData={effectiveEditingData}
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
                                       healthProfile={HealthProfile}
                                    />
                                 </div>
                              </div>
                           )}
                        {examination && HealthProfile && (
                           <ExaminationDetail
                              examination={examination}
                              healthProfile={HealthProfile}
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
