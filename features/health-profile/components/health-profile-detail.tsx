"use client";

import { useGetDetailHealthProfileQuery } from "@/store/api/health-profile/health-profile-api";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import {
   ArrowLeft,
   Award,
   Edit,
   FileChartColumn,
   FileText,
   RotateCcwClock,
} from "lucide-react";
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from "@/components/ui/accordion";
import { useGetExaminationsQuery } from "@/store/api/examination/examination-api";
import { Examination } from "@/store/api/examination/type";
import { useState } from "react";
import { CustomPagination } from "@/components/common/custom-pagination";
import { useGetStaffRiskAssessmentsQuery } from "@/store/api/risk-factor-assessment/risk-factor-assessment-api";
import { RiskAssessmentResult } from "@/store/api/risk-factor-assessment/type";
import { RiskAssessmentDetailModal } from "@/features/examination/components/risk-assessment-detail-modal";
import { cn } from "@/lib/utils";
import { HealthProfile } from "@/store/api/health-profile/type";

interface HealthProfileDetailProps {
   profileId: string;
   onClose: () => void;
   onEdit?: (id: string) => void;
   onDelete: (profile: HealthProfile) => void;
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

const ExaminationItem = ({
   examination,
   index,
}: {
   examination: Examination;
   index: number;
}) => {
   const fomatDate = (date?: string) => {
      if (!date) return "—";
      const dateObj = new Date(date);
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
   };
   return (
      <div
         className="flex flex-col gap-1.5 p-3 rounded-sm border shadow-sm"
         key={index}
      >
         <span className="text-sm font-semibold text-slate-800">
            {fomatDate(examination.examinationDate)}
         </span>
         <span className="text-xs text-slate-500">
            Bác sĩ: {examination?.doctor?.fullName}
         </span>
         {examination?.diagnosis && (
            <span className="text-xs text-slate-500">
               Chẩn đoán: {examination?.diagnosis}
            </span>
         )}
         <span className="text-xs text-slate-500">
            Cơ sở: {examination?.facility?.facilityName}
         </span>
      </div>
   );
};

const RiskAssessmentItem = ({
   record,
   index,
   onViewDetails,
}: {
   record: RiskAssessmentResult;
   index: number;
   onViewDetails: (record: RiskAssessmentResult) => void;
}) => {
   const fomatDate = (date?: string) => {
      if (!date) return "—";
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;
      const day = dateObj.getDate();
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
   };

   const riskColorConfig = {
      VERY_HIGH: {
         badge: "bg-rose-50 text-rose-700 border-rose-200",
         label: "Nguy cơ rất cao",
      },
      HIGH: {
         badge: "bg-amber-50 text-amber-700 border-amber-200",
         label: "Nguy cơ cao",
      },
      LOW: {
         badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
         label: "Nguy cơ thấp",
      },
   };

   return (
      <div
         className="flex flex-col gap-1.5 p-3 rounded-sm border shadow-sm cursor-pointer hover:border-primary/70"
         key={index}
         onClick={() => onViewDetails(record)}
      >
         <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-800">
               {fomatDate(record.evaluatedAt)}
            </span>
            <div className="flex items-center gap-1.5">
               {record.riskLevel && (
                  <span
                     className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold border",
                        riskColorConfig[
                           record.riskLevel as keyof typeof riskColorConfig
                        ]?.badge,
                     )}
                  >
                     {
                        riskColorConfig[
                           record.riskLevel as keyof typeof riskColorConfig
                        ]?.label
                     }
                  </span>
               )}
            </div>
         </div>

         {record?.riskScore && (
            <span className="text-xs text-slate-500">
               Xác suất biến cố 10 năm:{" "}
               <span className="font-semibold text-slate-700">
                  {record.riskScore}%
               </span>
            </span>
         )}

         {record.doctor?.fullName && (
            <span className="text-xs text-slate-500">
               Bác sĩ: {record.doctor.fullName}
            </span>
         )}

         {record.conclusion && (
            <span className="text-xs text-slate-500">
               Kết luận: {record.conclusion}
            </span>
         )}

         {record.assessmentInput?.facility?.facilityName && (
            <span className="text-xs text-slate-500">
               Cơ sở: {record.assessmentInput.facility.facilityName}
            </span>
         )}
      </div>
   );
};

