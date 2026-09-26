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
import {
   RiskLevelBadge,
   RISK_LEVEL_OPTIONS,
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
      if (!doctorNote.trim()) {
         newErrors.doctorNote =
            "Vui lòng nhập ghi chú / kết luận thẩm định của bác sĩ";
      }
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

         toast.success("Thẩm định và xác nhận phân tầng nguy cơ thành công!");
         onSuccess?.(res);
         onClose();
      } catch (error: unknown) {
         console.error("Failed to evaluate risk assessment:", error);
         const apiError = error as { data?: { message?: string } };
         toast.error(
            apiError?.data?.message || "Có lỗi xảy ra khi xác nhận thẩm định",
         );
      }
   };

   return (
      <>
         <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
               Thẩm định & Xác nhận phân tầng nguy cơ
            </DialogTitle>
         </DialogHeader>

         {/* Thông tin tham khảo từ kết quả phân tầng hiện tại */}
         <div className="flex items-center justify-between p-3.5 rounded-sm bg-slate-50 border border-slate-200 text-xs mt-1">
            <div className="flex items-center gap-2">
               <span className="text-slate-500">Mức phân tầng ban đầu:</span>
               <RiskLevelBadge level={assessment.riskLevel} />
            </div>
            {assessment.riskScore !== undefined &&
               assessment.riskScore !== null && (
                  <div className="flex items-center gap-1.5">
                     <span className="text-slate-500">
                        Nguy cơ biến cố trong 10 năm:
                     </span>
                     <span className="font-bold text-primary">
                        {assessment.riskScore}%
                     </span>
                  </div>
               )}
         </div>

         <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            <FormSelect
               label="Mức phân tầng thẩm định"
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
               label="Ghi chú & Kết luận của bác sĩ thẩm định"
               required
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
