"use client";

import { format } from "date-fns";
import {
   RiskAssessmentResult,
   AssessmentInput,
} from "@/store/api/risk-factor-assessment/type";
import { useGetRiskAssessmentDetailQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
   RiskLevelBadge,
   getRiskContainerClass,
   RISK_EXPLANATION_TEXT,
   formatRiskRate,
   checkHasUnderlyingDisease,
} from "@/components/common/risk-level-badge";
import { toast } from "react-toastify";
import { checkHealthProfileCarePackage } from "@/lib/care-package-utils";
import {
   Activity,
   HeartPulse,
   User,
   CheckCircle2,
   MinusCircle,
   AlertTriangle,
   FileText,
} from "lucide-react";

const TARGET_ORGAN_DAMAGE_FIELDS: {
   key: keyof AssessmentInput;
   label: string;
}[] = [
   {
      key: "hasLeftVentricularHypertrophy",
      label: "Phì đại thất trái (ECG / Siêu âm tim)",
   },
   {
      key: "hasAlbuminuria",
      label: "Có Albumin niệu / Microalbumin niệu",
   },
   {
      key: "hasRetinopathy",
      label: "Tổn thương võng mạc do THA / mạch cảnh",
   },
   {
      key: "hasSilentBrainInfarct",
      label: "Nhồi máu não thầm lặng (Silent brain infarct)",
   },
];

const CARDIOVASCULAR_EVENT_FIELDS: {
   key: keyof AssessmentInput;
   label: string;
}[] = [
   { key: "stroke", label: "Đột quỵ não" },
   { key: "hasMyocardialInfarction", label: "Nhồi máu cơ tim" },
   { key: "hasAcuteCoronarySyndrome", label: "Hội chứng vành cấp" },
   { key: "hasCoronaryArteryDisease", label: "Bệnh lý mạch vành" },
   { key: "hasTia", label: "Cơn thiếu máu não thoáng qua (TIA)" },
   { key: "hasAorticAneurysm", label: "Phình động mạch chủ" },
   { key: "hasPeripheralArteryDisease", label: "Bệnh mạch máu ngoại vi" },
   { key: "hasAtherosclerosis", label: "Vữa xơ mạch máu" },
   {
      key: "hasFamilialHypercholesterolemia",
      label: "Tăng Cholesterol máu gia đình",
   },
];

const getPositiveFactors = (input?: AssessmentInput) => {
   if (!input) return [];
   const factors: { label: string; value?: string }[] = [];

   if (input.diabetes) {
      const details: string[] = [];
      if (input.diabetesDurationYears)
         details.push(`${input.diabetesDurationYears} năm`);
      if (input.glycemicControl)
         details.push(`kiểm soát ${input.glycemicControl}`);
      factors.push({
         label: "Đái tháo đường",
         value: details.length > 0 ? `Có (${details.join(", ")})` : "Có",
      });
   }
   if (input.hasLeftVentricularHypertrophy) {
      factors.push({ label: "Phì đại thất trái (ECG / Siêu âm tim)" });
   }
   if (input.hasAlbuminuria) {
      factors.push({ label: "Có Albumin niệu / Microalbumin niệu" });
   }
   if (input.hasRetinopathy) {
      factors.push({ label: "Tổn thương võng mạc do THA / mạch cảnh" });
   }
   if (input.hasSilentBrainInfarct) {
      factors.push({ label: "Nhồi máu não thầm lặng" });
   }
   if (input.stroke) {
      factors.push({ label: "Đột quỵ não" });
   }
   if (input.hasMyocardialInfarction) {
      factors.push({ label: "Nhồi máu cơ tim" });
   }
   if (input.hasAcuteCoronarySyndrome) {
      factors.push({ label: "Hội chứng vành cấp" });
   }
   if (input.hasCoronaryArteryDisease) {
      factors.push({ label: "Bệnh lý mạch vành" });
   }
   if (input.hasTia) {
      factors.push({ label: "Cơn thiếu máu não thoáng qua (TIA)" });
   }
   if (input.hasAorticAneurysm) {
      factors.push({ label: "Phình động mạch chủ" });
   }
   if (input.hasPeripheralArteryDisease) {
      factors.push({ label: "Bệnh mạch máu ngoại vi" });
   }
   if (input.hasAtherosclerosis) {
      factors.push({ label: "Vữa xơ mạch máu" });
   }
   if (input.hasFamilialHypercholesterolemia) {
      factors.push({ label: "Tăng Cholesterol máu gia đình" });
   }

   return factors;
};

