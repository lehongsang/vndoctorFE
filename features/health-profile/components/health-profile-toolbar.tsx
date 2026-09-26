"use client";

import * as React from "react";
import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { FormSelect } from "@/components/common/form-select";
import { Plus, RefreshCcw } from "lucide-react";

export const SCOPE_OPTIONS = [
   { label: "Tất cả hồ sơ", value: "ALL" },
   { label: "Hồ sơ của tôi", value: "MY" },
];
export const LINK_STATUS_OPTIONS = [
   { label: "Tất cả liên kết", value: "ALL" },
   { label: "Liên kết", value: "ACTIVE" },
   { label: "Chờ liên kết", value: "PENDING" },
   { label: "Hết hạn liên kết", value: "UNLINKED" },
   { label: "Chưa liên kết", value: "NOT_LINKED" },
];
export const PACKAGE_TYPE_OPTIONS = [
   { label: "Tất cả gói", value: "ALL" },
   { label: "Gói cơ bản", value: "STANDARD" },
   { label: "Gói VIP", value: "VIP" },
];

export interface HealthProfileToolBarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   scopeSelected?: string;
   onChangeScope?: (scope: string) => void;
   linkStatusSelected?: string;
   onChangeLinkStatus?: (status: string) => void;
   packageTypeSelected?: string;
   onChangePackageType?: (type: string) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
   onClickCreate?: () => void;
}

export function HealthProfileToolBar({
   searchText = "",
   onSearchChange,
   scopeSelected = "ALL",
   onChangeScope = () => {},
   linkStatusSelected = "ALL",
   onChangeLinkStatus = () => {},
   packageTypeSelected = "ALL",
   onChangePackageType = () => {},
   refetch,
   isFetching = false,
   disabled = false,
   onClickCreate,
}: HealthProfileToolBarProps) {
   return (
      <div className="w-full flex items-center flex-wrap gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            disabled={disabled}
            containerClassName="flex-none min-w-56 w-72"
            placeholder="Nhập tên,SĐT,CCCD,Mã hồ sơ..."
         />
         <FormSelect
            options={SCOPE_OPTIONS}
            value={scopeSelected}
            onValueChange={onChangeScope}
            disabled={disabled}
            clearable={false}
            containerClassName="w-fit"
            className="w-40"
         />
         <FormSelect
            options={LINK_STATUS_OPTIONS}
            value={linkStatusSelected}
            onValueChange={onChangeLinkStatus}
            disabled={disabled}
            clearable={false}
            containerClassName="w-fit"
            className="w-48"
         />
         <FormSelect
            options={PACKAGE_TYPE_OPTIONS}
            value={packageTypeSelected}
            onValueChange={onChangePackageType}
            disabled={disabled}
            clearable={false}
            containerClassName="w-fit"
            className="w-40"
         />
         <CustomButton
            className="h-10 w-10"
            onClick={refetch}
            disabled={disabled || isFetching || !refetch}
         >
            <RefreshCcw />
         </CustomButton>
         <CustomButton
            onClick={onClickCreate}
            className="h-10 w-28"
            startIcon={<Plus />}
         >
            Thêm mới
         </CustomButton>
      </div>
   );
}

export default HealthProfileToolBar;
