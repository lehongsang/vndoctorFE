"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
   useGetHealthProfilesQuery,
   useDeleteHealthProfileMutation,
   useLinkToAppMutation,
} from "@/store/api/health-profile/health-profile-api";
import { HealthProfile, LinkStatus } from "@/store/api/health-profile/type";
import { useAuth } from "@/hooks/use-auth";
import HealthProfileToolBar from "./health-profile-toolbar";
import { HealthProfileForm } from "./health-profile-form";
import { HealthProfileDetail } from "./health-profile-detail";
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
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { LinkAppModal } from "./link-app-modal";
import { BuyCarePackageModal } from "./buy-care-package-modal";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { formatAge } from "@/lib/utils";
import RiskFactorAssessmentForm from "@/features/examination/components/risk-factor-assessment-form";
import { ScrollArea } from "@/components/ui/scroll-area";

const GENDER_LABELS: Record<string, string> = {
   MALE: "Nam",
   FEMALE: "Nữ",
   OTHER: "Khác",
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
   const [assessingProfile, setAssessingProfile] =
      useState<HealthProfile | null>(null);
   const [buyingProfile, setBuyingProfile] = useState<HealthProfile | null>(
      null,
   );
   const [viewingRejectionReason, setViewingRejectionReason] = useState<{
      profileName: string;
      packageName: string;
      reason: string;
   } | null>(null);

   const { user } = useAuth();
   const [scope, setScope] = useState<string>("ALL");
   const [linkStatus, setLinkStatus] = useState<string>("ALL");
   const [packageType, setPackageType] = useState<string>("ALL");

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
      linkStatus: linkStatus !== "ALL" ? (linkStatus as LinkStatus) : undefined,
      packageType:
         packageType !== "ALL"
            ? (packageType as "STANDARD" | "VIP")
            : undefined,
      staffId: scope === "MY" && user?.id ? user.id : undefined,
   });

   const [deleteHealthProfile, { isLoading: isDeleting }] =
      useDeleteHealthProfileMutation();
   const [linkToApp, { isLoading: isLinking }] = useLinkToAppMutation();
   const [resendingProfileId, setResendingProfileId] = useState<string | null>(
      null,
   );

   const handleResendLink = async (profile: HealthProfile) => {
      const phone = profile.phoneNumber?.trim();
      if (!phone) {
         setLinkingProfile(profile);
         return;
      }

      setResendingProfileId(profile.id);
      try {
         await linkToApp({
            healthProfileId: profile.id,
            phoneNumber: phone,
         }).unwrap();
         toast.success("Gửi lại yêu cầu liên kết ứng dụng thành công");
         refetch();
      } catch (err: unknown) {
         const errorObj = err as {
            data?: { message?: string };
            message?: string;
         };
         toast.error(
            errorObj?.data?.message ||
               errorObj?.message ||
               "Có lỗi xảy ra khi gửi lại yêu cầu liên kết",
         );
      } finally {
         setResendingProfileId(null);
      }
   };

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

   const handleCloseForm = () => {
      setIsFormOpen(false);
      setSelectedProfileId(undefined);
      refetch();
   };

   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      setPage(1);
   };

   const handleChangeScope = (newScope: string) => {
      setScope(newScope);
      setPage(1);
   };

   const handleChangeLinkStatus = (newStatus: string) => {
      setLinkStatus(newStatus);
      setPage(1);
   };

   const handleChangePackageType = (newType: string) => {
      setPackageType(newType);
      setPage(1);
   };

   const handleRefresh = () => {
      setSearchText("");
      setDebouncedSearch("");
      setScope("ALL");
      setLinkStatus("ALL");
      setPackageType("ALL");
      setPage(1);
      setIsFormOpen(false);
      setSelectedProfileId(undefined);
      refetch();
   };

   const router = useRouter();

   const handleConfirmDeleteProfile = async () => {
      if (!deletingProfile || isDeleting) return;
      try {
         await deleteHealthProfile(deletingProfile.id).unwrap();
         toast.success("Xóa hồ sơ sức khỏe thành công");
         if (selectedProfileId === deletingProfile.id) {
            handleCloseForm();
         }
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
         cellClassName: "w-14 pl-4text-xs text-slate-600 font-medium",
         cell: (_profile, index) => (page - 1) * limit + index + 1,
      },
      {
         id: "code",
         header: "Mã hồ sơ",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-60",
         cell: (profile) => (
            <span className="font-medium text-xs text-slate-700 ">
               {profile?.hospitalPatientCode || "—"}
            </span>
         ),
      },
      {
         id: "fullName",
         header: "Tên khách hàng",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-60",
         cell: (profile) => (
            <span
               className="font-medium text-sm text-blue-800 underline cursor-pointer"
               onClick={() => handleOpenViewProfile(profile.id, profile)}
            >
               {profile.fullName}
            </span>
         ),
      },
      {
         id: "gender",
         header: "Giới tính",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile) => (
            <span className="text-xs text-slate-700 font-medium">
               {GENDER_LABELS[profile.gender] ?? profile.gender}
            </span>
         ),
      },
      {
         id: "age",
         header: "Tuổi",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile) => (
            <span className="text-xs text-slate-700 font-medium">
               {formatAge(profile.dob)}
            </span>
         ),
      },
      {
         id: "carePackage",
         header: "Gói điều trị",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile: HealthProfile) => {
            const sub = profile?.careSubscription;
            const carePackage = sub?.carePackage;

            if (!sub || !carePackage) {
               return (
                  <CustomButton
                     size="sm"
                     className="h-7 px-2 text-xs"
                     onClick={() => setBuyingProfile(profile)}
                  >
                     Mua gói điều trị
                  </CustomButton>
               );
            }

            const isStandard = carePackage.type === "STANDARD";

            // Xử lý các trạng thái xác nhận của bệnh nhân & gói
            const isRejected =
               Boolean(sub.rejectionReason) ||
               (sub.status === "CANCELLED" && !sub.isPatientConfirmed);
            const isWaitingConfirm =
               Boolean(sub) && !sub.isPatientConfirmed && !isRejected;
            const isWaitingCoordinate =
               Boolean(sub) &&
               sub.isPatientConfirmed &&
               sub.status === "PENDING";
            const isActive = sub.status === "ACTIVE";

            return (
               <div className="flex flex-col gap-0 items-start leading-tight">
                  {/* Bên trên: Tên gói + loại gói */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                     <span className="text-xs font-medium text-slate-800">
                        {carePackage.name}
                     </span>
                     <span
                        className={`text-[10px] py-0.5 px-1.5 rounded-sm font-medium ${
                           isStandard
                              ? "text-blue-600 bg-blue-100"
                              : "text-amber-600 bg-amber-100"
                        }`}
                     >
                        {isStandard ? "Cơ bản" : "Vip"}
                     </span>
                  </div>

                  {/* Bên dưới: Trạng thái gói */}
                  <div className="flex items-center gap-1 flex-wrap mt-0.5 text-xs text-slate-500">
                     <span>Trạng thái:</span>
                     {isActive && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-emerald-50 text-emerald-700">
                           Đang sử dụng
                        </span>
                     )}

                     {isWaitingConfirm && (
                        <span
                           className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-amber-100 text-amber-700"
                           title="Đã gửi đăng ký gói đến bệnh nhân, đang chờ xác nhận trên App"
                        >
                           Chờ xác nhận
                        </span>
                     )}

                     {isWaitingCoordinate && (
                        <span
                           className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-blue-50 text-blue-700"
                           title="Bệnh nhân đã xác nhận, vui lòng hoàn tất điều phối nhân viên"
                        >
                           Chờ điều phối
                        </span>
                     )}

                     {isRejected && (
                        <div className="inline-flex items-center gap-1 flex-wrap">
                           <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-rose-50 text-rose-700">
                              Bị từ chối
                           </span>
                           <button
                              type="button"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 setViewingRejectionReason({
                                    profileName: profile.fullName,
                                    packageName: carePackage.name,
                                    reason:
                                       sub.rejectionReason ||
                                       "Không có thông tin lý do cụ thể.",
                                 });
                              }}
                              className="text-[11px] text-rose-600 hover:text-rose-800 underline underline-offset-2 cursor-pointer font-medium"
                           >
                              Xem lý do
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            );
         },
      },
      {
         id: "linkStatus",
         header: "Trạng thái liên kết App",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (profile: HealthProfile) => {
            if (profile.linkStatus === "PENDING") {
               const isResendingThis = resendingProfileId === profile.id;
               return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                     <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-amber-100 text-amber-700">
                        Đang chờ
                     </span>
                     <CustomButton
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        isLoading={isResendingThis}
                        disabled={isResendingThis}
                        onClick={() => handleResendLink(profile)}
                     >
                        {isResendingThis ? "Đang gửi..." : "Gửi lại"}
                     </CustomButton>
                  </div>
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
                        className="h-8 px-2 text-xs"
                        onClick={() => setLinkingProfile(profile)}
                        isLoading={isLinking}
                     >
                        Gửi lại
                     </CustomButton>
                  </div>
               );
            }

            return (
               <CustomButton
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setLinkingProfile(profile)}
                  isLoading={isLinking}
                  disabled={isLinking}
               >
                  Liên kết
               </CustomButton>
            );
         },
      },
      {
         id: "actions",
         header: "Thao tác",
         headerClassName: "text-right text-xs font-semibold text-slate-600",
         cellClassName: "py-2 text-right",
         cell: (profile: HealthProfile) => {
            const sub = profile?.careSubscription;
            const canExamine = Boolean(sub) && sub?.status === "ACTIVE";
            const isRejected =
               Boolean(sub?.rejectionReason) ||
               (sub?.status === "CANCELLED" && !sub?.isPatientConfirmed);

            return (
               <div className="flex items-center justify-end gap-1.5">
                  {canExamine ? (
                     <CustomButton
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() =>
                           router.push(
                              `/health-profile/examination/${profile.id}`,
                           )
                        }
                     >
                        Khám bệnh
                     </CustomButton>
                  ) : isRejected ? (
                     <CustomButton
                        size="sm"
                        className="h-8 px-2.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                        onClick={() => setBuyingProfile(profile)}
                        title={
                           sub?.rejectionReason
                              ? `Bệnh nhân đã từ chối: ${sub.rejectionReason}. Bấm để đăng ký lại.`
                              : "Bệnh nhân đã từ chối. Bấm để đăng ký lại."
                        }
                     >
                        Đăng ký lại
                     </CustomButton>
                  ) : null}

                  <CustomButton
                     size="sm"
                     className="h-8 px-2.5 text-xs"
                     onClick={() => setAssessingProfile(profile)}
                  >
                     Phân tầng
                  </CustomButton>
               </div>
            );
         },
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
                  onDelete={setDeletingProfile}
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
                  scopeSelected={scope}
                  onChangeScope={handleChangeScope}
                  linkStatusSelected={linkStatus}
                  onChangeLinkStatus={handleChangeLinkStatus}
                  packageTypeSelected={packageType}
                  onChangePackageType={handleChangePackageType}
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

         <BuyCarePackageModal
            open={Boolean(buyingProfile)}
            onOpenChange={(open) => !open && setBuyingProfile(null)}
            profile={buyingProfile}
            onSuccess={() => refetch()}
         />

         <Dialog
            open={Boolean(assessingProfile)}
            onOpenChange={(open) => !open && setAssessingProfile(null)}
         >
            <DialogContent className="sm:min-w-5xl max-h-[90vh] overflow-y-auto p-6 rounded-sm">
               <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-900">
                     Phân tầng yếu tố nguy cơ tim mạch:{" "}
                     {assessingProfile?.fullName}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                     Mã hồ sơ:{" "}
                     {assessingProfile?.hospitalPatientCode ||
                        assessingProfile?.id}
                  </DialogDescription>
               </DialogHeader>

               <ScrollArea className="h-[70vh] -mr-4 pr-4">
                  {assessingProfile && (
                     <RiskFactorAssessmentForm
                        selectedProfile={assessingProfile}
                        onStartExaminationWithAssessment={() => {
                           const id = assessingProfile.id;
                           setAssessingProfile(null);
                           router.push(`/health-profile/examination/${id}`);
                        }}
                     />
                  )}
               </ScrollArea>
            </DialogContent>
         </Dialog>

         {/* Modal xem chi tiết lý do từ chối gói */}
         <Dialog
            open={Boolean(viewingRejectionReason)}
            onOpenChange={(open) => !open && setViewingRejectionReason(null)}
         >
            <DialogContent className="sm:max-w-md p-5 rounded-sm">
               <DialogHeader>
                  <DialogTitle className="text-sm font-bold text-rose-700">
                     Lý do bệnh nhân từ chối gói điều trị
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                     Bệnh nhân:{" "}
                     <span className="font-medium text-slate-700">
                        {viewingRejectionReason?.profileName}
                     </span>{" "}
                     - Gói:{" "}
                     <span className="font-medium text-slate-700">
                        {viewingRejectionReason?.packageName}
                     </span>
                  </DialogDescription>
               </DialogHeader>

               <div className="mt-2 p-3 bg-rose-50/60 border border-rose-200/80 rounded-sm">
                  <p className="text-xs text-rose-950 whitespace-pre-wrap leading-relaxed">
                     {viewingRejectionReason?.reason}
                  </p>
               </div>

               <div className="mt-2 flex justify-end">
                  <CustomButton
                     size="sm"
                     variant="outline"
                     className="h-8 px-3 text-xs"
                     onClick={() => setViewingRejectionReason(null)}
                  >
                     Đóng
                  </CustomButton>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   );
}

export default HealthProfileTable;
