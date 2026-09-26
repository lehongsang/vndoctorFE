"use client";

import { useGetDetailCareSubcriptionQuery } from "@/store/api/coordinate/coordinateApi";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import { Edit } from "lucide-react";
import type { Staff } from "@/store/api/staff/type";

interface CareSubscriptionDetailProps {
   subscriptionId: string;
   onClose: () => void;
   onEdit?: (id: string) => void;
}

const GENDER_LABELS: Record<string, string> = {
   MALE: "Nam",
   FEMALE: "Nữ",
   OTHER: "Khác",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
   SELF: "Bản thân",
   FATHER: "Bố",
   MOTHER: "Mẹ",
   CHILD: "Con",
   SPOUSE: "Vợ / Chồng",
   OTHER: "Khác",
};

const STATUS_CONFIG: Record<
   string,
   { label: string; bg: string; text: string }
> = {
   PENDING: {
      label: "Chờ điều phối",
      bg: "bg-amber-100",
      text: "text-amber-700",
   },
   ACTIVE: {
      label: "Đang hoạt động",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
   },
   EXPIRED: {
      label: "Đã hết hạn",
      bg: "bg-slate-100",
      text: "text-slate-600",
   },
   CANCELLED: {
      label: "Đã hủy",
      bg: "bg-rose-100",
      text: "text-rose-700",
   },
};

const RowItem = ({
   label,
   value,
   className,
}: {
   label: string;
   value?: React.ReactNode;
   className?: string;
}) => (
   <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="text-sm font-medium text-slate-800 wrap-break-word">
         {value || "Chưa cập nhật"}
      </div>
   </div>
);

const StaffCard = ({ title, staff }: { title: string; staff?: Staff }) => (
   <div className="bg-slate-50 p-4 rounded-sm shadow-sm border border-slate-200 flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
         <span className="font-semibold text-xs">{title}</span>
         <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
               staff
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
         >
            {staff ? "Đã điều phối" : "Chưa chỉ định"}
         </span>
      </div>

      {staff ? (
         <div className="text-xs text-slate-600 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Họ và tên:</span>
               <span className="font-semibold text-slate-800 text-sm">
                  {staff.fullName}
               </span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Mã nhân viên:</span>
               <span className="text-slate-700">{staff.staffCode || "—"}</span>
            </div>
            {staff.specialty && (
               <div className="flex items-center justify-between">
                  <span className="text-slate-500">Chuyên khoa:</span>
                  <span className="text-slate-700">{staff.specialty}</span>
               </div>
            )}
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Số điện thoại:</span>
               <span className="text-slate-700">
                  {staff.phoneNumber || "—"}
               </span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Email:</span>
               <span className="text-slate-700">{staff.email || "—"}</span>
            </div>
         </div>
      ) : (
         <div className="py-4 text-center text-xs text-slate-400 italic">
            Chưa có nhân viên phụ trách cho vị trí này.
         </div>
      )}
   </div>
);

