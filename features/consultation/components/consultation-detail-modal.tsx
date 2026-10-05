"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/common/custom-button";
import { FormTextarea } from "@/components/common/form-textarea";
import { Consultation } from "@/store/api/consultation/type";
import {
   useGetConsultationByIdQuery,
   useConsultAndResponseMutation,
} from "@/store/api/consultation/consultation-api";
import { useGetExaminationByIdQuery } from "@/store/api/examination/examination-api";
import { formatDate } from "@/lib/utils";
import { CONSULTATION_STATUS_CONFIG } from "./consultation-table";
import { CloverLoading } from "@/components/common/clover-loading";
import {
   Activity,
   CheckCircle,
   FileText,
   Lock,
   Monitor,
   Stethoscope,
   User,
} from "lucide-react";

interface ConsultationDetailModalProps {
   open: boolean;
   consultation: Consultation | null;
   onClose: () => void;
   initialMode?: "view" | "edit";
}

export function ConsultationDetailModal({
   open,
   consultation,
   onClose,
   initialMode = "view",
}: ConsultationDetailModalProps) {
   if (!open || !consultation) return null;

   return (
      <ConsultationDetailModalContent
         key={`${consultation.id}-${initialMode}`}
         open={open}
         consultation={consultation}
         onClose={onClose}
         initialMode={initialMode}
      />
   );
}

interface ConsultationDetailModalContentProps {
   open: boolean;
   consultation: Consultation;
   onClose: () => void;
   initialMode?: "view" | "edit";
}

