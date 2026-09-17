"use client";

import { useState, useEffect } from "react";
import {
   useDeleteStaffMutation,
   useGetAllStaffQuery,
} from "@/store/api/staff/staff-api";
import { Factility } from "@/store/api/facility/type";
import { Staff, StaffRole, STAFF_ROLE_LABELS } from "@/store/api/staff/type";
import StaffToolBar from "./staff-toolbar";
import { StaffForm } from "./staff-form";
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
import { ConfirmModal } from "@/components/common/confirm-modal";

interface FacilityStaffProps {
   facilityId?: string;
   facility?: Factility;
}

export default function FacilityStaff({
   facilityId,
   facility,
}: FacilityStaffProps) {
   const [searchText, setSearchText] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [role, setRole] = useState<StaffRole | "ALL">("ALL");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);
   const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
   const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
      undefined,
   );
   const [staffFormMode, setStaffFormMode] = useState<
      "create" | "update" | "view"
   >("create");

   const handleOpenCreateStaff = () => {
      setSelectedStaffId(undefined);
      setStaffFormMode("create");
      setIsStaffFormOpen(true);
   };

   const handleOpenViewStaff = (id: string) => {
      setSelectedStaffId(id);
      setStaffFormMode("view");
      setIsStaffFormOpen(true);
   };

   const handleOpenEditStaff = (id: string) => {
      setSelectedStaffId(id);
      setStaffFormMode("update");
      setIsStaffFormOpen(true);
   };

   const handleCloseStaffForm = () => {
      setIsStaffFormOpen(false);
      setSelectedStaffId(undefined);
      refetch();
   };

   useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
      return () => clearTimeout(timer);
   }, [searchText]);

   const {
      data: staffData,
      isLoading,
      isFetching,
      refetch,
   } = useGetAllStaffQuery(
      {
         facilityId: facilityId || undefined,
         search: debouncedSearch.trim() || undefined,
         role: role === "ALL" ? undefined : role,
         page,
         limit,
      },
      {
         skip: !facilityId,
      },
   );

   const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
   const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      setPage(1);
   };

   const handleRoleChange = (val: string) => {
      setRole(val as StaffRole | "ALL");
      setPage(1);
   };

   const handleRefresh = () => {
      if (facilityId) {
         setSearchText("");
         setDebouncedSearch("");
         setRole("ALL");
         setPage(1);
         setIsStaffFormOpen(false);
         setSelectedStaffId(undefined);
         refetch();
      }
   };

   const handleConfirmDeleteStaff = async () => {
      if (!deletingStaff || isDeleting) return;
      try {
         await deleteStaff(deletingStaff.id).unwrap();
         toast.success("Xóa nhân viên thành công");
         setDeletingStaff(null);
         refetch();
      } catch (error: unknown) {
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi xóa nhân viên";
         toast.error(errorMessage);
      }
   };

   const staffList: Staff[] = staffData?.items ?? [];
   const totalItems = staffData?.total ?? staffList.length;
   const totalPages =
      staffData?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit));

   if (!facilityId) {
      return (
         <div className="mt-4 p-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white">
            Chưa có thông tin cơ sở y tế để hiển thị danh sách nhân viên.
         </div>
      );
   }

   interface StaffColumn {
      id: string;
      header: React.ReactNode;
      headerClassName?: string;
      cellClassName?: string;
      cell: (staff: Staff, index: number) => React.ReactNode;
   }

   const columns: StaffColumn[] = [
      {
         id: "stt",
         header: "STT",
         headerClassName: "w-14 pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "w-14 pl-4 py-3.5 text-xs text-slate-600 font-medium",
         cell: (_staff, index) => (page - 1) * limit + index + 1,
      },
      {
         id: "staffCode",
         header: "Mã NV",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (staff) => (
            <span className="text-xs font-semibold text-slate-700">
               {staff.staffCode}
            </span>
         ),
      },
      {
         id: "fullName",
         header: "Họ và tên",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-44",
         cell: (staff) => (
            <div className="flex flex-col gap-0.5">
               <span className="font-medium text-sm text-slate-800">
                  {staff.fullName}
               </span>
            </div>
         ),
      },
      {
         id: "role",
         header: "Vai trò",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (staff) => (
            <span className="text-xs text-slate-700 font-medium">
               {STAFF_ROLE_LABELS[staff.role as StaffRole] ?? staff.role}
            </span>
         ),
      },
      {
         id: "specialty",
         header: "Chuyên khoa",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (staff) => (
            <span
               className="text-xs text-slate-600 max-w-50 truncate block"
               title={staff.specialty || ""}
            >
               {staff.specialty || "—"}
            </span>
         ),
      },
      {
         id: "contact",
         header: "Liên hệ",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (staff) => (
            <div className="flex flex-col text-xs text-slate-600 gap-0.5">
               <span>{staff.email || "—"}</span>
               <span className="text-slate-400">
                  {staff.phoneNumber || "—"}
               </span>
            </div>
         ),
      },
      {
         id: "actions",
         header: "Thao tác",
         headerClassName:
            "text-right text-xs font-semibold text-slate-600 pr-4 min-w-40",
         cellClassName: "py-3.5 text-right pr-4",
         cell: (staffItem: Staff) => (
            <div className="flex items-center justify-end gap-1.5">
               <CustomButton
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => handleOpenViewStaff(staffItem.id)}
               >
                  <Eye />
               </CustomButton>
               <CustomButton
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => handleOpenEditStaff(staffItem.id)}
               >
                  <Edit />
               </CustomButton>
               <CustomButton
                  id={`delete-${staffItem.id}`}
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                  onClick={() => setDeletingStaff(staffItem)}
               >
                  <Trash />
               </CustomButton>
            </div>
         ),
      },
   ];

   return (
      <div className="flex flex-col gap-4">
         <StaffToolBar
            searchText={searchText}
            onSearchChange={handleSearchChange}
            role={role}
            onRoleChange={handleRoleChange}
            refetch={handleRefresh}
            isFetching={isFetching}
            disabled={!facilityId}
            onClickCreate={handleOpenCreateStaff}
         />

         {isStaffFormOpen ? (
            <StaffForm
               key={`${staffFormMode}-${selectedStaffId ?? "new"}`}
               staffId={selectedStaffId}
               facility={facility}
               facilityId={facilityId}
               mode={staffFormMode}
               onClose={handleCloseStaffForm}
            />
         ) : (
            <>
               <div className="">
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
                                    text="Đang tải danh sách nhân sự..."
                                 />
                              </TableCell>
                           </TableRow>
                        ) : staffList.length === 0 ? (
                           <TableRow>
                              <TableCell
                                 colSpan={columns.length}
                                 className="h-48 text-center text-sm text-slate-500"
                              >
                                 Không tìm thấy nhân sự nào thuộc cơ sở này.
                              </TableCell>
                           </TableRow>
                        ) : (
                           staffList.map((staff, index) => (
                              <TableRow
                                 key={staff.id}
                                 className="border-b border-slate-300 transition-colors hover:bg-slate-100"
                              >
                                 {columns.map((col) => (
                                    <TableCell
                                       key={col.id}
                                       className={col.cellClassName ?? "py-0"}
                                    >
                                       {col.cell(staff, index)}
                                    </TableCell>
                                 ))}
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>

               {staffList.length > 0 && (
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

         <ConfirmModal
            open={Boolean(deletingStaff)}
            onClose={() => setDeletingStaff(null)}
            onConfirm={handleConfirmDeleteStaff}
            itemName={deletingStaff?.fullName}
            title="Xác nhận xóa nhân viên"
            isLoading={isDeleting}
         />
      </div>
   );
}
