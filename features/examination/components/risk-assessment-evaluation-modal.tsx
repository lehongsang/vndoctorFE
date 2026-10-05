"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import {
   RiskAssessmentResult,
   RiskLevel,
} from "@/store/api/risk-factor-assessment/type";
import { useEvaluateRiskAssessmentMutation } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { FormTextarea } from "@/components/common/form-textarea";
import { FormSelect } from "@/components/common/form-select";
import { CustomButton } from "@/components/common/custom-button";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import {
   RiskLevelBadge,
   getRiskContainerClass,
   RISK_LEVEL_OPTIONS,
   RISK_EXPLANATION_TEXT,
   formatRiskRate,
   checkHasUnderlyingDisease,
} from "@/components/common/risk-level-badge";

export interface RiskAssessmentEvaluationModalProps {
   isOpen: boolean;
   onClose: () => void;
   assessment: RiskAssessmentResult | null;
   onSuccess?: (updated: RiskAssessmentResult) => void;
}

function EvaluationFormContent({
   assessment,
   onClose,
   onSuccess,
}: {
   assessment: RiskAssessmentResult;
   onClose: () => void;
   onSuccess?: (updated: RiskAssessmentResult) => void;
}) {
   const hasUnderlying = checkHasUnderlyingDisease(assessment);
   const input = assessment.assessmentInput;
   const isMissingNonHdl =
      !hasUnderlying &&
      input &&
      (!input.nonHdlCholesterol ||
         !input.totalCholesterol ||
         !input.hdlCholesterol);
   const [riskLevel, setRiskLevel] = useState<RiskLevel>(
      assessment.riskLevel || "LOW",
   );
   const [doctorNote, setDoctorNote] = useState<string>(
      assessment.doctorNote || "",
   );
   const [errors, setErrors] = useState<{
      doctorNote?: string;
      riskLevel?: string;
   }>({});

   const [evaluateRiskAssessment, { isLoading: isEvaluating }] =
      useEvaluateRiskAssessmentMutation();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!assessment.id) return;

      const newErrors: { doctorNote?: string; riskLevel?: string } = {};
      if (!riskLevel) {
         newErrors.riskLevel = "Vui lòng chọn mức phân tầng nguy cơ";
      }

      if (Object.keys(newErrors).length > 0) {
         setErrors(newErrors);
         return;
      }

      try {
         const res = await evaluateRiskAssessment({
            id: assessment.id,
            data: {
               doctorNote: doctorNote.trim(),
               riskLevel,
            },
         }).unwrap();

         toast.success("xác nhận và xác nhận phân tầng nguy cơ thành công!");
         onSuccess?.(res);
         onClose();
      } catch (error: unknown) {
         console.error("Failed to evaluate risk assessment:", error);
         const apiError = error as { data?: { message?: string } };
         toast.error(
            apiError?.data?.message || "Có lỗi xảy ra khi xác nhận xác nhận",
         );
      }
   };

   return (
      <>
         <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
               xác nhận & Xác nhận phân tầng nguy cơ
            </DialogTitle>
         </DialogHeader>

         {/* Thông tin tham khảo từ kết quả phân tầng hiện tại */}
         <div
            className={cn(
               "p-4 rounded-sm border flex flex-col gap-2.5 text-xs mt-1",
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
                           {formatRiskRate(assessment.riskScore, hasUnderlying)}
                        </span>
                     </div>
                  )}
            </div>

            {/* Giải thích tỷ lệ biến cố */}
            <div className="text-[11px] text-slate-900 bg-white/80 p-2.5 rounded border border-slate-200/70 leading-relaxed">
               <strong className="text-slate-900">Giải thích:</strong>{" "}
               {RISK_EXPLANATION_TEXT}
            </div>

            {isMissingNonHdl && (
               <div className="flex items-start gap-2 p-2.5 rounded bg-amber-50/90 border border-amber-300 text-amber-900 text-xs">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                     <span className="font-semibold text-amber-950">
                        Lưu ý phân tầng:
                     </span>{" "}
                     Thiếu dữ liệu Non-HDL-Cholesterol do không nhập 1 trong 2
                     hoặc không nhập cả 2 chỉ số: Cholesterol toàn phần và
                     HDL-Cholesterol.
                  </div>
               </div>
            )}

            <p className="text-[11px] text-slate-900 italic">
               * Phân tầng yếu tố nguy cơ theo thang điểm Score 2; Score-OP;
               Score-dia được Khuyến cáo của hiệp hội tim mạch châu Âu ESC
            </p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            <FormSelect
               label="Mức phân tầng xác nhận"
               required
               options={RISK_LEVEL_OPTIONS}
               value={riskLevel}
               onValueChange={(val) => {
                  setRiskLevel(val as RiskLevel);
                  if (errors.riskLevel) {
                     setErrors((prev) => ({ ...prev, riskLevel: undefined }));
                  }
               }}
               error={errors.riskLevel}
               placeholder="Chọn mức phân tầng nguy cơ..."
            />

            <FormTextarea
               label="Ghi chú"
               rows={4}
               value={doctorNote}
               onChange={(e) => {
                  setDoctorNote(e.target.value);
                  if (errors.doctorNote) {
                     setErrors((prev) => ({ ...prev, doctorNote: undefined }));
                  }
               }}
               error={errors.doctorNote}
               placeholder="Ví dụ: Bác sĩ đã thăm khám lâm sàng, xác nhận bệnh nhân thuộc nhóm nguy cơ tim mạch rất cao, đề nghị kiểm soát chặt chẽ huyết áp và lipid máu..."
            />

            <div className="flex items-center justify-end gap-2.5">
               <CustomButton
                  type="button"
                  variant="destructive"
                  onClick={onClose}
                  disabled={isEvaluating}
                  className="text-xs h-9 px-4"
               >
                  Hủy bỏ
               </CustomButton>
               <CustomButton
                  type="submit"
                  isLoading={isEvaluating}
                  loadingText="Đang xác nhận..."
                  className="text-xs h-9 px-5 font-semibold"
               >
                  Xác nhận
               </CustomButton>
            </div>
         </form>
      </>
   );
}

export function RiskAssessmentEvaluationModal({
   isOpen,
   onClose,
   assessment,
   onSuccess,
}: RiskAssessmentEvaluationModalProps) {
   return (
      <Dialog
         open={isOpen}
         onOpenChange={(open) => {
            if (!open) onClose();
         }}
      >
         <DialogContent className="sm:min-w-2xl rounded-md p-4">
            {assessment && (
               <EvaluationFormContent
                  key={assessment.id}
                  assessment={assessment}
                  onClose={onClose}
                  onSuccess={onSuccess}
               />
            )}
         </DialogContent>
      </Dialog>
   );
}

export default RiskAssessmentEvaluationModal;
