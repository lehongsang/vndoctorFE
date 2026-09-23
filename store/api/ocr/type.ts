// --- Engine & Request Types ---
export type OcrEngine = "rapidocr" | "tesseract";

export type OcrPdfRequest = {
   file: File | Blob;
   force_ocr?: boolean;
   dpi?: number;
   lang?: string;
   engine?: OcrEngine;
};

export type OcrCccdRequest = {
   front_file?: File | Blob;
   back_file?: File | Blob;
   note?: string;
};

// --- Patient Information Extracted from Medical Record ---
export type OcrPatientInfo = {
   fullName?: string;
   gender?: "MALE" | "FEMALE" | "OTHER" | string;
   dob?: string;
   age?: number;
   citizenId?: string;
   phoneNumber?: string;
   address?: string;
   healthInsuranceNumber?: string;
   patientCode?: string;
   job?: string;
   ethnicity?: string;
};

// --- Vital Signs (Sinh hiệu) ---
export type OcrVitalSigns = {
   bloodPressure?: string;
   systolicBp?: number;
   diastolicBp?: number;
   heartRate?: number;
   temperature?: number;
   spo2?: number;
   respiratoryRate?: number;
   heightCm?: number;
   weightKg?: number;
   bmi?: number;
};

// --- Laboratory / Paraclinical Test Items (Xét nghiệm cận lâm sàng) ---
export type OcrLabTestItem = {
   testName: string;
   value: string | number;
   unit?: string;
   referenceRange?: string;
   flag?: "NORMAL" | "HIGH" | "LOW" | "ABNORMAL" | string;
   isAbnormal?: boolean;
};

// --- Prescription / Medication Item (Đơn thuốc) ---
export type OcrPrescriptionItem = {
   drugName: string;
   activeIngredient?: string;
   dosage?: string;
   unit?: string;
   quantity?: number | string;
   usage?: string;
   morning?: number | string;
   noon?: number | string;
   afternoon?: number | string;
   evening?: number | string;
   note?: string;
};

// --- Clinical & Medical Examination Data (Chẩn đoán & Khám bệnh) ---
export type OcrClinicalInfo = {
   hospitalName?: string;
   department?: string;
   doctorName?: string;
   visitDate?: string;
   reasonForVisit?: string;
   clinicalSymptoms?: string;
   diagnosis?: string;
   icd10Code?: string;
   secondaryDiagnosis?: string;
   treatmentPlan?: string;
   notes?: string;
   admissionDate?: string;
   dischargeDate?: string;
};

// --- Comprehensive Extracted Medical Record Structure ---
export type OcrMedicalRecordResult = {
   patient?: OcrPatientInfo;
   vitals?: OcrVitalSigns;
   clinical?: OcrClinicalInfo;
   labResults?: OcrLabTestItem[];
   prescriptions?: OcrPrescriptionItem[];
   rawText?: string;
   raw_text?: string;
   pageCount?: number;
   confidence?: number;
   executionTimeMs?: number;
   metadata?: Record<string, string | number | boolean | null>;
};

// --- Cấu trúc dữ liệu chi tiết thực tế trả về từ backend OCR vndoctor ---
export type OcrPhanLoaiBenhLyNen = {
   has_underlying_disease?: boolean;
};

export type OcrChiSoSinhLyCoBan = {
   tuoi?: number | null;
   gioi_tinh?: string | null;
   hut_thuoc_la?: boolean | null;
   huyet_ap_tam_thu_sbp?: number | null;
   cholesterol_toan_phan?: number | null;
   hdl_cholesterol?: number | null;
};

export type OcrTonThuongCoQuanDich = {
   phi_dai_that_trai?: boolean | null;
   ton_thuong_day_mat?: boolean | null;
   albumin_microalbumin_nieu?: boolean | null;
   ton_thuong_tham_lang_tren_nao?: boolean | null;
};

export type OcrBenhLyManTinhKemTheo = {
   egfr?: number | null;
   acr?: number | null;
   dai_thao_duong?: boolean | null;
   nhoi_mau_co_tim?: boolean | null;
   benh_ly_mach_vanh?: boolean | null;
   phinh_dong_mach_chu?: boolean | null;
   vua_xo_mach_mau?: boolean | null;
   dot_quy_nao?: boolean | null;
   hoi_chung_vanh_cap?: boolean | null;
   thieu_mau_cuc_bo_nao_thoang_qua_tia?: boolean | null;
   benh_mach_mau_ngoai_vi?: boolean | null;
   tang_cholesterol_mau_gia_dinh?: boolean | null;
};

