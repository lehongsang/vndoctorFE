import { CustomButton } from "@/components/common/custom-button";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { STAFF_ROLE_OPTIONS, StaffRole } from "@/types/staff";

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
   const selectedLabel =
      role === "ALL" || !role
         ? "Tất cả vai trò"
         : STAFF_ROLE_OPTIONS.find((opt) => opt.value === role)?.label || role;

   return (
      <div className="w-full flex flex-wrap items-center gap-3">
         <Input
            value={searchText}
            onChange={onSearchChange}
            className="h-10 max-w-72 px-4 bg-white"
            placeholder="Tìm kiếm theo tên, mã, email..."
         />
         <div className="w-64">
            <Select
               value={role}
               onValueChange={(val) => onRoleChange?.(val ?? "ALL")}
            >
               <SelectTrigger className="min-h-10 w-full bg-white cursor-pointer">
                  <SelectValue placeholder="Tất cả vai trò">
                     {selectedLabel}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent
                  side="bottom"
                  alignItemWithTrigger={false}
                  className="p-2 shadow-none"
               >
                  <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                  {STAFF_ROLE_OPTIONS.map((opt) => (
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
