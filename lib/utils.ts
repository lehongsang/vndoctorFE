import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Tính số tuổi chính xác từ ngày sinh (chuỗi string YYYY-MM-DD, ISO string hoặc đối tượng Date).
 * @param dob Ngày sinh
 * @returns Số tuổi (number) hoặc null nếu ngày sinh không hợp lệ hoặc để trống.
 */
export function calculateAge(dob?: string | Date | null): number | null {
  if (!dob) return null

  const birthDate = typeof dob === "string" ? new Date(dob) : dob

  if (isNaN(birthDate.getTime())) {
    if (typeof dob === "string") {
      const match = dob.match(/^(\d{4})/)
      if (match) {
        const year = parseInt(match[1], 10)
        const currentYear = new Date().getFullYear()
        if (!isNaN(year) && year > 1900 && year <= currentYear) {
          return Math.max(0, currentYear - year)
        }
      }
    }
    return null
  }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age >= 0 ? age : 0
}

/**
 * Định dạng tuổi hiển thị dạng text (ví dụ: "40 tuổi" hoặc "—").
 * @param dob Ngày sinh
 * @param unit Đơn vị kèm theo (mặc định: "tuổi")
 * @param fallback Chuỗi trả về khi không tính được tuổi (mặc định: "—")
 */
export function formatAge(
  dob?: string | Date | null,
  unit: string = "tuổi",
  fallback: string = "—"
): string {
  const age = calculateAge(dob)
  if (age === null) return fallback
  return unit ? `${age} ${unit}` : `${age}`
}

