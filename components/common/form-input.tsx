"use client";

import * as React from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FormInputProps extends React.ComponentProps<"input"> {
   label?: React.ReactNode;
   required?: boolean;
   type?: string;
   error?: string;
   containerClassName?: string;
   clearable?: boolean;
   onClear?: () => void;
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
   clearable = true,
   onClear,
   value,
   defaultValue,
   onChange,
   ref,
   ...props
}: FormInputProps & { ref?: React.Ref<HTMLInputElement> }) => {
   const generatedId = React.useId();
   const inputId = id || generatedId;
   const [showPassword, setShowPassword] = React.useState(false);
   const inputRef = React.useRef<HTMLInputElement | null>(null);

   const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(
      defaultValue !== undefined ? String(defaultValue) : "",
   );

   const isPassword = type === "password";
   const inputType = isPassword ? (showPassword ? "text" : "password") : type;

   const currentVal =
      value !== undefined ? String(value ?? "") : uncontrolledValue;
   const isDefault =
      defaultValue !== undefined
         ? currentVal === String(defaultValue)
         : currentVal === "";
   const canClear =
      clearable &&
      !disabled &&
      !props.readOnly &&
      !isDefault &&
      currentVal.length > 0;

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
         setUncontrolledValue(e.target.value);
      }
      onChange?.(e);
   };

   const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const resetVal = defaultValue !== undefined ? String(defaultValue) : "";
      if (value === undefined) {
         setUncontrolledValue(resetVal);
      }
      onClear?.();

      if (inputRef.current) {
         inputRef.current.value = resetVal;
         const event = new Event("input", { bubbles: true });
         inputRef.current.dispatchEvent(event);
      }

      if (onChange) {
         const syntheticEvent = {
            target: { value: resetVal },
            currentTarget: { value: resetVal },
         } as React.ChangeEvent<HTMLInputElement>;
         onChange(syntheticEvent);
      }

      inputRef.current?.focus();
   };

   const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
         inputRef.current = node;
         if (typeof ref === "function") {
            ref(node);
         } else if (ref && typeof ref === "object") {
            (ref as React.MutableRefObject<HTMLInputElement | null>).current =
               node;
         }
      },
      [ref],
   );

   return (
      <Field invalid={Boolean(error)} className={containerClassName}>
         {label && (
            <FieldLabel
               htmlFor={inputId}
               className="text-xs font-medium text-slate-800 flex items-center flex-wrap gap-x-1"
            >
               {label}
               {required && (
                  <span className="text-red-600 font-medium inline-block">*</span>
               )}
            </FieldLabel>
         )}
         <div className="relative w-full">
            <Input
               id={inputId}
               ref={setRefs}
               type={inputType}
               required={required}
               disabled={disabled}
               value={value}
               defaultValue={defaultValue}
               onChange={handleChange}
               className={cn(
                  "h-10 px-4 rounded-sm border-slate-300",
                  isPassword && canClear
                     ? "pr-16"
                     : isPassword || canClear
                       ? "pr-10"
                       : "pr-4",
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
                  onClick={handleClear}
                  className={cn(
                     "absolute top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors cursor-pointer",
                     isPassword ? "right-9" : "right-3",
                  )}
               >
                  <X className="size-3.5" />
               </button>
            )}
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
         {error && <FieldError className="text-xs">{error}</FieldError>}
      </Field>
   );
};
