"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CloverLoading } from "@/components/common/clover-loading";
import { cn } from "@/lib/utils";

export interface CustomButtonProps extends React.ComponentProps<typeof Button> {
   isLoading?: boolean;
   loadingText?: React.ReactNode;
   startIcon?: React.ReactNode;
   endIcon?: React.ReactNode;
   fullWidth?: boolean;
}

export type ICustomButton = CustomButtonProps;

export const CustomButton = ({
   children,
   isLoading = false,
   loadingText,
   startIcon,
   endIcon,
   fullWidth = false,
   disabled,
   className,
   ...props
}: CustomButtonProps) => {
   return (
      <Button
         disabled={disabled || isLoading}
         className={cn(
            "cursor-pointer",
            fullWidth && "w-full",
            disabled && "opacity-60",
            "h-10  flex items-center justify-center gap-2 rounded-sm",
            className,
         )}
         {...props}
      >
         {isLoading ? <CloverLoading size="xs" variant="current" /> : startIcon}
         {isLoading && loadingText ? loadingText : children}
         {!isLoading && endIcon}
      </Button>
   );
};
