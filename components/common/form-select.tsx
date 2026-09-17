"use client";

import * as React from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FormSelectOption {
   label: React.ReactNode;
   value: string;
   disabled?: boolean;
}

export interface FormSelectProps {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   placeholder?: string;
   options?: FormSelectOption[];
   value?: string;
   defaultValue?: string;
   onValueChange?: (value: string) => void;
   disabled?: boolean;
   id?: string;
   containerClassName?: string;
   className?: string;
   triggerClassName?: string;
   contentClassName?: string;
   side?: "bottom" | "top" | "left" | "right" | "inline-start" | "inline-end";
   align?: "start" | "center" | "end";
   alignItemWithTrigger?: boolean;
   sideOffset?: number;
   children?: React.ReactNode;
}

export type IFormSelect = FormSelectProps;

export const FormSelect = ({
   label,
   required,
   error,
   placeholder = "Chọn một tùy chọn",
   options,
   value,
   defaultValue,
   onValueChange,
   disabled,
   id,
   containerClassName,
   className,
   triggerClassName,
   contentClassName,
   side = "bottom",
   align = "start",
   alignItemWithTrigger = false,
   sideOffset = 4,
   children,
}: FormSelectProps) => {
   const generatedId = React.useId();
   const selectId = id || generatedId;

   const selectItems = React.useMemo(() => {
      if (!options) return undefined;
      return options.map((opt) => ({
         value: opt.value,
         label: opt.label,
      }));
   }, [options]);

   return (
      <Field invalid={Boolean(error)} className={containerClassName}>
         {label && (
            <FieldLabel
               htmlFor={selectId}
               className="text-sm font-semibold text-slate-700"
            >
               {label}
               {required && (
                  <span className="ml-1 text-red-600 font-bold">*</span>
               )}
            </FieldLabel>
         )}

         <div className="relative w-full">
            <Select
               items={selectItems}
               value={value}
               defaultValue={defaultValue}
               onValueChange={(val) => {
                  if (val !== null && val !== undefined) {
                     onValueChange?.(val);
                  }
               }}
               disabled={disabled}
            >
               <SelectTrigger
                  id={selectId}
                  className={cn(
                     "min-h-12 px-4 w-full bg-slate-100 text-sm font-normal",
                     error &&
                        "border-destructive focus-visible:ring-destructive/20",
                     triggerClassName,
                     className,
                  )}
               >
                  <SelectValue placeholder={placeholder}>
                     {(val: string | null) => {
                        if (val === null || val === undefined || val === "") {
                           return placeholder;
                        }
                        const found = options?.find((opt) => opt.value === val);
                        return found ? found.label : val;
                     }}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent
                  side={side}
                  align={align}
                  alignItemWithTrigger={alignItemWithTrigger}
                  sideOffset={sideOffset}
                  className={cn("p-2", contentClassName)}
               >
                  {options?.map((opt) => (
                     <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.disabled}
                     >
                        {opt.label}
                     </SelectItem>
                  ))}
                  {children}
               </SelectContent>
            </Select>
         </div>

         {error && <FieldError className="text-sm">{error}</FieldError>}
      </Field>
   );
};

export { SelectItem };
