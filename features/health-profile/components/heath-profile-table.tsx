"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
   useGetHealthProfilesQuery,
   useDeleteHealthProfileMutation,
} from "@/store/api/health-profile/health-profile-api";
import { HealthProfile } from "@/store/api/health-profile/type";
import HealthProfileToolBar from "./health-profile-toolbar";
import { HealthProfileForm } from "./health-profile-form";
import { HealthProfileDetail } from "./health-profile-detail";
import { CustomPagination } from "@/components/common/custom-pagination";
import { Edit, Eye, Trash } from "lucide-react";
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
import { toast } from "react-toastify";
import { useGetAllChronicDiseasesQuery } from "@/store/api/chronic-diseases/chronic-diseases-api";
import { LinkAppModal } from "./link-app-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { formatAge } from "@/lib/utils";

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

export interface HealthProfileTableProps {
   onViewDetail?: (profile: HealthProfile) => void;
   onEdit?: (profile: HealthProfile) => void;
   onClickCreate?: () => void;
}

interface HealthProfileColumn {
   id: string;
   header: React.ReactNode;
   headerClassName?: string;
   cellClassName?: string;
   cell: (profile: HealthProfile, index: number) => React.ReactNode;
}

export function HealthProfileTable({
   onViewDetail,
   onEdit,
   onClickCreate,
}: HealthProfileTableProps) {
   const [searchText, setSearchText] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);
   const searchParams = useSearchParams();
   const querySelectedId =
      searchParams.get("selectedId") ||
      searchParams.get("profileId") ||
      searchParams.get("id");

   const [prevQuerySelectedId, setPrevQuerySelectedId] =
      useState(querySelectedId);
   const [isFormOpen, setIsFormOpen] = useState(Boolean(querySelectedId));
   const [selectedProfileId, setSelectedProfileId] = useState<
      string | undefined
   >(querySelectedId || undefined);
   const [formMode, setFormMode] = useState<"create" | "update" | "view">(
      querySelectedId ? "view" : "create",
   );
   const [deletingProfile, setDeletingProfile] = useState<HealthProfile | null>(
      null,
   );
   const [linkingProfile, setLinkingProfile] = useState<HealthProfile | null>(
      null,
   );

   if (prevQuerySelectedId !== querySelectedId) {
      setPrevQuerySelectedId(querySelectedId);
      if (querySelectedId) {
         setSelectedProfileId(querySelectedId);
         setFormMode("view");
         setIsFormOpen(true);
      }
   }

   useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
      return () => clearTimeout(timer);
   }, [searchText]);

   const {
      data: profileData,
      isLoading,
      isFetching,
      refetch,
   } = useGetHealthProfilesQuery({
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
   });

   const { data: diseasesData } = useGetAllChronicDiseasesQuery({
      page: 1,
      limit: 1000,
   });

   const chronicDiseaseMap = useMemo(() => {
      const map = new Map<string, { name: string; code: string }>();
      if (Array.isArray(diseasesData?.items)) {
         diseasesData.items.forEach((item) => {
            map.set(item.id, { name: item.name, code: item.code });
         });
      }
      return map;
   }, [diseasesData]);

   const [deleteHealthProfile, { isLoading: isDeleting }] =
      useDeleteHealthProfileMutation();

   const handleOpenCreateProfile = () => {
      if (onClickCreate) {
         onClickCreate();
         return;
      }
      setSelectedProfileId(undefined);
      setFormMode("create");
      setIsFormOpen(true);
   };

   const handleOpenViewProfile = (id: string, profile: HealthProfile) => {
      if (onViewDetail) {
         onViewDetail(profile);
         return;
      }
      setSelectedProfileId(id);
      setFormMode("view");
      setIsFormOpen(true);
   };

   const handleOpenEditProfile = (id: string, profile: HealthProfile) => {
      if (onEdit) {
         onEdit(profile);
         return;
      }
      setSelectedProfileId(id);
      setFormMode("update");
      setIsFormOpen(true);
   };

   const handleCloseForm = () => {
      setIsFormOpen(false);
      setSelectedProfileId(undefined);
      refetch();
   };

   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      setPage(1);
   };

   const handleRefresh = () => {
      setSearchText("");
      setDebouncedSearch("");
      setPage(1);
      setIsFormOpen(false);
      setSelectedProfileId(undefined);
      refetch();
   };

   const handleConfirmDeleteProfile = async () => {
      if (!deletingProfile || isDeleting) return;
      try {
         await deleteHealthProfile(deletingProfile.id).unwrap();
         toast.success("Xóa hồ sơ sức khỏe thành công");
         setDeletingProfile(null);
         refetch();
      } catch (error: unknown) {
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi xóa hồ sơ sức khỏe";
         toast.error(errorMessage);
      }
   };

   const profileList: HealthProfile[] = profileData?.items ?? [];
   const totalItems = profileData?.total ?? profileList.length;
   const totalPages =
      profileData && typeof profileData.total === "number"
         ? Math.max(1, Math.ceil(totalItems / limit))
         : Math.max(1, Math.ceil(totalItems / limit));

   const columns: HealthProfileColumn[] = [
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
         header: "Giới tính / Tuổi",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile) => (
            <span className="text-xs text-slate-700 font-medium">
               {GENDER_LABELS[profile.gender] ?? profile.gender} -{" "}
               {formatAge(profile.dob)}
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
         id: "linkApp",
         header: "Liên kết App",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-[150px]",
         cell: (profile: HealthProfile) => {
            if (profile.linkStatus === "PENDING") {
               return (
                  <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-amber-100 text-amber-700">
                     Đang chờ
                  </span>
               );
            }

            if (
               profile.linkStatus === "ACTIVE" ||
               (profile.isLinked && profile.linkStatus !== "UNLINKED")
            ) {
               return (
                  <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-emerald-100 text-emerald-700">
                     Đã liên kết
                  </span>
               );
            }

            if (profile.linkStatus === "UNLINKED") {
               return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                     <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        Đã hủy liên kết
                     </span>
                     <CustomButton
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => setLinkingProfile(profile)}
                     >
                        Gửi lại liên kết
                     </CustomButton>
                  </div>
               );
            }

            return (
               <CustomButton
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setLinkingProfile(profile)}
               >
                  Liên kết
               </CustomButton>
            );
         },
      },
      {
         id: "actions",
         header: "Thao tác",
         headerClassName:
            "text-right text-xs font-semibold text-slate-600 pr-4 min-w-40",
         cellClassName: "py-3.5 text-right pr-4",
         cell: (profile: HealthProfile) => (
            <div className="flex items-center justify-end gap-1.5">
               <CustomButton
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => handleOpenViewProfile(profile.id, profile)}
               >
                  <Eye className="w-3.5 h-3.5" />
               </CustomButton>
               <CustomButton
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => handleOpenEditProfile(profile.id, profile)}
               >
                  <Edit className="w-3.5 h-3.5" />
               </CustomButton>
               <CustomButton
                  id={`delete-${profile.id}`}
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                  onClick={() => setDeletingProfile(profile)}
               >
                  <Trash className="w-3.5 h-3.5" />
               </CustomButton>
            </div>
         ),
      },
   ];

   return (
      <div className="flex flex-col gap-4 p-4">
         {isFormOpen ? (
            formMode === "view" && selectedProfileId ? (
               <HealthProfileDetail
                  profileId={selectedProfileId}
                  onClose={handleCloseForm}
                  onEdit={(id) => {
                     setSelectedProfileId(id);
                     setFormMode("update");
                  }}
               />
            ) : (
               <HealthProfileForm
                  key={`${formMode}-${selectedProfileId ?? "new"}`}
                  profileId={selectedProfileId}
                  mode={formMode}
                  onClose={handleCloseForm}
               />
            )
         ) : (
            <>
               <HealthProfileToolBar
                  searchText={searchText}
                  onSearchChange={handleSearchChange}
                  refetch={handleRefresh}
                  isFetching={isFetching}
                  onClickCreate={handleOpenCreateProfile}
               />

               <div>
                  <Table>
                     <TableHeader className="bg-slate-50/60">
                        <TableRow className="hover:bg-transparent border-b border-slate-300">
                           {columns.map((col) => (
                              <TableHead
                                 key={col.id}
                                 className={col.headerClassName}
                              >
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
                                    text="Đang tải danh sách hồ sơ sức khỏe..."
                                 />
                              </TableCell>
                           </TableRow>
                        ) : profileList.length === 0 ? (
                           <TableRow>
                              <TableCell
                                 colSpan={columns.length}
                                 className="h-48 text-center text-sm text-slate-500"
                              >
                                 Chưa có hồ sơ sức khỏe nào.
                              </TableCell>
                           </TableRow>
                        ) : (
                           profileList.map((profile, index) => (
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

               {profileList.length > 0 && (
                  <div className="mt-2 flex justify-end">
                     <CustomPagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={limit}
                        showPageSizeSelector
                        onPageChange={setPage}
                        onPageSizeChange={(newLimit) => {
                           setLimit(newLimit);
                           setPage(1);
                        }}
                     />
                  </div>
               )}
            </>
         )}

         <LinkAppModal
            open={Boolean(linkingProfile)}
            onOpenChange={(open) => !open && setLinkingProfile(null)}
            profile={linkingProfile}
            onSuccess={() => refetch()}
         />

         <ConfirmModal
            open={Boolean(deletingProfile)}
            onClose={() => setDeletingProfile(null)}
            onConfirm={handleConfirmDeleteProfile}
            itemName={deletingProfile?.fullName}
            title="Xác nhận xóa hồ sơ sức khỏe"
            isLoading={isDeleting}
         />
      </div>
   );
}

export default HealthProfileTable;
