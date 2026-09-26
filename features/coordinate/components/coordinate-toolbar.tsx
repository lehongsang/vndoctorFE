"use client";

import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from "lucide-react";

interface CoordinateToolbarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
}

export function CoordinateToolbar({
   searchText = "",
   onSearchChange,
   refetch,
   isFetching,
   disabled = false,
}: CoordinateToolbarProps) {
   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            disabled={disabled}
            placeholder="Tìm theo mã, tên bệnh, mã ICD-10..."
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
