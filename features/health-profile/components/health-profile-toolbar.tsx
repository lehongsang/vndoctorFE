"use client";

import * as React from "react";
import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";

export const HEALTH_PROFILE_STATUS_OPTIONS = [
   { label: "Hoạt động", value: "ACTIVE" },
   { label: "Tạm khóa", value: "INACTIVE" },
];

export interface HealthProfileToolBarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
   onClickCreate?: () => void;
}

export function HealthProfileToolBar({
   searchText = "",
   onSearchChange,
   refetch,
   isFetching = false,
   disabled = false,
   onClickCreate,
}: HealthProfileToolBarProps) {
   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            disabled={disabled}
            containerClassName="flex-none w-72"
            placeholder="Tìm theo tên, mã hồ sơ, SĐT, CCCD..."
         />
         <CustomButton onClick={onClickCreate} className="h-10 w-28">
            Thêm mới
         </CustomButton>
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

export default HealthProfileToolBar;
