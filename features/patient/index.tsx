"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetHealthProfileAssignQuery } from "@/store/api/health-profile/health-profile-api";
import { HealthProfile } from "@/store/api/health-profile/type";
import PatientToolBar from "./components/patient-toolbar";
import PatientTable from "./components/patient-table";
import { HealthProfileDetail } from "@/features/health-profile/components/health-profile-detail";

export function PatientFeature() {
   const { user } = useAuth();
   const [searchText, setSearchText] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);
   const [selectedProfileId, setSelectedProfileId] = useState<
      string | undefined
   >(undefined);

   useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
      return () => clearTimeout(timer);
   }, [searchText]);

   const {
      data: profileData,
      isLoading,
      isFetching,
      refetch,
   } = useGetHealthProfileAssignQuery(
      {
         page,
         limit,
         doctorId: user?.id,
         facilityId: user?.facilityId,
         search: debouncedSearch.trim() || undefined,
      },
      {
         skip: !user?.id,
      },
   );

   const profileList: HealthProfile[] = profileData?.items ?? [];
   const totalItems = profileData?.total ?? profileList.length;

   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      setPage(1);
   };

   const handleRefresh = () => {
      setSearchText("");
      setDebouncedSearch("");
      setPage(1);
      setSelectedProfileId(undefined);
      refetch();
   };

   const handleViewDetail = (profile: HealthProfile) => {
      setSelectedProfileId(profile.id);
   };

   const handleCloseDetail = () => {
      setSelectedProfileId(undefined);
      refetch();
   };

   if (selectedProfileId) {
      return (
         <HealthProfileDetail
            profileId={selectedProfileId}
            onClose={handleCloseDetail}
         />
      );
   }

   return (
      <div className="flex flex-col gap-4">
         <PatientToolBar
            searchText={searchText}
            onSearchChange={handleSearchChange}
            refetch={handleRefresh}
            isFetching={isFetching}
            disabled={isLoading}
         />

         <PatientTable
            profiles={profileList}
            isLoading={isLoading}
            isFetching={isFetching}
            page={page}
            limit={limit}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(newLimit) => {
               setLimit(newLimit);
               setPage(1);
            }}
            onViewDetail={handleViewDetail}
         />
      </div>
   );
}

export default PatientFeature;
