"use client";

import React from "react";
import { CheckCircle2, ShieldAlert, UserCheck } from "lucide-react";
import { PatientVerificationResult } from "@/lib/ocr-verification";
import { cn } from "@/lib/utils";

interface PatientOcrVerificationBannerProps {
   verification: PatientVerificationResult | null;
   className?: string;
}

export function PatientOcrVerificationBanner({
   verification,
   className,
}: PatientOcrVerificationBannerProps) {
   if (!verification) return null;

   // 1. Trường hợp tạo mới và chưa có thông tin bệnh nhân để đối chiếu
   if (!verification.hasExpectedPatient) {
      return (
         <div
            className={cn(
               "p-3 rounded-sm border border-slate-200 bg-slate-50 text-xs text-slate-700 flex items-center justify-between gap-3 flex-wrap",
               className,
            )}
         >
            <div className="flex items-center gap-2">
               <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
               <span>
                  Bệnh nhân từ tài liệu:{" "}
                  <strong className="text-slate-900">
                     {verification.ocrName || "Chưa nhận diện"}
                  </strong>
                  {verification.ocrDobDisplay && (
                     <span className="text-slate-500">
                        {" "}
                        (Ngày sinh: {verification.ocrDobDisplay})
                     </span>
                  )}
               </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
               Tạo mới hồ sơ
            </span>
         </div>
      );
   }

   // 2. Trường hợp KHÔNG TRÙNG KHỚP (Cực kỳ quan trọng - Cảnh báo đỏ)
   if (!verification.isMatched) {
      return (
         <div
            className={cn(
               "p-3.5 sm:p-4 rounded-sm border-2 border-rose-400 bg-rose-50/90 text-rose-950 text-xs space-y-2.5 shadow-xs",
               className,
            )}
         >
            <div className="flex items-center justify-between gap-2 flex-wrap">
               <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-bold text-rose-700 text-sm">
                     CẢNH BÁO: THÔNG TIN BỆNH NHÂN KHÔNG TRÙNG KHỚP!
                  </span>
               </div>
               <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-rose-200 text-rose-800 border border-rose-300">
                  Chặn áp dụng
               </span>
            </div>

            <p className="text-slate-700 leading-relaxed">
               {verification.errorMessage ||
                  "Họ tên hoặc ngày sinh trong tài liệu OCR không khớp với bệnh nhân đang thao tác."}{" "}
               <span className="font-semibold text-rose-700">
                  Hệ thống không cho phép áp dụng dữ liệu này để tránh điền nhầm
                  hồ sơ giữa các bệnh nhân.
               </span>
            </p>

            {/* Bảng so sánh 2 bên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
               <div className="p-2.5 rounded bg-white border border-rose-200">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                     <span className="w-2 h-2 rounded-full bg-slate-400" />
                     Bệnh nhân hiện tại (Hệ thống)
                  </div>
                  <div className="mt-1.5 space-y-1">
                     <div>
                        <span className="text-slate-500">Họ và tên: </span>
                        <strong className="text-slate-900">
                           {verification.expectedName || "Chưa có"}
                        </strong>
                     </div>
                     <div>
                        <span className="text-slate-500">Ngày sinh: </span>
                        <strong className="text-slate-900">
                           {verification.expectedDobDisplay || "Chưa có"}
                        </strong>
                     </div>
                  </div>
               </div>

               <div className="p-2.5 rounded bg-white border border-rose-300">
                  <div className="font-bold text-rose-800 pb-1 border-b border-rose-100 flex items-center justify-between">
                     <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Tài liệu OCR bóc tách
                     </span>
                     <span className="text-[10px] text-rose-600 font-semibold">
                        Không khớp
                     </span>
                  </div>
                  <div className="mt-1.5 space-y-1">
                     <div>
                        <span className="text-slate-500">Họ và tên: </span>
                        <strong
                           className={cn(
                              verification.nameMatched
                                 ? "text-emerald-700"
                                 : "text-rose-700 underline font-bold",
                           )}
                        >
                           {verification.ocrName || "Không tìm thấy"}
                        </strong>
                     </div>
                     <div>
                        <span className="text-slate-500">Ngày sinh: </span>
                        <strong
                           className={cn(
                              verification.dobMatched
                                 ? "text-emerald-700"
                                 : "text-rose-700 underline font-bold",
                           )}
                        >
                           {verification.ocrDobDisplay || "Không tìm thấy"}
                        </strong>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   // 3. Trường hợp TRÙNG KHỚP HỢP LỆ (Xanh lá)
   return (
      <div
         className={cn(
            "p-3 rounded-sm border border-emerald-300 bg-emerald-50/80 text-emerald-950 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs",
            className,
         )}
      >
         <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-900">
               Xác thực bệnh nhân:
            </span>
            <span className="text-emerald-950 font-bold">
               {verification.expectedName}
            </span>
            {verification.expectedDobDisplay && (
               <span className="text-emerald-800">
                  ({verification.expectedDobDisplay})
               </span>
            )}
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-semibold border border-emerald-300">
               ✓ Trùng khớp
            </span>
         </div>
         <span className="text-[11px] text-emerald-700 font-medium">
            An toàn để áp dụng dữ liệu
         </span>
      </div>
   );
}
