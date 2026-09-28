// Utility kiểm tra và đối chiếu thông tin bệnh nhân giữa hệ thống và tài liệu OCR

export interface ExpectedPatientInfo {
   fullName?: string | null;
   dob?: string | null;
}

export interface PatientVerificationResult {
   hasExpectedPatient: boolean;
   isMatched: boolean;
   nameMatched: boolean;
   dobMatched: boolean;
   expectedName: string;
   expectedDobDisplay: string;
   ocrName: string;
   ocrDobDisplay: string;
   errorMessage?: string;
}

/**
 * Loại bỏ dấu tiếng Việt và chuẩn hóa chữ thường, khoảng trắng
 */
export function removeVietnameseTones(str: string): string {
   return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
}

/**
 * Chuẩn hóa họ tên, xóa các tiền tố văn bản hay gặp trong phiếu y tế (BN, Bệnh nhân, ...)
 */
export function cleanPatientName(name?: string | null): string {
   if (!name) return "";
   let cleaned = name.trim();
   cleaned = cleaned
      .replace(
         /^(bệnh nhân|benh nhan|bn|họ và tên|ho va ten|họ tên|ho ten|ông|bà)[\s\:\.\-]+/i,
         "",
      )
      .trim();
   return cleaned;
}

/**
 * Chuẩn hóa chuỗi ngày sinh để so sánh
 */
export function normalizeDob(dobStr?: string | null): {
   dateStr: string; // YYYY-MM-DD nếu đầy đủ ngày tháng năm
   yearStr: string; // YYYY nếu nhận diện được năm
   displayStr: string; // DD/MM/YYYY hoặc YYYY hiển thị thân thiện trên UI
} {
   if (!dobStr) return { dateStr: "", yearStr: "", displayStr: "" };
   const trimmed = dobStr.trim();
   const baseStr = trimmed.includes("T") ? trimmed.split("T")[0] : trimmed;

   // 1. YYYY-MM-DD
   const matchYmd = baseStr.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
   if (matchYmd) {
      const year = matchYmd[1];
      const month = matchYmd[2].padStart(2, "0");
      const day = matchYmd[3].padStart(2, "0");
      return {
         dateStr: `${year}-${month}-${day}`,
         yearStr: year,
         displayStr: `${day}/${month}/${year}`,
      };
   }

   // 2. DD/MM/YYYY hoặc DD-MM-YYYY hoặc DD.MM.YYYY
   const matchDmy = baseStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})/);
   if (matchDmy) {
      const day = matchDmy[1].padStart(2, "0");
      const month = matchDmy[2].padStart(2, "0");
      const year = matchDmy[3];
      return {
         dateStr: `${year}-${month}-${day}`,
         yearStr: year,
         displayStr: `${day}/${month}/${year}`,
      };
   }

   // 3. Chỉ có năm sinh YYYY
   const matchYear = baseStr.match(/\b(19\d{2}|20\d{2})\b/);
   if (matchYear) {
      return {
         dateStr: "",
         yearStr: matchYear[1],
         displayStr: matchYear[1],
      };
   }

   return { dateStr: "", yearStr: "", displayStr: trimmed };
}

/**
 * So sánh 2 họ tên bệnh nhân
 */
export function isNameMatching(
   expectedName?: string | null,
   ocrName?: string | null,
): boolean {
   if (!expectedName || !ocrName) return false;
   const cleanExp = cleanPatientName(expectedName);
   const cleanOcr = cleanPatientName(ocrName);

   const normExp = removeVietnameseTones(cleanExp);
   const normOcr = removeVietnameseTones(cleanOcr);

   if (!normExp || !normOcr) return false;

   // So khớp trực tiếp (bỏ dấu)
   if (normExp === normOcr) return true;

   // So khớp theo các từ (hỗ trợ viết tắt chữ đệm như "Nguyễn V. A" và "Nguyễn Văn A")
   const tokensExp = normExp.split(" ").filter(Boolean);
   const tokensOcr = normOcr.split(" ").filter(Boolean);

   if (
      tokensExp.length > 0 &&
      tokensExp.length === tokensOcr.length &&
      tokensExp[0] === tokensOcr[0] &&
      tokensExp[tokensExp.length - 1] === tokensOcr[tokensOcr.length - 1]
   ) {
      let isTokenMatch = true;
      for (let i = 1; i < tokensExp.length - 1; i++) {
         const t1 = tokensExp[i].replace(/\./g, "");
         const t2 = tokensOcr[i].replace(/\./g, "");
         if (t1 === t2) continue;
         if (
            (t1.length === 1 && t2.startsWith(t1)) ||
            (t2.length === 1 && t1.startsWith(t2))
         ) {
            continue;
         }
         isTokenMatch = false;
         break;
      }
      if (isTokenMatch) return true;
   }

   return false;
}

