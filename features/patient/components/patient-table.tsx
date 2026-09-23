"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HealthProfile } from "@/store/api/health-profile/type";
import { CustomPagination } from "@/components/common/custom-pagination";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";

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

const formatDate = (dateStr?: string) => {
   if (!dateStr) return "—";
   try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("vi-VN");
   } catch {
      return dateStr;
   }
};

interface PatientColumn {
   id: string;
   header: React.ReactNode;
   headerClassName?: string;
   cellClassName?: string;
   cell: (profile: HealthProfile, index: number) => React.ReactNode;
}

export interface PatientTableProps {
   profiles: HealthProfile[];
   isLoading: boolean;
   isFetching: boolean;
   page: number;
   limit: number;
   totalItems: number;
   onPageChange: (page: number) => void;
   onPageSizeChange: (limit: number) => void;
   onViewDetail: (profile: HealthProfile) => void;
   onExamine?: (profile: HealthProfile) => void;
}

export function PatientTable({
   profiles,
   isLoading,
   isFetching,
   page,
   limit,
   totalItems,
   onPageChange,
   onPageSizeChange,
   onViewDetail,
   onExamine,
}: PatientTableProps) {
   const router = useRouter();
   const totalPages = Math.max(1, Math.ceil(totalItems / limit));

   const columns: PatientColumn[] = [
      {
         id: "stt",
         header: "STT",
         headerClassName: "w-14 pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "w-14 pl-4 py-3.5 text-xs text-slate-600 font-medium",
         cell: (_profile, index) => (page - 1) * limit + index + 1,
      },
      {
         id: "patientCode",
         header: "Mã HS",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile) => (
            <span className="text-xs font-semibold text-slate-700">
               {profile?.hospitalPatientCode ||
                  profile.id.slice(0, 8).toUpperCase()}
            </span>
         ),
      },
      {
         id: "fullName",
         header: "Họ và tên",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-44",
         cell: (profile) => (
            <div className="flex flex-col gap-0.5">
               <span className="font-medium text-sm text-slate-800">
                  {profile.fullName}
               </span>
               <span className="text-xs text-slate-400">
                  {RELATIONSHIP_LABELS[profile.relationship] ??
                     profile.relationship}
                  {profile.citizenId ? ` / CCCD: ${profile.citizenId}` : ""}
               </span>
            </div>
         ),
      },
      {
         id: "genderDob",
         header: "Giới tính / Ngày sinh",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile) => (
            <span className="text-xs text-slate-700 font-medium">
               {GENDER_LABELS[profile.gender] ?? profile.gender} •{" "}
               {formatDate(profile.dob)}
            </span>
         ),
      },
      {
         id: "contact",
         header: "Liên hệ",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile) => (
            <div className="flex flex-col text-xs text-slate-600 gap-0.5">
               <span className="text-slate-700 font-medium">
                  {profile.phoneNumber || "—"}
               </span>
               <span
                  className="text-slate-400 max-w-48 truncate block"
                  title={profile.address}
               >
                  {profile.address || "—"}
               </span>
            </div>
         ),
      },
      {
         id: "treatmentPackages",
         header: "Gói điều trị",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-[120px]",
         cell: (profile: HealthProfile) => {
            return (
               <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-700 font-medium">
                     {profile?.subscription?.carePackage.name}
                  </span>
                  <span
                     className={`text-xs py-1 px-2 rounded-sm inline-block w-fit ${
                        profile?.subscription?.carePackage?.type === "STANDARD"
                           ? "text-blue-600 bg-blue-100 font-medium"
                           : "text-purple-600 bg-purple-100 font-medium"
                     }`}
                  >
                     {profile?.subscription?.carePackage?.type === "STANDARD"
                        ? "Cơ bản"
                        : "Vip"}
                  </span>
               </div>
            );
         },
      },
      {
         id: "actions",
         header: "Thao tác",
         headerClassName:
            "text-right text-xs font-semibold text-slate-600 pr-4 min-w-24",
         cellClassName: "py-3.5 text-right pr-4",
         cell: (profile: HealthProfile) => (
            <div className="flex items-center justify-end gap-1.5">
               <CustomButton
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => onViewDetail(profile)}
               >
                  Chi tiết
               </CustomButton>
               <CustomButton
                  size="sm"
                  className="h-8 px-2.5"
                  onClick={() => {
                     if (onExamine) {
                        onExamine(profile);
                     } else {
                        router.push(`/work?profileId=${profile.id}`);
                     }
                  }}
               >
                  Khám bệnh
               </CustomButton>
            </div>
         ),
      },
   ];

   return (
      <div className="flex flex-col gap-4">
         <div>
            <Table>
               <TableHeader className="bg-slate-50/60">
                  <TableRow className="hover:bg-transparent border-b border-slate-300">
                     {columns.map((col) => (
                        <TableHead key={col.id} className={col.headerClassName}>
                           {col.header}
                        </TableHead>
                     ))}
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {isFetching || isLoading ? (
                     <TableRow>
                        <TableCell
                           colSpan={columns.length}
                           className="h-48 text-center"
                        >
                           <CloverLoading
                              size="md"
                              text="Đang tải danh sách bệnh nhân được phân công..."
                           />
                        </TableCell>
                     </TableRow>
                  ) : profiles.length === 0 ? (
                     <TableRow>
                        <TableCell
                           colSpan={columns.length}
                           className="h-48 text-center text-sm text-slate-500"
                        >
                           Chưa có bệnh nhân nào được phân công.
                        </TableCell>
                     </TableRow>
                  ) : (
                     profiles.map((profile, index) => (
                        <TableRow
                           key={profile.id}
                           className="border-b border-slate-300 transition-colors hover:bg-slate-100"
                        >
                           {columns.map((col) => (
                              <TableCell
                                 key={col.id}
                                 className={col.cellClassName ?? "py-0"}
                              >
                                 {col.cell(profile, index)}
                              </TableCell>
                           ))}
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>

         {profiles.length > 0 && (
            <div className="mt-2 flex justify-end">
               <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={limit}
                  showPageSizeSelector
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
               />
            </div>
         )}
      </div>
   );
}

export default PatientTable;
