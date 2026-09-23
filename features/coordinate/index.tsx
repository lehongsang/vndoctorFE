"use client";

import { useGetAllSubscriptionsQuery } from "@/store/api/coordinate/coordinateApi";
import CoordinateTable from "./components/coordinate-table";
import { CoordinateToolbar } from "./components/coordinate-toolbar";
import { CoordinateForm } from "./components/coordinate-form";
import { useState } from "react";
import { CustomPagination } from "@/components/common/custom-pagination";
import { CareSubscriptions } from "@/store/api/coordinate/type";

export default function CoordinateFeature() {
   const [search, setSearch] = useState("");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);

   const {
      data: careSubcriptions,
      isFetching,
      isLoading,
      refetch,
   } = useGetAllSubscriptionsQuery({
      search,
      page,
      limit,
   });

   const [selectedDetailId, setSelectedDetailId] = useState<string | null>(
      null,
   );
   const [coordinatingId, setCoordinatingId] = useState<string | null>(null);

   const isViewingOrCoordinating = Boolean(selectedDetailId || coordinatingId);

   const careSubcriptionsList: CareSubscriptions[] =
      careSubcriptions?.data || [];

   return (
      <div className="flex flex-col gap-4">
         {!isViewingOrCoordinating && (
            <CoordinateToolbar
               searchText={search}
               onSearchChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
               }}
               refetch={refetch}
               isFetching={isFetching}
               disabled={isLoading}
            />
         )}

         {coordinatingId ? (
            <CoordinateForm
               subscriptionId={coordinatingId}
               onClose={() => setCoordinatingId(null)}
               onSuccess={() => {
                  setCoordinatingId(null);
                  refetch();
               }}
            />
         ) : (
            <CoordinateTable
               careSubcriptions={careSubcriptionsList}
               isFetching={isFetching}
               isLoading={isLoading}
               onViewDetail={(id) => setSelectedDetailId(id)}
               onCloseDetail={() => setSelectedDetailId(null)}
               onEdit={(id) => {
                  setSelectedDetailId(null);
                  setCoordinatingId(id);
               }}
            />
         )}

         {!isViewingOrCoordinating && careSubcriptionsList?.length > 0 && (
            <div className="mt-2 flex justify-end">
               <CustomPagination
                  currentPage={page}
                  totalPages={careSubcriptions?.page}
                  totalItems={careSubcriptions?.total}
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
      </div>
   );
}
