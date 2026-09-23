import { useState, useEffect } from "react";

/**
 * Hook trì hoãn giá trị cập nhật (debounce) theo khoảng thời gian delay
 * @param value Giá trị cần debounce
 * @param delay Thời gian delay tính theo ms (mặc định 350ms)
 * @returns Giá trị sau khi debounce
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
   const [debouncedValue, setDebouncedValue] = useState<T>(value);

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedValue(value);
      }, delay);

      return () => {
         clearTimeout(timer);
      };
   }, [value, delay]);

   return debouncedValue;
}
