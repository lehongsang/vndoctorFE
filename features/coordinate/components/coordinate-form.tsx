"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import CloverLoading from "@/components/common/clover-loading";
import { CustomButton } from "@/components/common/custom-button";
import { useAuth } from "@/hooks/use-auth";
import {
   useAssignStaffMutation,
   useGetDetailCareSubcriptionQuery,
   useUpdateStaffSubscriptionMutation,
} from "@/store/api/coordinate/coordinateApi";
import { useGetAllStaffQuery } from "@/store/api/staff/staff-api";
import {
   type Staff,
   type StaffRole,
   STAFF_ROLE_LABELS,
} from "@/store/api/staff/type";
import type { CareSubscriptions } from "@/store/api/coordinate/type";
import { toast } from "react-toastify";

interface CoordinateFormProps {
   subscriptionId?: string;
   onClose?: () => void;
   onSuccess?: () => void;
}

const RowItem = ({
   label,
   value,
   className,
}: {
   label: string;
   value?: React.ReactNode;
   className?: string;
}) => (
   <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="text-sm font-medium text-slate-800 wrap-break-word">
         {value || "Chưa cập nhật"}
      </div>
   </div>
);

type FilterRole = "ALL" | StaffRole;

interface CoordinateFormContentProps {
   subcription: CareSubscriptions;
   subscriptionId?: string;
   onClose?: () => void;
   onSuccess?: () => void;
}

