"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/popover";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export interface CustomCalendarProps {
   label?: React.ReactNode;
   value?: string | Date | null;
   onChange?: (dateString: string, date?: Date) => void;
   placeholder?: string;
   disabled?: boolean;
   clearable?: boolean;
   required?: boolean;
   error?: string;
   className?: string;
   containerClassName?: string;
   minDate?: Date;
   maxDate?: Date;
   size?: "sm" | "default";
   id?: string;
}

const parseDateString = (val?: string | Date | null): Date | undefined => {
   if (!val) return undefined;
   if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
   if (typeof val === "string") {
      const parts = val.split("-");
      if (parts.length === 3) {
         const year = parseInt(parts[0], 10);
         const month = parseInt(parts[1], 10) - 1;
         const day = parseInt(parts[2], 10);
         const d = new Date(year, month, day);
         return isNaN(d.getTime()) ? undefined : d;
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
   }
   return undefined;
};

const formatDateToString = (d?: Date): string => {
   if (!d || isNaN(d.getTime())) return "";
   const year = d.getFullYear();
   const month = String(d.getMonth() + 1).padStart(2, "0");
   const day = String(d.getDate()).padStart(2, "0");
   return `${year}-${month}-${day}`;
};

export function CustomCalendar({
   label,
   value,
   onChange,
   placeholder = "Chọn ngày",
   disabled = false,
   clearable = true,
   required = false,
   error,
   className,
   containerClassName,
   minDate,
   maxDate,
   size = "sm",
   id,
}: CustomCalendarProps) {
   const [open, setOpen] = useState(false);
   const generatedId = React.useId();
   const elementId = id || generatedId;

   const selectedDate = useMemo(() => parseDateString(value), [value]);

   const formattedDisplay = useMemo(() => {
      if (!selectedDate) return "";
      try {
         return format(selectedDate, "dd/MM/yyyy");
      } catch {
         return "";
      }
   }, [selectedDate]);

   const handleSelectDate = (date: Date | undefined) => {
      const dateStr = formatDateToString(date);
      onChange?.(dateStr, date);
      setOpen(false);
   };

   const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onChange?.("", undefined);
      setOpen(false);
   };

   const handleToday = () => {
      const today = new Date();
      const dateStr = formatDateToString(today);
      onChange?.(dateStr, today);
      setOpen(false);
   };

   return (
      <Field
         invalid={Boolean(error)}
         className={cn(
            "relative flex flex-col gap-1 w-full",
            containerClassName,
         )}
      >
         {label && (
            <FieldLabel
               htmlFor={elementId}
               className={cn(
                  "font-medium text-slate-500",
                  size === "sm"
                     ? "text-xs"
                     : "text-sm text-slate-600 font-normal",
               )}
            >
               {label}
               {required && (
                  <span className="ml-1 text-red-600 font-bold">*</span>
               )}
            </FieldLabel>
         )}

         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
               id={elementId}
               type="button"
               disabled={disabled}
               className={cn(
                  "flex w-full items-center justify-between border border-slate-200 bg-white font-normal text-left transition-colors outline-none cursor-pointer select-none",
                  "hover:bg-slate-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                  size === "sm"
                     ? "h-8 px-2.5 rounded-sm text-xs"
                     : "h-10 px-3 rounded-md text-sm",
                  !selectedDate && "text-slate-400",
                  disabled && "cursor-not-allowed opacity-50 bg-slate-100",
                  error &&
                     "border-destructive focus-visible:ring-destructive/20",
                  className,
               )}
            >
               <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                  <CalendarIcon
                     className={cn(
                        "text-slate-400 shrink-0",
                        size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4",
                     )}
                  />
                  <span
                     className={cn(
                        "truncate",
                        selectedDate
                           ? "text-slate-800 font-medium"
                           : "text-slate-400",
                     )}
                  >
                     {formattedDisplay || placeholder}
                  </span>
               </div>

               {clearable && selectedDate && !disabled && (
                  <span
                     role="button"
                     tabIndex={0}
                     onClick={handleClear}
                     className="ml-1.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                     title="Xóa ngày"
                  >
                     <X
                        className={cn(
                           size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
                        )}
                     />
                  </span>
               )}
            </PopoverTrigger>

            <PopoverContent
               align="start"
               className="w-auto p-0 bg-white border border-slate-200 shadow-lg rounded-md"
            >
               <div className="p-1">
                  <Calendar
                     mode="single"
                     selected={selectedDate}
                     onSelect={handleSelectDate}
                     locale={vi}
                     disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                     }}
                  />
               </div>

               <div className="flex items-center justify-between p-2 border-t border-slate-100 bg-slate-50/70">
                  <button
                     type="button"
                     onClick={handleToday}
                     className="text-xs font-semibold text-primary hover:underline cursor-pointer px-1 py-0.5"
                  >
                     Hôm nay
                  </button>
                  {selectedDate && (
                     <button
                        type="button"
                        onClick={handleClear}
                        className="text-xs font-medium text-slate-500 hover:text-rose-600 hover:underline cursor-pointer px-1 py-0.5"
                     >
                        Xóa chọn
                     </button>
                  )}
               </div>
            </PopoverContent>
         </Popover>

         {error && <FieldError className="text-xs">{error}</FieldError>}
      </Field>
   );
}
