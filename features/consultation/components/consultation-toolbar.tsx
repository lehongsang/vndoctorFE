"use client";

import * as React from "react";
import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { FormSelect } from "@/components/common/form-select";
import { RefreshCcw } from "lucide-react";

export const CONSULTATION_STATUS_OPTIONS = [
   { label: "Tất cả trạng thái", value: "ALL" },
   { label: "Chờ hội chẩn", value: "PENDING" },
   { label: "Đang hội chẩn", value: "IN_PROGRESS" },
   { label: "Đã có kết luận", value: "COMPLETED" },
   { label: "Đã hủy", value: "CANCELLED" },
];

export interface ConsultationToolbarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   onSearch?: (value: string) => void;
   debounceDelay?: number;
   statusFilter?: string;
   onStatusFilterChange?: (status: string) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
}

export function ConsultationToolbar({
   searchText = "",
   onSearchChange,
   onSearch,
   debounceDelay,
   statusFilter = "ALL",
   onStatusFilterChange = () => {},
   refetch,
   isFetching = false,
   disabled = false,
}: ConsultationToolbarProps) {
   return (
      <div className="w-full flex items-center flex-wrap gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            onSearch={onSearch}
            debounceDelay={debounceDelay}
            disabled={disabled}
            containerClassName="flex-none min-w-56 w-72"
            placeholder="Tìm mã hội chẩn, lý do, kết luận..."
         />
         <FormSelect
            options={CONSULTATION_STATUS_OPTIONS}
            value={statusFilter}
            onValueChange={onStatusFilterChange}
            disabled={disabled}
            clearable={false}
            containerClassName="w-fit"
            className="w-48"
         />
         <CustomButton
            className="h-10 w-10 cursor-pointer"
            onClick={refetch}
            disabled={disabled || isFetching || !refetch}
            title="Làm mới danh sách"
         >
            <RefreshCcw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
         </CustomButton>
      </div>
   );
}
