import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { FormSelect } from "@/components/common/form-select";
import { STAFF_ROLE_OPTIONS, StaffRole } from "@/types/staff";
import { RefreshCcw } from "lucide-react";

interface StaffToolBarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   role?: StaffRole | "ALL";
   onRoleChange?: (value: string) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
   onClickCreate?: () => void;
}

export default function StaffToolBar({
   searchText = "",
   onSearchChange,
   role = "ALL",
   onRoleChange,
   refetch,
   isFetching,
   disabled = false,
   onClickCreate,
}: StaffToolBarProps) {
   const options = [
      { label: "Tất cả vai trò", value: "ALL" },
      ...STAFF_ROLE_OPTIONS,
   ];

   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            placeholder="Tìm kiếm theo tên, mã, email..."
         />
         <div className="w-64">
            <FormSelect
               value={role}
               onValueChange={(val) => onRoleChange?.(val ?? "ALL")}
               placeholder="Tất cả vai trò"
               options={options}
               clearable={false}
               triggerClassName="min-h-10 w-full bg-white"
            />
         </div>
         <CustomButton onClick={onClickCreate} className="h-10 w-28">
            Thêm mới
         </CustomButton>
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
