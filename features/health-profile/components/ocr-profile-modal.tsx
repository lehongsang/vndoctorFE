"use client";

import React, { useState, useRef } from "react";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { CustomButton } from "@/components/common/custom-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CloverLoading } from "@/components/common/clover-loading";
import { useExtractOcrPdfMutation } from "@/store/api/ocr/ocr-api";
import {
   OcrPdfResponse,
   OcrMedicalRecordStructuredData,
   OcrMedicalRecordResult,
} from "@/store/api/ocr/type";
import { toast } from "react-toastify";
import {
   ScanLine,
   FileText,
   UploadCloud,
   CheckCircle2,
   RotateCcw,
   Trash2,
   Check,
   Sparkles,
   Upload,
} from "lucide-react";

export interface OcrProfileExtractedData {
   fullName?: string;
   dob?: string;
   gender?: "MALE" | "FEMALE" | "OTHER";
   citizenId?: string;
   phoneNumber?: string;
   address?: string;
   bloodType?: "UNKNOWN" | "A" | "B" | "AB" | "O";
   allergy?: string;
   medicalHistory?: string;
   isSmoking?: boolean;
   hasHypertension?: boolean;
   hasDyslipidemia?: boolean;
   hasDiabetes?: boolean;
}

interface OcrProfileModalProps {
   isOpen: boolean;
   onClose: () => void;
   onApply: (data: OcrProfileExtractedData) => void;
}

// Chuyển đổi định dạng ngày trả về từ OCR thành YYYY-MM-DD cho input type="date"
function parseOcrDateToInput(dateStr?: string | null): string {
   if (!dateStr) return "";
   const trimmed = dateStr.trim();
   // YYYY-MM-DD
   if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
   // DD/MM/YYYY hoặc DD-MM-YYYY hoặc DD.MM.YYYY
   const matchDmy = trimmed.match(
      /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
   );
   if (matchDmy) {
      const day = matchDmy[1].padStart(2, "0");
      const month = matchDmy[2].padStart(2, "0");
      const year = matchDmy[3];
      return `${year}-${month}-${day}`;
   }
   // Chỉ có năm YYYY -> mặc định YYYY-01-01
   if (/^\d{4}$/.test(trimmed)) {
      return `${trimmed}-01-01`;
   }
   // Chuỗi ISO có chữ T
   if (trimmed.includes("T")) {
      return trimmed.split("T")[0];
   }
   return "";
}

function parseOcrGender(
   genderStr?: string | null,
): "MALE" | "FEMALE" | "OTHER" {
   if (!genderStr) return "MALE";
   const lower = genderStr.toLowerCase().trim();
   if (lower.includes("nam") || lower === "male" || lower === "m")
      return "MALE";
   if (
      lower.includes("nữ") ||
      lower.includes("nu") ||
      lower === "female" ||
      lower === "f"
   )
      return "FEMALE";
   return "OTHER";
}

function parseOcrBloodType(
   bloodStr?: string | null,
): "UNKNOWN" | "A" | "B" | "AB" | "O" {
   if (!bloodStr) return "UNKNOWN";
   const upper = bloodStr.toUpperCase().trim();
   if (upper === "AB" || upper.includes("AB")) return "AB";
   if (upper === "A" || upper.includes("A")) return "A";
   if (upper === "B" || upper.includes("B")) return "B";
   if (upper === "O" || upper.includes("O")) return "O";
   return "UNKNOWN";
}

function parseOcrCitizenId(idStr?: string | null): string {
   if (!idStr) return "";
   const cleaned = idStr.replace(/\D/g, "");
   return cleaned.length === 12 ? cleaned : "";
}

function parseOcrPhone(phoneStr?: string | null): string {
   if (!phoneStr) return "";
   let cleaned = phoneStr.replace(/\D/g, "");
   if (cleaned.startsWith("84")) {
      cleaned = "0" + cleaned.slice(2);
   }
   if (/^(0[35789])[0-9]{8}$/.test(cleaned)) {
      return cleaned;
   }
   return "";
}

