import { useState } from "react";
import { useGetDetailFacilityQuery } from "@/store/api/facility/facility-api";
import { Factility } from "@/store/api/facility/type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import FacilityChildren from "./facility-children";
import { FacilityForm } from "./facility-children/facility-form";
import FacilityStaff from "./facility-staff";

const FACILITY_TYPE_LABELS: Record<string, string> = {
   CENTRAL_HOSPITAL: "Bệnh viện tuyến Trung ương",
   PROVINCIAL_HOSPITAL: "Bệnh viện tuyến Tỉnh / Thành phố",
   DISTRICT_HOSPITAL: "Bệnh viện tuyến Quận / Huyện",
   COMMUNE_HEALTH_STATION: "Trạm y tế Xã / Phường",
   CLINIC: "Phòng khám",
   OTHER: "Cơ sở y tế khác",
};

const RowItem = ({ label, value }: { label: string; value?: string }) => (
   <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 wrap-break-word">
         {value || "Chưa cập nhật"}
      </span>
   </div>
);

export default function Facility() {
   const { user } = useAuth();
   const f_id = user?.facilityId;
   const [isEditing, setIsEditing] = useState(false);
   const {
      data: detailFactility,
      isLoading,
      isFetching,
   } = useGetDetailFacilityQuery(f_id ?? "", {
      skip: !f_id,
   });
   const data_detail = detailFactility as unknown as Factility;

   const faciliy_info = [
      {
         label: "Mã cơ sở y tế",
         value: data_detail?.facilityCode,
      },
      {
         label: "Tên cơ sở y tế",
         value: data_detail?.facilityName,
      },
      {
         label: "Loại hình cơ sở",
         value:
            (data_detail?.facilityType &&
               FACILITY_TYPE_LABELS[data_detail.facilityType]) ||
            data_detail?.facilityType,
      },
      {
         label: "Đơn vị quản lý cấp trên",
         value: data_detail?.parentId || "Trực thuộc Bộ / Sở Y tế",
      },
      {
         label: "Số điện thoại liên hệ",
         value: data_detail?.phoneNumber || "Chưa cập nhật",
      },
      {
         label: "Địa chỉ",
         value: data_detail?.address || "Chưa cập nhật",
      },
      {
         label: "Trạng thái vận hành",
         value: data_detail?.isActive
            ? "Đang tiếp nhận bệnh nhân"
            : "Tạm ngưng hoạt động",
      },
      {
         label: "Ngày tạo hệ thống",
         value: data_detail?.createdAt
            ? new Date(data_detail.createdAt).toLocaleDateString("vi-VN")
            : "Chưa xác định",
      },
      {
         label: "Cập nhật lần cuối",
         value: data_detail?.updatedAt
            ? new Date(data_detail.updatedAt).toLocaleDateString("vi-VN")
            : "Chưa xác định",
      },
   ];

   return (
      <Tabs
         defaultValue="overview"
         onValueChange={() => setIsEditing(false)}
         className="gap-6"
      >
         <TabsList variant="line" className="gap-x-4 text-sm">
            <TabsTrigger
               value="overview"
               className="cursor-pointer data-active:text-primary data-active:after:bg-primary font-medium"
            >
               Thông tin chung
            </TabsTrigger>
            <TabsTrigger
               value="childFacilities"
               className="cursor-pointer data-active:text-primary data-active:after:bg-primary font-medium"
            >
               Cơ sở con
            </TabsTrigger>
            <TabsTrigger
               value="employees"
               className="cursor-pointer data-active:text-primary data-active:after:bg-primary font-medium"
            >
               Nhân viên trực thuộc
            </TabsTrigger>
         </TabsList>
         <TabsContent value="overview">
            {isLoading || isFetching ? (
               <div className="w-full h-32 flex items-center justify-center">
                  <CloverLoading size="md" text="Đang tải thông tin cơ sở..." />
               </div>
            ) : data_detail ? (
               isEditing ? (
                  <FacilityForm
                     facilityId={f_id}
                     facility={data_detail}
                     mode="update"
                     onClose={() => setIsEditing(false)}
                  />
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 rounded-sm border border-slate-200 shadow-sm">
                     {faciliy_info.map((item, index) => (
                        <RowItem
                           key={index}
                           label={item.label}
                           value={item.value}
                        />
                     ))}
                     <div className="col-span-full flex justify-end">
                        <CustomButton onClick={() => setIsEditing(true)}>
                           Cập nhật thông tin
                        </CustomButton>
                     </div>
                  </div>
               )
            ) : (
               <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
                  <h3 className="text-sm font-semibold text-slate-700">
                     Chưa có thông tin cơ sở y tế
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                     Tài khoản hiện tại chưa được liên kết với cơ sở y tế cụ thể
                     hoặc dữ liệu đang được đồng bộ.
                  </p>
               </div>
            )}
         </TabsContent>
         <TabsContent value="childFacilities">
            <FacilityChildren facilityId={f_id} parentFacility={data_detail} />
         </TabsContent>
         <TabsContent value="employees">
            <FacilityStaff facilityId={f_id} facility={data_detail} />
         </TabsContent>
      </Tabs>
   );
}
