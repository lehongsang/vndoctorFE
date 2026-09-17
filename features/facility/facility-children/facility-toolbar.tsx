import { CustomButton } from "@/components/common/custom-button";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { FACILITY_TYPE_OPTIONS, FacilityType } from "@/store/api/facility/type";

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
   const selectedLabel =
      facilityType === "ALL" || !facilityType
         ? "Tất cả loại cơ sở"
         : FACILITY_TYPE_OPTIONS.find((opt) => opt.value === facilityType)
              ?.label || facilityType;

   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <Input
            value={searchText}
            onChange={onSearchChange}
            className="h-10 max-w-72 px-4 bg-white"
            placeholder="Tìm kiếm theo tên, mã..."
         />
         <div className="w-64">
            <Select
               value={facilityType}
               onValueChange={(val) => onFacilityTypeChange?.(val ?? "ALL")}
            >
               <SelectTrigger className="min-h-10 w-full bg-white cursor-pointer">
                  <SelectValue placeholder="Tất cả loại cơ sở">
                     {selectedLabel}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent
                  side="bottom"
                  alignItemWithTrigger={false}
                  className="p-2 shadow-none"
               >
                  <SelectItem value="ALL">Tất cả loại cơ sở</SelectItem>
                  {FACILITY_TYPE_OPTIONS.map((opt) => (
                     <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
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
