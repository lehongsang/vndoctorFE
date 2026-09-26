"use client";

import { useState, useRef } from "react";
import { FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "react-toastify";
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
import { cn } from "@/lib/utils";

export interface OcrExtractedFormValues {
   hasUnderlyingDisease?: boolean | null;
   age?: number | null;
   gender?: string | null;
   isSmoking?: boolean | null;
   systolicBp?: number | null;
   diastolicBp?: number | null;
   totalCholesterol?: number | null;
   hdlCholesterol?: number | null;
   glucoseFasting?: number | null;
   heightCm?: number | null;
   weightKg?: number | null;
   hasLeftVentricularHypertrophy?: boolean | null;
   hasRetinopathy?: boolean | null;
   hasAlbuminuria?: boolean | null;
   hasSilentBrainInfarct?: boolean | null;
   egfr?: number | null;
   acr?: number | null;
   diabetes?: boolean | null;
   hasMyocardialInfarction?: boolean | null;
   hasCoronaryArteryDisease?: boolean | null;
   hasAorticAneurysm?: boolean | null;
   hasAtherosclerosis?: boolean | null;
   stroke?: boolean | null;
   hasAcuteCoronarySyndrome?: boolean | null;
   hasTia?: boolean | null;
   hasPeripheralArteryDisease?: boolean | null;
   hasFamilialHypercholesterolemia?: boolean | null;
}

export interface OcrMedicalRecordModalProps {
   isOpen: boolean;
   onClose: () => void;
   onApplyToForm?: (values: OcrExtractedFormValues) => void;
}

type TabType = "assessment" | "profile" | "json";

export function OcrMedicalRecordModal({
   isOpen,
   onClose,
   onApplyToForm,
}: OcrMedicalRecordModalProps) {
   const [file, setFile] = useState<File | null>(null);
   const [engine, setEngine] = useState<OcrEngine>("rapidocr");
   const [forceOcr, setForceOcr] = useState<boolean>(false);
   const [activeTab, setActiveTab] = useState<TabType>("assessment");
   const [result, setResult] = useState<OcrPdfResponse | null>(null);
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
   };

   const handleReset = () => {
      setFile(null);
      setResult(null);
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
         const response = await extractOcr({
            file,
            engine,
            force_ocr: forceOcr,
            dpi: 150,
            lang: "vie+eng",
         }).unwrap();

         setResult(response);
         toast.success("Trích xuất hồ sơ bệnh án thành công!");
      } catch (err: unknown) {
         const errorObj = err as { data?: { message?: string } };
         toast.error(
            errorObj?.data?.message || "Lỗi khi trích xuất dữ liệu từ tài liệu",
         );
      }
   };

   // Dữ liệu bóc tách được (ưu tiên cấu trúc chuẩn từ backend VNdoctor)
   const dataObj = (result?.data || result) as
      | OcrMedicalRecordStructuredData
      | undefined;

   const phanLoai = dataObj?.PHAN_LOAI_BENH_LY_NEN;
   const sinhLy = dataObj?.A_CHI_SO_SINH_LY_CO_BAN;
   const tonThuong = dataObj?.TON_THUONG_CO_QUAN_DICH;
   const benhManTinh = dataObj?.C_BENH_LY_MAN_TINH_KEM_THEO;
   const caNhan = dataObj?.THONG_TIN_CA_NHAN;
   const lienHe = dataObj?.THONG_TIN_LIEN_HE_AND_DIA_CHI;
   const sucKhoe = dataObj?.CHI_SO_AND_TIEN_SU_SUC_KHOE;

   // Lấy các giá trị trích xuất để điền vào biểu mẫu
   const getApplicableValues = (): OcrExtractedFormValues => {
      const values: OcrExtractedFormValues = {};

      if (phanLoai?.has_underlying_disease !== undefined) {
         values.hasUnderlyingDisease = phanLoai.has_underlying_disease;
      }
      if (sinhLy?.tuoi !== undefined && sinhLy?.tuoi !== null) {
         values.age = sinhLy.tuoi;
      }
      if (sinhLy?.gioi_tinh) {
         values.gender = sinhLy.gioi_tinh;
      }
      if (sinhLy?.hut_thuoc_la !== undefined && sinhLy?.hut_thuoc_la !== null) {
         values.isSmoking = sinhLy.hut_thuoc_la;
      }
      if (
         sinhLy?.huyet_ap_tam_thu_sbp !== undefined &&
         sinhLy?.huyet_ap_tam_thu_sbp !== null
      ) {
         values.systolicBp = sinhLy.huyet_ap_tam_thu_sbp;
      }
      if (
         sinhLy?.cholesterol_toan_phan !== undefined &&
         sinhLy?.cholesterol_toan_phan !== null
      ) {
         values.totalCholesterol = sinhLy.cholesterol_toan_phan;
      }
      if (
         sinhLy?.hdl_cholesterol !== undefined &&
         sinhLy?.hdl_cholesterol !== null
      ) {
         values.hdlCholesterol = sinhLy.hdl_cholesterol;
      }

      if (sucKhoe?.chieu_cao !== undefined && sucKhoe?.chieu_cao !== null) {
         values.heightCm = sucKhoe.chieu_cao;
      }
      if (sucKhoe?.can_nang !== undefined && sucKhoe?.can_nang !== null) {
         values.weightKg = sucKhoe.can_nang;
      }

      // Tổn thương cơ quan đích
      if (tonThuong?.phi_dai_that_trai !== undefined) {
         values.hasLeftVentricularHypertrophy = tonThuong.phi_dai_that_trai;
      }
      if (tonThuong?.ton_thuong_day_mat !== undefined) {
         values.hasRetinopathy = tonThuong.ton_thuong_day_mat;
      }
      if (tonThuong?.albumin_microalbumin_nieu !== undefined) {
         values.hasAlbuminuria = tonThuong.albumin_microalbumin_nieu;
      }
      if (tonThuong?.ton_thuong_tham_lang_tren_nao !== undefined) {
         values.hasSilentBrainInfarct = tonThuong.ton_thuong_tham_lang_tren_nao;
      }

      // Bệnh lý mạn tính
      if (benhManTinh?.egfr !== undefined && benhManTinh?.egfr !== null) {
         values.egfr = benhManTinh.egfr;
      }
      if (benhManTinh?.acr !== undefined && benhManTinh?.acr !== null) {
         values.acr = benhManTinh.acr;
      }
      if (benhManTinh?.dai_thao_duong !== undefined) {
         values.diabetes = benhManTinh.dai_thao_duong;
      }
      if (benhManTinh?.benh_ly_mach_vanh !== undefined) {
         values.hasCoronaryArteryDisease = benhManTinh.benh_ly_mach_vanh;
      }
      if (benhManTinh?.nhoi_mau_co_tim !== undefined) {
         values.hasMyocardialInfarction = benhManTinh.nhoi_mau_co_tim;
      }
      if (benhManTinh?.phinh_dong_mach_chu !== undefined) {
         values.hasAorticAneurysm = benhManTinh.phinh_dong_mach_chu;
      }
      if (benhManTinh?.vua_xo_mach_mau !== undefined) {
         values.hasAtherosclerosis = benhManTinh.vua_xo_mach_mau;
      }
      if (benhManTinh?.dot_quy_nao !== undefined) {
         values.stroke = benhManTinh.dot_quy_nao;
      }
      if (benhManTinh?.hoi_chung_vanh_cap !== undefined) {
         values.hasAcuteCoronarySyndrome = benhManTinh.hoi_chung_vanh_cap;
      }
      if (benhManTinh?.thieu_mau_cuc_bo_nao_thoang_qua_tia !== undefined) {
         values.hasTia = benhManTinh.thieu_mau_cuc_bo_nao_thoang_qua_tia;
      }
      if (benhManTinh?.benh_mach_mau_ngoai_vi !== undefined) {
         values.hasPeripheralArteryDisease = benhManTinh.benh_mach_mau_ngoai_vi;
      }
      if (benhManTinh?.tang_cholesterol_mau_gia_dinh !== undefined) {
         values.hasFamilialHypercholesterolemia =
            benhManTinh.tang_cholesterol_mau_gia_dinh;
      }

      return values;
   };

   const handleApply = () => {
      if (!onApplyToForm) return;
      const values = getApplicableValues();
      onApplyToForm(values);
      toast.success("Đã áp dụng các chỉ số OCR vào biểu mẫu đánh giá!");
      onClose();
   };

   const renderBooleanBadge = (val?: boolean | null) => {
      if (val === true) {
         return (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
               Có
            </span>
         );
      }
      if (val === false) {
         return (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
               Không
            </span>
         );
      }
      return <span className="text-slate-400">—</span>;
   };

   const formatVal = (val?: number | string | null, unit: string = "") => {
      if (val === null || val === undefined || val === "") return "—";
      return `${val} ${unit}`.trim();
   };

   const applicableCount = Object.keys(getApplicableValues()).length;

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
                     OCR Trích xuất Hồ sơ Bệnh án Y tế
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                     Bóc tách thông tin sinh hiệu, tổn thương cơ quan đích, bệnh
                     lý mạn tính từ tài liệu PDF hoặc ảnh scan
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
                              <>
                                 <div className="py-15">
                                    <p className="font-semibold text-slate-800 text-sm">
                                       Kéo thả hoặc nhấn để tải lên tài liệu
                                    </p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                       Hỗ trợ định dạng PDF hoặc ảnh chụp (PNG,
                                       JPG, JPEG, WEBP)
                                    </p>
                                 </div>
                              </>
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
                                    id="force_ocr"
                                    checked={forceOcr}
                                    onCheckedChange={(checked) =>
                                       setForceOcr(Boolean(checked))
                                    }
                                 />
                                 <Label
                                    htmlFor="force_ocr"
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
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
                           <div className="flex items-center gap-2 flex-wrap">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-emerald-950 text-xs">
                                 Bệnh nhân:
                              </span>
                              <span className="text-emerald-900 font-bold text-sm">
                                 {caNhan?.ho_va_ten || file?.name}
                              </span>
                              {phanLoai?.has_underlying_disease && (
                                 <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                                    Có bệnh nền (Non-ASCVD)
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
                              onClick={() => setActiveTab("assessment")}
                              variant={
                                 activeTab === "assessment"
                                    ? "default"
                                    : "outline"
                              }
                              className="px-3 py-1.5"
                           >
                              Phân tầng & Chỉ số đánh giá
                           </CustomButton>

                           <CustomButton
                              type="button"
                              onClick={() => setActiveTab("profile")}
                              variant={
                                 activeTab === "profile" ? "default" : "outline"
                              }
                              className="px-3 py-1.5 "
                           >
                              Thông tin bệnh nhân & Tiền sử
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

                        {/* Tab 1: Phân tầng nguy cơ & Chỉ số */}
                        {activeTab === "assessment" && (
                           <div className="space-y-4">
                              {/* Khối 1: Chỉ số sinh lý cơ bản */}
                              <div className="space-y-2">
                                 <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
                                    A. Chỉ số sinh lý cơ bản & Xét nghiệm
                                 </div>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          Tuổi
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {formatVal(sinhLy?.tuoi, "tuổi")}
                                       </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          Giới tính
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {sinhLy?.gioi_tinh || "—"}
                                       </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          Hút thuốc lá
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {sinhLy?.hut_thuoc_la
                                             ? "Có"
                                             : "Không"}
                                       </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          Huyết áp tâm thu (SBP)
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {formatVal(
                                             sinhLy?.huyet_ap_tam_thu_sbp,
                                             "mmHg",
                                          )}
                                       </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          Cholesterol toàn phần
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {formatVal(
                                             sinhLy?.cholesterol_toan_phan,
                                             "mmol/L",
                                          )}
                                       </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          HDL-Cholesterol
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {formatVal(
                                             sinhLy?.hdl_cholesterol,
                                             "mmol/L",
                                          )}
                                       </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          eGFR (Cầu thận)
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {formatVal(
                                             benhManTinh?.egfr,
                                             "mL/min",
                                          )}
                                       </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                                       <span className="text-slate-500 block text-[11px]">
                                          Tỷ lệ ACR
                                       </span>
                                       <span className="font-bold text-slate-900 text-sm">
                                          {formatVal(benhManTinh?.acr, "mg/g")}
                                       </span>
                                    </div>
                                 </div>
                              </div>

                              {/* Khối 2: Tổn thương cơ quan đích */}
                              <div className="space-y-2">
                                 <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
                                    B. Dấu hiệu tổn thương cơ quan đích
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Phì đại thất trái (ECG / Siêu âm)
                                       </span>
                                       {renderBooleanBadge(
                                          tonThuong?.phi_dai_that_trai,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Tổn thương đáy mắt (Võng mạc)
                                       </span>
                                       {renderBooleanBadge(
                                          tonThuong?.ton_thuong_day_mat,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Albumin / Microalbumin niệu
                                       </span>
                                       {renderBooleanBadge(
                                          tonThuong?.albumin_microalbumin_nieu,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Tổn thương thầm lặng trên não
                                       </span>
                                       {renderBooleanBadge(
                                          tonThuong?.ton_thuong_tham_lang_tren_nao,
                                       )}
                                    </div>
                                 </div>
                              </div>

                              {/* Khối 3: Bệnh lý mạn tính kèm theo */}
                              <div className="space-y-2">
                                 <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200">
                                    C. Bệnh lý mạn tính & Tiền sử biến cố tim
                                    mạch
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Bệnh lý động mạch vành
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.benh_ly_mach_vanh,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Đái tháo đường
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.dai_thao_duong,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Nhồi máu cơ tim
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.nhoi_mau_co_tim,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Hội chứng vành cấp
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.hoi_chung_vanh_cap,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Đột quỵ não
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.dot_quy_nao,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Thiếu máu cục bộ não thoáng qua (TIA)
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.thieu_mau_cuc_bo_nao_thoang_qua_tia,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Vữa xơ mạch máu lớn
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.vua_xo_mach_mau,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Phình động mạch chủ
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.phinh_dong_mach_chu,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Bệnh mạch máu ngoại vi
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.benh_mach_mau_ngoai_vi,
                                       )}
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                                       <span className="text-slate-700">
                                          Tăng Cholesterol máu gia đình
                                       </span>
                                       {renderBooleanBadge(
                                          benhManTinh?.tang_cholesterol_mau_gia_dinh,
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Tab 2: Thông tin bệnh nhân & Tiền sử */}
                        {activeTab === "profile" && (
                           <div className="space-y-4">
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                 <div className="font-semibold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wide text-[11px]">
                                    Thông tin hành chính
                                 </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div>
                                       <span className="text-slate-500">
                                          Họ và tên:{" "}
                                       </span>
                                       <span className="font-bold text-slate-900">
                                          {caNhan?.ho_va_ten || "—"}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-slate-500">
                                          Ngày sinh:{" "}
                                       </span>
                                       <span className="font-medium text-slate-800">
                                          {caNhan?.ngay_sinh || "—"}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-slate-500">
                                          Giới tính:{" "}
                                       </span>
                                       <span className="font-medium text-slate-800">
                                          {caNhan?.gioi_tinh || "—"}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-slate-500">
                                          Số CCCD/CMND:{" "}
                                       </span>
                                       <span className="font-medium text-slate-800">
                                          {caNhan?.cccd_cmnd || "—"}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-slate-500">
                                          Số điện thoại:{" "}
                                       </span>
                                       <span className="font-medium text-slate-800">
                                          {lienHe?.so_dien_thoai || "—"}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-slate-500">
                                          Tỉnh/Thành phố:{" "}
                                       </span>
                                       <span className="font-medium text-slate-800">
                                          {lienHe?.tinh_thanh_pho || "—"}
                                       </span>
                                    </div>
                                    <div className="sm:col-span-2">
                                       <span className="text-slate-500">
                                          Địa chỉ đầy đủ:{" "}
                                       </span>
                                       <span className="font-medium text-slate-800">
                                          {lienHe?.dia_chi_day_du || "—"}
                                       </span>
                                    </div>
                                 </div>
                              </div>

                              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                                 <div className="font-semibold text-amber-900 border-b border-amber-200 pb-1 uppercase tracking-wide text-[11px]">
                                    Tiền sử bệnh lý & Thể trạng
                                 </div>
                                 <div className="space-y-2 text-xs">
                                    <div className="grid grid-cols-3 gap-2">
                                       <div>
                                          <span className="text-slate-500 block text-[11px]">
                                             Chiều cao:
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {formatVal(
                                                sucKhoe?.chieu_cao,
                                                "cm",
                                             )}
                                          </span>
                                       </div>
                                       <div>
                                          <span className="text-slate-500 block text-[11px]">
                                             Cân nặng:
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {formatVal(
                                                sucKhoe?.can_nang,
                                                "kg",
                                             )}
                                          </span>
                                       </div>
                                       <div>
                                          <span className="text-slate-500 block text-[11px]">
                                             Nhóm máu:
                                          </span>
                                          <span className="font-semibold text-slate-800">
                                             {sucKhoe?.nhom_mau || "—"}
                                          </span>
                                       </div>
                                    </div>

                                    {sucKhoe?.tien_su_benh_ly && (
                                       <div className="pt-1">
                                          <span className="text-slate-500 block text-[11px] font-medium">
                                             Tiền sử bệnh án ghi nhận:
                                          </span>
                                          <p className="font-medium text-slate-900 bg-white p-2.5 rounded border border-amber-200 mt-1 leading-relaxed">
                                             {sucKhoe.tien_su_benh_ly}
                                          </p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Tab 3: Dữ liệu JSON gốc */}
                        {activeTab === "json" && (
                           <div className="space-y-2">
                              <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
                                 {JSON.stringify(result, null, 2)}
                              </pre>
                           </div>
                        )}

                        {/* Footer với nút Áp dụng vào biểu mẫu */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                           <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                              <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                              <span>
                                 Phát hiện{" "}
                                 <strong className="text-slate-900">
                                    {applicableCount}
                                 </strong>{" "}
                                 chỉ số tương thích với biểu mẫu phân tầng nguy
                                 cơ.
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

                              {onApplyToForm && applicableCount > 0 && (
                                 <CustomButton
                                    type="button"
                                    size="sm"
                                    onClick={handleApply}
                                 >
                                    Áp dụng vào biểu mẫu
                                 </CustomButton>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </ScrollArea>
         </DialogContent>
      </Dialog>
   );
}