export function HealthProfileDetail({
   profileId,
   onClose,
   onEdit,
   onDelete,
}: HealthProfileDetailProps) {
   const {
      data: profile,
      isLoading,
      isFetching,
   } = useGetDetailHealthProfileQuery(profileId, {
      skip: !profileId,
   });

   console.log(profile);

   const [pageExam, setPageExam] = useState<number>(1);
   const [limitExam, setLimitExam] = useState<number>(10);

   const {
      data: examinations,
      isLoading: isLoadingExa,
      isFetching: isFetchingExa,
   } = useGetExaminationsQuery(
      {
         healthProfileId: profileId,
         page: pageExam,
         limit: limitExam,
      },
      {
         skip: !profileId,
      },
   );

   const examinationData = examinations?.data as Examination[];
   const totalExam = examinations?.total || 0;
   const totalPagesExam = Math.max(1, Math.ceil(totalExam / limitExam));

   const [pageRisk, setPageRisk] = useState<number>(1);
   const [limitRisk, setLimitRisk] = useState<number>(10);
   const [selectedRiskItem, setSelectedRiskItem] =
      useState<RiskAssessmentResult | null>(null);

   const {
      data: riskAssessments,
      isLoading: isLoadingRisk,
      isFetching: isFetchingRisk,
   } = useGetStaffRiskAssessmentsQuery(
      {
         healthProfileId: profileId,
         page: pageRisk,
         limit: limitRisk,
      },
      {
         skip: !profileId,
      },
   );

   const riskAssessmentData = (riskAssessments?.data ||
      riskAssessments?.items ||
      []) as RiskAssessmentResult[];
   const totalRisk = riskAssessments?.total || 0;
   const totalPagesRisk = Math.max(1, Math.ceil(totalRisk / limitRisk));

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
         <div className="flex items-center gap-4">
            <CustomButton
               size="sm"
               onClick={handleBack}
               startIcon={<ArrowLeft />}
            >
               Quay lại
            </CustomButton>
            <h2 className="text-base font-semibold text-slate-900">
               Thông tin chi tiết
            </h2>
         </div>

         <div className="flex items-center justify-between">
            <div className="flex flex-col">
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

         <Accordion>
            <AccordionItem value="item-1">
               <AccordionTrigger className="flex border rounded-none">
                  <div className="flex items-center gap-4 text-base">
                     <FileText /> Thông tin hồ sơ
                  </div>
               </AccordionTrigger>
               <AccordionContent>
                  <div className="flex flex-col gap-6 p-6 border rounded-sm shadow-sm">
                     {/* Thông tin cá nhân */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50">
                        <RowItem label="Họ và tên" value={profile.fullName} />
                        <RowItem
                           label="Giới tính"
                           value={
                              GENDER_LABELS[profile.gender] ?? profile.gender
                           }
                        />
                        <RowItem
                           label="Ngày sinh"
                           value={formatDate(profile.dob)}
                        />
                        <RowItem
                           label="Quan hệ với chủ hộ/tài khoản"
                           value={
                              RELATIONSHIP_LABELS[profile.relationship] ??
                              profile.relationship
                           }
                        />
                        <RowItem
                           label="Số CCCD / CMND"
                           value={profile.citizenId}
                        />
                        <RowItem
                           label="Số điện thoại"
                           value={profile.phoneNumber}
                        />
                        <RowItem
                           label="Liên kết App"
                           value={
                              profile.linkStatus === "PENDING" ? (
                                 <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-100 text-amber-700">
                                    Đang chờ
                                 </span>
                              ) : profile.linkStatus === "ACTIVE" ||
                                (profile.isLinked &&
                                   profile.linkStatus !== "UNLINKED") ? (
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
                           label="Nhóm máu"
                           value={
                              profile.bloodType &&
                              profile.bloodType !== "UNKNOWN"
                                 ? `Nhóm máu ${profile.bloodType}`
                                 : "Chưa xác định"
                           }
                        />
                        <RowItem
                           label="Chiều cao"
                           value={
                              profile.height
                                 ? `${profile.height} cm`
                                 : "Chưa cập nhật"
                           }
                        />
                        <RowItem
                           label="Cân nặng"
                           value={
                              profile.weight
                                 ? `${profile.weight} kg`
                                 : "Chưa cập nhật"
                           }
                        />
                        <RowItem
                           label="Địa chỉ cư trú"
                           value={profile.address}
                           className="md:col-span-2 lg:col-span-2"
                        />
                     </div>

                     {/* Yếu tố nguy cơ & Tiền sử bệnh tim mạch */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                        <RowItem
                           label="Yếu tố nguy cơ tim mạch & chuyển hóa"
                           value={
                              [
                                 profile.isSmoking ? "Hút thuốc lá" : null,
                                 profile.hasHypertension
                                    ? "Tăng huyết áp"
                                    : null,
                                 profile.hasDyslipidemia
                                    ? "Rối loạn lipid máu"
                                    : null,
                                 profile.hasDiabetes ? "Đái tháo đường" : null,
                                 profile.hasFamilialHypercholesterolemia
                                    ? "Tăng cholesterol máu gia đình"
                                    : null,
                              ].filter(Boolean).length > 0 ? (
                                 <div className="flex flex-wrap gap-1.5 mt-1">
                                    {[
                                       profile.isSmoking
                                          ? "Hút thuốc lá"
                                          : null,
                                       profile.hasHypertension
                                          ? "Tăng huyết áp"
                                          : null,
                                       profile.hasDyslipidemia
                                          ? "Rối loạn lipid máu"
                                          : null,
                                       profile.hasDiabetes
                                          ? "Đái tháo đường"
                                          : null,
                                       profile.hasFamilialHypercholesterolemia
                                          ? "Tăng cholesterol máu gia đình"
                                          : null,
                                    ]
                                       .filter(Boolean)
                                       .map((name) => (
                                          <span
                                             key={name}
                                             className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                                          >
                                             {name}
                                          </span>
                                       ))}
                                 </div>
                              ) : (
                                 "Không ghi nhận"
                              )
                           }
                        />

                        <RowItem
                           label="Bệnh lý tim mạch & mạch máu"
                           value={
                              [
                                 profile.hasCoronaryArteryDisease
                                    ? "Bệnh động mạch vành"
                                    : null,
                                 profile.hasMyocardialInfarction
                                    ? "Nhồi máu cơ tim"
                                    : null,
                                 profile.hasAcuteCoronarySyndrome
                                    ? "Hội chứng vành cấp"
                                    : null,
                                 profile.hasAtherosclerosis
                                    ? "Xơ vữa động mạch"
                                    : null,
                                 profile.hasAorticAneurysm
                                    ? "Phình động mạch chủ"
                                    : null,
                                 profile.hasPeripheralArteryDisease
                                    ? "Bệnh ĐM ngoại biên"
                                    : null,
                                 profile.hasStroke ? "Đột quỵ não" : null,
                                 profile.hasTia
                                    ? "Thiếu máu não thoáng qua (TIA)"
                                    : null,
                              ].filter(Boolean).length > 0 ? (
                                 <div className="flex flex-wrap gap-1.5 mt-1">
                                    {[
                                       profile.hasCoronaryArteryDisease
                                          ? "Bệnh động mạch vành"
                                          : null,
                                       profile.hasMyocardialInfarction
                                          ? "Nhồi máu cơ tim"
                                          : null,
                                       profile.hasAcuteCoronarySyndrome
                                          ? "Hội chứng vành cấp"
                                          : null,
                                       profile.hasAtherosclerosis
                                          ? "Xơ vữa động mạch"
                                          : null,
                                       profile.hasAorticAneurysm
                                          ? "Phình động mạch chủ"
                                          : null,
                                       profile.hasPeripheralArteryDisease
                                          ? "Bệnh ĐM ngoại biên"
                                          : null,
                                       profile.hasStroke ? "Đột quỵ não" : null,
                                       profile.hasTia
                                          ? "Thiếu máu não thoáng qua (TIA)"
                                          : null,
                                    ]
                                       .filter(Boolean)
                                       .map((name) => (
                                          <span
                                             key={name}
                                             className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                                          >
                                             {name}
                                          </span>
                                       ))}
                                 </div>
                              ) : (
                                 "Không ghi nhận"
                              )
                           }
                        />

                        <RowItem
                           label="Tiền sử bệnh lý khác"
                           value={profile.medicalHistory}
                        />

                        <RowItem
                           label="Tiền sử dị ứng"
                           value={profile.allergy}
                        />
                     </div>

                     {/* Cơ sở y tế liên kết */}
                     <div>
                        {profile.facility ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 flex flex-col gap-2">
                                 <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm text-slate-800">
                                       {profile.facility.facilityName ||
                                          "Cơ sở y tế"}
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
                                       Ngày tạo: {formatDate(profile.createdAt)}
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
                           id={`delete-${profile.id}`}
                           size="sm"
                           className="w-20 bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                           onClick={() => onDelete(profile)}
                        >
                           Xóa hồ sơ
                        </CustomButton>
                        <CustomButton
                           size="sm"
                           variant="destructive"
                           className="w-20"
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
               </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
               <AccordionTrigger className="flex border rounded-none ">
                  <div className="flex items-center gap-4 text-base">
                     <RotateCcwClock /> Lịch sử đợt khám
                  </div>
               </AccordionTrigger>
               <AccordionContent>
                  {isFetchingExa || isLoadingExa ? (
                     <div>
                        <CloverLoading size="sm" />
                     </div>
                  ) : !examinationData || examinationData.length === 0 ? (
                     <div className="p-6 text-center text-xs text-slate-500 bg-slate-50">
                        Chưa có lịch sử đợt khám nào.
                     </div>
                  ) : (
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-end w-full">
                           <CustomPagination
                              currentPage={pageExam}
                              totalPages={totalPagesExam}
                              totalItems={totalExam}
                              showPageSizeSelector
                              onPageChange={setPageExam}
                              pageSize={limitExam}
                              onPageSizeChange={(limit) => {
                                 setLimitExam(limit);
                                 setPageExam(1);
                              }}
                           />
                        </div>
                        <div className="flex flex-col gap-3">
                           {examinationData.map((examination, index) => (
                              <ExaminationItem
                                 key={examination.id}
                                 examination={examination}
                                 index={index}
                              />
                           ))}
                        </div>
                     </div>
                  )}
               </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
               <AccordionTrigger className="flex border rounded-none ">
                  <div className="flex items-center gap-4 text-base">
                     <FileChartColumn /> Lịch sử phân tầng yếu tố nguy cơ
                  </div>
               </AccordionTrigger>
               <AccordionContent>
                  {isFetchingRisk || isLoadingRisk ? (
                     <div>
                        <CloverLoading size="sm" />
                     </div>
                  ) : !riskAssessmentData || riskAssessmentData.length === 0 ? (
                     <div className="p-6 text-center text-xs text-slate-500 bg-slate-50">
                        Chưa có lịch sử phân tầng yếu tố nguy cơ nào.
                     </div>
                  ) : (
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-end w-full">
                           <CustomPagination
                              currentPage={pageRisk}
                              totalPages={totalPagesRisk}
                              totalItems={totalRisk}
                              showPageSizeSelector
                              onPageChange={setPageRisk}
                              pageSize={limitRisk}
                              onPageSizeChange={(limit) => {
                                 setLimitRisk(limit);
                                 setPageRisk(1);
                              }}
                           />
                        </div>
                        <div className="flex flex-col gap-3">
                           {riskAssessmentData.map((record, index) => (
                              <RiskAssessmentItem
                                 key={record.id}
                                 record={record}
                                 index={index}
                                 onViewDetails={(item) =>
                                    setSelectedRiskItem(item)
                                 }
                              />
                           ))}
                        </div>
                     </div>
                  )}
               </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
               <AccordionTrigger className="flex border rounded-none">
                  <div className="flex items-center gap-4 text-base">
                     <Award /> Gói điều trị
                  </div>
               </AccordionTrigger>
               <AccordionContent>
                  {(() => {
                     const sub = profile?.subscription;
                     const carePackage = sub?.carePackage;

                     if (!sub || !carePackage) {
                        return (
                           <div className="p-6 text-sm text-slate-500 italic border rounded-sm">
                              Chưa mua gói điều trị
                           </div>
                        );
                     }

                     const isVip = carePackage.type === "VIP";

                     const formatMoney = (val?: number) => {
                        if (typeof val !== "number") return "0 đ";
                        return new Intl.NumberFormat("vi-VN", {
                           style: "currency",
                           currency: "VND",
                        }).format(val);
                     };

                     const formatDateOnly = (d?: string) => {
                        if (!d) return "Chưa cập nhật";
                        const dateObj = new Date(d);
                        if (isNaN(dateObj.getTime())) return d;
                        const day = String(dateObj.getDate()).padStart(2, "0");
                        const month = String(dateObj.getMonth() + 1).padStart(
                           2,
                           "0",
                        );
                        const year = dateObj.getFullYear();
                        return `${day}/${month}/${year}`;
                     };

                     // Tính số ngày còn lại của gói
                     const calculateRemainingDays = (expiresAt?: string) => {
                        if (!expiresAt) return null;
                        const expireDate = new Date(expiresAt);
                        if (isNaN(expireDate.getTime())) return null;

                        const now = new Date();
                        const diffTime = expireDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(
                           diffTime / (1000 * 60 * 60 * 24),
                        );
                        return diffDays;
                     };

                     const remainingDays = calculateRemainingDays(
                        sub.expiresAt,
                     );

                     const statusMap: Record<
                        string,
                        {
                           label: string;
                           className: string;
                        }
                     > = {
                        ACTIVE: {
                           label: "Đang hoạt động",
                           className:
                              "text-emerald-700 bg-emerald-50 border-emerald-200",
                        },
                        PENDING: {
                           label: "Chờ điều phối",
                           className:
                              "text-amber-700 bg-amber-50 border-amber-200",
                        },
                        EXPIRED: {
                           label: "Đã hết hạn",
                           className:
                              "text-slate-600 bg-slate-100 border-slate-200",
                        },
                        CANCELLED: {
                           label: "Đã hủy",
                           className:
                              "text-rose-700 bg-rose-50 border-rose-200",
                        },
                     };

                     const statusInfo = statusMap[sub.status] || {
                        label: sub.status || "Chưa xác định",
                        className:
                           "text-slate-700 bg-slate-100 border-slate-200",
                     };

                     return (
                        <div className="flex flex-col gap-6 p-6 border rounded-sm shadow-sm">
                           {/* Thông tin gói điều trị */}
                           <div>
                              <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wide">
                                 Thông tin gói dịch vụ
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 <RowItem
                                    label="Tên gói điều trị"
                                    value={carePackage.name}
                                 />
                                 <RowItem
                                    label="Loại gói"
                                    value={
                                       <span
                                          className={cn(
                                             "text-xs px-2 py-0.5 rounded-sm font-medium border inline-block",
                                             isVip
                                                ? "text-amber-700 bg-amber-50 border-amber-200"
                                                : "text-blue-700 bg-blue-50 border-blue-200",
                                          )}
                                       >
                                          {isVip ? "VIP" : "Cơ bản"}
                                       </span>
                                    }
                                 />
                                 <RowItem
                                    label="Trạng thái gói"
                                    value={
                                       <span
                                          className={cn(
                                             "text-xs px-2 py-0.5 rounded-sm font-medium border inline-block",
                                             statusInfo.className,
                                          )}
                                       >
                                          {statusInfo.label}
                                       </span>
                                    }
                                 />
                                 <RowItem
                                    label="Xác nhận từ bệnh nhân"
                                    value={
                                       sub.rejectionReason ? (
                                          <div className="flex flex-col gap-0.5">
                                             <span className="text-xs px-2 py-0.5 rounded-sm font-medium border inline-block text-rose-700 bg-rose-50 border-rose-200 w-fit">
                                                Bệnh nhân từ chối
                                             </span>
                                             <span className="text-xs text-rose-600 italic">
                                                Lý do: {sub.rejectionReason}
                                             </span>
                                          </div>
                                       ) : sub.isPatientConfirmed ? (
                                          <div className="flex flex-col gap-0.5">
                                             <span className="text-xs px-2 py-0.5 rounded-sm font-medium border inline-block text-emerald-700 bg-emerald-50 border-emerald-200 w-fit">
                                                Đã xác nhận
                                             </span>
                                             {sub.patientConfirmedAt && (
                                                <span className="text-xs text-slate-500 font-normal">
                                                   Lúc {formatDateOnly(sub.patientConfirmedAt)}
                                                </span>
                                             )}
                                          </div>
                                       ) : (
                                          <span className="text-xs px-2 py-0.5 rounded-sm font-medium border inline-block text-amber-700 bg-amber-50 border-amber-200 w-fit">
                                             Chờ bệnh nhân xác nhận trên App
                                          </span>
                                       )
                                    }
                                 />
                                 <RowItem
                                    label="Giá gói"
                                    value={formatMoney(carePackage.priceAmount)}
                                 />
                                 <RowItem
                                    label="Thời hạn quy định"
                                    value={
                                       carePackage.durationDays
                                          ? `${carePackage.durationDays} ngày`
                                          : "Chưa cập nhật"
                                    }
                                 />
                                 <RowItem
                                    label="Số người đăng ký tối đa"
                                    value={
                                       carePackage.maxSubscribers
                                          ? `${carePackage.maxSubscribers} người`
                                          : "Không giới hạn"
                                    }
                                 />
                                 <RowItem
                                    label="Ngày bắt đầu"
                                    value={formatDateOnly(sub.startedAt)}
                                 />
                                 <RowItem
                                    label="Ngày kết thúc"
                                    value={formatDateOnly(sub.expiresAt)}
                                 />
                                 <RowItem
                                    label="Thời gian còn lại"
                                    value={
                                       remainingDays !== null ? (
                                          remainingDays > 0 ? (
                                             <span className="font-semibold text-emerald-600">
                                                Còn {remainingDays} ngày
                                             </span>
                                          ) : remainingDays === 0 ? (
                                             <span className="font-semibold text-amber-600">
                                                Hết hạn hôm nay
                                             </span>
                                          ) : (
                                             <span className="font-semibold text-rose-600">
                                                Đã quá hạn{" "}
                                                {Math.abs(remainingDays)} ngày
                                             </span>
                                          )
                                       ) : (
                                          "Chưa cập nhật"
                                       )
                                    }
                                 />
                                 {carePackage.code && (
                                    <RowItem
                                       label="Mã gói"
                                       value={carePackage.code}
                                    />
                                 )}
                                 {carePackage.description && (
                                    <RowItem
                                       label="Mô tả gói"
                                       value={carePackage.description}
                                       className="md:col-span-2 lg:col-span-3"
                                    />
                                 )}
                              </div>
                           </div>

                           {/* Đội ngũ phụ trách */}
                           <div className="pt-4 border-t border-slate-100">
                              <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wide">
                                 Đội ngũ chăm sóc phụ trách
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 <RowItem
                                    label="Bác sĩ phụ trách"
                                    value={
                                       sub.assignedDoctor?.fullName ? (
                                          <span>
                                             {sub.assignedDoctor.fullName}
                                             {sub.assignedDoctor
                                                .phoneNumber && (
                                                <span className="text-slate-500 font-normal">
                                                   {" "}
                                                   -{" "}
                                                   {
                                                      sub.assignedDoctor
                                                         .phoneNumber
                                                   }
                                                </span>
                                             )}
                                          </span>
                                       ) : (
                                          "Chưa phân công"
                                       )
                                    }
                                 />
                                 <RowItem
                                    label="Điều dưỡng phụ trách"
                                    value={
                                       sub.assignedNurse?.fullName ? (
                                          <span>
                                             {sub.assignedNurse.fullName}
                                             {sub.assignedNurse.phoneNumber && (
                                                <span className="text-slate-500 font-normal">
                                                   {" "}
                                                   -{" "}
                                                   {
                                                      sub.assignedNurse
                                                         .phoneNumber
                                                   }
                                                </span>
                                             )}
                                          </span>
                                       ) : (
                                          "Chưa phân công"
                                       )
                                    }
                                 />
                                 {isVip && (
                                    <RowItem
                                       label="Chuyên gia cố vấn (VIP)"
                                       value={
                                          sub.assignedExpert?.fullName ||
                                          carePackage.doctorExpert?.fullName ? (
                                             <span>
                                                {sub.assignedExpert?.fullName ||
                                                   carePackage.doctorExpert
                                                      ?.fullName}
                                                {(sub.assignedExpert
                                                   ?.phoneNumber ||
                                                   carePackage.doctorExpert
                                                      ?.phoneNumber) && (
                                                   <span className="text-slate-500 font-normal">
                                                      {" "}
                                                      -{" "}
                                                      {sub.assignedExpert
                                                         ?.phoneNumber ||
                                                         carePackage
                                                            .doctorExpert
                                                            ?.phoneNumber}
                                                   </span>
                                                )}
                                             </span>
                                          ) : (
                                             "Chưa phân công"
                                          )
                                       }
                                    />
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                  })()}
               </AccordionContent>
            </AccordionItem>
         </Accordion>

         {/* Modal chi tiết phân tầng nguy cơ */}
         <RiskAssessmentDetailModal
            isOpen={Boolean(selectedRiskItem)}
            onClose={() => setSelectedRiskItem(null)}
            assessment={selectedRiskItem}
            showStartExamination={false}
         />
      </div>
   );
}

export default HealthProfileDetail;
