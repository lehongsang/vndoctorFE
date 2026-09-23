"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { RiskAssessmentResult } from "@/store/api/risk-factor-assessment/type";
import { useEvaluateRiskAssessmentMutation } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { FormTextarea } from "@/components/common/form-textarea";
import { CustomButton } from "@/components/common/custom-button";

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
   const [conclusion, setConclusion] = useState<string>(
      assessment.conclusion || "",
   );
   const [recommendations, setRecommendations] = useState<string>(
      assessment.recommendations || "",
   );
   const [errors, setErrors] = useState<{
      conclusion?: string;
      recommendations?: string;
   }>({});

   const [evaluateRiskAssessment, { isLoading: isEvaluating }] =
      useEvaluateRiskAssessmentMutation();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!assessment.id) return;

      const newErrors: { conclusion?: string; recommendations?: string } = {};
      if (!conclusion.trim()) {
         newErrors.conclusion = "Vui lòng nhập kết luận thẩm định";
      }
      if (!recommendations.trim()) {
         newErrors.recommendations =
            "Vui lòng nhập khuyến nghị / phác đồ điều trị";
      }

      if (Object.keys(newErrors).length > 0) {
         setErrors(newErrors);
         return;
      }

      try {
         const res = await evaluateRiskAssessment({
            id: assessment.id,
            data: {
               conclusion: conclusion.trim(),
               recommendations: recommendations.trim(),
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
            <DialogDescription className="text-xs text-slate-500">
               Bác sĩ ghi nhận kết luận thẩm định và khuyến nghị phác đồ điều
               trị vào hồ sơ bệnh nhân.
            </DialogDescription>
         </DialogHeader>

         {/* Thông tin tham khảo từ kết quả phân tầng hiện tại */}
         <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs mt-1">
            <div className="flex items-center gap-2">
               <span className="text-slate-500">Mức phân tầng:</span>
               <span className="font-semibold text-slate-800">
                  {assessment.riskLevel === "VERY_HIGH"
                     ? "Nguy cơ rất cao"
                     : assessment.riskLevel === "HIGH"
                       ? "Nguy cơ cao"
                       : "Nguy cơ thấp"}
               </span>
            </div>
            {assessment.riskScore !== undefined &&
               assessment.riskScore !== null && (
                  <div className="flex items-center gap-1.5">
                     <span className="text-slate-500">Điểm nguy cơ:</span>
                     <span className="font-bold text-primary">
                        {assessment.riskScore}%
                     </span>
                  </div>
               )}
         </div>

         <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            <FormTextarea
               label="Kết luận của bác sĩ thẩm định"
               required
               rows={3}
               value={conclusion}
               onChange={(e) => {
                  setConclusion(e.target.value);
                  if (errors.conclusion) {
                     setErrors((prev) => ({ ...prev, conclusion: undefined }));
                  }
               }}
               error={errors.conclusion}
               placeholder="Ví dụ: Bệnh nhân có nguy cơ tim mạch rất cao do tăng huyết áp kèm đái tháo đường và tổn thương cơ quan đích..."
            />

            <FormTextarea
               label="Khuyến nghị & Phác đồ điều trị"
               required
               rows={3}
               value={recommendations}
               onChange={(e) => {
                  setRecommendations(e.target.value);
                  if (errors.recommendations) {
                     setErrors((prev) => ({
                        ...prev,
                        recommendations: undefined,
                     }));
                  }
               }}
               error={errors.recommendations}
               placeholder="Ví dụ: Điều chỉnh lối sống, giảm muối, kiểm soát HbA1c < 7.0%, tái khám sau 1 tháng..."
            />

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
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
         <DialogContent className="sm:min-w-2xl rounded-md">
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
