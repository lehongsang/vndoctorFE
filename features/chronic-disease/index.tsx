"use client";

import { useState, useEffect } from "react";
import {
   useGetAllChronicDiseasesQuery,
   useDeleteChronicDiseaseMutation,
} from "@/store/api/chronic-diseases/chronic-diseases-api";
import { ChronicDisease } from "@/store/api/chronic-diseases/type";
import ChronicDiseaseToolBar from "./components/chronic-disease-toolbar";
import ChronicDiseaseForm from "./components/chronic-disease-form";
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

interface ChronicDiseaseColumn {
   id: string;
   header: React.ReactNode;
   headerClassName?: string;
   cellClassName?: string;
   cell: (disease: ChronicDisease, index: number) => React.ReactNode;
}

export default function ChronicDiseaseFeature() {
   const [searchText, setSearchText] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | undefined>(
      undefined,
   );
   const [formMode, setFormMode] = useState<"create" | "update" | "view">(
      "create",
   );
   const [deletingDisease, setDeletingDisease] = useState<ChronicDisease | null>(null);

   useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
      return () => clearTimeout(timer);
   }, [searchText]);

   const {
      data: diseaseData,
      isLoading,
      isFetching,
      refetch,
   } = useGetAllChronicDiseasesQuery({
      search: debouncedSearch.trim() || undefined,
      page,
      limit,
   });

   const [deleteDisease, { isLoading: isDeleting }] =
      useDeleteChronicDiseaseMutation();

   const handleOpenCreateDisease = () => {
      setSelectedDiseaseId(undefined);
      setFormMode("create");
      setIsFormOpen(true);
   };

   const handleOpenViewDisease = (id: string) => {
      setSelectedDiseaseId(id);
      setFormMode("view");
      setIsFormOpen(true);
   };

   const handleOpenEditDisease = (id: string) => {
      setSelectedDiseaseId(id);
      setFormMode("update");
      setIsFormOpen(true);
   };

   const handleCloseForm = () => {
      setIsFormOpen(false);
      setSelectedDiseaseId(undefined);
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
      setSelectedDiseaseId(undefined);
      refetch();
   };

   const handleConfirmDeleteDisease = async () => {
      if (!deletingDisease || isDeleting) return;
      try {
         await deleteDisease(deletingDisease.id).unwrap();
         toast.success("Xóa bệnh mãn tính thành công");
         setDeletingDisease(null);
         refetch();
      } catch (error: unknown) {
         const errorMessage =
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { message?: string } }).data?.message ===
               "string"
               ? (error as { data: { message: string } }).data.message
               : "Có lỗi xảy ra khi xóa bệnh mãn tính";
         toast.error(errorMessage);
      }
   };

   const diseaseList: ChronicDisease[] = diseaseData?.items ?? [];
   const totalItems = diseaseData?.total ?? diseaseList.length;
   const totalPages =
      diseaseData?.total !== undefined
         ? Math.max(1, Math.ceil(totalItems / limit))
         : Math.max(1, Math.ceil(totalItems / limit));

   const columns: ChronicDiseaseColumn[] = [
      {
         id: "stt",
         header: "STT",
         headerClassName: "w-14 pl-4 text-xs font-semibold text-slate-600",
         cellClassName: "w-14 pl-4 py-3.5 text-xs text-slate-600 font-medium",
         cell: (_disease, index) => (page - 1) * limit + index + 1,
      },
      {
         id: "code",
         header: "Mã bệnh",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (disease) => (
            <span className="text-xs font-semibold text-slate-700">
               {disease.code}
            </span>
         ),
      },
      {
         id: "name",
         header: "Tên bệnh mãn tính",
         headerClassName: "text-xs font-semibold text-slate-600 min-w-44",
         cell: (disease) => (
            <span className="font-medium text-sm text-slate-800">
               {disease.name}
            </span>
         ),
      },
      {
         id: "icd10Code",
         header: "Mã ICD-10",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (disease) => (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
               {disease.icd10Code || "—"}
            </span>
         ),
      },
      {
         id: "category",
         header: "Nhóm bệnh",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (disease) => (
            <span
               className="text-xs text-slate-600 max-w-48 truncate block"
               title={disease.category || ""}
            >
               {disease.category || "—"}
            </span>
         ),
      },
      {
         id: "displayOrder",
         header: "Thứ tự",
         headerClassName: "text-xs font-semibold text-slate-600 text-center w-20",
         cellClassName: "text-center w-20",
         cell: (disease) => (
            <span className="text-xs text-slate-600 font-medium">
               {disease.displayOrder ?? 0}
            </span>
         ),
      },
      {
         id: "isActive",
         header: "Trạng thái",
         headerClassName: "text-xs font-semibold text-slate-600",
         cell: (disease) => (
            <span
               className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                  disease.isActive
                     ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                     : "bg-slate-100 text-slate-600 border-slate-200"
               }`}
            >
               {disease.isActive ? "Hoạt động" : "Tạm khóa"}
            </span>
         ),
      },
      {
         id: "actions",
         header: "Thao tác",
         headerClassName:
            "text-right text-xs font-semibold text-slate-600 pr-4 min-w-36",
         cellClassName: "py-3.5 text-right pr-4",
         cell: (disease: ChronicDisease) => (
            <div className="flex items-center justify-end gap-1.5">
               <CustomButton
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => handleOpenViewDisease(disease.id)}
               >
                  <Eye className="w-3.5 h-3.5" />
               </CustomButton>
               <CustomButton
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => handleOpenEditDisease(disease.id)}
               >
                  <Edit className="w-3.5 h-3.5" />
               </CustomButton>
               <CustomButton
                  id={`delete-${disease.id}`}
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                  onClick={() => setDeletingDisease(disease)}
               >
                  <Trash className="w-3.5 h-3.5" />
               </CustomButton>
            </div>
         ),
      },
   ];

   return (
      <div className="flex flex-col gap-4">
         {isFormOpen ? (
            <ChronicDiseaseForm
               key={`${formMode}-${selectedDiseaseId ?? "new"}`}
               diseaseId={selectedDiseaseId}
               mode={formMode}
               onClose={handleCloseForm}
            />
         ) : (
            <>
               <ChronicDiseaseToolBar
                  searchText={searchText}
                  onSearchChange={handleSearchChange}
                  refetch={handleRefresh}
                  isFetching={isFetching}
                  onClickCreate={handleOpenCreateDisease}
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
                                    text="Đang tải danh sách bệnh mãn tính..."
                                 />
                              </TableCell>
                           </TableRow>
                        ) : diseaseList.length === 0 ? (
                           <TableRow>
                              <TableCell
                                 colSpan={columns.length}
                                 className="h-48 text-center text-sm text-slate-500"
                              >
                                 Chưa có dữ liệu bệnh mãn tính nào.
                              </TableCell>
                           </TableRow>
                        ) : (
                           diseaseList.map((disease, index) => (
                              <TableRow
                                 key={disease.id}
                                 className="border-b border-slate-300 transition-colors hover:bg-slate-100"
                              >
                                 {columns.map((col) => (
                                    <TableCell
                                       key={col.id}
                                       className={col.cellClassName ?? "py-0"}
                                    >
                                       {col.cell(disease, index)}
                                    </TableCell>
                                 ))}
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>

               {diseaseList.length > 0 && (
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
            open={Boolean(deletingDisease)}
            onClose={() => setDeletingDisease(null)}
            onConfirm={handleConfirmDeleteDisease}
            itemName={deletingDisease?.name}
            title="Xác nhận xóa bệnh mãn tính"
            isLoading={isDeleting}
         />
      </div>
   );
}
