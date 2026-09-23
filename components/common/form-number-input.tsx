"use client";

import * as React from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { X } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberFormatSourceInfo = Parameters<
   NonNullable<NumericFormatProps["onValueChange"]>
>[1];

export interface FormNumberInputProps extends Omit<
   NumericFormatProps,
   "customInput" | "size" | "getInputRef"
> {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   containerClassName?: string;
   clearable?: boolean;
   onClear?: () => void;
   ref?: React.Ref<HTMLInputElement>;
   getInputRef?: ((el: HTMLInputElement | null) => void) | React.Ref<HTMLInputElement>;
}

export const FormNumberInput = ({
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
   onValueChange,
   onChange,
   ref,
   getInputRef,
   ...props
}: FormNumberInputProps) => {
   const generatedId = React.useId();
   const inputId = id || generatedId;
   const inputRef = React.useRef<HTMLInputElement | null>(null);

   const [uncontrolledValue, setUncontrolledValue] = React.useState<
      string | number | null | undefined
   >(defaultValue);

   const currentVal = value !== undefined ? value : uncontrolledValue;
   const isDefault =
      defaultValue !== undefined
         ? currentVal === defaultValue
         : currentVal === "" || currentVal === null || currentVal === undefined;

   const canClear =
      clearable &&
      !disabled &&
      !props.readOnly &&
      !isDefault &&
      currentVal !== "" &&
      currentVal !== null &&
      currentVal !== undefined;

   const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const resetVal = defaultValue !== undefined ? defaultValue : "";
      if (value === undefined) {
         setUncontrolledValue(resetVal);
      }
      onClear?.();

      if (onValueChange) {
         onValueChange(
            {
               formattedValue: String(resetVal ?? ""),
               value: String(resetVal ?? ""),
               floatValue: typeof resetVal === "number" ? resetVal : undefined,
            },
            {
               event: undefined,
               source: "prop" as NumberFormatSourceInfo["source"],
            },
         );
      }

      if (inputRef.current) {
         inputRef.current.value = String(resetVal ?? "");
         const event = new Event("input", { bubbles: true });
         inputRef.current.dispatchEvent(event);
      }

      if (onChange) {
         const syntheticEvent = {
            target: { value: String(resetVal ?? "") },
            currentTarget: { value: String(resetVal ?? "") },
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
            (
               ref as React.MutableRefObject<HTMLInputElement | null>
            ).current = node;
         }
         if (typeof getInputRef === "function") {
            getInputRef(node);
         }
      },
      [ref, getInputRef],
   );

   return (
      <Field invalid={Boolean(error)} className={containerClassName}>
         {label && (
            <FieldLabel
               htmlFor={inputId}
               className="text-sm font-normal text-slate-600 max-w-full line-clamp-1"
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
               getInputRef={setRefs}
               customInput={Input}
               disabled={disabled}
               value={value}
               defaultValue={defaultValue}
               onValueChange={(values, sourceInfo) => {
                  if (value === undefined) {
                     setUncontrolledValue(values.value);
                  }
                  onValueChange?.(values, sourceInfo);
               }}
               onChange={onChange}
               className={cn(
                  "h-12 px-4 bg-slate-100 rounded-sm",
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
               >
                  <X className="size-3.5" />
               </button>
            )}
         </div>
         {error && <FieldError className="text-xs">{error}</FieldError>}
      </Field>
   );
};