export function OcrProfileModal({
   isOpen,
   onClose,
   onApply,
}: OcrProfileModalProps) {
   // PDF / Bệnh án state
   const [pdfFile, setPdfFile] = useState<File | null>(null);

   // Kết quả trích xuất để người dùng xem và chỉnh sửa trước khi apply
   const [extractedData, setExtractedData] =
      useState<OcrProfileExtractedData | null>(null);

   const pdfInputRef = useRef<HTMLInputElement>(null);

   const [extractPdf, { isLoading: isPdfLoading }] = useExtractOcrPdfMutation();

   const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const validTypes = [
         "application/pdf",
         "image/png",
         "image/jpeg",
         "image/jpg",
         "image/webp",
      ];
      if (
         !validTypes.includes(file.type) &&
         !file.name.match(/\.(pdf|png|jpe?g|webp)$/i)
      ) {
         toast.error("Vui lòng chọn file PDF hoặc hình ảnh (PNG, JPG, WEBP)");
         return;
      }
      setPdfFile(file);
      setExtractedData(null);
   };

   const handleReset = () => {
      setPdfFile(null);
      setExtractedData(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
   };

   const handleExtractPdf = async () => {
      if (!pdfFile) {
         toast.error("Vui lòng chọn file hồ sơ hoặc bệnh án");
         return;
      }

      try {
         const response: OcrPdfResponse = await extractPdf({
            file: pdfFile,
            engine: "rapidocr",
            force_ocr: false,
            dpi: 150,
            lang: "vie+eng",
         }).unwrap();

         const dataObj = (response.data || response) as
            | (OcrMedicalRecordStructuredData & OcrMedicalRecordResult)
            | undefined;

         const caNhan =
            dataObj?.THONG_TIN_CA_NHAN || response.THONG_TIN_CA_NHAN;
         const lienHe =
            dataObj?.THONG_TIN_LIEN_HE_AND_DIA_CHI ||
            response.THONG_TIN_LIEN_HE_AND_DIA_CHI;
         const sucKhoe =
            dataObj?.CHI_SO_AND_TIEN_SU_SUC_KHOE ||
            response.CHI_SO_AND_TIEN_SU_SUC_KHOE;
         const sinhLy =
            dataObj?.A_CHI_SO_SINH_LY_CO_BAN ||
            response.A_CHI_SO_SINH_LY_CO_BAN;
         const benhManTinh =
            dataObj?.C_BENH_LY_MAN_TINH_KEM_THEO ||
            response.C_BENH_LY_MAN_TINH_KEM_THEO;
         const patient = dataObj?.patient || response.patient;

         const fullName = caNhan?.ho_va_ten || patient?.fullName || "";
         const dob = parseOcrDateToInput(
            caNhan?.ngay_sinh || patient?.dob || "",
         );
         const gender = parseOcrGender(
            caNhan?.gioi_tinh || sinhLy?.gioi_tinh || patient?.gender || "",
         );
         const citizenId = parseOcrCitizenId(
            caNhan?.cccd_cmnd || patient?.citizenId || "",
         );
         const phoneNumber = parseOcrPhone(
            lienHe?.so_dien_thoai || patient?.phoneNumber || "",
         );
         const address = lienHe?.dia_chi_day_du || patient?.address || "";
         const bloodType = parseOcrBloodType(sucKhoe?.nhom_mau || "");
         const medicalHistory = sucKhoe?.tien_su_benh_ly || "";

         const isSmoking =
            typeof sinhLy?.hut_thuoc_la === "boolean"
               ? sinhLy.hut_thuoc_la
               : undefined;
         const hasDiabetes =
            typeof benhManTinh?.dai_thao_duong === "boolean"
               ? benhManTinh.dai_thao_duong
               : undefined;

         let hasHypertension: boolean | undefined = undefined;
         if (
            sinhLy?.huyet_ap_tam_thu_sbp &&
            sinhLy.huyet_ap_tam_thu_sbp >= 140
         ) {
            hasHypertension = true;
         }

         let hasDyslipidemia: boolean | undefined = undefined;
         if (
            sinhLy?.cholesterol_toan_phan &&
            sinhLy.cholesterol_toan_phan > 5.2
         ) {
            hasDyslipidemia = true;
         }

         const parsed: OcrProfileExtractedData = {
            fullName: fullName.trim(),
            dob,
            gender,
            citizenId,
            phoneNumber,
            address: address.trim(),
            bloodType,
            medicalHistory: medicalHistory.trim(),
            isSmoking,
            hasHypertension,
            hasDyslipidemia,
            hasDiabetes,
         };

         setExtractedData(parsed);
         toast.success("Bóc tách thông tin hồ sơ bệnh án thành công!");
      } catch (err: unknown) {
         const errorObj = err as { data?: { message?: string } };
         toast.error(
            errorObj?.data?.message ||
               "Lỗi khi trích xuất dữ liệu từ hồ sơ bệnh án.",
         );
      }
   };

   const handleApply = () => {
      if (!extractedData) return;
      onApply(extractedData);
      toast.success("Đã điền thông tin trích xuất vào hồ sơ thành công!");
      onClose();
   };

   return (
      <Dialog
         open={isOpen}
         onOpenChange={(open) => {
            if (!open) {
               handleReset();
               onClose();
            }
         }}
      >
         <DialogContent className="sm:min-w-4xl p-0 rounded-sm gap-0 overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200">
               <div className="flex items-center gap-2">
                  <div>
                     <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <span>OCR Bóc Tách Hồ Sơ Bệnh Án</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                           <Sparkles className="w-2.5 h-2.5" /> AI OCR
                        </span>
                     </DialogTitle>
                     <DialogDescription className="text-xs text-slate-500 mt-0.5">
                        Tải tệp PDF hoặc ảnh scan hồ sơ bệnh án để tự động trích
                        xuất và điền nhanh thông tin
                     </DialogDescription>
                  </div>
               </div>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
               <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Khu vực chọn file Hồ sơ bệnh án */}
                  <div className="space-y-3">
                     <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handlePdfChange}
                     />

                     {pdfFile ? (
                        <div className="border border-emerald-300 bg-emerald-50/50 rounded-sm p-4 flex items-center justify-between gap-3">
                           <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-sm bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                 <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                 <p className="font-semibold text-slate-800 text-xs truncate">
                                    {pdfFile.name}
                                 </p>
                                 <p className="text-[11px] text-slate-500">
                                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                    • {pdfFile.type || "Tài liệu y tế"}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-1.5 shrink-0">
                              <CustomButton
                                 type="button"
                                 size="xs"
                                 onClick={() => pdfInputRef.current?.click()}
                                 className="text-[11px] h-8"
                              >
                                 Đổi tệp
                              </CustomButton>
                              <CustomButton
                                 type="button"
                                 size="xs"
                                 variant="destructive"
                                 onClick={() => {
                                    setPdfFile(null);
                                    if (pdfInputRef.current)
                                       pdfInputRef.current.value = "";
                                 }}
                                 className="text-[11px] h-8"
                              >
                                 <Trash2 className="w-3 h-3" />
                              </CustomButton>
                           </div>
                        </div>
                     ) : (
                        <div
                           onClick={() => pdfInputRef.current?.click()}
                           className="border-2 border-dashed border-slate-300 hover:border-primary/60 hover:bg-primary/5 rounded-sm p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5"
                        >
                           <Upload className="w-8 h-8 text-slate-400 mb-1" />
                           <p className="text-xs font-semibold text-slate-700">
                              Nhấp để chọn file Hồ sơ bệnh án
                           </p>
                           <p className="text-[11px] text-slate-400">
                              Hỗ trợ định dạng PDF hoặc ảnh scan phiếu khám
                              (PNG, JPG, WEBP)
                           </p>
                        </div>
                     )}

                     <div className="flex justify-end pt-1">
                        <CustomButton
                           type="button"
                           onClick={handleExtractPdf}
                           isLoading={isPdfLoading}
                           disabled={!pdfFile || isPdfLoading}
                           size="sm"
                           className="gap-1.5 shadow-2xs font-semibold cursor-pointer"
                        >
                           {isPdfLoading ? (
                              <>
                                 <span>Đang phân tích tài liệu...</span>
                              </>
                           ) : (
                              <>
                                 <span>Bắt đầu bóc tách Bệnh án</span>
                              </>
                           )}
                        </CustomButton>
                     </div>
                  </div>

                  {/* Khu vực hiển thị kết quả trích xuất */}
                  {extractedData && (
                     <div className="border border-blue-200 bg-blue-50/40 rounded-sm p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                           <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Kết quả trích xuất được</span>
                           </div>
                           <span className="text-[10px] text-slate-500 font-medium">
                              Kiểm tra thông tin trước khi áp dụng
                           </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                           <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">
                                 Họ và tên
                              </span>
                              <input
                                 type="text"
                                 value={extractedData.fullName || ""}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       fullName: e.target.value,
                                    })
                                 }
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5"
                                 placeholder="Chưa có dữ liệu"
                              />
                           </div>

                           <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">
                                 Ngày sinh
                              </span>
                              <input
                                 type="date"
                                 value={extractedData.dob || ""}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       dob: e.target.value,
                                    })
                                 }
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5"
                              />
                           </div>

                           <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">
                                 Giới tính
                              </span>
                              <select
                                 value={extractedData.gender || "MALE"}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       gender: e.target.value as
                                          | "MALE"
                                          | "FEMALE"
                                          | "OTHER",
                                    })
                                 }
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none pt-0.5 cursor-pointer"
                              >
                                 <option value="MALE">Nam</option>
                                 <option value="FEMALE">Nữ</option>
                                 <option value="OTHER">Khác</option>
                              </select>
                           </div>

                           <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">
                                 Số CCCD (12 chữ số)
                              </span>
                              <input
                                 type="text"
                                 value={extractedData.citizenId || ""}
                                 maxLength={12}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       citizenId: e.target.value,
                                    })
                                 }
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5 font-mono"
                                 placeholder="Chưa có dữ liệu"
                              />
                           </div>

                           <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">
                                 Số điện thoại
                              </span>
                              <input
                                 type="text"
                                 value={extractedData.phoneNumber || ""}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       phoneNumber: e.target.value,
                                    })
                                 }
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5"
                                 placeholder="Chưa có dữ liệu"
                              />
                           </div>

                           <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                              <span className="text-slate-400 text-[10px] block">
                                 Nhóm máu
                              </span>
                              <select
                                 value={extractedData.bloodType || "UNKNOWN"}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       bloodType: e.target.value as
                                          | "UNKNOWN"
                                          | "A"
                                          | "B"
                                          | "AB"
                                          | "O",
                                    })
                                 }
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none pt-0.5 cursor-pointer"
                              >
                                 <option value="UNKNOWN">Chưa xác định</option>
                                 <option value="A">Nhóm máu A</option>
                                 <option value="B">Nhóm máu B</option>
                                 <option value="AB">Nhóm máu AB</option>
                                 <option value="O">Nhóm máu O</option>
                              </select>
                           </div>

                           <div className="bg-white p-2.5 rounded-sm border border-slate-200 sm:col-span-2">
                              <span className="text-slate-400 text-[10px] block">
                                 Địa chỉ thường trú
                              </span>
                              <input
                                 type="text"
                                 value={extractedData.address || ""}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       address: e.target.value,
                                    })
                                 }
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5"
                                 placeholder="Chưa có dữ liệu địa chỉ"
                              />
                           </div>

                           <div className="bg-white p-2.5 rounded-sm border border-slate-200 sm:col-span-2">
                              <span className="text-slate-400 text-[10px] block">
                                 Tiền sử bệnh lý
                              </span>
                              <input
                                 type="text"
                                 value={extractedData.medicalHistory || ""}
                                 onChange={(e) =>
                                    setExtractedData({
                                       ...extractedData,
                                       medicalHistory: e.target.value,
                                    })
                                 }
                                 placeholder="Chưa có thông tin tiền sử"
                                 className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5"
                              />
                           </div>
                        </div>

                        {/* Các cờ bệnh lý nền nếu có */}
                        {(extractedData.isSmoking !== undefined ||
                           extractedData.hasHypertension !== undefined ||
                           extractedData.hasDiabetes !== undefined ||
                           extractedData.hasDyslipidemia !== undefined) && (
                           <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                              <span className="text-slate-400 text-[10px] block mb-1">
                                 Tình trạng sức khỏe & Yếu tố nguy cơ ghi nhận:
                              </span>
                              <div className="flex flex-wrap gap-2 text-[11px]">
                                 {extractedData.isSmoking && (
                                    <span className="px-2 py-0.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                       Hút thuốc lá
                                    </span>
                                 )}
                                 {extractedData.hasHypertension && (
                                    <span className="px-2 py-0.5 rounded-sm bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                                       Tăng huyết áp
                                    </span>
                                 )}
                                 {extractedData.hasDiabetes && (
                                    <span className="px-2 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                                       Đái tháo đường
                                    </span>
                                 )}
                                 {extractedData.hasDyslipidemia && (
                                    <span className="px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                       Rối loạn lipid máu
                                    </span>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </ScrollArea>

            {/* Footer hành động */}
            <div className="p-3 sm:px-5 sm:py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
               <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
               >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
               </CustomButton>

               <CustomButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onClose}
                  className="w-20"
               >
                  Đóng
               </CustomButton>

               <CustomButton
                  type="button"
                  size="sm"
                  disabled={!extractedData}
                  onClick={handleApply}
               >
                  <span>Áp dụng vào hồ sơ</span>
               </CustomButton>
            </div>
         </DialogContent>
      </Dialog>
   );
}
