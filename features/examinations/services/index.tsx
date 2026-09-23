import { CustomButton } from "@/components/common/custom-button";
import { SearchInput } from "@/components/common/search-input";
import { Plus } from "lucide-react";

interface ServiceItemsProps {
   code?: string;
   name?: string;
   price?: number;
   type?: string;
}

const ServiceItems = (service: ServiceItemsProps) => {
   return (
      <div className="flex flex-col p-4 border rounded-lg">
         <div className="flex gap-2 text-sm">
            <span className="font-bold">{service.code}</span>
            <span>{service.name}</span>
         </div>
         <div className="flex items-center justify-between">
            <div className="flex gap-4 items-center text-sm">
               <span>Giá: {service.price}</span>
               <span>Loại: {service.type}</span>
            </div>
            <div className="flex gap-3 items-center">
               <CustomButton className="h-8 w-8">
                  <Plus />
               </CustomButton>
            </div>
         </div>
      </div>
   );
};

export function ExaminationService() {
   return (
      <div className="flex flex-col gap-4 border-l h-screen">
         <div className="flex items-center flex-col gap-2 py-4">
            <CustomButton className="w-56">
               Đến nhóm quản lý điều trị
            </CustomButton>
            <CustomButton className="w-56">
               Trao đổi trực tiếp với BN
            </CustomButton>
         </div>
         <div className="p-4 flex flex-col gap-4">
            <h1 className="font-bold text-lg">Chỉ định dịch vụ</h1>
            <SearchInput placeholder="Tìm kiếm dịch vụ" />
            <div className="flex gap-2 flex-wrap">
               <CustomButton className="h-8 w-fit">Cận lâm sàng</CustomButton>
               <CustomButton className="h-8 w-fit">Thuốc</CustomButton>
               <CustomButton className="h-8 w-fit">Thủ thuật</CustomButton>
               <CustomButton className="h-8 w-fit">Dịch vụ</CustomButton>
            </div>

            <div className="flex flex-col gap-4">
               <ServiceItems
                  code="CLS01"
                  name="Xét nghiệm máu"
                  price={100000}
                  type="Cận lâm sàng"
               />
            </div>
         </div>
      </div>
   );
}
