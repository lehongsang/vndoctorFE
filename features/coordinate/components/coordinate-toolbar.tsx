"use client";

import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { RefreshCcw } from "lucide-react";

interface CoordinateToolbarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   onSearch?: (value: string) => void;
   debounceDelay?: number;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
}

export function CoordinateToolbar({
   searchText = "",
   onSearchChange,
   onSearch,
   debounceDelay,
   refetch,
   isFetching,
   disabled = false,
}: CoordinateToolbarProps) {
   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            onSearch={onSearch}
            debounceDelay={debounceDelay}
            disabled={disabled}
            placeholder="Tìm kiếm theo tên bệnh nhân, mã hồ sơ..."
            className="min-w-60"
         />
         <CustomButton
            className="h-10 w-10"
            onClick={refetch}
            disabled={disabled || isFetching || !refetch}
         >
            <RefreshCcw />
         </CustomButton>
      </div>
   );
}