/**
 * So sánh ngày sinh giữa hệ thống và OCR
 */
export function isDobMatching(
   expectedDob?: string | null,
   ocrDob?: string | null,
   ocrAge?: number | null,
): boolean {
   if (!expectedDob) return true;
   const exp = normalizeDob(expectedDob);
   if (!exp.yearStr && !exp.dateStr) return true;

   if (ocrDob) {
      const ocr = normalizeDob(ocrDob);
      // Đầy đủ ngày tháng năm: bắt buộc phải trùng khớp tuyệt đối
      if (exp.dateStr && ocr.dateStr) {
         return exp.dateStr === ocr.dateStr;
      }
      // Một bên chỉ có năm sinh: so khớp năm sinh
      if (exp.yearStr && ocr.yearStr) {
         return exp.yearStr === ocr.yearStr;
      }
   }

   // Fallback nếu tài liệu OCR chỉ bóc tách được tuổi (ocrAge)
   if (typeof ocrAge === "number" && ocrAge > 0 && exp.yearStr) {
      const expectedBirthYear = parseInt(exp.yearStr, 10);
      const currentYear = new Date().getFullYear();
      const approxBirthYear = currentYear - ocrAge;
      return Math.abs(expectedBirthYear - approxBirthYear) <= 1;
   }

   return false;
}

/**
 * Hàm tổng hợp đối chiếu bệnh nhân trước khi cho phép áp dụng dữ liệu OCR
 */
export function verifyPatientMatch(params: {
   expectedFullName?: string | null;
   expectedDob?: string | null;
   ocrFullName?: string | null;
   ocrDob?: string | null;
   ocrAge?: number | null;
}): PatientVerificationResult {
   const expectedName = cleanPatientName(params.expectedFullName);
   const expectedDobNorm = normalizeDob(params.expectedDob);

   const ocrName = cleanPatientName(params.ocrFullName);
   const ocrDobNorm = normalizeDob(params.ocrDob);

   const hasExpectedName = Boolean(expectedName);
   const hasExpectedDob = Boolean(
      expectedDobNorm.dateStr || expectedDobNorm.yearStr,
   );
   const hasExpectedPatient = hasExpectedName || hasExpectedDob;

   // Nếu không có thông tin bệnh nhân mục tiêu để đối chiếu (ví dụ tạo mới hoàn toàn chưa nhập gì)
   if (!hasExpectedPatient) {
      return {
         hasExpectedPatient: false,
         isMatched: true,
         nameMatched: true,
         dobMatched: true,
         expectedName: "",
         expectedDobDisplay: "",
         ocrName,
         ocrDobDisplay:
            ocrDobNorm.displayStr ||
            (params.ocrAge ? `${params.ocrAge} tuổi` : ""),
      };
   }

   // 1. Kiểm tra họ và tên
   let nameMatched = true;
   if (hasExpectedName) {
      nameMatched = Boolean(ocrName && isNameMatching(expectedName, ocrName));
   }

   // 2. Kiểm tra ngày sinh / năm sinh
   let dobMatched = true;
   if (hasExpectedDob) {
      dobMatched = isDobMatching(
         params.expectedDob,
         params.ocrDob,
         params.ocrAge,
      );
   }

   const isMatched = nameMatched && dobMatched;

   let errorMessage = "";
   if (!isMatched) {
      if (!nameMatched && !dobMatched) {
         errorMessage =
            "Họ tên và ngày sinh trong tài liệu OCR không trùng khớp với bệnh nhân hiện tại.";
      } else if (!nameMatched) {
         errorMessage = `Họ tên trong tài liệu OCR (${ocrName || "chưa nhận diện"}) không trùng khớp với bệnh nhân (${expectedName}).`;
      } else {
         const ocrDisplay =
            ocrDobNorm.displayStr ||
            (params.ocrAge ? `${params.ocrAge} tuổi` : "chưa nhận diện");
         errorMessage = `Ngày sinh trong tài liệu OCR (${ocrDisplay}) không trùng khớp với bệnh nhân (${expectedDobNorm.displayStr}).`;
      }
   }

   return {
      hasExpectedPatient: true,
      isMatched,
      nameMatched,
      dobMatched,
      expectedName: params.expectedFullName?.trim() || "",
      expectedDobDisplay: expectedDobNorm.displayStr,
      ocrName,
      ocrDobDisplay:
         ocrDobNorm.displayStr ||
         (params.ocrAge ? `${params.ocrAge} tuổi` : ""),
      errorMessage,
   };
}
