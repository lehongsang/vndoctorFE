"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useGetAllChronicDiseasesQuery } from "@/store/api/chronic-diseases/chronic-diseases-api";
import { ChronicDisease } from "@/store/api/chronic-diseases/type";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CloverLoading } from "@/components/common/clover-loading";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface Icd10SuggestInputProps extends React.ComponentProps<"input"> {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   containerClassName?: string;
   clearable?: boolean;
   onClear?: () => void;
   onSelectDisease?: (disease: ChronicDisease) => void;
}

export const Icd10SuggestInput = React.forwardRef<
   HTMLInputElement,
   Icd10SuggestInputProps
>(
   (
      {
         label,
         required,
         error,
         containerClassName,
         className,
         id,
         disabled,
         clearable = true,
         onClear,
         value,
         defaultValue,
         onChange,
         onSelectDisease,
         placeholder = "Ví dụ: I10, E11...",
         ...props
      },
      ref,
   ) => {
      const generatedId = React.useId();
      const inputId = id || generatedId;
      const inputRef = useRef<HTMLInputElement | null>(null);
      const wrapperRef = useRef<HTMLDivElement>(null);

      const [isOpen, setIsOpen] = useState(false);
      const [internalValue, setInternalValue] = useState(
         value !== undefined
            ? String(value)
            : defaultValue !== undefined
              ? String(defaultValue)
              : "",
      );
      const [searchTerm, setSearchTerm] = useState("");
      const [debouncedSearch, setDebouncedSearch] = useState("");

      const currentVal =
         value !== undefined ? String(value ?? "") : internalValue;
      const canClear =
         clearable && !disabled && !props.readOnly && currentVal.length > 0;

      // Keep internalValue in sync with controlled value prop
      useEffect(() => {
         if (value !== undefined) {
            setInternalValue(String(value));
         }
      }, [value]);

      // Debounce search query
      useEffect(() => {
         const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
         }, 250);
         return () => clearTimeout(timer);
      }, [searchTerm]);

      // Only query chronic diseases when user actually types something
      const hasSearch = debouncedSearch.length > 0;
      const { data, isLoading, isFetching } = useGetAllChronicDiseasesQuery(
         {
            search: debouncedSearch,
            page: 1,
            limit: 6,
         },
         {
            skip: !isOpen || !hasSearch,
         },
      );

      const items = data?.items || [];

      // Forwarded ref + internal ref synchronization
      const setRefs = useCallback(
         (node: HTMLInputElement | null) => {
            inputRef.current = node;
            if (typeof ref === "function") {
               ref(node);
            } else if (ref && typeof ref === "object") {
               (
                  ref as React.MutableRefObject<HTMLInputElement | null>
               ).current = node;
            }
         },
         [ref],
      );

      // Close dropdown on outside click
      useEffect(() => {
         const handleClickOutside = (e: MouseEvent) => {
            if (
               wrapperRef.current &&
               !wrapperRef.current.contains(e.target as Node)
            ) {
               setIsOpen(false);
            }
         };
         document.addEventListener("mousedown", handleClickOutside);
         return () =>
            document.removeEventListener("mousedown", handleClickOutside);
      }, []);

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         const val = e.target.value;
         if (value === undefined) {
            setInternalValue(val);
         }
         setSearchTerm(val);
         setIsOpen(Boolean(val.trim()));
         onChange?.(e);
      };

      const handleSelect = (disease: ChronicDisease) => {
         const code = disease.icd10Code || disease.code;
         const selectedValue = disease.name ? `${code} - ${disease.name}` : code;

         if (value === undefined) {
            setInternalValue(selectedValue);
         }
         setSearchTerm("");
         setIsOpen(false);

         onSelectDisease?.(disease);

         if (inputRef.current) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
               window.HTMLInputElement.prototype,
               "value",
            )?.set;
            if (nativeInputValueSetter) {
               nativeInputValueSetter.call(inputRef.current, selectedValue);
            } else {
               inputRef.current.value = selectedValue;
            }
            const event = new Event("input", { bubbles: true });
            inputRef.current.dispatchEvent(event);
         }

         if (onChange && inputRef.current) {
            onChange({
               target: inputRef.current,
               currentTarget: inputRef.current,
            } as React.ChangeEvent<HTMLInputElement>);
         } else if (onChange) {
            const syntheticEvent = {
               target: { name: props.name || "icd10Code", value: selectedValue },
               currentTarget: { name: props.name || "icd10Code", value: selectedValue },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
         }
      };

      const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
         e.preventDefault();
         e.stopPropagation();

         setInternalValue("");
         setSearchTerm("");
         setIsOpen(false);

         if (inputRef.current) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
               window.HTMLInputElement.prototype,
               "value",
            )?.set;
            if (nativeInputValueSetter) {
               nativeInputValueSetter.call(inputRef.current, "");
            } else {
               inputRef.current.value = "";
            }
            const event = new Event("input", { bubbles: true });
            inputRef.current.dispatchEvent(event);
         }

         if (onChange && inputRef.current) {
            onChange({
               target: inputRef.current,
               currentTarget: inputRef.current,
            } as React.ChangeEvent<HTMLInputElement>);
         } else if (onChange) {
            const syntheticEvent = {
               target: { name: props.name || "icd10Code", value: "" },
               currentTarget: { name: props.name || "icd10Code", value: "" },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
         }

         onClear?.();

         inputRef.current?.focus();
      };

      return (
         <Field
            invalid={Boolean(error)}
            className={cn("relative w-full", containerClassName)}
         >
            {label && (
               <FieldLabel
                  htmlFor={inputId}
                  className="text-sm font-normal text-slate-600"
               >
                  {label}
                  {required && (
                     <span className="ml-1 text-red-600 font-bold">*</span>
                  )}
               </FieldLabel>
            )}

            <div ref={wrapperRef} className="relative w-full">
               <Input
                  id={inputId}
                  ref={setRefs}
                  disabled={disabled}
                  value={value}
                  defaultValue={defaultValue}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  className={cn(
                     "h-12 px-4 bg-slate-100 rounded-sm text-sm",
                     canClear ? "pr-10" : "pr-4",
                     className,
                  )}
                  {...props}
               />

               {canClear && (
                  <button
                     type="button"
                     tabIndex={-1}
                     disabled={disabled}
                     aria-label="Xóa nội dung"
                     title="Xóa nội dung"
                     onMouseDown={(e) => e.preventDefault()}
                     onClick={handleClear}
                     className="absolute right-3 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                     <X className="size-3.5" />
                  </button>
               )}

               {/* Chỉ hiển thị gợi ý khi người dùng đang nhập từ khóa tìm kiếm */}
               {isOpen && hasSearch && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in-50 slide-in-from-top-1">
                     {isLoading || isFetching ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-500">
                           <CloverLoading size="sm" />
                           <span>Đang tìm kiếm gợi ý...</span>
                        </div>
                     ) : items.length === 0 ? (
                        <div className="py-3 text-center text-xs text-slate-400">
                           Không có gợi ý mã bệnh phù hợp
                        </div>
                     ) : (
                        <div className="flex flex-col gap-0.5">
                           {items.map((item) => {
                              const code = item.icd10Code || item.code;
                              return (
                                 <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-left rounded-sm hover:bg-slate-100 transition-colors group cursor-pointer"
                                 >
                                    <div className="flex flex-col min-w-0">
                                       <span className="text-sm text-slate-800 truncate group-hover:text-primary transition-colors">
                                          {code} - {item.name}
                                       </span>
                                       {item.category && (
                                          <span className="text-xs text-slate-400 truncate">
                                             {item.category}
                                          </span>
                                       )}
                                    </div>
                                 </button>
                              );
                           })}
                        </div>
                     )}
                  </div>
               )}
            </div>

            {error && <FieldError className="text-xs">{error}</FieldError>}
         </Field>
      );
   },
);

Icd10SuggestInput.displayName = "Icd10SuggestInput";
