"use client";

import { CustomButton } from "@/components/common/custom-button";
import { Input } from "@/components/ui/input";

interface CoordinateToolbarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
   onClickCreate?: () => void;
}

export function CoordinateToolbar({
   searchText = "",
   onSearchChange,
   refetch,
   isFetching,
   disabled = false,
   onClickCreate,
}: CoordinateToolbarProps) {
   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <Input
            value={searchText}
            onChange={onSearchChange}
            disabled={disabled}
            className="h-10 max-w-72 px-4 bg-white"
            placeholder="Tìm theo mã, tên bệnh, mã ICD-10..."
         />
         <CustomButton onClick={onClickCreate} className="h-10 w-28">
            Thêm mới
         </CustomButton>
         <CustomButton
            variant="outline"
            className="h-10 w-28"
            onClick={refetch}
            disabled={disabled || isFetching || !refetch}
         >
            Làm mới
         </CustomButton>
      </div>
   );
}
