"use client";

import * as React from "react";
import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { FormSelect } from "@/components/common/form-select";
import { RefreshCcw } from "lucide-react";
import { CareRequestStatus } from "@/store/api/care-request/type";

export const STATUS_OPTIONS = [
   { label: "Tất cả trạng thái", value: "ALL" },
   { label: "Chờ tiếp nhận", value: "PENDING" },
   { label: "Đang xử lý", value: "IN_PROGRESS" },
   { label: "Đã hoàn thành", value: "RESOLVED" },
   { label: "Đã hủy", value: "CANCELLED" },
];

export interface CareRequestToolbarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   statusFilter?: CareRequestStatus | "ALL";
   onStatusFilterChange?: (status: string) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
}

export function CareRequestToolbar({
   searchText = "",
   onSearchChange,
   statusFilter = "ALL",
   onStatusFilterChange = () => {},
   refetch,
   isFetching = false,
   disabled = false,
}: CareRequestToolbarProps) {
   return (
      <div className="w-full flex items-center flex-wrap gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            disabled={disabled}
            containerClassName="flex-none min-w-56 w-72"
            placeholder="Tìm mã yêu cầu, tiêu đề, mô tả..."
         />
         <FormSelect
            options={STATUS_OPTIONS}
            value={statusFilter}
            onValueChange={onStatusFilterChange}
            disabled={disabled}
            clearable={false}
            containerClassName="w-fit"
            className="w-48"
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

export default CareRequestToolbar;