function ConsultationDetailModalContent({
   open,
   consultation,
   onClose,
   initialMode = "view",
}: ConsultationDetailModalContentProps) {
   const consultationId = consultation.id;

   // Lấy dữ liệu chi tiết mới nhất của phiếu hội chẩn
   const { data: detailData, isLoading: isLoadingDetail } =
      useGetConsultationByIdQuery(consultationId, {
         skip: !consultationId,
      });

   const current = detailData || consultation;

   // Lấy thông tin đợt khám liên quan nếu có
   const examinationId = current?.examinationId || "";
   const { data: examinationData } = useGetExaminationByIdQuery(examinationId, {
      skip: !examinationId,
   });

   const hasConclusion = Boolean(
      current.conclusion?.trim() ||
      consultation.conclusion?.trim() ||
      current.status === "COMPLETED",
   );

   const [conclusion, setConclusion] = useState(consultation.conclusion || "");
   const [isEditing, setIsEditing] = useState(
      !hasConclusion && (initialMode === "edit" || !consultation.conclusion),
   );
   const [consultAndResponse, { isLoading: isUpdating }] =
      useConsultAndResponseMutation();

   // Khi detailData tải xong, đồng bộ conclusion nếu ban đầu chưa có
   const [prevDetailConclusion, setPrevDetailConclusion] = useState<
      string | undefined
   >(consultation.conclusion);

   if (
      detailData?.conclusion &&
      prevDetailConclusion !== detailData.conclusion
   ) {
      setPrevDetailConclusion(detailData.conclusion);
      setConclusion(detailData.conclusion);
      setIsEditing(false);
   }

   const statusConfig = CONSULTATION_STATUS_CONFIG[current.status] || {
      label: current.status,
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-200",
   };

   const patient =
      current.healthProfile ||
      examinationData?.healthProfile ||
      current.examination?.healthProfile;

   const requestingDoctor =
      current.requestingDoctor ||
      examinationData?.doctor ||
      current.examination?.doctor;

   const handleSaveConclusion = async () => {
      if (hasConclusion) {
         toast.warn("Phiếu hội chẩn đã có kết luận, không thể sửa đổi.");
         return;
      }

      if (!conclusion.trim()) {
         toast.error("Vui lòng nhập kết luận hội chẩn");
         return;
      }

      try {
         await consultAndResponse({
            id: current.id,
            body: {
               conclusion: conclusion.trim(),
            },
         }).unwrap();

         toast.success("Cập nhật kết luận hội chẩn thành công!");
         setIsEditing(false);
         onClose();
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(
            error.data?.message || "Không thể cập nhật kết luận hội chẩn",
         );
      }
   };

   return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
         <DialogContent className="sm:min-w-2xl max-h-[90vh] flex flex-col p-5 gap-4 overflow-hidden rounded-lg">
            <DialogHeader className="gap-1 text-left shrink-0">
               <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                     <Monitor className="size-5 text-blue-600" />
                     <DialogTitle className="text-base font-semibold text-slate-900">
                        Phiếu hội chẩn:{" "}
                        {current.consultationCode || current.id.slice(0, 8)}
                     </DialogTitle>
                  </div>
                  <span
                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border || "border-slate-200"}`}
                  >
                     {statusConfig.label}
                  </span>
               </div>
               <DialogDescription className="text-xs text-slate-500">
                  Thời gian gửi yêu cầu:{" "}
                  <strong>
                     {formatDate(
                        current.requestedAt || current.createdAt,
                        true,
                     )}
                  </strong>
               </DialogDescription>
            </DialogHeader>

            {isLoadingDetail ? (
               <div className="h-48 flex items-center justify-center">
                  <CloverLoading
                     size="sm"
                     text="Đang tải thông tin chi tiết..."
                  />
               </div>
            ) : (
               <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                  {/* Bệnh nhân & Bác sĩ yêu cầu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/90">
                     <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                           <User className="size-3.5" />
                           <span>Thông tin bệnh nhân:</span>
                        </div>
                        <p className="font-semibold text-sm text-slate-900">
                           {patient?.fullName || "—"}
                        </p>
                        <div className="text-slate-600 flex items-center gap-2 flex-wrap text-[11px]">
                           {patient?.hospitalPatientCode && (
                              <span>Mã: {patient.hospitalPatientCode}</span>
                           )}
                           {patient?.phoneNumber && (
                              <span>• SĐT: {patient.phoneNumber}</span>
                           )}
                           {patient?.gender && <span>• {patient.gender}</span>}
                        </div>
                     </div>

                     <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                           <Stethoscope className="size-3.5 text-blue-600" />
                           <span>Bác sĩ gửi yêu cầu:</span>
                        </div>
                        <p className="font-semibold text-sm text-slate-900">
                           {requestingDoctor?.fullName || "Bác sĩ điều trị"}
                        </p>
                        {requestingDoctor?.staffCode && (
                           <p className="text-[11px] text-slate-500">
                              Mã nhân viên: {requestingDoctor.staffCode}
                           </p>
                        )}
                     </div>
                  </div>

                  {/* Thông tin đợt khám (Sinh hiệu, chẩn đoán) */}
                  {examinationData && (
                     <div className="p-3.5 rounded-lg border border-blue-100 bg-blue-50/40 space-y-2">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-900 text-xs">
                           <Activity className="size-3.5 text-blue-600" />
                           <span>Tình trạng đợt khám liên quan</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                           {examinationData.systolicBp &&
                              examinationData.diastolicBp && (
                                 <div className="p-2 bg-white rounded border border-blue-100/80">
                                    <span className="text-slate-500 block">
                                       Huyết áp
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                       {examinationData.systolicBp}/
                                       {examinationData.diastolicBp} mmHg
                                    </span>
                                 </div>
                              )}
                           {examinationData.heartRate && (
                              <div className="p-2 bg-white rounded border border-blue-100/80">
                                 <span className="text-slate-500 block">
                                    Nhịp tim
                                 </span>
                                 <span className="font-semibold text-slate-900">
                                    {examinationData.heartRate} bpm
                                 </span>
                              </div>
                           )}
                           {examinationData.temperature && (
                              <div className="p-2 bg-white rounded border border-blue-100/80">
                                 <span className="text-slate-500 block">
                                    Thân nhiệt
                                 </span>
                                 <span className="font-semibold text-slate-900">
                                    {examinationData.temperature} °C
                                 </span>
                              </div>
                           )}
                           {examinationData.spo2 && (
                              <div className="p-2 bg-white rounded border border-blue-100/80">
                                 <span className="text-slate-500 block">
                                    SpO2
                                 </span>
                                 <span className="font-semibold text-slate-900">
                                    {examinationData.spo2} %
                                 </span>
                              </div>
                           )}
                        </div>

                        {examinationData.diagnosis && (
                           <div className="pt-1">
                              <span className="text-slate-500 font-medium">
                                 Chẩn đoán:
                              </span>{" "}
                              <span className="font-semibold text-slate-900">
                                 {examinationData.diagnosis}
                              </span>
                           </div>
                        )}
                        {examinationData.clinicalSymptoms && (
                           <div>
                              <span className="text-slate-500 font-medium">
                                 Triệu chứng lâm sàng:
                              </span>{" "}
                              <span className="text-slate-700">
                                 {examinationData.clinicalSymptoms}
                              </span>
                           </div>
                        )}
                     </div>
                  )}

                  {/* Lý do hội chẩn */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1.5 shadow-2xs">
                     <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                        <FileText className="size-3.5 text-slate-500" />
                        <span>Lý do & Nội dung yêu cầu hội chẩn:</span>
                     </div>
                     <p className="text-slate-800 leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-blue-500 text-xs font-medium bg-slate-50/50 p-2.5 rounded-r">
                        {current.reason || "—"}
                     </p>
                  </div>

                  {/* Kết luận của Chuyên gia */}
                  <div className="p-3.5 rounded-lg border border-emerald-200/90 bg-emerald-50/30 space-y-2">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-900 text-xs">
                           <CheckCircle className="size-3.5 text-emerald-600" />
                           <span>Ý kiến & Kết luận của Chuyên gia:</span>
                        </div>
                        {hasConclusion && (
                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Lock className="size-3" />
                              Đã khóa
                           </span>
                        )}
                     </div>

                     {isEditing && !hasConclusion ? (
                        <div className="space-y-2 pt-1">
                           <FormTextarea
                              label="Nội dung kết luận & Hướng điều trị đề xuất"
                              name="conclusion"
                              placeholder="Nhập ý kiến chuyên môn, đánh giá nguy cơ, phác đồ điều trị đề xuất hoặc các lưu ý đặc biệt cho bệnh nhân..."
                              value={conclusion}
                              onChange={(e) => setConclusion(e.target.value)}
                              className="text-xs"
                              disabled={isUpdating}
                              rows={5}
                              required
                           />
                        </div>
                     ) : current.conclusion ? (
                        <div className="space-y-1">
                           <p className="text-slate-900 font-medium whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-emerald-200">
                              {current.conclusion}
                           </p>
                           {current.respondedAt && (
                              <p className="text-[11px] text-slate-500 text-right">
                                 Phản hồi lúc:{" "}
                                 {formatDate(current.respondedAt, true)}
                              </p>
                           )}
                        </div>
                     ) : (
                        <p className="text-slate-400 italic text-xs">
                           Chuyên gia chưa đưa ra kết luận.
                        </p>
                     )}
                  </div>
               </div>
            )}

            <DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2 shrink-0">
               <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isUpdating}
                  className="h-9 px-4 text-xs"
               >
                  Đóng
               </CustomButton>
               {isEditing && (
                  <CustomButton
                     type="button"
                     size="sm"
                     onClick={handleSaveConclusion}
                     isLoading={isUpdating}
                     loadingText="Đang lưu..."
                     disabled={!conclusion.trim()}
                     className="h-9 px-5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                     Lưu kết luận hội chẩn
                  </CustomButton>
               )}
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
