"use client";

import { useGetDetailHealthProfileQuery } from "@/store/api/health-profile/health-profile-api";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import { Edit } from "lucide-react";

interface HealthProfileDetailProps {
   profileId: string;
   onClose: () => void;
   onEdit?: (id: string) => void;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
   SELF: "Bản thân",
   FATHER: "Bố",
   MOTHER: "Mẹ",
   CHILD: "Con",
   SPOUSE: "Vợ / Chồng",
   OTHER: "Khác",
};

const GENDER_LABELS: Record<string, string> = {
   MALE: "Nam",
   FEMALE: "Nữ",
   OTHER: "Khác",
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

export function HealthProfileDetail({
   profileId,
   onClose,
   onEdit,
}: HealthProfileDetailProps) {
   const {
      data: profile,
      isLoading,
      isFetching,
   } = useGetDetailHealthProfileQuery(profileId, {
      skip: !profileId,
   });

   const handleBack = () => {
      onClose();
   };

   if (isLoading || isFetching) {
      return (
         <div className="p-12 flex justify-center items-center bg-white rounded-xl border border-slate-200">
            <CloverLoading
               size="md"
               text="Đang tải thông tin chi tiết hồ sơ..."
            />
         </div>
      );
   }

   if (!profile) {
      return (
         <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
            Không tìm thấy thông tin hồ sơ sức khỏe.
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

   return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between border-b border-slate-300 pb-4">
            <div className="flex items-center gap-3">
               <div>
                  <h2 className="text-base font-semibold text-slate-900">
                     Hồ sơ sức khỏe: {profile.fullName}
                  </h2>
                   <p className="text-xs text-slate-500">
                      Mã hồ sơ:{" "}
                      {profile.hospitalPatientCode ||
                         profile.facilityLink?.[0]?.hospitalPatientCode ||
                         profile.id}
                   </p>
               </div>
            </div>
         </div>

         {/* Thông tin cá nhân */}
         <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 border-l-3 border-emerald-500 pl-2">
               Thông tin cá nhân & Nhân khẩu học
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
               <RowItem label="Họ và tên" value={profile.fullName} />
               <RowItem
                  label="Giới tính"
                  value={GENDER_LABELS[profile.gender] ?? profile.gender}
               />
               <RowItem label="Ngày sinh" value={formatDate(profile.dob)} />
               <RowItem
                  label="Quan hệ với chủ hộ/tài khoản"
                  value={
                     RELATIONSHIP_LABELS[profile.relationship] ??
                     profile.relationship
                  }
               />
               <RowItem label="Số CCCD / CMND" value={profile.citizenId} />
               <RowItem label="Số điện thoại" value={profile.phoneNumber} />
               <RowItem
                  label="Liên kết App"
                  value={
                     profile.linkStatus === "PENDING" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-100 text-amber-700">
                           Đang chờ
                        </span>
                     ) : profile.linkStatus === "ACTIVE" ||
                       (profile.isLinked && profile.linkStatus !== "UNLINKED") ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-emerald-100 text-emerald-700">
                           Đã liên kết
                        </span>
                     ) : profile.linkStatus === "UNLINKED" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-red-100 text-red-700">
                           Đã hủy liên kết
                        </span>
                     ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-slate-100 text-slate-600">
                           Chưa liên kết
                        </span>
                     )
                  }
               />
               <RowItem
                  label="Địa chỉ cư trú"
                  value={profile.address}
                  className="md:col-span-2 lg:col-span-2"
               />
            </div>
         </div>

         {/* Thông tin y tế cơ bản */}
         <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 border-l-3 border-emerald-500 pl-2">
               Chỉ số y tế & Tiền sử bệnh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
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
                  label="Bệnh mạn tính"
                  value={
                     Array.isArray(profile.profileChronicDisease) &&
                     profile.profileChronicDisease.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                           {profile.profileChronicDisease.map((disease) => (
                              <span
                                 key={disease.id}
                                 className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                              >
                                 {disease.name} ({disease.code})
                              </span>
                           ))}
                        </div>
                     ) : (
                        "Không có bệnh mạn tính"
                     )
                  }
               />
               <RowItem
                  label="Tiền sử bệnh lý"
                  value={profile.medicalHistory}
                  className="md:col-span-2 lg:col-span-3"
               />
            </div>
         </div>

         {/* Cơ sở y tế liên kết */}
         <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 border-l-3 border-emerald-500 pl-2">
               Cơ sở y tế liên kết
            </h3>
            {profile.facility ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800">
                           {profile.facility.facilityName || "Cơ sở y tế"}
                        </span>
                        <span
                           className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                              profile.facility.isActive !== false
                                 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                 : "bg-slate-100 text-slate-600 border-slate-200"
                           }`}
                        >
                           {profile.facility.isActive !== false
                              ? "Đang liên kết"
                              : "Ngừng liên kết"}
                        </span>
                     </div>
                     <div className="text-xs text-slate-600 flex flex-col gap-1">
                        <span>
                           Mã bệnh nhân tại viện:{" "}
                           <strong>
                              {profile.hospitalPatientCode || "—"}
                           </strong>
                        </span>
                        <span>
                           SĐT đăng ký:{" "}
                           {profile.facility.phoneNumber ||
                              profile.phoneNumber ||
                              "—"}
                        </span>
                        <span>
                           Địa chỉ CSYT: {profile.facility.address || "—"}
                        </span>
                        <span>
                           Ngày liên kết:{" "}
                           {formatDate(profile.createdAt)}
                        </span>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                  Chưa liên kết với cơ sở y tế nào.
               </div>
            )}
         </div>

         <div className="flex justify-end gap-2">
            <CustomButton
               size="sm"
               className="w-20 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
               onClick={() => handleBack()}
            >
               Hủy
            </CustomButton>
            {onEdit && (
               <CustomButton
                  size="sm"
                  className="w-fit"
                  startIcon={<Edit />}
                  onClick={() => onEdit(profile.id)}
               >
                  Chỉnh sửa
               </CustomButton>
            )}
         </div>
      </div>
   );
}

export default HealthProfileDetail;
