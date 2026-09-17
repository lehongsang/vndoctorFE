"use client";

import * as React from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormTextareaProps extends React.ComponentProps<"textarea"> {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   containerClassName?: string;
}

export type IFormTextarea = FormTextareaProps;

export const FormTextarea = ({
   label,
   error,
   required,
   containerClassName,
   className,
   id,
   disabled,
   rows = 3,
   ref,
   ...props
}: FormTextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }) => {
   const generatedId = React.useId();
   const textareaId = id || generatedId;

   return (
      <Field invalid={Boolean(error)} className={containerClassName}>
         {label && (
            <FieldLabel
               htmlFor={textareaId}
               className="text-sm font-semibold text-slate-700"
            >
               {label}
               {required && (
                  <span className="ml-1 text-red-600 font-bold">*</span>
               )}
            </FieldLabel>
         )}
         <div className="relative w-full">
            <Textarea
               id={textareaId}
               ref={ref}
               rows={rows}
               required={required}
               disabled={disabled}
               className={cn("min-h-24 p-4 bg-slate-100 text-sm", className)}
               {...props}
            />
         </div>
         {error && <FieldError className="text-sm">{error}</FieldError>}
      </Field>
   );
};
