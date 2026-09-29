"use client";

import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";

interface ChronicDiseaseToolBarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   onSearch?: (value: string) => void;
   debounceDelay?: number;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
   onClickCreate?: () => void;
}

export default function ChronicDiseaseToolBar({
   searchText = "",
   onSearchChange,
   onSearch,
   debounceDelay,
   refetch,
   isFetching,
   disabled = false,
   onClickCreate,
}: ChronicDiseaseToolBarProps) {
   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            onSearch={onSearch}
            debounceDelay={debounceDelay}
            disabled={disabled}
            className="h-10 max-w-72 px-4 bg-white"
            placeholder="Tìm theo mã, tên bệnh, mã ICD-10..."
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
