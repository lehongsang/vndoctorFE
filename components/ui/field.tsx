"use client";

import * as React from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";

import { cn } from "@/lib/utils";

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn("flex flex-col gap-1.5 text-left w-full", className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "text-xs font-semibold text-slate-700 select-none data-disabled:opacity-50 data-invalid:text-rose-600 transition-colors",
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-slate-400 pl-0.5", className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn(
        "text-[11px] font-medium text-rose-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1",
        className
      )}
      {...props}
    />
  );
}

export { Field, FieldLabel, FieldDescription, FieldError };
