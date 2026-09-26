"use client";

import React from "react";
import { useGetDetailCareRequestQuery } from "@/store/api/care-request/care-request-api";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import { ArrowLeft } from "lucide-react";
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from "@/components/ui/accordion";
import { STATUS_CONFIG } from "./care-request-table";
import { formatDate } from "@/lib/utils";

interface CareRequestDetailViewProps {
   requestId: string;
   onClose: () => void;
   onReceive?: () => void;
   onResolve?: () => void;
   onCancel?: () => void;
}

const RowItem = ({
   label,
   value,
   className,
}: {
   label: string;
   value?: React.ReactNode;
   className?: string;
}) => (
   <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="text-sm font-medium text-slate-800 wrap-break-word">
         {value || "Chưa cập nhật"}
      </div>
   </div>
);

export function CareRequestDetailView({
   requestId,
   onClose,
   onReceive,
   onResolve,
   onCancel,
}: CareRequestDetailViewProps) {
   const { data: detail, isLoading, isFetching } = useGetDetailCareRequestQuery(
      requestId,
      { skip: !requestId }
   );

   if (isLoading || isFetching) {
      return (
         <div className="p-12 flex justify-center items-center bg-white rounded-xl border border-slate-200">
            <CloverLoading
               size="md"
               text="Đang tải thông tin chi tiết yêu cầu chăm sóc..."
            />
         </div>
      );
   }

   if (!detail) {
      return (
         <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            Không tìm thấy thông tin yêu cầu chăm sóc.
            <div className="mt-4">
               <CustomButton variant="outline" size="sm" onClick={onClose}>
                  Quay lại
               </CustomButton>
            </div>
         </div>
      );
   }

   const statusConfig = STATUS_CONFIG[detail.status] || {
      label: detail.status,
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
   };

   return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <CustomButton
                  size="sm"
                  onClick={onClose}
                  startIcon={<ArrowLeft className="w-4 h-4" />}
               >
                  Quay lại
               </CustomButton>
               <div>
                  <h2 className="text-base font-semibold text-slate-900">
                     Chi tiết yêu cầu: {detail.requestCode || detail.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                     Ngày tạo: {detail.createdAt ? formatDate(detail.createdAt, true) : "—"}
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2">
               {detail.status === "PENDING" && onReceive && (
                  <CustomButton
                     size="sm"
                     className="h-9 px-3 text-xs"
                     onClick={onReceive}
                  >
                     Tiếp nhận yêu cầu
                  </CustomButton>
               )}

               {detail.status === "IN_PROGRESS" && onResolve && (
                  <CustomButton
                     size="sm"
                     className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                     onClick={onResolve}
                  >
                     Hoàn thành
                  </CustomButton>
               )}

               {(detail.status === "PENDING" || detail.status === "IN_PROGRESS") && onCancel && (
                  <CustomButton
                     variant="outline"
                     size="sm"
                     className="h-9 px-3 text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                     onClick={onCancel}
                  >
                     Hủy yêu cầu
                  </CustomButton>
               )}
            </div>
         </div>

         <Accordion defaultValue={["item-1", "item-2", "item-3"]}>
            <AccordionItem value="item-1">
               <AccordionTrigger className="flex border rounded-none px-4 py-3 font-semibold text-sm">
                  Thông tin chung
               </AccordionTrigger>
               <AccordionContent>
                  <div className="flex flex-col gap-6 p-6 border rounded-sm shadow-sm bg-white">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-sm">
                        <RowItem label="Mã yêu cầu" value={detail.requestCode} />
                        <RowItem
                           label="Trạng thái"
                           value={
                              <span
                                 className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                              >
                                 {statusConfig.label}
                              </span>
                           }
                        />
                        <RowItem
                           label="Người tiếp nhận"
                           value={
                              detail.assignedUser?.fullName ? (
                                 <span>
                                    {detail.assignedUser.fullName}{" "}
                                    {detail.assignedUser.phoneNumber && (
                                       <span className="text-xs text-slate-500 font-normal">
                                          ({detail.assignedUser.phoneNumber})
                                       </span>
                                    )}
                                 </span>
                              ) : (
                                 "Chưa tiếp nhận"
                              )
                           }
                        />
                        <RowItem
                           label="Thời gian hoàn thành"
                           value={
                              detail.resolvedAt
                                 ? formatDate(detail.resolvedAt, true)
                                 : "Chưa hoàn thành"
                           }
                        />
                        {detail.subscription?.healthProfile && (
                           <>
                              <RowItem
                                 label="Bệnh nhân"
                                 value={detail.subscription.healthProfile.fullName}
                              />
                              <RowItem
                                 label="Số điện thoại"
                                 value={
                                    detail.subscription.healthProfile.phoneNumber ||
                                    "Chưa cập nhật"
                                 }
                              />
                           </>
                        )}
                        {detail.subscription?.carePackage && (
                           <RowItem
                              label="Gói chăm sóc liên kết"
                              value={detail.subscription.carePackage.packageName}
                           />
                        )}
                     </div>
                  </div>
               </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
               <AccordionTrigger className="flex border rounded-none px-4 py-3 font-semibold text-sm">
                  Nội dung yêu cầu từ bệnh nhân
               </AccordionTrigger>
               <AccordionContent>
                  <div className="flex flex-col gap-4 p-6 border rounded-sm shadow-sm bg-white">
                     <div>
                        <span className="text-xs font-medium text-slate-500 block mb-1">
                           Tiêu đề
                        </span>
                        <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-sm border">
                           {detail.title || "—"}
                        </div>
                     </div>

                     <div>
                        <span className="text-xs font-medium text-slate-500 block mb-1">
                           Mô tả chi tiết
                        </span>
                        <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-sm border whitespace-pre-wrap leading-relaxed">
                           {detail.description || "Không có mô tả chi tiết."}
                        </div>
                     </div>

                     {detail.mediaUrls && detail.mediaUrls.length > 0 && (
                        <div>
                           <span className="text-xs font-medium text-slate-500 block mb-2">
                              Tệp / Hình ảnh đính kèm ({detail.mediaUrls.length})
                           </span>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {detail.mediaUrls.map((url, idx) => (
                                 <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="border rounded-sm p-1.5 block hover:opacity-90 bg-slate-50 transition-opacity"
                                 >
                                    <img
                                       src={url}
                                       alt={`Tệp ${idx + 1}`}
                                       className="w-full h-32 object-cover rounded-sm"
                                       onError={(e) => {
                                          (e.target as HTMLElement).style.display = "none";
                                       }}
                                    />
                                    <span className="text-xs text-blue-700 block mt-1.5 truncate text-center font-medium underline">
                                       Xem tệp #{idx + 1}
                                    </span>
                                 </a>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </AccordionContent>
            </AccordionItem>

            {detail.resolutionNote && (
               <AccordionItem value="item-3">
                  <AccordionTrigger className="flex border rounded-none px-4 py-3 font-semibold text-sm">
                     Kết quả xử lý & Lời dặn
                  </AccordionTrigger>
                  <AccordionContent>
                     <div className="p-6 border rounded-sm shadow-sm bg-white">
                        <div className="p-4 rounded-sm bg-emerald-50/70 border border-emerald-200 text-sm text-emerald-950 whitespace-pre-wrap leading-relaxed">
                           {detail.resolutionNote}
                        </div>
                     </div>
                  </AccordionContent>
               </AccordionItem>
            )}
         </Accordion>
      </div>
   );
}

export default CareRequestDetailView;
