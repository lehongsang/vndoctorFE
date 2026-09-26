"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/popover";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import CloverLoading from "./clover-loading";

export interface FormComboboxOption {
   label: string;
   value: string;
   subLabel?: string;
   disabled?: boolean;
}

export interface FormComboboxProps {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   placeholder?: string;
   searchPlaceholder?: string;
   emptyText?: string;
   options?: FormComboboxOption[];
   value?: string;
   onValueChange?: (value: string) => void;
   onSearchChange?: (query: string) => void;
   serverSearch?: boolean;
   disabled?: boolean;
   isLoading?: boolean;
   loadingText?: string;
   clearable?: boolean;
   id?: string;
   containerClassName?: string;
   className?: string;
}

const removeAccents = (str: string): string =>
   str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();

export const FormCombobox = ({
   label,
   required,
   error,
   placeholder = "Chọn một tùy chọn...",
   searchPlaceholder = "Tìm kiếm...",
   emptyText = "Không tìm thấy kết quả phù hợp.",
   options = [],
   value,
   onValueChange,
   onSearchChange,
   serverSearch = false,
   disabled = false,
   isLoading = false,
   loadingText = "Đang tải dữ liệu...",
   clearable = false,
   id,
   containerClassName,
   className,
}: FormComboboxProps) => {
   const [open, setOpen] = React.useState(false);
   const [searchQuery, setSearchQuery] = React.useState("");
   const generatedId = React.useId();
   const comboboxId = id || generatedId;

   const [prevValue, setPrevValue] = React.useState(value);
   const [cachedOption, setCachedOption] = React.useState<
      FormComboboxOption | undefined
   >(() => options.find((opt) => opt.value === value));

   if (prevValue !== value) {
      setPrevValue(value);
      const found = options.find((opt) => opt.value === value);
      setCachedOption(found);
   }

   const selectedOption = React.useMemo(() => {
      if (!value) return undefined;
      const found = options.find((opt) => opt.value === value);
      return (
         found ?? (cachedOption?.value === value ? cachedOption : undefined)
      );
   }, [options, value, cachedOption]);

   const filteredOptions = React.useMemo(() => {
      if (serverSearch) return options;
      const q = removeAccents(searchQuery.trim());
      if (!q) return options;
      return options.filter((opt) => {
         const labelMatch = removeAccents(opt.label).includes(q);
         const subMatch = opt.subLabel
            ? removeAccents(opt.subLabel).includes(q)
            : false;
         return labelMatch || subMatch;
      });
   }, [options, searchQuery, serverSearch]);

   const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen && serverSearch && searchQuery) {
         setSearchQuery("");
         onSearchChange?.("");
      }
   };

   return (
      <Field invalid={Boolean(error)} className={containerClassName}>
         {label && (
            <FieldLabel
               htmlFor={comboboxId}
               className="text-xs font-medium text-slate-800"
            >
               {label}
               {required && (
                  <span className="ml-1 text-red-600 font-bold">*</span>
               )}
            </FieldLabel>
         )}

         <div className="relative w-full">
            <Popover open={open} onOpenChange={handleOpenChange}>
               <PopoverTrigger
                  type="button"
                  id={comboboxId}
                  disabled={disabled}
                  className={cn(
                     "flex h-10 w-full items-center justify-between rounded-sm border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-left font-normal transition-colors outline-none cursor-pointer",
                     "hover:bg-slate-200/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                     !selectedOption && "text-slate-500",
                     disabled && "cursor-not-allowed opacity-50",
                     error &&
                        "border-destructive focus-visible:ring-destructive/20",
                     className,
                  )}
               >
                  <span className="truncate flex-1">
                     {selectedOption ? (
                        <span className="text-slate-900 font-medium">
                           {selectedOption.label}
                        </span>
                     ) : (
                        <span>{placeholder}</span>
                     )}
                  </span>

                  <div className="flex items-center ml-2 shrink-0">
                     {clearable && value && !disabled && !isLoading && (
                        <span
                           role="button"
                           tabIndex={0}
                           onClick={(e) => {
                              e.stopPropagation();
                              onValueChange?.("");
                           }}
                           className="p-1 hover:bg-slate-300/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors mr-1 cursor-pointer"
                        >
                           <X className="size-4" />
                        </span>
                     )}
                     <ChevronDown className="size-4 opacity-50" />
                  </div>
               </PopoverTrigger>

               <PopoverContent
                  align="start"
                  className="w-(--anchor-width) min-w-64 max-w-[95vw] mt-1 p-2 rounded-md overflow-hidden bg-white"
               >
                  <Command shouldFilter={false} className="w-full">
                     <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onValueChange={(val) => {
                           setSearchQuery(val);
                           onSearchChange?.(val);
                        }}
                        className="text-sm"
                     />
                     <CommandList className="max-h-60 overflow-y-auto py-1">
                        {isLoading ? (
                           <div className="flex items-center justify-center py-6 text-sm text-slate-500 gap-2">
                              <CloverLoading size="sm" />
                              <span>{loadingText}</span>
                           </div>
                        ) : filteredOptions.length === 0 ? (
                           <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                              {emptyText}
                           </CommandEmpty>
                        ) : (
                           <CommandGroup>
                              {filteredOptions.map((opt) => (
                                 <CommandItem
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={opt.disabled}
                                    onSelect={() => {
                                       onValueChange?.(opt.value);
                                       setOpen(false);
                                       setSearchQuery("");
                                       if (serverSearch) {
                                          onSearchChange?.("");
                                       }
                                    }}
                                    className="flex items-center justify-between py-2 cursor-pointer text-sm rounded hover:bg-slate-100 data-selected:bg-slate-100"
                                 >
                                    <div className="flex flex-col pr-2">
                                       <span className="font-medium text-slate-800">
                                          {opt.label}
                                       </span>
                                       {opt.subLabel && (
                                          <span className="text-xs text-slate-500">
                                             {opt.subLabel}
                                          </span>
                                       )}
                                    </div>
                                    <Check
                                       className={cn(
                                          "size-4 text-primary shrink-0",
                                          value === opt.value
                                             ? "opacity-100"
                                             : "opacity-0",
                                       )}
                                    />
                                 </CommandItem>
                              ))}
                           </CommandGroup>
                        )}
                     </CommandList>
                  </Command>
               </PopoverContent>
            </Popover>
         </div>

         {error && <FieldError className="text-sm">{error}</FieldError>}
      </Field>
   );
};
