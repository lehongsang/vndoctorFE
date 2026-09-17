import * as React from "react";
import { cn } from "@/lib/utils";

export interface CloverLoadingProps {
   size?: "xs" | "sm" | "md" | "lg";
   text?: string;
   className?: string;
   variant?: "primary" | "emerald" | "current" | "white";
   fullContainer?: boolean;
}

const sizeConfig = {
   xs: {
      container: "w-4 h-4",
      grid: "w-3.5 h-3.5 gap-0.5",
      dot: "w-1.5 h-1.5",
      text: "text-[10px]",
   },
   sm: {
      container: "w-6 h-6",
      grid: "w-4.5 h-4.5 gap-0.5",
      dot: "w-2 h-2",
      text: "text-xs",
   },
   md: {
      container: "w-9 h-9",
      grid: "w-6 h-6 gap-1",
      dot: "w-2.5 h-2.5",
      text: "text-sm",
   },
   lg: {
      container: "w-12 h-12",
      grid: "w-8 h-8 gap-1.5",
      dot: "w-3.5 h-3.5",
      text: "text-base",
   },
};

const variantConfig = {
   primary: "bg-primary shadow-xs shadow-primary/30",
   emerald: "bg-emerald-500 shadow-xs shadow-emerald-500/30",
   current: "bg-current",
   white: "bg-white/90 shadow-xs shadow-white/30",
};

export const CloverLoading = ({
   size = "md",
   text,
   className,
   variant = "primary",
   fullContainer = false,
}: CloverLoadingProps) => {
   const config = sizeConfig[size];
   const dotStyle = cn(
      "aspect-square rounded-full shrink-0",
      config.dot,
      variantConfig[variant],
   );

   const content = (
      <div
         role="status"
         aria-label="Đang tải..."
         className={cn(
            "flex flex-col items-center justify-center gap-3",
            className,
         )}
      >
         <div
            className={cn(
               "relative flex items-center justify-center",
               config.container,
            )}
         >
            <div
               className={cn(
                  "grid grid-cols-2 place-items-center animate-clover-spin",
                  config.grid,
               )}
            >
               <span className={dotStyle} />
               <span className={dotStyle} />
               <span className={dotStyle} />
               <span className={dotStyle} />
            </div>
         </div>

         {text && (
            <p
               className={cn(
                  "text-slate-500 font-medium animate-pulse",
                  config.text,
               )}
            >
               {text}
            </p>
         )}
         <span className="sr-only">Đang tải...</span>
      </div>
   );

   if (fullContainer) {
      return (
         <div className="col-span-full flex items-center justify-center h-48 w-full">
            {content}
         </div>
      );
   }

   return content;
};

export default CloverLoading;
