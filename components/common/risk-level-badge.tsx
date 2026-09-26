import React from "react";
import { cn } from "@/lib/utils";
import { RiskLevel } from "@/store/api/risk-factor-assessment/type";

export interface RiskLevelConfigItem {
   label: string;
   outline: string;
   solid: string;
   container: string;
   borderHover: string;
}

export const RISK_LEVEL_CONFIG: Record<RiskLevel, RiskLevelConfigItem> = {
   VERY_HIGH: {
      label: "Rất cao",
      outline: "bg-red-100 text-red-950 border-red-300 font-semibold",
      solid: "bg-red-900 text-white border-red-950 font-semibold",
      container: "bg-red-50/90 border-red-300 text-red-950",
      borderHover: "hover:border-red-400",
   },
   HIGH: {
      label: "Cao",
      outline: "bg-red-50 text-red-600 border-red-200 font-semibold",
      solid: "bg-red-600 text-white border-red-600 font-semibold",
      container: "bg-red-50/50 border-red-200 text-red-900",
      borderHover: "hover:border-red-300",
   },
   LOW: {
      label: "Thấp - Trung bình",
      outline: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
      solid: "bg-emerald-600 text-white border-emerald-600 font-semibold",
      container: "bg-emerald-50/80 border-emerald-300 text-emerald-950",
      borderHover: "hover:border-emerald-300",
   },
};

const DEFAULT_CONFIG: RiskLevelConfigItem = {
   label: "Chưa xác định",
   outline: "bg-slate-50 text-slate-700 border-slate-200 font-medium",
   solid: "bg-slate-600 text-white border-slate-700 font-medium",
   container: "bg-slate-50 border-slate-200 text-slate-800",
   borderHover: "hover:border-slate-300",
};

export const RISK_LEVEL_OPTIONS: { label: string; value: RiskLevel }[] = [
   { label: "Thấp - Trung bình", value: "LOW" },
   { label: "Cao", value: "HIGH" },
   { label: "Rất cao", value: "VERY_HIGH" },
];

export function getRiskLevelConfig(level?: string | null): RiskLevelConfigItem {
   if (!level) return DEFAULT_CONFIG;
   return RISK_LEVEL_CONFIG[level as RiskLevel] || {
      ...DEFAULT_CONFIG,
      label: level,
   };
}

export function getRiskLevelLabel(level?: string | null): string {
   return getRiskLevelConfig(level).label;
}

export function getRiskContainerClass(level?: string | null): string {
   return getRiskLevelConfig(level).container;
}

export interface RiskLevelBadgeProps
   extends React.HTMLAttributes<HTMLSpanElement> {
   level?: RiskLevel | string | null;
   variant?: "outline" | "solid";
   size?: "sm" | "md" | "lg";
   customLabel?: string;
}

export const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({
   level,
   variant = "outline",
   size = "sm",
   customLabel,
   className,
   ...props
}) => {
   const config = getRiskLevelConfig(level);
   const labelText = customLabel || config.label;

   const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
   }[size];

   const variantClass = variant === "solid" ? config.solid : config.outline;

   return (
      <span
         className={cn(
            "inline-flex items-center justify-center rounded-full border whitespace-nowrap transition-colors",
            sizeClasses,
            variantClass,
            className,
         )}
         {...props}
      >
         {labelText}
      </span>
   );
};

export default RiskLevelBadge;
