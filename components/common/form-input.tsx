"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FormInputProps extends React.ComponentProps<"input"> {
   label?: React.ReactNode;
   required?: boolean;
   type?: string;
   error?: string;
   containerClassName?: string;
}

export type IFormInput = FormInputProps;

export const FormInput = ({
   label,
   type = "text",
   error,
   required,
   containerClassName,
   className,
   id,
   disabled,
   ...props
}: FormInputProps) => {
   const generatedId = React.useId();
   const inputId = id || generatedId;
   const [showPassword, setShowPassword] = React.useState(false);

   const isPassword = type === "password";
   const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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
            <Input
               id={inputId}
               type={inputType}
               required={required}
               disabled={disabled}
               className={cn(
                  "h-12 px-4 bg-slate-100",
                  isPassword ? "pr-10" : "pr-4",
                  className,
               )}
               {...props}
            />
            {isPassword && (
               <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors disabled:pointer-events-none disabled:opacity-50"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
               >
                  {showPassword ? (
                     <EyeOff className="size-4" />
                  ) : (
                     <Eye className="size-4" />
                  )}
               </button>
            )}
         </div>
         {error && <FieldError className="text-sm">{error}</FieldError>}
      </Field>
   );
};