function CoordinateFormContent({
   subcription,
   subscriptionId,
   onClose,
   onSuccess,
}: CoordinateFormContentProps) {
   const { user } = useAuth();

   const [assignStaff, { isLoading: isAssigning }] = useAssignStaffMutation();
   const [updateStaffSubscription, { isLoading: isUpdating }] =
      useUpdateStaffSubscriptionMutation();

   // Khởi tạo danh sách nhân sự trực tiếp từ subcription, không dùng setState trong useEffect
   const [selectedStaffs, setSelectedStaffs] = useState<Staff[]>(() => {
      const initial: Staff[] = [];
      if (subcription.assignedDoctor) {
         initial.push(subcription.assignedDoctor);
      }
      if (
         subcription.assignedNurse &&
         !initial.some((s) => s.id === subcription.assignedNurse?.id)
      ) {
         initial.push(subcription.assignedNurse);
      }
      if (
         subcription.assignedExpert &&
         !initial.some((s) => s.id === subcription.assignedExpert?.id)
      ) {
         initial.push(subcription.assignedExpert);
      }
      return initial;
   });

   const [isOpen, setIsOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [roleFilter, setRoleFilter] = useState<FilterRole>("ALL");

   const containerRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);

   const isVip = subcription?.carePackage?.type === "VIP";
   const maxStaff = isVip ? 3 : 2;

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   // Đóng dropdown khi click ra ngoài
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            containerRef.current &&
            !containerRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
         document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const {
      data: staffData,
      isLoading: isStaffLoading,
      isFetching: isStaffFetching,
   } = useGetAllStaffQuery(
      {
         facilityId: user?.facilityId || "",
         search: debouncedSearch.trim() || undefined,
         limit: 20,
         isActive: true,
      },
      {
         skip: !user?.facilityId,
      },
   );

   const searchResults = useMemo(() => {
      const items = staffData?.items || [];
      if (roleFilter === "ALL") return items;
      return items.filter((item) => item.role === roleFilter);
   }, [staffData?.items, roleFilter]);

   const handleAddStaff = (staff: Staff) => {
      if (selectedStaffs.some((s) => s.id === staff.id)) return;
      if (selectedStaffs.length >= maxStaff) {
         toast.warning(
            `Gói ${isVip ? "VIP" : "Cơ bản"} chỉ cho phép tối đa ${maxStaff} nhân sự`,
         );
         return;
      }
      const updated = [...selectedStaffs, staff];
      setSelectedStaffs(updated);
      setSearchTerm("");
      if (updated.length >= maxStaff) {
         setIsOpen(false);
      } else {
         inputRef.current?.focus();
      }
   };

   const handleRemoveStaff = (staffId: string) => {
      setSelectedStaffs((prev) => prev.filter((s) => s.id !== staffId));
   };

   const handleSave = async () => {
      if (!subscriptionId) return;

      if (selectedStaffs.length === 0) {
         toast.error("Vui lòng chọn ít nhất một nhân sự phụ trách");
         return;
      }

      // Xác định bác sĩ
      const doctor =
         selectedStaffs.find(
            (s) => s.role === "DOCTOR" || s.role === "DOCTOR_EXPERT",
         ) || selectedStaffs[0];

      // Xác định điều dưỡng
      const nurse =
         selectedStaffs.find(
            (s) => s.id !== doctor?.id && s.role === "NURSE",
         ) ||
         selectedStaffs.find((s) => s.id !== doctor?.id) ||
         doctor;

      // Xác định chuyên gia (nếu có người thứ 3)
      const expert = selectedStaffs.find(
         (s) => s.id !== doctor?.id && s.id !== nurse?.id,
      );

      const body = {
         assignedDoctorId: doctor.id,
         assignedNurseId: nurse.id,
         assignedExpertId: expert?.id || undefined,
      };

      try {
         if (subcription?.status === "PENDING") {
            await assignStaff({ id: subscriptionId, body }).unwrap();
         } else {
            await updateStaffSubscription({
               id: subscriptionId,
               body,
            }).unwrap();
         }
         toast.success("Cập nhật điều phối nhân sự thành công");
         onSuccess?.();
      } catch (err: unknown) {
         const error = err as { data?: { message?: string }; message?: string };
         toast.error(
            error?.data?.message ||
               error?.message ||
               "Có lỗi xảy ra khi phân công nhân sự",
         );
      }
   };

   const isSubmitting = isAssigning || isUpdating;

   return (
      <div className="flex flex-col gap-5">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Cột thông tin đăng ký & khách hàng */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-md p-4 flex flex-col gap-3.5 h-fit">
               <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Thông tin đăng ký
               </span>
               <RowItem
                  label="Họ tên bệnh nhân"
                  value={subcription?.healthProfile?.fullName}
               />
               <RowItem
                  label="Số điện thoại"
                  value={subcription?.healthProfile?.phoneNumber}
               />
               <RowItem
                  label="Địa chỉ"
                  value={subcription?.healthProfile?.address}
               />
               <RowItem
                  label="Gói dịch vụ"
                  value={subcription?.carePackage?.name}
               />
               <RowItem
                  label="Loại gói"
                  value={
                     <span
                        className={`text-xs px-2 py-0.5 rounded-sm font-medium border ${
                           isVip
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                     >
                        {isVip
                           ? "Gói VIP (Tối đa 3 nhân sự)"
                           : "Gói Cơ bản (Tối đa 2 nhân sự)"}
                     </span>
                  }
               />
               <RowItem
                  label="Giá tiền"
                  value={subcription?.carePackage?.priceAmount?.toLocaleString(
                     "vi-VN",
                     {
                        style: "currency",
                        currency: "VND",
                     },
                  )}
               />
            </div>

            {/* Cột 1 ô combobox hiển thị badge nhân sự & danh sách chi tiết */}
            <div className="lg:col-span-2 flex flex-col gap-4">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                     Nhân sự phụ trách ({selectedStaffs.length}/{maxStaff})
                  </span>
                  <span className="text-xs text-slate-500">
                     {isVip ? "Tối đa 3 nhân sự" : "Tối đa 2 nhân sự"}
                  </span>
               </div>

               {/* 1 Ô Combobox duy nhất hiển thị Badge & tìm kiếm */}
               <div ref={containerRef} className="relative flex flex-col gap-2">
                  <div
                     onClick={() => {
                        inputRef.current?.focus();
                        setIsOpen(true);
                     }}
                     className="min-h-11 w-full p-2 bg-white border border-slate-300 rounded-md flex flex-wrap items-center gap-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 cursor-text transition-colors"
                  >
                     {/* Render các badge nhân sự đã chọn */}
                     {selectedStaffs.map((staff) => (
                        <span
                           key={staff.id}
                           className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
                        >
                           <span>{staff.fullName}</span>
                           <span className="text-[11px] text-emerald-600 font-normal">
                              ({STAFF_ROLE_LABELS[staff.role] || staff.role})
                           </span>
                           <button
                              type="button"
                              onClick={(e) => {
                                 e.stopPropagation();
                                 handleRemoveStaff(staff.id);
                              }}
                              className="ml-1 text-emerald-600 hover:text-rose-600 cursor-pointer font-bold leading-none"
                              title="Bỏ nhân sự này"
                           >
                              ✕
                           </button>
                        </span>
                     ))}

                     {/* Ô input tìm kiếm trực tiếp trong combobox */}
                     {selectedStaffs.length < maxStaff ? (
                        <input
                           ref={inputRef}
                           type="text"
                           value={searchTerm}
                           onChange={(e) => {
                              setSearchTerm(e.target.value);
                              if (!isOpen) setIsOpen(true);
                           }}
                           onFocus={() => setIsOpen(true)}
                           placeholder={
                              selectedStaffs.length === 0
                                 ? `Tìm kiếm và chọn nhân sự (tối đa ${maxStaff})...`
                                 : "Nhập để tìm thêm..."
                           }
                           className="flex-1 min-w-40 h-7 text-sm outline-none bg-transparent text-slate-800"
                        />
                     ) : (
                        <span className="text-xs text-slate-400 italic py-1">
                           (Đã đạt tối đa {maxStaff} nhân sự)
                        </span>
                     )}
                  </div>

                  {/* Dropdown danh sách kết quả tìm kiếm & filter */}
                  {isOpen && (
                     <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-xl z-50 p-2.5 flex flex-col gap-2.5">
                        {/* Thanh Filter theo vai trò: cố định trên cùng, không bị ẩn hay scroll */}
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 overflow-x-auto text-xs shrink-0">
                           <span className="text-slate-500 shrink-0 font-medium">
                              Lọc vai trò:
                           </span>
                           {(
                              [
                                 { label: "Tất cả", value: "ALL" },
                                 { label: "Bác sĩ", value: "DOCTOR" },
                                 {
                                    label: "Bác sĩ chuyên gia",
                                    value: "DOCTOR_EXPERT",
                                 },
                                 { label: "Điều dưỡng", value: "NURSE" },
                              ] as const
                           ).map((tab) => (
                              <button
                                 key={tab.value}
                                 type="button"
                                 onClick={() => setRoleFilter(tab.value)}
                                 className={`px-2.5 py-1 rounded-sm shrink-0 cursor-pointer transition-colors ${
                                    roleFilter === tab.value
                                       ? "bg-emerald-600 text-white font-medium"
                                       : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                 }`}
                              >
                                 {tab.label}
                              </button>
                           ))}
                        </div>

                        {/* Danh sách nhân sự từ API có max-h và cuộn độc lập */}
                        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-0.5">
                           {isStaffLoading || isStaffFetching ? (
                              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                                 <CloverLoading size="sm" />
                                 <span>Đang tải danh sách nhân sự...</span>
                              </div>
                           ) : searchResults.length > 0 ? (
                              searchResults.map((item) => {
                                 const isSelected = selectedStaffs.some(
                                    (s) => s.id === item.id,
                                 );
                                 const isFull =
                                    selectedStaffs.length >= maxStaff &&
                                    !isSelected;

                                 return (
                                    <div
                                       key={item.id}
                                       onClick={() => {
                                          if (!isSelected && !isFull) {
                                             handleAddStaff(item);
                                          }
                                       }}
                                       className={`p-2.5 rounded-sm flex items-center justify-between transition-colors ${
                                          isSelected
                                             ? "bg-emerald-50/80 border border-emerald-200 opacity-80 cursor-default"
                                             : isFull
                                               ? "opacity-50 cursor-not-allowed bg-slate-50"
                                               : "hover:bg-slate-100 cursor-pointer"
                                       }`}
                                    >
                                       <div className="flex flex-col">
                                          <div className="flex items-center gap-1.5 text-sm text-slate-800">
                                             <span className="font-medium">
                                                {item.fullName}
                                             </span>
                                             {item.staffCode && (
                                                <span className="text-xs font-mono text-slate-500">
                                                   ({item.staffCode})
                                                </span>
                                             )}
                                          </div>
                                          <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                                             {item.phoneNumber && (
                                                <span>
                                                   SĐT: {item.phoneNumber}
                                                </span>
                                             )}
                                             {item.specialty && (
                                                <span>
                                                   CK: {item.specialty}
                                                </span>
                                             )}
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-2">
                                          <span className="text-xs px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
                                             {STAFF_ROLE_LABELS[item.role] ||
                                                item.role}
                                          </span>
                                          {isSelected ? (
                                             <span className="text-xs font-medium text-emerald-700">
                                                Đã chọn
                                             </span>
                                          ) : (
                                             <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                                                Chọn
                                             </span>
                                          )}
                                       </div>
                                    </div>
                                 );
                              })
                           ) : (
                              <div className="py-6 text-center text-xs text-slate-400 italic">
                                 {debouncedSearch
                                    ? "Không tìm thấy nhân sự phù hợp"
                                    : "Không có dữ liệu nhân sự"}
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>

               {/* Hiển thị thông tin chi tiết từng nhân sự đã chọn */}
               <div className="flex flex-col gap-2.5 pt-2">
                  <span className="text-xs font-medium text-slate-600">
                     Thông tin cơ bản của các nhân sự đã chỉ định:
                  </span>

                  {selectedStaffs.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedStaffs.map((staff) => (
                           <div
                              key={staff.id}
                              className="p-3 bg-slate-50/70 border border-slate-200 rounded-md flex flex-col gap-2 text-xs text-slate-600"
                           >
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                                 <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-800 text-sm">
                                       {staff.fullName}
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-medium">
                                       {STAFF_ROLE_LABELS[staff.role] ||
                                          staff.role}
                                    </span>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => handleRemoveStaff(staff.id)}
                                    className="text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                 >
                                    Bỏ chọn
                                 </button>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                 <div>
                                    <span className="text-slate-500">
                                       Mã NV:{" "}
                                    </span>
                                    <span className="font-mono text-slate-700">
                                       {staff.staffCode || "—"}
                                    </span>
                                 </div>
                                 <div>
                                    <span className="text-slate-500">
                                       Số ĐT:{" "}
                                    </span>
                                    <span className="text-slate-700">
                                       {staff.phoneNumber || "—"}
                                    </span>
                                 </div>
                                 <div className="col-span-2">
                                    <span className="text-slate-500">
                                       Chuyên khoa:{" "}
                                    </span>
                                    <span className="text-slate-700">
                                       {staff.specialty || "—"}
                                    </span>
                                 </div>
                                 {staff.email && (
                                    <div className="col-span-2">
                                       <span className="text-slate-500">
                                          Email:{" "}
                                       </span>
                                       <span className="text-slate-700 truncate">
                                          {staff.email}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-center text-xs text-slate-400 italic">
                        Chưa có nhân sự nào được phân công. Vui lòng tìm và chọn
                        từ ô combobox ở trên.
                     </div>
                  )}
               </div>

               {/* Nút hành động */}
               <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  {onClose && (
                     <CustomButton
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        size="sm"
                        className="w-20 bg-rose-600 hover:bg-rose-700 text-white hover:text-white"
                     >
                        Hủy
                     </CustomButton>
                  )}
                  <CustomButton
                     onClick={handleSave}
                     isLoading={isSubmitting}
                     loadingText="Đang lưu..."
                     size="sm"
                     className="px-4 py-2 text-sm font-medium rounded-md"
                  >
                     Lưu phân công
                  </CustomButton>
               </div>
            </div>
         </div>
      </div>
   );
}

export function CoordinateForm({
   subscriptionId,
   onClose,
   onSuccess,
}: CoordinateFormProps) {
   const {
      data: subcription,
      isLoading: isSubLoading,
      isFetching: isSubFetching,
   } = useGetDetailCareSubcriptionQuery(
      {
         id: subscriptionId || "",
      },
      {
         skip: !subscriptionId,
      },
   );

   if (isSubLoading || isSubFetching) {
      return (
         <div className="p-12 flex justify-center items-center">
            <CloverLoading size="md" text="Đang tải thông tin điều phối..." />
         </div>
      );
   }

   if (!subcription) {
      return (
         <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-md border border-slate-200">
            Không tìm thấy thông tin đăng ký gói chăm sóc.
         </div>
      );
   }

   return (
      <CoordinateFormContent
         key={subcription.id}
         subcription={subcription}
         subscriptionId={subscriptionId}
         onClose={onClose}
         onSuccess={onSuccess}
      />
   );
}
