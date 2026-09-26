import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { FormSelect } from "@/components/common/form-select";
import { FACILITY_TYPE_OPTIONS, FacilityType } from "@/store/api/facility/type";
import { RefreshCcw } from "lucide-react";

interface FacilityToolBarProps {
   searchText?: string;
   onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   facilityType?: FacilityType | "ALL";
   onFacilityTypeChange?: (value: string) => void;
   refetch?: () => void;
   isFetching?: boolean;
   disabled?: boolean;
   onClickCreate?: () => void;
}

export default function FacilityToolBar({
   searchText = "",
   onSearchChange,
   facilityType = "ALL",
   onFacilityTypeChange,
   refetch,
   isFetching,
   disabled = false,
   onClickCreate,
}: FacilityToolBarProps) {
   const options = [
      { label: "Tất cả loại cơ sở", value: "ALL" },
      ...FACILITY_TYPE_OPTIONS,
   ];

   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <SearchInput
            value={searchText}
            onChange={onSearchChange}
            placeholder="Tìm kiếm theo tên, mã..."
         />
         <div className="w-64">
            <FormSelect
               value={facilityType}
               onValueChange={(val) => onFacilityTypeChange?.(val ?? "ALL")}
               placeholder="Tất cả loại cơ sở"
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
