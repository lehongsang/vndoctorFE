import { useGetChildrenF1FacilityQuery } from "@/store/api/facility/facility-api";
import { useEffect, useState } from "react";
import FacilityToolBar from "./facility-toolbar";
import { FacilityCard } from "./facility-card";
import { CloverLoading } from "@/components/common/clover-loading";
import { Factility, FacilityType } from "@/store/api/facility/type";
import { FacilityForm } from "./facility-form";
import { CustomPagination } from "@/components/common/custom-pagination";
import { StaffForm } from "../facility-staff/staff-form";

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
   const [isFacilityFormOpen, setIsFacilityFormOpen] = useState(false);
   const [selectedFacilityId, setSelectedFacilityId] = useState<
      string | undefined
   >(undefined);
   const [facilityFormMode, setFacilityFormMode] = useState<
      "create" | "update" | "view"
   >("create");
   const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
   const [adminFacilityTarget, setAdminFacilityTarget] = useState<
      Factility | undefined
   >(undefined);

   const handleOpenCreateAdmin = (fac: Factility) => {
      setIsFacilityFormOpen(false);
      setSelectedFacilityId(undefined);
      setAdminFacilityTarget(fac);
      setIsCreateAdminOpen(true);
   };

   const handleCloseCreateAdmin = () => {
      setIsCreateAdminOpen(false);
      setAdminFacilityTarget(undefined);
      refetch();
   };

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
         setIsFacilityFormOpen(false);
         setSelectedFacilityId(undefined);
         refetch();
      }
   };

   const handleOpenCreateFacility = () => {
      setSelectedFacilityId(undefined);
      setFacilityFormMode("create");
      setIsFacilityFormOpen(true);
   };

   const handleOpenEditFacility = (fac: Factility) => {
      setSelectedFacilityId(fac.id);
      setFacilityFormMode("update");
      setIsFacilityFormOpen(true);
   };

   const handleOpenViewFacility = (fac: Factility) => {
      setSelectedFacilityId(fac.id);
      setFacilityFormMode("view");
      setIsFacilityFormOpen(true);
   };

   const handleCloseFacilityForm = () => {
      setIsFacilityFormOpen(false);
      setSelectedFacilityId(undefined);
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
            disabled={!facilityId || isFacilityFormOpen || isCreateAdminOpen}
            onClickCreate={handleOpenCreateFacility}
         />
         {isFacilityFormOpen ? (
            <FacilityForm
               key={`${facilityFormMode}-${selectedFacilityId ?? "new"}`}
               facilityId={selectedFacilityId}
               parentId={facilityId}
               parentFacility={parentFacility}
               mode={facilityFormMode}
               onClose={handleCloseFacilityForm}
               onCreatedSuccess={(newFacility: Factility) =>
                  handleOpenCreateAdmin(newFacility)
               }
            />
         ) : isCreateAdminOpen && adminFacilityTarget ? (
            <StaffForm
               facility={adminFacilityTarget}
               facilityId={adminFacilityTarget.id}
               defaultRole="ADMIN"
               title={`Tạo tài khoản quản trị cho cơ sở: ${adminFacilityTarget.facilityName}`}
               onClose={handleCloseCreateAdmin}
            />
         ) : (
            <>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {isFetching || isLoading ? (
                     <CloverLoading
                        fullContainer
                        size="md"
                        text="Đang tải danh sách cơ sở con..."
                     />
                  ) : facilityItems.length === 0 ? (
                     <div className="col-span-full p-8 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl bg-white">
                        Không tìm thấy cơ sở con trực thuộc nào.
                     </div>
                  ) : (
                     facilityItems.map((facility: Factility) => (
                        <FacilityCard
                           key={facility.id}
                           facility={facility}
                           onViewDetail={handleOpenViewFacility}
                           onEdit={handleOpenEditFacility}
                           onCreateAdmin={handleOpenCreateAdmin}
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
            </>
         )}
      </div>
   );
};

export default FacilityChildren;
