import { useGetChildrenF1FacilityQuery } from "@/store/api/facility/facility-api";
import { useEffect, useState } from "react";
import FacilityToolBar from "./facility-toolbar";
import { FacilityCard } from "./facility-card";
import { CloverLoading } from "@/components/common/clover-loading";
import { Factility, FacilityType } from "@/store/api/facility/type";
import { FacilityForm } from "./facility-form";
import { CustomPagination } from "@/components/common/custom-pagination";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";

const FacilityChildren = ({
   facilityId,
   parentFacility,
}: {
   facilityId?: string;
   parentFacility?: Factility;
}) => {
   const [searchText, setSearchText] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);
   const [facilityType, setFacilityType] = useState<string>("ALL");
   const [isCreateFacilityOpen, setIsCreateFacilityOpen] = useState(false);

   useEffect(() => {
      const handler = setTimeout(() => {
         setDebouncedSearch(searchText);
      }, 400);
      return () => clearTimeout(handler);
   }, [searchText]);

   const {
      data: facilities,
      isLoading,
      isFetching,
      refetch,
   } = useGetChildrenF1FacilityQuery(
      {
         id: facilityId ?? "",
         search: debouncedSearch.trim() || undefined,
         page,
         limit,
         facilityType:
            facilityType === "ALL" ? undefined : (facilityType as FacilityType),
      },
      {
         skip: !facilityId,
      },
   );

   const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
      setPage(1);
   };

   const handleFacilityTypeChange = (type: string) => {
      setFacilityType(type);
      setPage(1);
   };

   const handleRefresh = () => {
      if (facilityId) {
         setSearchText("");
         setDebouncedSearch("");
         setFacilityType("ALL");
         setPage(1);
         refetch();
      }
   };

   if (!facilityId) {
      return (
         <div className="mt-4 p-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white">
            Chưa có thông tin cơ sở y tế để hiển thị danh sách cơ sở con.
         </div>
      );
   }

   const data_f = facilities as unknown as {
      items?: Factility[];
      total?: number;
      totalPages?: number;
   };
   const facilityItems: Factility[] = Array.isArray(facilities)
      ? facilities
      : (data_f?.items ?? []);
   const totalItems = Array.isArray(facilities)
      ? facilities.length
      : (data_f?.total ?? facilityItems.length);
   const totalPages =
      data_f?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit));

   return (
      <div>
         <FacilityToolBar
            searchText={searchText}
            onSearchChange={handleSearchChange}
            facilityType={facilityType as FacilityType | "ALL"}
            onFacilityTypeChange={handleFacilityTypeChange}
            refetch={handleRefresh}
            isFetching={isFetching}
            disabled={!facilityId}
            onClickCreate={() => setIsCreateFacilityOpen(true)}
         />

         {/* Modal Thêm mới cơ sở con */}
         <Dialog
            open={isCreateFacilityOpen}
            onOpenChange={setIsCreateFacilityOpen}
         >
            <DialogContent className="sm:min-w-3xl max-h-[90vh] overflow-y-auto rounded-sm p-4">
               <DialogHeader className="border-b border-slate-100 pb-3">
                  <DialogTitle className="text-lg font-bold">
                     Thêm mới cơ sở con
                  </DialogTitle>
               </DialogHeader>
               <FacilityForm
                  parentId={facilityId}
                  parentFacility={parentFacility}
                  mode="create"
                  hideTitle
                  onClose={() => {
                     setIsCreateFacilityOpen(false);
                     refetch();
                  }}
                  onCreatedSuccess={() => {
                     setIsCreateFacilityOpen(false);
                     refetch();
                  }}
               />
            </DialogContent>
         </Dialog>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {isFetching || isLoading ? (
               <CloverLoading
                  fullContainer
                  size="md"
                  text="Đang tải danh sách cơ sở con..."
               />
            ) : facilityItems.length === 0 ? (
               <div className="col-span-full p-8 text-center text-sm text-slate-500 border border-slate-100 rounded-sm bg-white">
                  Không tìm thấy cơ sở con trực thuộc nào.
               </div>
            ) : (
               facilityItems.map((facility: Factility) => (
                  <FacilityCard
                     key={facility.id}
                     facility={facility}
                  />
               ))
            )}
         </div>

         {facilityItems.length > 0 && (
            <div className="mt-6 flex justify-end">
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
      </div>
   );
};

export default FacilityChildren;
