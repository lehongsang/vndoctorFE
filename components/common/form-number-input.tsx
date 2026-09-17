"use client";

import * as React from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FormNumberInputProps
   extends Omit<NumericFormatProps, "customInput" | "size"> {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   containerClassName?: string;
}

export const FormNumberInput = ({
   label,
   required,
   error,
   containerClassName,
   className,
   id,
   disabled,
   ...props
}: FormNumberInputProps) => {
   const generatedId = React.useId();
   const inputId = id || generatedId;

   return (
      <Field invalid={Boolean(error)} className={containerClassName}>
         {label && (
            <FieldLabel
               htmlFor={inputId}
               className="text-sm font-semibold text-slate-700"
            >
               {label}
               {required && (
                  <span className="ml-1 text-red-600 font-bold">*</span>
               )}
            </FieldLabel>
         )}
         <div className="relative w-full">
            <NumericFormat
               id={inputId}
               customInput={Input}
               disabled={disabled}
               className={cn("h-12 px-4 bg-slate-100", className)}
               {...props}
            />
         </div>
         {error && <FieldError>{error}</FieldError>}
      </Field>
   );
};
