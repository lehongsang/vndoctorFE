"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetAllConsultationsQuery } from "@/store/api/consultation/consultation-api";
import { Consultation } from "@/store/api/consultation/type";
import { CustomPagination } from "@/components/common/custom-pagination";
import { ConsultationStats } from "./components/consultation-stats";
import { ConsultationToolbar } from "./components/consultation-toolbar";
import { ConsultationTable } from "./components/consultation-table";

export default function ConsultationModule() {
   const router = useRouter();
   const [searchText, setSearchText] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("ALL");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);

   const {
      data: responseData,
      isLoading,
      isFetching,
      refetch,
   } = useGetAllConsultationsQuery({
      page,
      limit,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: searchText.trim() || undefined,
   });

   // Chuẩn hóa dữ liệu trả về (hỗ trợ cả dạng mảng hoặc { data: Consultation[], total: number })
   const consultations: Consultation[] = useMemo(() => {
      if (!responseData) return [];
      if (Array.isArray(responseData)) {
         return responseData;
      }
      if (Array.isArray(responseData.items)) {
         return responseData.items;
      }
      return [];
   }, [responseData]);

   // Lọc dữ liệu client-side nếu backend trả về toàn bộ mảng
   const filteredConsultations = useMemo(() => {
      let list = consultations;

      if (statusFilter !== "ALL") {
         list = list.filter((c) => c.status === statusFilter);
      }

      if (searchText.trim()) {
         const q = searchText.toLowerCase().trim();
         list = list.filter((c) => {
            const code = c.consultationCode?.toLowerCase() || "";
            const reason = c.reason?.toLowerCase() || "";
            const conclusion = c.conclusion?.toLowerCase() || "";
            const patientName =
               c.healthProfile?.fullName?.toLowerCase() ||
               c.examination?.healthProfile?.fullName?.toLowerCase() ||
               "";
            const doctorName =
               c.requestingDoctor?.fullName?.toLowerCase() ||
               c.examination?.doctor?.fullName?.toLowerCase() ||
               "";

            return (
               code.includes(q) ||
               reason.includes(q) ||
               conclusion.includes(q) ||
               patientName.includes(q) ||
               doctorName.includes(q)
            );
         });
      }

      return list;
   }, [consultations, statusFilter, searchText]);

   const totalItems =
      typeof responseData === "object" &&
      !Array.isArray(responseData) &&
      responseData?.total !== undefined
         ? responseData.total
         : filteredConsultations.length;

   const totalPages = Math.max(1, Math.ceil(totalItems / limit));

   const displayData = useMemo(() => {
      if (
         typeof responseData === "object" &&
         !Array.isArray(responseData) &&
         responseData?.total !== undefined &&
         responseData.items
      ) {
         return filteredConsultations;
      }
      const start = (page - 1) * limit;
      return filteredConsultations.slice(start, start + limit);
   }, [filteredConsultations, page, limit, responseData]);

   const handleSearch = (value: string) => {
      setSearchText(value);
      setPage(1);
   };

   const handleStatusFilterChange = (val: string) => {
      setStatusFilter(val);
      setPage(1);
   };

   const handleRefresh = () => {
      setSearchText("");
      setStatusFilter("ALL");
      setPage(1);
      refetch();
   };

   const handleViewDetail = (item: Consultation) => {
      router.push(`/consultation/${item.id}`);
   };

   const handleProvideConclusion = (item: Consultation) => {
      router.push(`/consultation/${item.id}?action=consult`);
   };

   return (
      <div className="flex flex-col gap-4">
         {/* Thống kê nhanh */}
         <ConsultationStats consultations={consultations} />

         {/* Toolbar */}
         <ConsultationToolbar
            searchText={searchText}
            onSearch={handleSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            refetch={handleRefresh}
            isFetching={isFetching}
            disabled={isLoading}
         />

         {/* Bảng dữ liệu */}
         <ConsultationTable
            data={displayData}
            isLoading={isLoading}
            isFetching={isFetching}
            page={page}
            limit={limit}
            onViewDetail={handleViewDetail}
            onProvideConclusion={handleProvideConclusion}
         />

         {/* Phân trang */}
         {totalItems > 0 && (
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

         {/* End ConsultationModule */}
      </div>
   );
}
