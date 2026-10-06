"use client";

import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
   useGetCareRequestsQuery,
   useReceiveCareRequestMutation,
   useUpdateStatusCareRequestMutation,
} from "@/store/api/care-request/care-request-api";
import { CareRequest, CareRequestStatus } from "@/store/api/care-request/type";
import { Staff } from "@/store/api/staff/type";
import { useAuth } from "@/hooks/use-auth";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { CustomPagination } from "@/components/common/custom-pagination";
import { CareRequestToolbar } from "./components/care-request-toolbar";
import { CareRequestTable } from "./components/care-request-table";
import { CareRequestDetailView } from "./components/care-request-detail-view";
import { CareRequestModal } from "./components/care-request-modal";

export default function CareRequestModule() {
   const [searchText, setSearchText] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("ALL");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);

   const [selectedDetailId, setSelectedDetailId] = useState<string | null>(
      null,
   );
   const [selectedRequest, setSelectedRequest] = useState<CareRequest | null>(
      null,
   );
   const [isCancelOpen, setIsCancelOpen] = useState(false);

   const {
      data: responseData,
      isLoading,
      isFetching,
      refetch,
   } = useGetCareRequestsQuery({
      page,
      limit,
      status:
         statusFilter === "ALL"
            ? undefined
            : (statusFilter as CareRequestStatus),
      search: searchText.trim() || undefined,
   });

   const requests: CareRequest[] = useMemo(() => {
      if (Array.isArray(responseData?.data)) {
         return responseData.data;
      }
      if (Array.isArray(responseData)) {
         return responseData as unknown as CareRequest[];
      }
      return [];
   }, [responseData]);

   const { user } = useAuth();
   const [receiveCareRequest] = useReceiveCareRequestMutation();
   const [updateStatus, { isLoading: isUpdatingStatus }] =
      useUpdateStatusCareRequestMutation();

   const filteredRequests = useMemo(() => {
      let list = requests;

      if (statusFilter !== "ALL") {
         list = list.filter((r) => r.status === statusFilter);
      }

      if (searchText.trim()) {
         const query = searchText.toLowerCase().trim();
         list = list.filter(
            (r) =>
               r.requestCode?.toLowerCase().includes(query) ||
               r.title?.toLowerCase().includes(query) ||
               r.description?.toLowerCase().includes(query) ||
               r.assignedUser?.fullName?.toLowerCase().includes(query) ||
               r.subscription?.healthProfile?.fullName
                  ?.toLowerCase()
                  .includes(query) ||
               r.subscription?.healthProfile?.phoneNumber?.includes(query),
         );
      }

      return list;
   }, [requests, statusFilter, searchText]);

   const totalItems = responseData?.total ?? filteredRequests.length;
   const totalPages =
      responseData?.total !== undefined
         ? Math.max(1, Math.ceil(totalItems / limit))
         : Math.max(1, Math.ceil(totalItems / limit));

   const displayData = useMemo(() => {
      if (responseData?.total !== undefined && responseData.data) {
         return filteredRequests;
      }
      const start = (page - 1) * limit;
      return filteredRequests.slice(start, start + limit);
   }, [filteredRequests, page, limit, responseData]);

   const handleCancelConfirm = async () => {
      if (!selectedRequest?.id) return;
      try {
         await updateStatus({
            id: selectedRequest.id,
            body: { status: "CANCELLED" },
         }).unwrap();
         toast.success("Đã hủy yêu cầu chăm sóc");
         setIsCancelOpen(false);
         setSelectedRequest(null);
         refetch();
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(error.data?.message || "Không thể hủy yêu cầu");
      }
   };

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

   const handleOpenReceive = async (item: CareRequest) => {
      if (!user?.id) {
         toast.error("Không tìm thấy thông tin tài khoản người dùng");
         return;
      }
      try {
         const res = await receiveCareRequest({
            id: item.id,
            body: {
               assignedUserId: user.id,
               note: "",
            },
         }).unwrap();
         toast.success("Tiếp nhận yêu cầu chăm sóc thành công");
         refetch();
         setSelectedRequest(
            res || {
               ...item,
               assignedUserId: user.id,
               assignedUser: user as unknown as Staff,
               status: "IN_PROGRESS",
            },
         );
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(error.data?.message || "Không thể tiếp nhận yêu cầu");
      }
   };

   const handleOpenResolve = (item: CareRequest) => {
      setSelectedRequest(item);
   };

   const handleOpenCancel = (item: CareRequest) => {
      setSelectedRequest(item);
      setIsCancelOpen(true);
   };

   return (
      <div className="flex flex-col gap-4">
         {selectedDetailId ? (
            <CareRequestDetailView
               requestId={selectedDetailId}
               onClose={() => setSelectedDetailId(null)}
               onReceive={() => {
                  const item = requests.find((r) => r.id === selectedDetailId);
                  if (item) handleOpenReceive(item);
               }}
               onResolve={() => {
                  const item = requests.find((r) => r.id === selectedDetailId);
                  if (item) handleOpenResolve(item);
               }}
               onCancel={() => {
                  const item = requests.find((r) => r.id === selectedDetailId);
                  if (item) handleOpenCancel(item);
               }}
            />
         ) : (
            <>
               <CareRequestToolbar
                  searchText={searchText}
                  onSearch={handleSearch}
                  statusFilter={statusFilter as CareRequestStatus | "ALL"}
                  onStatusFilterChange={handleStatusFilterChange}
                  refetch={handleRefresh}
                  isFetching={isFetching}
                  disabled={isLoading}
               />

               <CareRequestTable
                  data={displayData}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  page={page}
                  limit={limit}
                  onViewDetail={(item) => setSelectedDetailId(item.id)}
                  onReceive={handleOpenReceive}
                  onResolve={handleOpenResolve}
                  onCancel={handleOpenCancel}
               />

               {displayData.length > 0 && (
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

         <CareRequestModal
            isOpen={!!selectedRequest}
            onClose={() => {
               setSelectedRequest(null);
            }}
            requestData={selectedRequest}
            onSuccess={refetch}
         />

         <ConfirmModal
            open={isCancelOpen}
            onClose={() => {
               setIsCancelOpen(false);
               setSelectedRequest(null);
            }}
            onConfirm={handleCancelConfirm}
            title="Xác nhận hủy yêu cầu"
            description={
               <>
                  Bạn có chắc chắn muốn hủy yêu cầu chăm sóc{" "}
                  <strong>
                     {selectedRequest?.requestCode || selectedRequest?.title}
                  </strong>
                  ? Trạng thái yêu cầu sẽ chuyển sang Đã hủy.
               </>
            }
            confirmText="Hủy yêu cầu"
            cancelText="Đóng"
            isLoading={isUpdatingStatus}
            loadingText="Đang xử lý..."
            variant="danger"
         />
      </div>
   );
}