export type OcrThongTinCaNhan = {
   ho_va_ten?: string | null;
   ngay_sinh?: string | null;
   gioi_tinh?: string | null;
   cccd_cmnd?: string | null;
   trang_thai_ho_so?: string | null;
};

export type OcrThongTinLienHeAndDiaChi = {
   so_dien_thoai?: string | null;
   email?: string | null;
   tinh_thanh_pho?: string | null;
   quan_huyen?: string | null;
   so_nha_ten_duong?: string | null;
   dia_chi_day_du?: string | null;
};

export type OcrChiSoAndTienSuSucKhoe = {
   chieu_cao?: number | null;
   can_nang?: number | null;
   nhom_mau?: string | null;
   tien_su_benh_ly?: string | null;
};

export type OcrThongTinNhomChamSoc = {
   ma_nhom_cham_soc?: string | null;
};

export type OcrMedicalRecordStructuredData = {
   PHAN_LOAI_BENH_LY_NEN?: OcrPhanLoaiBenhLyNen;
   A_CHI_SO_SINH_LY_CO_BAN?: OcrChiSoSinhLyCoBan;
   TON_THUONG_CO_QUAN_DICH?: OcrTonThuongCoQuanDich;
   C_BENH_LY_MAN_TINH_KEM_THEO?: OcrBenhLyManTinhKemTheo;
   THONG_TIN_CA_NHAN?: OcrThongTinCaNhan;
   THONG_TIN_LIEN_HE_AND_DIA_CHI?: OcrThongTinLienHeAndDiaChi;
   CHI_SO_AND_TIEN_SU_SUC_KHOE?: OcrChiSoAndTienSuSucKhoe;
   D_THONG_TIN_NHOM_CHAM_SOC?: OcrThongTinNhomChamSoc;
};

// --- Response DTO for POST /api/ocr/pdf ---
export type OcrPdfResponse = {
   success?: boolean;
   message?: string;
   data?: OcrMedicalRecordResult | OcrMedicalRecordStructuredData;
   // Cấu trúc phân loại theo nhóm trả về trực tiếp
   PHAN_LOAI_BENH_LY_NEN?: OcrPhanLoaiBenhLyNen;
   A_CHI_SO_SINH_LY_CO_BAN?: OcrChiSoSinhLyCoBan;
   TON_THUONG_CO_QUAN_DICH?: OcrTonThuongCoQuanDich;
   C_BENH_LY_MAN_TINH_KEM_THEO?: OcrBenhLyManTinhKemTheo;
   THONG_TIN_CA_NHAN?: OcrThongTinCaNhan;
   THONG_TIN_LIEN_HE_AND_DIA_CHI?: OcrThongTinLienHeAndDiaChi;
   CHI_SO_AND_TIEN_SU_SUC_KHOE?: OcrChiSoAndTienSuSucKhoe;
   D_THONG_TIN_NHOM_CHAM_SOC?: OcrThongTinNhomChamSoc;
   // Hỗ trợ thêm dạng dữ liệu mở rộng nếu có
   patient?: OcrPatientInfo;
   vitals?: OcrVitalSigns;
   clinical?: OcrClinicalInfo;
   labResults?: OcrLabTestItem[];
   prescriptions?: OcrPrescriptionItem[];
   rawText?: string;
   raw_text?: string;
   status?: string;
   execution_time?: number;
};

// --- Response DTO for POST /api/ocr/cccd ---
export type OcrCccdResult = {
   idNumber?: string;
   citizenId?: string;
   fullName?: string;
   dob?: string;
   gender?: string;
   nationality?: string;
   placeOfOrigin?: string;
   placeOfResidence?: string;
   dateOfExpiry?: string;
   dateOfIssue?: string;
   placeOfIssue?: string;
   qrCode?: {
      citizenId?: string;
      cmnd?: string;
      fullName?: string;
      dob?: string;
      gender?: string;
      address?: string;
      dateOfIssue?: string;
   };
   confidence?: number;
   rawText?: string;
};

export type OcrCccdResponse = {
   success?: boolean;
   message?: string;
   data?: OcrCccdResult;
   idNumber?: string;
   fullName?: string;
   dob?: string;
   gender?: string;
   nationality?: string;
   placeOfOrigin?: string;
   placeOfResidence?: string;
   dateOfExpiry?: string;
};

// --- Response DTO for GET /api/ocr/health ---
export type OcrSupportedApi = {
   endpoint: string;
   description: string;
};

export type OcrHealthResponse = {
   status: string;
   supported_apis: OcrSupportedApi[];
};
