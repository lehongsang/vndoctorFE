"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<
   React.ComponentProps<"input">,
   "type"
> {
   containerClassName?: string;
   onClear?: () => void;
   showClearButton?: boolean;
   clearable?: boolean;
   startIcon?: React.ReactNode;
   debounceDelay?: number;
   onDebounce?: (value: string) => void;
   onSearch?: (value: string) => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
   (
      {
         value,
         defaultValue,
         onChange,
         onClear,
         showClearButton = true,
         clearable,
         startIcon,
         placeholder = "Tìm kiếm...",
         containerClassName,
         className,
         disabled,
         debounceDelay = 350,
         onDebounce,
         onSearch,
         ...props
      },
      forwardedRef,
   ) => {
      const innerRef = React.useRef<HTMLInputElement>(null);
      React.useImperativeHandle(
         forwardedRef,
         () => innerRef.current as HTMLInputElement,
      );

      // Quản lý giá trị hiển thị bên trong input
      const [innerValue, setInnerValue] = React.useState<string>(
         String(value ?? defaultValue ?? ""),
      );

      // Đồng bộ khi prop `value` bên ngoài thay đổi
      React.useEffect(() => {
         if (value !== undefined) {
            setInnerValue(String(value ?? ""));
         }
      }, [value]);

      const debounceCallback = onDebounce || onSearch;
      const debounceCallbackRef = React.useRef(debounceCallback);
      React.useEffect(() => {
         debounceCallbackRef.current = debounceCallback;
      }, [debounceCallback]);

      const isFirstRender = React.useRef(true);

      // Debounce gọi callback khi người dùng tạm ngừng nhập
      React.useEffect(() => {
         if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
         }

         if (!debounceCallbackRef.current) return;

         const timer = setTimeout(() => {
            debounceCallbackRef.current?.(innerValue);
         }, debounceDelay);

         return () => clearTimeout(timer);
      }, [innerValue, debounceDelay]);

      const hasValue = Boolean(innerValue.length > 0);

      const isClearable = clearable ?? showClearButton;
      const isDefault =
         defaultValue !== undefined
            ? innerValue === String(defaultValue)
            : innerValue === "";
      const canClear = isClearable && !disabled && !isDefault && hasValue;

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         const nextVal = e.target.value;
         setInnerValue(nextVal);
         onChange?.(e);
      };

      const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
         e.preventDefault();
         e.stopPropagation();
         const resetVal =
            defaultValue !== undefined ? String(defaultValue) : "";
         setInnerValue(resetVal);
         onClear?.();
         debounceCallback?.(resetVal);
         if (onChange) {
            const syntheticEvent = {
               target: { value: resetVal },
               currentTarget: { value: resetVal },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
         }
         innerRef.current?.focus();
      };

      return (
         <div className={cn("relative", containerClassName)}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
               {startIcon ?? <Search className="w-4 h-4" />}
            </div>
            <Input
               ref={innerRef}
               type="text"
               value={innerValue}
               onChange={handleChange}
               disabled={disabled}
               placeholder={placeholder}
               className={cn(
                  "h-10 pl-9 text-sm border-slate-300 rounded-sm placeholder:text-slate-400",
                  canClear ? "pr-9" : "pr-3",
                  className,
               )}
               {...props}
            />
            {canClear && (
               <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label="Xóa tìm kiếm"
                  title="Xóa tìm kiếm"
               >
                  <X className="size-3.5" />
               </button>
            )}
         </div>
      );
   },
);

SearchInput.displayName = "SearchInput";
