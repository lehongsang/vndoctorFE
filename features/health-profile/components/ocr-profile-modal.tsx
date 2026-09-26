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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useExtractOcrPdfMutation } from "@/store/api/ocr/ocr-api";
import {
   OcrEngine,
   OcrPdfResponse,
   OcrMedicalRecordStructuredData,
} from "@/store/api/ocr/type";
import { toast } from "react-toastify";
import { FileText, CheckCircle2, AlertCircle, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OcrProfileExtractedData {
   fullName?: string;
   dob?: string;
   gender?: "MALE" | "FEMALE" | "OTHER";
   citizenId?: string;
   phoneNumber?: string;
   address?: string;
   bloodType?: "UNKNOWN" | "A" | "B" | "AB" | "O";
   height?: number;
   weight?: number;
   allergy?: string;
   medicalHistory?: string;
   isSmoking?: boolean;
   hasHypertension?: boolean;
   hasDyslipidemia?: boolean;
   hasDiabetes?: boolean;
   hasStroke?: boolean;
   hasMyocardialInfarction?: boolean;
   hasAcuteCoronarySyndrome?: boolean;
   hasCoronaryArteryDisease?: boolean;
   hasTia?: boolean;
   hasAorticAneurysm?: boolean;
   hasPeripheralArteryDisease?: boolean;
   hasAtherosclerosis?: boolean;
   hasFamilialHypercholesterolemia?: boolean;
}

interface OcrProfileModalProps {
   isOpen: boolean;
   onClose: () => void;
   onApply: (data: OcrProfileExtractedData) => void;
}

type TabType = "profile" | "diseases" | "json";

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
   const [file, setFile] = useState<File | null>(null);
   const [engine, setEngine] = useState<OcrEngine>("rapidocr");
   const [forceOcr, setForceOcr] = useState<boolean>(false);
   const [activeTab, setActiveTab] = useState<TabType>("profile");
   const [result, setResult] = useState<OcrPdfResponse | null>(null);
   const [extractedData, setExtractedData] =
      useState<OcrProfileExtractedData | null>(null);

   const fileInputRef = useRef<HTMLInputElement>(null);
   const [extractOcr, { isLoading }] = useExtractOcrPdfMutation();

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;

      const validTypes = [
         "application/pdf",
         "image/png",
         "image/jpeg",
         "image/jpg",
         "image/webp",
      ];
      if (
         !validTypes.includes(selected.type) &&
         !selected.name.match(/\.(pdf|png|jpe?g|webp)$/i)
      ) {
         toast.error("Vui lòng chọn file PDF hoặc hình ảnh (PNG, JPG, WEBP)");
         return;
      }

      setFile(selected);
      setResult(null);
      setExtractedData(null);
   };

   const handleReset = () => {
      setFile(null);
      setResult(null);
      setExtractedData(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   };

   const handleExtract = async () => {
      if (!file) {
         toast.error("Vui lòng chọn file tài liệu trước");
         return;
      }

      try {
         const response: OcrPdfResponse = await extractOcr({
            file,
            engine,
            force_ocr: forceOcr,
            dpi: 150,
            lang: "vie+eng",
         }).unwrap();

         setResult(response);

         // Chuẩn cấu trúc từ backend OCR vndoctor (tương tự ocr-medical-record-modal)
         const dataObj = (response.data || response) as
            | OcrMedicalRecordStructuredData
            | undefined;

         const sinhLy = dataObj?.A_CHI_SO_SINH_LY_CO_BAN;
         const benhManTinh = dataObj?.C_BENH_LY_MAN_TINH_KEM_THEO;
         const caNhan = dataObj?.THONG_TIN_CA_NHAN;
         const lienHe = dataObj?.THONG_TIN_LIEN_HE_AND_DIA_CHI;
         const sucKhoe = dataObj?.CHI_SO_AND_TIEN_SU_SUC_KHOE;

         const fullName = caNhan?.ho_va_ten ?? "";
         const dob = parseOcrDateToInput(caNhan?.ngay_sinh ?? "");
         const gender = parseOcrGender(
            caNhan?.gioi_tinh ?? sinhLy?.gioi_tinh ?? "",
         );
         const citizenId = parseOcrCitizenId(caNhan?.cccd_cmnd ?? "");
         const phoneNumber = parseOcrPhone(lienHe?.so_dien_thoai ?? "");
         const address = lienHe?.dia_chi_day_du ?? "";
         const bloodType = parseOcrBloodType(sucKhoe?.nhom_mau ?? "");
         const height =
            sucKhoe?.chieu_cao != null ? Number(sucKhoe.chieu_cao) : undefined;
         const weight =
            sucKhoe?.can_nang != null ? Number(sucKhoe.can_nang) : undefined;
         const medicalHistory = sucKhoe?.tien_su_benh_ly ?? "";

         // Yếu tố nguy cơ
         const isSmoking =
            typeof sinhLy?.hut_thuoc_la === "boolean"
               ? sinhLy.hut_thuoc_la
               : undefined;

         const hasDiabetes =
            typeof benhManTinh?.dai_thao_duong === "boolean"
               ? benhManTinh.dai_thao_duong
               : undefined;

         // Tăng huyết áp: SBP >= 140 hoặc keyword từ tiền sử
         let hasHypertension: boolean | undefined = undefined;
         if (sinhLy?.huyet_ap_tam_thu_sbp != null) {
            hasHypertension = sinhLy.huyet_ap_tam_thu_sbp >= 140;
         } else if (medicalHistory) {
            const lowerHistory = medicalHistory.toLowerCase();
            if (
               lowerHistory.includes("tăng huyết áp") ||
               lowerHistory.includes("high blood pressure") ||
               lowerHistory.includes("hypertension")
            ) {
               hasHypertension = true;
            }
         }

         // Rối loạn lipid máu: cholesterol toàn phần > 5.2 hoặc keyword từ tiền sử
         let hasDyslipidemia: boolean | undefined = undefined;
         if (sinhLy?.cholesterol_toan_phan != null) {
            hasDyslipidemia = sinhLy.cholesterol_toan_phan > 5.2;
         } else if (medicalHistory) {
            const lowerHistory = medicalHistory.toLowerCase();
            if (
               lowerHistory.includes("rối loạn lipid") ||
               lowerHistory.includes("rối loạn chuyển hóa lipid") ||
               lowerHistory.includes("mỡ máu") ||
               lowerHistory.includes("dyslipidemia") ||
               lowerHistory.includes("cholesterol")
            ) {
               hasDyslipidemia = true;
            }
         }

         // Bệnh lý tim mạch mạn tính từ C_BENH_LY_MAN_TINH_KEM_THEO
         const hasCoronaryArteryDisease =
            typeof benhManTinh?.benh_ly_mach_vanh === "boolean"
               ? benhManTinh.benh_ly_mach_vanh
               : undefined;
         const hasMyocardialInfarction =
            typeof benhManTinh?.nhoi_mau_co_tim === "boolean"
               ? benhManTinh.nhoi_mau_co_tim
               : undefined;
         const hasAcuteCoronarySyndrome =
            typeof benhManTinh?.hoi_chung_vanh_cap === "boolean"
               ? benhManTinh.hoi_chung_vanh_cap
               : undefined;
         const hasStroke =
            typeof benhManTinh?.dot_quy_nao === "boolean"
               ? benhManTinh.dot_quy_nao
               : undefined;
         const hasTia =
            typeof benhManTinh?.thieu_mau_cuc_bo_nao_thoang_qua_tia ===
            "boolean"
               ? benhManTinh.thieu_mau_cuc_bo_nao_thoang_qua_tia
               : undefined;
         const hasAtherosclerosis =
            typeof benhManTinh?.vua_xo_mach_mau === "boolean"
               ? benhManTinh.vua_xo_mach_mau
               : undefined;
         const hasAorticAneurysm =
            typeof benhManTinh?.phinh_dong_mach_chu === "boolean"
               ? benhManTinh.phinh_dong_mach_chu
               : undefined;
         const hasPeripheralArteryDisease =
            typeof benhManTinh?.benh_mach_mau_ngoai_vi === "boolean"
               ? benhManTinh.benh_mach_mau_ngoai_vi
               : undefined;
         const hasFamilialHypercholesterolemia =
            typeof benhManTinh?.tang_cholesterol_mau_gia_dinh === "boolean"
               ? benhManTinh.tang_cholesterol_mau_gia_dinh
               : undefined;

         const parsed: OcrProfileExtractedData = {
            fullName: fullName.trim(),
            dob,
            gender,
            citizenId,
            phoneNumber,
            address: address.trim(),
            bloodType,
            height,
            weight,
            medicalHistory: medicalHistory.trim(),
            isSmoking,
            hasHypertension,
            hasDyslipidemia,
            hasDiabetes,
            hasCoronaryArteryDisease,
            hasMyocardialInfarction,
            hasAcuteCoronarySyndrome,
            hasStroke,
            hasTia,
            hasAtherosclerosis,
            hasAorticAneurysm,
            hasPeripheralArteryDisease,
            hasFamilialHypercholesterolemia,
         };

         setExtractedData(parsed);
         toast.success("Trích xuất hồ sơ bệnh án thành công!");
      } catch (err: unknown) {
         const errorObj = err as { data?: { message?: string } };
         toast.error(
            errorObj?.data?.message || "Lỗi khi trích xuất dữ liệu từ tài liệu",
         );
      }
   };

   // Đếm số trường thông tin hợp lệ trích xuất được
   const getApplicableCount = (): number => {
      if (!extractedData) return 0;
      let count = 0;
      if (extractedData.fullName) count++;
      if (extractedData.dob) count++;
      if (extractedData.gender) count++;
      if (extractedData.citizenId) count++;
      if (extractedData.phoneNumber) count++;
      if (extractedData.address) count++;
      if (extractedData.bloodType && extractedData.bloodType !== "UNKNOWN")
         count++;
      if (typeof extractedData.height === "number" && extractedData.height > 0)
         count++;
      if (typeof extractedData.weight === "number" && extractedData.weight > 0)
         count++;
      if (extractedData.medicalHistory) count++;
      if (typeof extractedData.isSmoking === "boolean") count++;
      if (typeof extractedData.hasHypertension === "boolean") count++;
      if (typeof extractedData.hasDyslipidemia === "boolean") count++;
      if (typeof extractedData.hasDiabetes === "boolean") count++;
      if (typeof extractedData.hasCoronaryArteryDisease === "boolean") count++;
      if (typeof extractedData.hasMyocardialInfarction === "boolean") count++;
      if (typeof extractedData.hasAcuteCoronarySyndrome === "boolean") count++;
      if (typeof extractedData.hasStroke === "boolean") count++;
      if (typeof extractedData.hasTia === "boolean") count++;
      if (typeof extractedData.hasAtherosclerosis === "boolean") count++;
      if (typeof extractedData.hasAorticAneurysm === "boolean") count++;
      if (typeof extractedData.hasPeripheralArteryDisease === "boolean")
         count++;
      if (typeof extractedData.hasFamilialHypercholesterolemia === "boolean")
         count++;
      return count;
   };

   const applicableCount = getApplicableCount();

   const handleApply = () => {
      if (!extractedData) return;
      onApply(extractedData);
      toast.success("Đã điền thông tin trích xuất vào hồ sơ thành công!");
      onClose();
   };

   const dataObj = (result?.data || result) as
      | OcrMedicalRecordStructuredData
      | undefined;
   const phanLoai = dataObj?.PHAN_LOAI_BENH_LY_NEN;
   const caNhan = dataObj?.THONG_TIN_CA_NHAN;

   // Danh sách các bệnh lý mạn tính hiển thị toggle
   const chronicDiseasesList = [
      {
         key: "hasCoronaryArteryDisease" as const,
         label: "Bệnh lý mạch vành",
      },
      {
         key: "hasMyocardialInfarction" as const,
         label: "Nhồi máu cơ tim",
      },
      {
         key: "hasAcuteCoronarySyndrome" as const,
         label: "Hội chứng vành cấp",
      },
      {
         key: "hasStroke" as const,
         label: "Đột quỵ",
      },
      {
         key: "hasTia" as const,
         label: "Thiếu máu não thoáng qua (TIA)",
      },
      {
         key: "hasAtherosclerosis" as const,
         label: "Vữa xơ mạch máu",
      },
      {
         key: "hasAorticAneurysm" as const,
         label: "Phình động mạch chủ",
      },
      {
         key: "hasPeripheralArteryDisease" as const,
         label: "Bệnh mạch máu ngoại vi",
      },
      {
         key: "hasFamilialHypercholesterolemia" as const,
         label: "Tăng Cholesterol máu gia đình",
      },
   ];

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
         <DialogContent className="sm:min-w-4xl rounded-sm p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200">
               <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                     OCR Trích xuất Hồ sơ Sức khỏe
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                     Bóc tách thông tin cá nhân, thể trạng, tiền sử bệnh án và
                     các yếu tố nguy cơ từ tài liệu PDF hoặc ảnh scan
                  </DialogDescription>
               </div>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
               <div className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Khu vực chọn file & cấu hình nhận diện */}
                  {!result ? (
                     <div className="space-y-4">
                        <div
                           onClick={() => fileInputRef.current?.click()}
                           className={cn(
                              "border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2",
                              file
                                 ? "border-emerald-400 bg-emerald-50/40"
                                 : "border-slate-300 hover:border-slate-400 bg-slate-50/60",
                           )}
                        >
                           <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                              className="hidden"
                              onChange={handleFileSelect}
                           />

                           {file ? (
                              <>
                                 <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                                    <FileText className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <p className="font-semibold text-slate-800 text-sm">
                                       {file.name}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                       {(file.size / 1024 / 1024).toFixed(2)} MB
                                       • {file.type || "Tài liệu y tế"}
                                    </p>
                                 </div>
                                 <CustomButton
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleReset();
                                    }}
                                    className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 mt-1"
                                 >
                                    <X className="w-3.5 h-3.5 mr-1" />
                                    Chọn file khác
                                 </CustomButton>
                              </>
                           ) : (
                              <div className="py-15">
                                 <p className="font-semibold text-slate-800 text-sm">
                                    Kéo thả hoặc nhấn để tải lên tài liệu
                                 </p>
                                 <p className="text-slate-500 text-xs mt-0.5">
                                    Hỗ trợ định dạng PDF hoặc ảnh chụp (PNG,
                                    JPG, JPEG, WEBP)
                                 </p>
                              </div>
                           )}
                        </div>

                        {/* Tuỳ chọn công nghệ OCR */}
                        <div className="p-3.5 rounded-sm border border-slate-200 bg-slate-50/50 space-y-3">
                           <div className="font-semibold text-slate-800 text-xs">
                              Cấu hình công nghệ OCR
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                 <Label className="text-slate-600 block mb-1 text-[11px]">
                                    Engine nhận diện
                                 </Label>
                                 <select
                                    value={engine}
                                    onChange={(e) =>
                                       setEngine(e.target.value as OcrEngine)
                                    }
                                    className="w-full h-8 px-2 rounded border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none"
                                 >
                                    <option value="rapidocr">
                                       RapidOCR (Khuyên dùng - Nhanh & Chính
                                       xác)
                                    </option>
                                    <option value="tesseract">
                                       Tesseract OCR (Đa ngữ)
                                    </option>
                                 </select>
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                 <Checkbox
                                    id="force_ocr_profile"
                                    checked={forceOcr}
                                    onCheckedChange={(checked) =>
                                       setForceOcr(Boolean(checked))
                                    }
                                 />
                                 <Label
                                    htmlFor="force_ocr_profile"
                                    className="text-xs text-slate-700 cursor-pointer"
                                 >
                                    Bắt buộc render ảnh và chạy OCR (Dành cho
                                    PDF scan)
                                 </Label>
                              </div>
                           </div>
                        </div>

                        {/* Nút thực hiện */}
                        <div className="flex justify-end gap-2 pt-2">
                           <CustomButton
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={onClose}
                              className="w-20"
                           >
                              Hủy bỏ
                           </CustomButton>

                           <CustomButton
                              type="button"
                              size="sm"
                              disabled={!file || isLoading}
                              isLoading={isLoading}
                              onClick={handleExtract}
                           >
                              Bắt đầu phân tích
                           </CustomButton>
                        </div>
                     </div>
                  ) : (
                     /* Hiển thị kết quả bóc tách */
                     <div className="space-y-4">
                        {/* Header thông tin bệnh nhân tóm tắt */}
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-sm flex flex-wrap items-center justify-between gap-3">
                           <div className="flex items-center gap-2 flex-wrap">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-emerald-950 text-xs">
                                 Bệnh nhân:
                              </span>
                              <span className="text-emerald-900 font-bold text-sm">
                                 {extractedData?.fullName ||
                                    caNhan?.ho_va_ten ||
                                    file?.name}
                              </span>
                              {phanLoai?.has_underlying_disease && (
                                 <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                                    Có bệnh nền
                                 </span>
                              )}
                           </div>

                           <CustomButton
                              type="button"
                              size="sm"
                              onClick={handleReset}
                              className="h-7 text-[11px]"
                           >
                              Tải tài liệu khác
                           </CustomButton>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-1">
                           <CustomButton
                              type="button"
                              onClick={() => setActiveTab("profile")}
                              variant={
                                 activeTab === "profile" ? "default" : "outline"
                              }
                              className="px-3 py-1.5"
                           >
                              Thông tin hồ sơ & Tiền sử
                           </CustomButton>

                           <CustomButton
                              type="button"
                              onClick={() => setActiveTab("diseases")}
                              variant={
                                 activeTab === "diseases"
                                    ? "default"
                                    : "outline"
                              }
                              className="px-3 py-1.5"
                           >
                              Bệnh lý & Yếu tố nguy cơ
                           </CustomButton>

                           <CustomButton
                              type="button"
                              onClick={() => setActiveTab("json")}
                              variant={
                                 activeTab === "json" ? "default" : "outline"
                              }
                              className="px-3 py-1.5"
                           >
                              Dữ liệu JSON gốc
                           </CustomButton>
                        </div>

                        {/* Tab 1: Thông tin hồ sơ & Tiền sử */}
                        {activeTab === "profile" && extractedData && (
                           <div className="space-y-4">
                              {/* Khối 1: Thông tin hành chính */}
                              <div className="p-3.5 bg-slate-50/70 rounded-sm border border-slate-200 space-y-3">
                                 <div className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 text-sm flex items-center justify-between">
                                    <span>Thông tin hành chính</span>
                                    <span className="text-[11px] font-normal text-slate-400">
                                       Có thể chỉnh sửa trực tiếp trước khi áp
                                       dụng
                                    </span>
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                                       <span className="text-slate-500 text-[11px] block">
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
                                       <span className="text-slate-500 text-[11px] block">
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
                                       <span className="text-slate-500 text-[11px] block">
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
                                       <span className="text-slate-500 text-[11px] block">
                                          Số CCCD/CMND (12 chữ số)
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
                                       <span className="text-slate-500 text-[11px] block">
                                          Số điện thoại
                                       </span>
                                       <input
                                          type="text"
                                          value={
                                             extractedData.phoneNumber || ""
                                          }
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
                                       <span className="text-slate-500 text-[11px] block">
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
                                 </div>
                              </div>

                              {/* Khối 2: Chỉ số thể trạng & Tiền sử */}
                              <div className="p-3.5 bg-slate-50/70 rounded-sm border border-slate-200 space-y-3">
                                 <div className="font-semibold text-slate-800 border-b border-slate-200 pb-1.5 text-sm">
                                    Chỉ số thể trạng & Tiền sử bệnh lý
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                                       <span className="text-slate-500 text-[11px] block">
                                          Chiều cao (cm)
                                       </span>
                                       <input
                                          type="number"
                                          value={extractedData.height || ""}
                                          onChange={(e) =>
                                             setExtractedData({
                                                ...extractedData,
                                                height: e.target.value
                                                   ? Number(e.target.value)
                                                   : undefined,
                                             })
                                          }
                                          className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5"
                                          placeholder="VD: 165"
                                       />
                                    </div>

                                    <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                                       <span className="text-slate-500 text-[11px] block">
                                          Cân nặng (kg)
                                       </span>
                                       <input
                                          type="number"
                                          value={extractedData.weight || ""}
                                          onChange={(e) =>
                                             setExtractedData({
                                                ...extractedData,
                                                weight: e.target.value
                                                   ? Number(e.target.value)
                                                   : undefined,
                                             })
                                          }
                                          className="w-full font-semibold text-slate-800 bg-transparent outline-none focus:border-b focus:border-primary pt-0.5"
                                          placeholder="VD: 60"
                                       />
                                    </div>

                                    <div className="bg-white p-2.5 rounded-sm border border-slate-200">
                                       <span className="text-slate-500 text-[11px] block">
                                          Nhóm máu
                                       </span>
                                       <select
                                          value={
                                             extractedData.bloodType ||
                                             "UNKNOWN"
                                          }
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
                                          <option value="UNKNOWN">
                                             Chưa xác định
                                          </option>
                                          <option value="A">Nhóm máu A</option>
                                          <option value="B">Nhóm máu B</option>
                                          <option value="AB">
                                             Nhóm máu AB
                                          </option>
                                          <option value="O">Nhóm máu O</option>
                                       </select>
                                    </div>

                                    <div className="bg-white p-2.5 rounded-sm border border-slate-200 sm:col-span-3">
                                       <span className="text-slate-500 text-[11px] block">
                                          Tiền sử bệnh án ghi nhận
                                       </span>
                                       <textarea
                                          rows={3}
                                          value={
                                             extractedData.medicalHistory || ""
                                          }
                                          onChange={(e) =>
                                             setExtractedData({
                                                ...extractedData,
                                                medicalHistory: e.target.value,
                                             })
                                          }
                                          placeholder="Chưa có thông tin tiền sử"
                                          className="w-full font-semibold text-slate-800 bg-transparent outline-none resize-none pt-1 leading-relaxed"
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Tab 2: Bệnh lý & Yếu tố nguy cơ */}
                        {activeTab === "diseases" && extractedData && (
                           <div className="space-y-4">
                              {/* Khối 1: Yếu tố nguy cơ chính */}
                              <div className="space-y-2">
                                 <div className="font-bold text-slate-800 text-sm">
                                    A. Yếu tố nguy cơ chính (Nhấn để bật/tắt)
                                 </div>
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                       {
                                          key: "isSmoking" as const,
                                          label: "Hút thuốc lá",
                                          activeClass:
                                             "bg-amber-50 border-amber-300 text-amber-800",
                                          dotClass: "bg-amber-500",
                                       },
                                       {
                                          key: "hasHypertension" as const,
                                          label: "Tăng huyết áp",
                                          activeClass:
                                             "bg-rose-50 border-rose-300 text-rose-800",
                                          dotClass: "bg-rose-500",
                                       },
                                       {
                                          key: "hasDiabetes" as const,
                                          label: "Đái tháo đường",
                                          activeClass:
                                             "bg-purple-50 border-purple-300 text-purple-800",
                                          dotClass: "bg-purple-500",
                                       },
                                       {
                                          key: "hasDyslipidemia" as const,
                                          label: "Rối loạn lipid",
                                          activeClass:
                                             "bg-blue-50 border-blue-300 text-blue-800",
                                          dotClass: "bg-blue-500",
                                       },
                                    ].map(
                                       ({
                                          key,
                                          label,
                                          activeClass,
                                          dotClass,
                                       }) => {
                                          const val = extractedData[key] as
                                             | boolean
                                             | undefined;
                                          return (
                                             <button
                                                key={key}
                                                type="button"
                                                onClick={() =>
                                                   setExtractedData({
                                                      ...extractedData,
                                                      [key]: !val,
                                                   })
                                                }
                                                className={`flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-sm border text-xs font-semibold transition-colors cursor-pointer ${
                                                   val
                                                      ? activeClass
                                                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                                                }`}
                                             >
                                                <span>{label}</span>
                                                <span
                                                   className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                                      val
                                                         ? dotClass
                                                         : "bg-slate-200"
                                                   }`}
                                                >
                                                   {val && (
                                                      <Check className="w-2.5 h-2.5 text-white" />
                                                   )}
                                                </span>
                                             </button>
                                          );
                                       },
                                    )}
                                 </div>
                              </div>

                              {/* Khối 2: Bệnh lý mạn tính & Tiền sử tim mạch */}
                              <div className="space-y-2">
                                 <div className="font-bold text-slate-800 text-sm">
                                    B. Bệnh lý mạn tính & Biến cố tim mạch
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {chronicDiseasesList.map(
                                       ({ key, label }) => {
                                          const val = extractedData[key] as
                                             | boolean
                                             | undefined;
                                          return (
                                             <div
                                                key={key}
                                                onClick={() =>
                                                   setExtractedData({
                                                      ...extractedData,
                                                      [key]: !val,
                                                   })
                                                }
                                                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                                             >
                                                <span className="text-slate-700 font-medium">
                                                   {label}
                                                </span>
                                                {val === true ? (
                                                   <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                      Có
                                                   </span>
                                                ) : val === false ? (
                                                   <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-600">
                                                      Không
                                                   </span>
                                                ) : (
                                                   <span className="text-slate-400">
                                                      —
                                                   </span>
                                                )}
                                             </div>
                                          );
                                       },
                                    )}
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Tab 3: Dữ liệu JSON gốc */}
                        {activeTab === "json" && (
                           <div className="space-y-2">
                              <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-sm text-[11px] font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
                                 {JSON.stringify(result, null, 2)}
                              </pre>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </ScrollArea>

            {/* Footer cố định luôn ở bottom — chỉ hiện khi có kết quả */}
            {result && (
               <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 bg-white">
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                     <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                     <span>
                        Phát hiện{" "}
                        <strong className="text-slate-900">
                           {applicableCount}
                        </strong>{" "}
                        thông tin tương thích với hồ sơ sức khỏe.
                     </span>
                  </div>

                  <div className="flex items-center gap-2">
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
                        onClick={handleApply}
                        disabled={applicableCount === 0}
                     >
                        Áp dụng vào hồ sơ
                     </CustomButton>
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
}
