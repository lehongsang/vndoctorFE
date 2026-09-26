"use client";

import React from "react";
import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { FormSelect } from "@/components/common/form-select";
import {
   CarePackageStatus,
   CarePackageType,
} from "@/store/api/care-package/type";
import { RefreshCcw } from "lucide-react";

export const CARE_PACKAGE_TYPE_OPTIONS: {
   label: string;
   value: CarePackageType;
}[] = [
   { label: "Gói Tiêu chuẩn", value: "STANDARD" },
   { label: "Gói VIP", value: "VIP" },
];

export const CARE_PACKAGE_STATUS_OPTIONS: {
   label: string;
   value: CarePackageStatus;
}[] = [
   { label: "Đang hoạt động", value: "ACTIVE" },
   { label: "Ngừng hoạt động", value: "INACTIVE" },
];

const PACKAGE_TYPE_FILTER_OPTIONS = [
   { label: "Tất cả loại gói", value: "ALL" },
   ...CARE_PACKAGE_TYPE_OPTIONS,
];

const STATUS_FILTER_OPTIONS = [
   { label: "Tất cả trạng thái", value: "ALL" },
   ...CARE_PACKAGE_STATUS_OPTIONS,
];

export interface CarePackageToolbarProps {
   searchText: string;
   onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   packageType: CarePackageType | "ALL";
   onPackageTypeChange: (value: CarePackageType | "ALL") => void;
   status: CarePackageStatus | "ALL";
   onStatusChange: (value: CarePackageStatus | "ALL") => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
   onClickCreate: () => void;
}

export function CarePackageToolbar({
   searchText,
   onSearchChange,
   packageType = "ALL",
   onPackageTypeChange,
   status = "ALL",
   onStatusChange,
   refetch,
   isFetching = false,
   disabled = false,
   onClickCreate,
}: CarePackageToolbarProps) {
   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         {/* Ô tìm kiếm */}
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            disabled={disabled}
            containerClassName="min-w-60 max-w-sm"
            placeholder="Tìm theo tên, mã gói..."
         />

         {/* Lọc loại gói */}
         <div className="w-48">
            <FormSelect
               value={packageType}
               disabled={disabled}
               placeholder="Tất cả loại gói"
               options={PACKAGE_TYPE_FILTER_OPTIONS}
               onValueChange={(val) =>
                  onPackageTypeChange(val as CarePackageType | "ALL")
               }
               triggerClassName="min-h-10 h-10 bg-white"
            />
         </div>

         {/* Lọc trạng thái */}
         <div className="w-48">
            <FormSelect
               value={status}
               disabled={disabled}
               placeholder="Tất cả trạng thái"
               options={STATUS_FILTER_OPTIONS}
               onValueChange={(val) =>
                  onStatusChange(val as CarePackageStatus | "ALL")
               }
               triggerClassName="min-h-10 h-10 bg-white"
            />
         </div>

         {/* Nút hành động */}
         <div className="flex items-center gap-2 ml-auto">
            <CustomButton
               onClick={onClickCreate}
               disabled={disabled}
               className="h-10 px-4"
            >
               Thêm mới gói
            </CustomButton>

            <CustomButton
               onClick={refetch}
               disabled={disabled || isFetching || !refetch}
               className="h-10 w-10"
            >
               <RefreshCcw />
            </CustomButton>
         </div>
      </div>
   );
}
