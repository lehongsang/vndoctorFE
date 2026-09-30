import { useGetDetailHealthProfileQuery } from "@/store/api/health-profile/health-profile-api";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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
import { useLazyGetExaminationByIdQuery } from "@/store/api/examination/examination-api";
import { ArrowLeft, AlertTriangle, Lock } from "lucide-react";
import { checkHealthProfileCarePackage } from "@/lib/care-package-utils";
import { toast } from "react-toastify";

export const ExaminationPage = () => {
   const params = useParams<{
      id?: string;
      action?: string;
      assessmentId?: string;
   }>();
   const searchParams = useSearchParams();

   const router = useRouter();
   const [getExaminationById] = useLazyGetExaminationByIdQuery();

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

   const packageCheck = useMemo(
      () => checkHealthProfileCarePackage(HealthProfile),
      [HealthProfile],
   );

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
         status: "IN_PROGRESS",
      } as unknown as Examination;
   }, [assessmentData, assessmentId]);

   const effectiveIsCreate =
      packageCheck.canCreateExamination &&
      (isCreateExamination || (action === "create" && !examination));
   const effectiveEditingData = editingExamination ?? assessmentInitialData;

   const handleExaminationSaved = async (savedExam: Examination) => {
      // Dọn dẹp query param action=create trên URL nếu có
      if (action === "create" && id) {
         router.replace(`/health-profile/examination/${id}`);
      }

      if (savedExam.status === "COMPLETED") {
         // Khi hoàn thành: hiển thị chi tiết phiếu khám vừa hoàn thành
         setIsCreateExamination(false);
         setEditingExamination(null);
         try {
            const fullExam = await getExaminationById(
               savedExam.id,
               false,
            ).unwrap();
            setExamination(fullExam);
         } catch {
            setExamination(savedExam);
         }
      } else {
         // Khi lưu (IN_PROGRESS hoặc trạng thái khác): vẫn hiển thị phiếu để tiếp tục
         setIsCreateExamination(false);
         setExamination(null);
         try {
            const fullExam = await getExaminationById(
               savedExam.id,
               false,
            ).unwrap();
            setEditingExamination(fullExam);
         } catch {
            setEditingExamination(savedExam);
         }
      }
   };

   const handleStartCreateExamination = (
      initialVitals?: Partial<Examination>,
   ) => {
      if (!HealthProfile) return;
      if (!packageCheck.canCreateExamination) {
         toast.error(
            packageCheck.reason ||
               "Hồ sơ sức khỏe chưa đăng ký gói hoặc gói đã hết hạn, không thể tạo phiếu khám mới!",
         );
         return;
      }
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
         <div className="col-span-3 flex flex-col gap-4 px-4 pt-2 border-r border-slate-200">
            <CustomButton
               className="w-fit"
               startIcon={<ArrowLeft />}
               onClick={() => {
                  router.push("/health-profile");
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
                  selectedExaminationId={
                     examination?.id || editingExamination?.id
                  }
                  onSelectExamination={(exam) => {
                     setEditingExamination(null);
                     setIsCreateExamination(false);
                     setExamination(exam);
                  }}
                  onEditExamination={(exam) => {
                     setExamination(null);
                     setIsCreateExamination(false);
                     setEditingExamination(exam);
                  }}
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
                           if (!packageCheck.canCreateExamination) {
                              toast.error(
                                 packageCheck.reason ||
                                    "Hồ sơ sức khỏe chưa đăng ký gói hoặc gói đã hết hạn, không thể tạo phiếu khám mới!",
                              );
                              return;
                           }
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
                              <div className="flex flex-col h-[calc(100vh-10rem)] gap-3 justify-center items-center p-6 text-center max-w-md mx-auto">
                                 {packageCheck.canCreateExamination ? (
                                    <CustomButton
                                       variant="default"
                                       size="sm"
                                       onClick={() =>
                                          handleStartCreateExamination()
                                       }
                                       className="flex items-center gap-1.5 w-fit px-6"
                                    >
                                       Tạo phiếu khám mới
                                    </CustomButton>
                                 ) : (
                                    <div className="p-5 rounded-lg border border-rose-200 bg-rose-50/80 flex flex-col items-center gap-3">
                                       <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                          <AlertTriangle className="w-6 h-6" />
                                       </div>
                                       <div className="space-y-1">
                                          <h3 className="text-sm font-bold text-rose-900">
                                             {packageCheck.isExpired
                                                ? "Gói điều trị đã hết hạn"
                                                : "Chưa đăng ký gói điều trị"}
                                          </h3>
                                          <p className="text-xs text-rose-700 leading-relaxed">
                                             {packageCheck.reason ||
                                                "Hồ sơ sức khỏe chưa đăng ký gói điều trị hoặc gói đã hết hạn. Không thể tạo phiếu khám mới."}
                                          </p>
                                       </div>
                                       <div className="flex items-center gap-2 pt-1">
                                          <CustomButton
                                             variant="default"
                                             size="sm"
                                             disabled
                                             className="opacity-50 cursor-not-allowed text-xs bg-slate-300 text-slate-600 hover:bg-slate-300"
                                             title={packageCheck.reason}
                                          >
                                             <Lock className="w-3.5 h-3.5 mr-1" />
                                             Tạo phiếu khám mới
                                          </CustomButton>
                                          <CustomButton
                                             variant="outline"
                                             size="sm"
                                             className="text-xs border-rose-300 text-rose-700 hover:bg-rose-100"
                                             onClick={() =>
                                                router.push("/health-profile")
                                             }
                                          >
                                             Danh sách hồ sơ
                                          </CustomButton>
                                       </div>
                                    </div>
                                 )}
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
                                       onSuccess={(savedExam) => {
                                          handleExaminationSaved(savedExam);
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