export function CareSubscriptionDetail({
   subscriptionId,
   onClose,
   onEdit,
}: CareSubscriptionDetailProps) {
   const {
      data: subscription,
      isLoading,
      isFetching,
   } = useGetDetailCareSubcriptionQuery(
      { id: subscriptionId },
      {
         skip: !subscriptionId,
      },
   );

   if (isLoading || isFetching) {
      return (
         <div className="p-12 flex justify-center items-center">
            <CloverLoading
               size="md"
               text="Đang tải thông tin chi tiết đăng ký gói chăm sóc..."
            />
         </div>
      );
   }

   if (!subscription) {
      return (
         <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            Không tìm thấy thông tin gói đăng ký chăm sóc.
            <div className="mt-4">
               <CustomButton variant="outline" size="sm" onClick={onClose}>
                  Quay lại
               </CustomButton>
            </div>
         </div>
      );
   }

   const formatDate = (dateStr?: string) => {
      if (!dateStr) return "Chưa cập nhật";
      try {
         const date = new Date(dateStr);
         return isNaN(date.getTime())
            ? dateStr
            : date.toLocaleDateString("vi-VN");
      } catch {
         return dateStr;
      }
   };

   const formatPrice = (price?: number) => {
      if (typeof price !== "number") return "Chưa cập nhật";
      return new Intl.NumberFormat("vi-VN", {
         style: "currency",
         currency: "VND",
      }).format(price);
   };

   const statusStyle =
      STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.PENDING;
   const profile = subscription.healthProfile;
   const carePackage = subscription.carePackage;

   return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between border-b border-slate-300 pb-4">
            <div>
               <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-slate-900">
                     Chi tiết đăng ký: {carePackage?.name || "Gói chăm sóc"}
                  </h2>
               </div>
               <p className="text-xs text-slate-500 mt-1">
                  Mã đăng ký:{" "}
                  <span className="font-mono text-slate-700">
                     {subscription.id}
                  </span>
               </p>
            </div>
         </div>

         {/* Thông tin gói chăm sóc */}
         <div>
            <h3 className="text-md font-semibold text-slate-800 mb-3">
               Thông tin gói chăm sóc
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-sm border border-slate-200 shadow-sm">
               <RowItem label="Tên gói" value={carePackage?.name} />
               <RowItem label="Mã gói" value={carePackage?.code} />
               <RowItem
                  label="Loại gói"
                  value={
                     carePackage?.type ? (
                        <span
                           className={`text-xs py-0.5 px-2 rounded-sm font-medium ${
                              carePackage.type === "VIP"
                                 ? "text-amber-700 bg-amber-100"
                                 : "text-sky-700 bg-sky-100"
                           }`}
                        >
                           {carePackage.type === "VIP"
                              ? "Gói VIP"
                              : "Gói Cơ bản"}
                        </span>
                     ) : (
                        "—"
                     )
                  }
               />
               <RowItem
                  label="Thời lượng gói"
                  value={
                     carePackage?.durationDays
                        ? `${carePackage.durationDays} ngày`
                        : "—"
                  }
               />
               <RowItem
                  label="Giá gói"
                  value={formatPrice(carePackage?.priceAmount)}
               />
               <RowItem
                  label="Trạng thái đăng ký"
                  value={
                     <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                     >
                        {statusStyle.label}
                     </span>
                  }
               />
               <RowItem
                  label="Ngày bắt đầu"
                  value={formatDate(subscription.startedAt)}
               />
               <RowItem
                  label="Ngày hết hạn"
                  value={formatDate(subscription.expiresAt)}
               />
               <RowItem
                  label="Mô tả gói"
                  value={carePackage?.description}
                  className="md:col-span-2 lg:col-span-3"
               />
            </div>
         </div>

         {/* Thông tin khách hàng & hồ sơ sức khỏe */}
         <div>
            <h3 className="text-md font-semibold text-slate-800 mb-3">
               Thông tin khách hàng
            </h3>
            {profile ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-sm border border-slate-200 shadow-sm">
                  <RowItem label="Họ và tên" value={profile.fullName} />
                  <RowItem
                     label="Giới tính"
                     value={GENDER_LABELS[profile.gender] ?? profile.gender}
                  />
                  <RowItem label="Ngày sinh" value={formatDate(profile.dob)} />
                  <RowItem
                     label="Quan hệ với chủ hộ"
                     value={
                        RELATIONSHIP_LABELS[profile.relationship] ??
                        profile.relationship
                     }
                  />
                  <RowItem label="Số CCCD / CMND" value={profile.citizenId} />
                  <RowItem label="Số điện thoại" value={profile.phoneNumber} />
                  <RowItem
                     label="Nhóm máu"
                     value={
                        profile.bloodType && profile.bloodType !== "UNKNOWN"
                           ? `Nhóm máu ${profile.bloodType}`
                           : "Không xác định"
                     }
                  />
                  <RowItem label="Tiền sử dị ứng" value={profile.allergy} />
                  <RowItem
                     label="Tiền sử bệnh lý"
                     value={profile.medicalHistory}
                  />
                  <RowItem
                     label="Địa chỉ cư trú"
                     value={profile.address}
                     className="md:col-span-2 lg:col-span-3"
                  />
               </div>
            ) : (
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                  Chưa có thông tin hồ sơ sức khỏe liên kết.
               </div>
            )}
         </div>

         {/* Đội ngũ nhân viên điều phối */}
         <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
               Đội ngũ nhân viên y tế điều phối
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <StaffCard
                  title="Bác sĩ chuyên gia"
                  staff={subscription.assignedExpert}
               />
               <StaffCard
                  title="Bác sĩ phụ trách"
                  staff={subscription.assignedDoctor}
               />
               <StaffCard
                  title="Điều dưỡng phụ trách"
                  staff={subscription.assignedNurse}
               />
            </div>
         </div>

         {/* Actions Footer */}
         <div className="flex justify-end gap-2">
            <CustomButton
               size="sm"
               variant="destructive"
               className="w-20"
               onClick={onClose}
            >
               Đóng
            </CustomButton>
            {onEdit && (
               <CustomButton
                  size="sm"
                  className="w-fit"
                  startIcon={<Edit />}
                  onClick={() => onEdit(subscription.id)}
               >
                  Điều phối nhân viên
               </CustomButton>
            )}
         </div>
      </div>
   );
}

export default CareSubscriptionDetail;
