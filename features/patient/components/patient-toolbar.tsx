"use client";

import * as React from "react";
import { CustomButton } from "@/components/common/custom-button";
import { Input } from "@/components/ui/input";

export interface PatientToolBarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
}

export function PatientToolBar({
   searchText = "",
   onSearchChange,
   refetch,
   isFetching = false,
   disabled = false,
}: PatientToolBarProps) {
   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <Input
            value={searchText}
            onChange={onSearchChange}
            disabled={disabled}
            className="h-10 max-w-72 px-4 bg-white"
            placeholder="Tìm theo tên, mã hồ sơ, SĐT, CCCD..."
         />
         <CustomButton
            variant="outline"
            className="h-10 w-28 bg-white"
            onClick={refetch}
            disabled={disabled || isFetching || !refetch}
         >
            Làm mới
         </CustomButton>
      </div>
   );
}

export default PatientToolBar;
