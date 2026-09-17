"use client";

import React, { useEffect, useState } from "react";
import {
   useChangeCarePackageStatusMutation,
   useDeleteCarePackageMutation,
   useGetCarePackagesQuery,
} from "@/store/api/care-package/care-package-api";
import {
   CarePackage,
   CarePackageStatus,
   CarePackageType,
} from "@/store/api/care-package/type";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomPagination } from "@/components/common/custom-pagination";
import { CustomButton } from "@/components/common/custom-button";
import { toast } from "react-toastify";
import { CarePackageToolbar } from "./components/care-package-toolbar";
import { CarePackageCard } from "./components/care-package-card";
import { CarePackageForm } from "./components/care-package-form";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function CarePackageModule() {
   const [searchText, setSearchText] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [packageType, setPackageType] = useState<CarePackageType | "ALL">(
      "ALL",
   );
   const [status, setStatus] = useState<CarePackageStatus | "ALL">("ALL");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);
   const { user } = useAuth();
   const facilityId = user?.facility?.id;

   const [isFormOpen, setIsFormOpen] = useState(false);
   const [selectedPackageId, setSelectedPackageId] = useState<
      string | undefined
   >(undefined);
   const [formMode, setFormMode] = useState<"create" | "update" | "view">(
      "create",
   );

   const [deletingPackage, setDeletingPackage] = useState<CarePackage | null>(
      null,
   );
   const [deletePackage, { isLoading: isDeleting }] =
      useDeleteCarePackageMutation();

   const [changeStatus, { isLoading: isStatusChanging }] =
      useChangeCarePackageStatusMutation();
   const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(
      null,
   );

   useEffect(() => {
      const handler = setTimeout(() => {
         setDebouncedSearch(searchText);
      }, 400);
      return () => clearTimeout(handler);
   }, [searchText]);

   const {
      data: packageData,
      isLoading,
      isFetching,
      refetch,
   } = useGetCarePackagesQuery({
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
      type: packageType === "ALL" ? undefined : packageType,
      status: status === "ALL" ? undefined : status,
      facilityId: facilityId || undefined,
   });

   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      setPage(1);
   };

   const handlePackageTypeChange = (type: CarePackageType | "ALL") => {
      setPackageType(type);
      setPage(1);
   };

   const handleStatusChange = (val: CarePackageStatus | "ALL") => {
      setStatus(val);
      setPage(1);
   };

   const handleRefresh = () => {
      setSearchText("");
      setDebouncedSearch("");
      setPackageType("ALL");
      setStatus("ALL");
      setPage(1);
      setIsFormOpen(false);
      setSelectedPackageId(undefined);
      setFormMode("create");
      refetch();
   };

   const handleOpenCreate = () => {
      setSelectedPackageId(undefined);
      setFormMode("create");
      setIsFormOpen(true);
   };

   const handleOpenEdit = (pkg: CarePackage) => {
      setSelectedPackageId(pkg.id);
      setFormMode("update");
      setIsFormOpen(true);
   };

   const handleOpenView = (pkg: CarePackage) => {
      setSelectedPackageId(pkg.id);
      setFormMode("view");
      setIsFormOpen(true);
   };

   const handleCloseForm = () => {
      setIsFormOpen(false);
      setSelectedPackageId(undefined);
      setFormMode("create");
   };

   const handleToggleStatus = async (pkg: CarePackage) => {
      const newStatus: CarePackageStatus =
         pkg.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      try {
         setStatusUpdatingId(pkg.id);
         await changeStatus({ id: pkg.id, status: newStatus }).unwrap();
         toast.success(
            `Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "tắt"} gói ${pkg.name}!`,
         );
      } catch (error: unknown) {
         console.error("Lỗi khi đổi trạng thái gói:", error);
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Không thể thay đổi trạng thái gói chăm sóc.";
         toast.error(errorMessage);
      } finally {
         setStatusUpdatingId(null);
      }
   };

   const handleConfirmDelete = async () => {
      if (!deletingPackage) return;
      try {
         await deletePackage(deletingPackage.id).unwrap();
         toast.success(`Đã xoá gói chăm sóc "${deletingPackage.name}"!`);
         setDeletingPackage(null);
      } catch (error: unknown) {
         console.error("Lỗi khi xoá gói chăm sóc:", error);
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi xoá gói chăm sóc.";
         toast.error(errorMessage);
      }
   };

   // Parse packages list
   const items: CarePackage[] = packageData?.data ?? [];
   const totalItems: number = packageData?.total ?? items.length;
   const totalPages: number = Math.max(1, Math.ceil(totalItems / limit));

   return (
      <div className="w-full space-y-5">
         {isFormOpen ? (
            <CarePackageForm
               key={`${formMode}-${selectedPackageId ?? "new"}`}
               id={selectedPackageId}
               mode={formMode}
               onClose={handleCloseForm}
            />
         ) : (
            <>
               <CarePackageToolbar
                  searchText={searchText}
                  onSearchChange={handleSearchChange}
                  packageType={packageType}
                  onPackageTypeChange={handlePackageTypeChange}
                  status={status}
                  onStatusChange={handleStatusChange}
                  refetch={handleRefresh}
                  isFetching={isFetching}
                  onClickCreate={handleOpenCreate}
               />

               {isLoading || isFetching ? (
                  <div className="flex items-center justify-center h-40 bg-white rounded-xl border border-slate-200">
                     <CloverLoading
                        size="md"
                        text="Đang tải danh sách gói chăm sóc..."
                     />
                  </div>
               ) : items.length === 0 ? (
                  <div className="flex flex-col h-40 items-center justify-center p-12 text-center border border-dashed border-slate-200 rounded-xl bg-white space-y-3">
                     <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-slate-800">
                           Chưa có gói chăm sóc nào
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm">
                           {debouncedSearch ||
                           packageType !== "ALL" ||
                           status !== "ALL"
                              ? "Không tìm thấy gói chăm sóc phù hợp với bộ lọc."
                              : "Bấm 'Thêm mới gói' để tạo gói chăm sóc đầu tiên cho cơ sở y tế."}
                        </p>
                     </div>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {items.map((pkg) => (
                        <CarePackageCard
                           key={pkg.id}
                           carePackage={pkg}
                           onView={handleOpenView}
                           onEdit={handleOpenEdit}
                           onDelete={(item) => setDeletingPackage(item)}
                           onToggleStatus={handleToggleStatus}
                           isStatusUpdating={
                              isStatusChanging && statusUpdatingId === pkg.id
                           }
                        />
                     ))}
                  </div>
               )}

               {/* Pagination */}
               {items.length > 0 && (
                  <div className="flex justify-end pt-2">
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

         {/* Delete Confirmation Dialog */}
         <Dialog
            open={Boolean(deletingPackage)}
            onOpenChange={(open) => {
               if (!open) setDeletingPackage(null);
            }}
         >
            <DialogContent className="max-w-md p-6">
               <DialogHeader className="flex flex-col items-center text-center gap-2">
                  <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                     <AlertTriangle className="size-6" />
                  </div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                     Xác nhận xóa gói chăm sóc
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                     Bạn có chắc chắn muốn xóa gói{" "}
                     <strong className="text-slate-800">
                        {deletingPackage?.name}
                     </strong>
                     ? Hành động này không thể hoàn tác sau khi thực hiện.
                  </DialogDescription>
               </DialogHeader>

               <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                  <CustomButton
                     variant="outline"
                     onClick={() => setDeletingPackage(null)}
                     disabled={isDeleting}
                     className="h-9 px-4 text-xs"
                  >
                     Hủy bỏ
                  </CustomButton>

                  <CustomButton
                     onClick={handleConfirmDelete}
                     isLoading={isDeleting}
                     loadingText="Đang xóa..."
                     className="h-9 px-4 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                  >
                     Xác nhận xóa
                  </CustomButton>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}
