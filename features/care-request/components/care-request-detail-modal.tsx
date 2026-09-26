"use client";

import React from "react";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { useGetDetailCareRequestQuery } from "@/store/api/care-request/care-request-api";
import { STATUS_MAP } from "./care-request-table";
import { formatDate } from "@/lib/utils";

interface CareRequestDetailModalProps {
   requestId: string | null;
   onClose: () => void;
   onReceive?: () => void;
   onResolve?: () => void;
}

export function CareRequestDetailModal({
   requestId,
   onClose,
   onReceive,
   onResolve,
}: CareRequestDetailModalProps) {
   const { data: detail, isLoading } = useGetDetailCareRequestQuery(
      requestId || "",
      { skip: !requestId }
   );

   if (!requestId) return null;

   const statusInfo = detail?.status ? STATUS_MAP[detail.status] : null;

   return (
      <Dialog open={Boolean(requestId)} onOpenChange={(open) => !open && onClose()}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader className="border-b pb-3">
               <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-base font-semibold text-slate-900">
                     Chi tiết yêu cầu chăm sóc
                  </DialogTitle>
                  {statusInfo && (
                     <span
                        className={`text-xs font-normal border px-2.5 py-0.5 rounded-sm ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                     >
                        {statusInfo.label}
                     </span>
                  )}
               </div>
            </DialogHeader>

            {isLoading ? (
               <div className="h-48 flex flex-col items-center justify-center gap-2">
                  <CloverLoading size="sm" />
                  <span className="text-xs text-slate-500">Đang tải thông tin chi tiết...</span>
               </div>
            ) : detail ? (
               <div className="space-y-4 text-sm text-slate-700">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md text-xs">
                     <div>
                        <span className="text-slate-500">Mã yêu cầu:</span>{" "}
                        <span className="font-semibold text-slate-900">
                           {detail.requestCode || "—"}
                        </span>
                     </div>
                     <div>
                        <span className="text-slate-500">Thời gian tạo:</span>{" "}
                        <span className="font-medium text-slate-900">
                           {detail.createdAt ? formatDate(detail.createdAt) : "—"}
                        </span>
                     </div>
                     {detail.subscription?.healthProfile && (
                        <div>
                           <span className="text-slate-500">Bệnh nhân:</span>{" "}
                           <span className="font-medium text-slate-900">
                              {detail.subscription.healthProfile.fullName}
                           </span>
                           {detail.subscription.healthProfile.phoneNumber && (
                              <span className="text-slate-500">
                                 {" "}
                                 ({detail.subscription.healthProfile.phoneNumber})
                              </span>
                           )}
                        </div>
                     )}
                     {detail.subscription?.carePackage && (
                        <div>
                           <span className="text-slate-500">Gói chăm sóc:</span>{" "}
                           <span className="font-medium text-slate-900">
                              {detail.subscription.carePackage.packageName}
                           </span>
                        </div>
                     )}
                     <div>
                        <span className="text-slate-500">Người tiếp nhận:</span>{" "}
                        <span className="font-medium text-slate-900">
                           {detail.assignedUser?.fullName || "Chưa tiếp nhận"}
                        </span>
                     </div>
                     {detail.resolvedAt && (
                        <div>
                           <span className="text-slate-500">Thời gian giải quyết:</span>{" "}
                           <span className="font-medium text-slate-900">
                              {formatDate(detail.resolvedAt)}
                           </span>
                        </div>
                     )}
                  </div>

                  <div>
                     <span className="text-xs font-semibold text-slate-500 block mb-1">
                        TIÊU ĐỀ YÊU CẦU
                     </span>
                     <p className="font-medium text-slate-900 bg-white p-2.5 rounded border text-sm">
                        {detail.title || "—"}
                     </p>
                  </div>

                  <div>
                     <span className="text-xs font-semibold text-slate-500 block mb-1">
                        MÔ TẢ CHI TIẾT
                     </span>
                     <div className="bg-slate-50 p-3 rounded border text-xs leading-relaxed whitespace-pre-wrap text-slate-800">
                        {detail.description || "Không có mô tả chi tiết"}
                     </div>
                  </div>

                  {detail.mediaUrls && detail.mediaUrls.length > 0 && (
                     <div>
                        <span className="text-xs font-semibold text-slate-500 block mb-1">
                           HÌNH ẢNH / TỆP ĐÍNH KÈM ({detail.mediaUrls.length})
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                           {detail.mediaUrls.map((url, idx) => (
                              <a
                                 key={idx}
                                 href={url}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="border rounded p-1 block hover:opacity-90 bg-slate-50"
                              >
                                 <img
                                    src={url}
                                    alt={`Attachment ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded"
                                    onError={(e) => {
                                       (e.target as HTMLElement).style.display = "none";
                                    }}
                                 />
                                 <span className="text-[11px] text-blue-600 block mt-1 truncate">
                                    Đính kèm #{idx + 1}
                                 </span>
                              </a>
                           ))}
                        </div>
                     </div>
                  )}

                  {detail.resolutionNote && (
                     <div>
                        <span className="text-xs font-semibold text-emerald-700 block mb-1">
                           KẾT QUẢ XỬ LÝ / GHI CHÚ
                        </span>
                        <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded text-xs text-emerald-950 whitespace-pre-wrap">
                           {detail.resolutionNote}
                        </div>
                     </div>
                  )}

                  <div className="pt-3 border-t flex justify-end gap-2">
                     <CustomButton
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="text-xs h-9 px-4"
                     >
                        Đóng
                     </CustomButton>

                     {detail.status === "PENDING" && onReceive && (
                        <CustomButton
                           size="sm"
                           onClick={() => {
                              onClose();
                              onReceive();
                           }}
                           className="text-xs h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                           Tiếp nhận yêu cầu
                        </CustomButton>
                     )}

                     {detail.status === "IN_PROGRESS" && onResolve && (
                        <CustomButton
                           size="sm"
                           onClick={() => {
                              onClose();
                              onResolve();
                           }}
                           className="text-xs h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                           Hoàn thành yêu cầu
                        </CustomButton>
                     )}
                  </div>
               </div>
            ) : (
               <div className="py-6 text-center text-xs text-slate-500">
                  Không tìm thấy thông tin chi tiết
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
}
