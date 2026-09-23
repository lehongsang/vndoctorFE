"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormTextareaProps extends React.ComponentProps<"textarea"> {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   containerClassName?: string;
   clearable?: boolean;
   onClear?: () => void;
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
   clearable = true,
   onClear,
   value,
   defaultValue,
   onChange,
   rows = 3,
   ref,
   ...props
}: FormTextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }) => {
   const generatedId = React.useId();
   const textareaId = id || generatedId;
   const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

   const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(
      defaultValue !== undefined ? String(defaultValue) : "",
   );

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

   const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

      if (textareaRef.current) {
         textareaRef.current.value = resetVal;
         const event = new Event("input", { bubbles: true });
         textareaRef.current.dispatchEvent(event);
      }

      if (onChange) {
         const syntheticEvent = {
            target: { value: resetVal },
            currentTarget: { value: resetVal },
         } as React.ChangeEvent<HTMLTextAreaElement>;
         onChange(syntheticEvent);
      }

      textareaRef.current?.focus();
   };

   const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
         textareaRef.current = node;
         if (typeof ref === "function") {
            ref(node);
         } else if (ref && typeof ref === "object") {
            (
               ref as React.MutableRefObject<HTMLTextAreaElement | null>
            ).current = node;
         }
      },
      [ref],
   );

   return (
      <Field invalid={Boolean(error)} className={containerClassName}>
         {label && (
            <FieldLabel
               htmlFor={textareaId}
               className="text-sm font-normal text-slate-600"
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
               ref={setRefs}
               rows={rows}
               required={required}
               disabled={disabled}
               value={value}
               defaultValue={defaultValue}
               onChange={handleChange}
               className={cn(
                  "min-h-24 p-4 rounded-sm bg-slate-100 text-sm",
                  canClear && "pr-10",
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
                  className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
               >
                  <X className="size-3.5" />
               </button>
            )}
         </div>
         {error && <FieldError className="text-xs">{error}</FieldError>}
      </Field>
   );
};