const formatMetric = (val?: number | string | null, unit: string = "") => {
   if (val === null || val === undefined || val === "") return "—";
   const num = Number(val);
   if (isNaN(num)) return `${val} ${unit}`.trim();
   return `${num} ${unit}`.trim();
};

export interface RiskAssessmentDetailModalProps {
   isOpen: boolean;
   onClose: () => void;
   assessment?: RiskAssessmentResult | null;
   assessmentId?: string | null;
   onEvaluate?: (assessment: RiskAssessmentResult) => void;
   onStartExamination?: (assessment: RiskAssessmentResult) => void;
   showStartExamination?: boolean;
   onEdit?: (assessment: RiskAssessmentResult) => void;
}

export function RiskAssessmentDetailModal({
   isOpen,
   onClose,
   assessment: propAssessment,
   assessmentId,
   onEvaluate,
   onStartExamination,
   showStartExamination = true,
   onEdit,
}: RiskAssessmentDetailModalProps) {
   const targetId = propAssessment?.id || assessmentId || "";
   const { data: fetchedAssessment, isLoading } =
      useGetRiskAssessmentDetailQuery(targetId, {
         skip: !targetId || !isOpen,
      });

   const assessment = fetchedAssessment || propAssessment || null;

   if (!isOpen) return null;

   if (isLoading && !assessment) {
      return (
         <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:min-w-3xl rounded-lg p-8 flex flex-col items-center justify-center gap-3">
               <CloverLoading size="md" />
               <span className="text-xs text-slate-500 font-medium">
                  Đang tải thông tin phân tầng nguy cơ...
               </span>
            </DialogContent>
         </Dialog>
      );
   }

   if (!assessment) return null;

   const input = (assessment.assessmentInput ||
      assessment ||
      {}) as AssessmentInput;
   const positiveFactors = getPositiveFactors(input);
   const hasUnderlying = checkHasUnderlyingDisease(assessment);

   const dateStr = assessment.evaluatedAt || assessment.createdAt;
   let formattedDate = "—";
   if (dateStr) {
      try {
         formattedDate = format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss");
      } catch {
         formattedDate = dateStr;
      }
   }

   const packageCheck = assessment?.healthProfile
      ? checkHealthProfileCarePackage(assessment.healthProfile)
      : null;

   const handleStartExam = () => {
      if (packageCheck && !packageCheck.canCreateExamination) {
         toast.warning(
            packageCheck.reason ||
               "Hồ sơ này chưa có gói điều trị hợp lệ để tạo phiếu khám.",
         );
         return;
      }
      onClose();
      if (onStartExamination) {
         onStartExamination(assessment);
      } else {
         const profileId =
            assessment.healthProfileId ||
            assessment.healthProfile?.id ||
            assessment.assessmentInput?.healthProfileId;
         const url = profileId
            ? `/health-profile/examination/${profileId}?action=create&assessmentId=${assessment.id}`
            : `/health-profile/examination?action=create&assessmentId=${assessment.id}`;
         window.open(url, "_blank");
      }
   };

   // Tính BMI nếu chưa có
   const computedBmi =
      input.bmi != null
         ? input.bmi
         : input.heightCm && input.weightKg && Number(input.heightCm) > 0
           ? (
                Number(input.weightKg) /
                Math.pow(Number(input.heightCm) / 100, 2)
             ).toFixed(1)
           : null;

   return (
      <Dialog
         open={isOpen}
         onOpenChange={(open) => {
            if (!open) onClose();
         }}
      >
         <DialogContent className="sm:min-w-4xl max-w-4xl rounded-sm p-px gap-0 overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200">
               <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between gap-2">
                  <span>Chi tiết phân tầng nguy cơ tim mạch</span>
               </DialogTitle>
               <DialogDescription className="text-xs text-slate-500">
                  Thời gian đánh giá: {formattedDate}
               </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
               <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* 1. Kết quả phân tầng tổng quan */}
                  <div
                     className={cn(
                        "p-4 rounded-sm border flex flex-col gap-2.5",
                        getRiskContainerClass(assessment.riskLevel),
                     )}
                  >
                     <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                           <span className="font-bold text-xs sm:text-sm">
                              Nguy cơ biến cố tim mạch trong 10 năm:
                           </span>
                           <RiskLevelBadge level={assessment.riskLevel} />
                        </div>
                        {assessment.riskScore !== null &&
                           assessment.riskScore !== undefined &&
                           assessment.riskScore !== "" && (
                              <div className="text-xs flex items-center gap-1.5 flex-wrap">
                                 <span className="text-slate-700 font-bold">
                                    Tỷ lệ biến cố:
                                 </span>
                                 <span className="text-base font-extrabold text-primary">
                                    {formatRiskRate(
                                       assessment.riskScore,
                                       hasUnderlying,
                                    )}
                                 </span>
                              </div>
                           )}
                     </div>

                     {/* Giải thích tỷ lệ biến cố */}
                     <div className="text-[11px] text-slate-900 bg-white/80 p-2.5 rounded border border-slate-200/70 leading-relaxed">
                        <strong className="text-slate-900">Giải thích:</strong>{" "}
                        {RISK_EXPLANATION_TEXT}
                     </div>

                     <p className="text-[11px] text-slate-900 italic">
                        * Phân tầng yếu tố nguy cơ theo thang điểm Score 2;
                        Score-OP; Score-dia được Khuyến cáo của hiệp hội tim
                        mạch châu Âu ESC
                     </p>
                  </div>

                  {/* 2. Thẩm định & Kết luận chuyên môn của bác sĩ (nếu có) */}
                  {(assessment.doctor || assessment.doctorNote) && (
                     <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                           <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              Thẩm định chuyên môn của bác sĩ
                           </span>
                           {assessment.doctor && (
                              <span className="text-[11px] text-slate-600">
                                 Bác sĩ thẩm định:{" "}
                                 <strong className="text-slate-800 font-semibold">
                                    {assessment.doctor.fullName}
                                 </strong>
                              </span>
                           )}
                        </div>

                        {assessment.doctorNote && (
                           <div className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">
                                 Ghi chú thẩm định:{" "}
                              </span>
                              {assessment.doctorNote}
                           </div>
                        )}
                     </div>
                  )}

                  {/* 3. Cảnh báo nguy cơ cao (Red Flags nếu có) */}
                  {assessment.redFlags && assessment.redFlags.length > 0 && (
                     <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-sm flex flex-col gap-2">
                        <div className="font-bold text-rose-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                           <AlertTriangle className="w-4 h-4 text-rose-600" />
                           Cảnh báo nguy cơ cao (Red Flags)
                        </div>
                        <div className="flex flex-col gap-1 pl-1">
                           {assessment.redFlags.map((flag, idx) => (
                              <div
                                 key={idx}
                                 className="text-xs text-rose-900 flex items-baseline font-medium"
                              >
                                 • {flag.title || flag.metric}: {flag.value}
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* 4. DỮ LIỆU ĐẦU VÀO ĐÃ NHẬP: THÔNG TIN CHUNG & THỂ TRẠNG */}
                  <div className="flex flex-col gap-2 pt-1">
                     <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" />
                        <span>Thông tin người bệnh & Thể trạng đầu vào</span>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Tuổi
                           </span>
                           <span className="font-semibold text-slate-800">
                              {input.age != null ? `${input.age} tuổi` : "—"}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Giới tính
                           </span>
                           <span className="font-semibold text-slate-800">
                              {input.gender || "—"}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Hút thuốc lá
                           </span>
                           <span
                              className={cn(
                                 "font-semibold",
                                 input.isSmoking
                                    ? "text-rose-600"
                                    : "text-slate-800",
                              )}
                           >
                              {input.isSmoking === true
                                 ? "Có hút thuốc"
                                 : input.isSmoking === false
                                   ? "Không hút thuốc"
                                   : "—"}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Nhóm phân tầng
                           </span>
                           <span className="font-semibold text-slate-800">
                              {hasUnderlying
                                 ? "Có bệnh nền (Non-ASCVD)"
                                 : "Chưa có bệnh nền (SCORE2)"}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Chiều cao
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.heightCm, "cm")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Cân nặng
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.weightKg, "kg")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Chỉ số BMI
                           </span>
                           <span className="font-semibold text-slate-800">
                              {computedBmi ? `${computedBmi} kg/m²` : "—"}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Bệnh nền ghi nhận
                           </span>
                           <span className="font-semibold text-slate-800">
                              {input.hasUnderlyingDisease ? "Có" : "Không"}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* 5. DỮ LIỆU ĐẦU VÀO ĐÃ NHẬP: HUYẾT ÁP & XÉT NGHIỆM CẬN LÂM SÀNG */}
                  <div className="flex flex-col gap-2 pt-1">
                     <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-primary" />
                        <span>Chỉ số huyết áp & Xét nghiệm cận lâm sàng</span>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Huyết áp
                           </span>
                           <span className="font-semibold text-slate-800">
                              {input.systolicBp && input.diastolicBp
                                 ? `${input.systolicBp}/${input.diastolicBp} mmHg`
                                 : input.systolicBp
                                   ? `${input.systolicBp} mmHg`
                                   : "—"}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Cholesterol toàn phần
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.totalCholesterol, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              HDL-Cholesterol
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.hdlCholesterol, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Non-HDL-Cholesterol
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.nonHdlCholesterol, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              LDL-Cholesterol
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.ldlCholesterol, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Triglycerides
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.triglycerides, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Đường huyết lúc đói
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.glucoseFasting, "mmol/L")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Độ lọc cầu thận (eGFR)
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.egfr, "mL/min/1.73m²")}
                           </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                           <span className="text-slate-500 block text-[11px]">
                              Tỷ lệ ACR
                           </span>
                           <span className="font-semibold text-slate-800">
                              {formatMetric(input.acr, "mg/g")}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* 6. THÔNG TIN ĐÁI THÁO ĐƯỜNG & THẬN (Nếu có) */}
                  {(input.diabetes ||
                     input.diabetesDurationYears != null ||
                     input.glycemicControl) && (
                     <div className="p-3 bg-amber-50/60 rounded border border-amber-200/80 flex flex-col gap-2">
                        <div className="font-bold text-amber-900 text-xs sm:text-sm">
                           Thông tin Đái tháo đường
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                           <div className="p-2 bg-white/80 rounded border border-amber-200">
                              <span className="text-slate-500 block text-[11px]">
                                 Tình trạng
                              </span>
                              <span className="font-semibold text-amber-900">
                                 {input.diabetes ? "Có mắc ĐTĐ" : "Không"}
                              </span>
                           </div>
                           <div className="p-2 bg-white/80 rounded border border-amber-200">
                              <span className="text-slate-500 block text-[11px]">
                                 Số năm mắc ĐTĐ
                              </span>
                              <span className="font-semibold text-slate-800">
                                 {input.diabetesDurationYears != null
                                    ? `${input.diabetesDurationYears} năm`
                                    : "—"}
                              </span>
                           </div>
                           <div className="p-2 bg-white/80 rounded border border-amber-200">
                              <span className="text-slate-500 block text-[11px]">
                                 Kiểm soát đường máu
                              </span>
                              <span className="font-semibold text-slate-800">
                                 {input.glycemicControl || "—"}
                              </span>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* 7. YẾU TỐ NGUY CƠ & BỆNH NỀN ĐÃ GHI NHẬN (CÁC YẾU TỐ DƯƠNG TÍNH) */}
                  {positiveFactors.length > 0 && (
                     <div className="flex flex-col gap-2 pt-1">
                        <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                           <HeartPulse className="w-4 h-4 text-rose-600" />
                           <span>
                              Yếu tố nguy cơ & Bệnh lý nền ghi nhận (
                              {positiveFactors.length})
                           </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {positiveFactors.map((factor, idx) => (
                              <div
                                 key={idx}
                                 className="p-2.5 rounded bg-rose-50/70 border border-rose-200 text-xs flex items-center justify-between"
                              >
                                 <span className="font-medium text-rose-900">
                                    {factor.label}
                                 </span>
                                 <span className="font-semibold text-rose-700 text-[11px]">
                                    {factor.value || "Có"}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* 8. TOÀN BỘ DANH MỤC BỆNH LÝ & BIẾN CỐ ĐÃ ĐƯỢC ĐÁNH GIÁ (FULL CHECKLIST) */}
                  <div className="flex flex-col gap-2 pt-1">
                     <div className="font-bold text-slate-800 text-xs sm:text-sm">
                        Chi tiết tình trạng các bệnh lý & Tổn thương cơ quan
                        đích
                     </div>

                     {/* Khối Tổn thương cơ quan đích */}
                     <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                           1. Tổn thương cơ quan đích
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {TARGET_ORGAN_DAMAGE_FIELDS.map((item) => {
                              const isPositive = Boolean(input[item.key]);
                              return (
                                 <div
                                    key={item.key}
                                    className={cn(
                                       "p-2 rounded border text-xs flex items-center justify-between gap-2",
                                       isPositive
                                          ? "bg-rose-50/80 border-rose-200 text-rose-900"
                                          : "bg-slate-50/70 border-slate-200 text-slate-700",
                                    )}
                                 >
                                    <span className="font-medium text-[11px]">
                                       {item.label}
                                    </span>
                                    <span
                                       className={cn(
                                          "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0",
                                          isPositive
                                             ? "bg-rose-100 text-rose-700"
                                             : "bg-slate-200/70 text-slate-500 font-normal",
                                       )}
                                    >
                                       {isPositive ? (
                                          <>
                                             <CheckCircle2 className="w-3 h-3 text-rose-600" />
                                             Có
                                          </>
                                       ) : (
                                          <>
                                             <MinusCircle className="w-3 h-3 text-slate-400" />
                                             Không
                                          </>
                                       )}
                                    </span>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Khối Tiền sử biến cố tim mạch */}
                     <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                           2. Tiền sử biến cố tim mạch nặng & Vữa xơ
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {CARDIOVASCULAR_EVENT_FIELDS.map((item) => {
                              const isPositive = Boolean(input[item.key]);
                              return (
                                 <div
                                    key={item.key}
                                    className={cn(
                                       "p-2 rounded border text-xs flex items-center justify-between gap-2",
                                       isPositive
                                          ? "bg-rose-50/80 border-rose-200 text-rose-900"
                                          : "bg-slate-50/70 border-slate-200 text-slate-700",
                                    )}
                                 >
                                    <span className="font-medium text-[11px]">
                                       {item.label}
                                    </span>
                                    <span
                                       className={cn(
                                          "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0",
                                          isPositive
                                             ? "bg-rose-100 text-rose-700"
                                             : "bg-slate-200/70 text-slate-500 font-normal",
                                       )}
                                    >
                                       {isPositive ? (
                                          <>
                                             <CheckCircle2 className="w-3 h-3 text-rose-600" />
                                             Có
                                          </>
                                       ) : (
                                          <>
                                             <MinusCircle className="w-3 h-3 text-slate-400" />
                                             Không
                                          </>
                                       )}
                                    </span>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  </div>
               </div>
            </ScrollArea>

            {/* Footer với các nút hành động */}
            <div className="p-3 sm:px-5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
               <CustomButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onClose}
                  className="text-xs h-8 px-3 cursor-pointer"
               >
                  Đóng
               </CustomButton>
               {showStartExamination && (
                  <CustomButton
                     type="button"
                     size="sm"
                     className="h-8 text-xs font-semibold px-4 cursor-pointer bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
                     onClick={handleStartExam}
                     title={
                        packageCheck && !packageCheck.canCreateExamination
                           ? packageCheck.reason
                           : undefined
                     }
                  >
                     Khám ngay
                  </CustomButton>
               )}

               {onEdit && (
                  <CustomButton
                     type="button"
                     variant="outline"
                     size="sm"
                     className="h-8 text-xs font-semibold px-4 cursor-pointer border-blue-300 text-blue-700 hover:bg-blue-50"
                     onClick={() => {
                        onClose();
                        onEdit(assessment);
                     }}
                  >
                     Đánh giá lại
                  </CustomButton>
               )}

               {onEvaluate && (
                  <CustomButton
                     type="button"
                     size="sm"
                     className="h-8 text-xs font-semibold px-4 cursor-pointer"
                     onClick={() => {
                        onClose();
                        onEvaluate(assessment);
                     }}
                  >
                     {assessment.doctor
                        ? "Thẩm định lại"
                        : "Thẩm định & Xác nhận"}
                  </CustomButton>
               )}
            </div>
         </DialogContent>
      </Dialog>
   );
}

export default RiskAssessmentDetailModal;
