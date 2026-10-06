"use client";

import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { CustomButton } from "@/components/common/custom-button";
import { FormTextarea } from "@/components/common/form-textarea";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   useReceiveCareRequestMutation,
   useResolveCareRequestMutation,
   useGetDetailCareRequestQuery,
} from "@/store/api/care-request/care-request-api";
import { useGetDetailCareSubcriptionQuery } from "@/store/api/coordinate/coordinateApi";
import { CareRequest } from "@/store/api/care-request/type";
import { Staff } from "@/store/api/staff/type";
import { STAFF_ROLE_LABELS } from "@/types/staff";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { ArrowRightLeft, User, ImageIcon, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CareRequestModalProps {
   isOpen: boolean;
   onClose: () => void;
   requestData: CareRequest | null;
   onSuccess?: () => void;
}

const careRequestFormSchema = z.object({
   resolutionNote: z
      .string()
      .trim()
      .min(
         5,
         "Vui lòng nhập kết luận / lời dặn trước khi lưu, tối thiểu 5 kí tự",
      ),
});

type CareRequestFormData = z.infer<typeof careRequestFormSchema>;

interface CareRequestModalContentProps {
   request: CareRequest;
   onClose: () => void;
   onSuccess?: () => void;
}

function CareRequestModalContent({
   request,
   onClose,
   onSuccess,
}: CareRequestModalContentProps) {
   const { user } = useAuth();

   // Query detail to guarantee latest data
   const { data: detailData } = useGetDetailCareRequestQuery(request.id, {
      skip: !request.id,
   });
   const activeRequest = detailData || request;

   const subscriptionId =
      activeRequest?.subscriptionId || activeRequest?.subscription?.id || "";

   const { data: subscriptionDetail } = useGetDetailCareSubcriptionQuery(
      { id: subscriptionId },
      { skip: !subscriptionId },
   );

   const [receiveCareRequest, { isLoading: isTransferring }] =
      useReceiveCareRequestMutation();
   const [resolveCareRequest, { isLoading: isResolving }] =
      useResolveCareRequestMutation();

   // Reactive values for resolution note without cascading renders
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<CareRequestFormData>({
      resolver: zodResolver(careRequestFormSchema),
      values: {
         resolutionNote: activeRequest?.resolutionNote || "",
      },
      resetOptions: {
         keepDirtyValues: true,
      },
   });

   // Local assignee override when shift is transferred during this session
   const [transferredAssignee, setTransferredAssignee] = useState<Staff | null>(
      null,
   );

   const currentAssignee =
      transferredAssignee ||
      activeRequest?.assignedUser ||
      (activeRequest?.assignedUserId === user?.id
         ? (user as unknown as Staff)
         : null);

   const currentAssigneeId =
      currentAssignee?.id || activeRequest?.assignedUserId;

   // Check if the current logged-in user is the one assigned to process this request
   const isAssignedToCurrentUser = Boolean(
      user?.id && currentAssigneeId === user.id,
   );

   // Candidate members for shift transfer from care package subscription
   const otherTeamMembers = useMemo(() => {
      const candidates: {
         id: string;
         fullName: string;
         roleLabel: string;
         staff?: Staff;
      }[] = [];
      const seen = new Set<string>();

      const checkAndAdd = (
         staff: Staff | undefined,
         id: string | undefined,
         defaultRoleLabel: string,
      ) => {
         const targetId = staff?.id || id;
         if (!targetId || targetId === currentAssigneeId || seen.has(targetId))
            return;
         seen.add(targetId);
         candidates.push({
            id: targetId,
            fullName: staff?.fullName || "Nhân viên y tế",
            roleLabel: staff?.role
               ? STAFF_ROLE_LABELS[staff.role] || staff.role
               : defaultRoleLabel,
            staff,
         });
      };

      if (subscriptionDetail) {
         checkAndAdd(
            subscriptionDetail.assignedDoctor,
            subscriptionDetail.assignedDoctorId,
            "Bác sĩ phụ trách",
         );
         checkAndAdd(
            subscriptionDetail.assignedNurse,
            subscriptionDetail.assignedNurseId,
            "Điều dưỡng phụ trách",
         );
         checkAndAdd(
            subscriptionDetail.assignedExpert,
            subscriptionDetail.assignedExpertId,
            "Bác sĩ chuyên gia",
         );
      } else if (activeRequest?.subscription?.assignedDoctorId) {
         checkAndAdd(
            undefined,
            activeRequest.subscription.assignedDoctorId,
            "Bác sĩ phụ trách",
         );
      }

      // Add previous assigned user if they are not the current assignee
      if (
         activeRequest?.assignedUser &&
         activeRequest.assignedUser.id !== currentAssigneeId &&
         !seen.has(activeRequest.assignedUser.id)
      ) {
         checkAndAdd(
            activeRequest.assignedUser,
            activeRequest.assignedUser.id,
            "Người bàn giao",
         );
      }

      return candidates;
   }, [subscriptionDetail, activeRequest, currentAssigneeId]);

   // Shift transfer action
   const handleTransferShift = async (target: {
      id: string;
      fullName: string;
      roleLabel: string;
      staff?: Staff;
   }) => {
      if (!activeRequest?.id) return;
      try {
         await receiveCareRequest({
            id: activeRequest.id,
            body: {
               assignedUserId: target.id,
               note: `Chuyển ca cho ${target.fullName} (${target.roleLabel})`,
            },
         }).unwrap();

         toast.success(
            `Đã chuyển ca cho ${target.fullName} (${target.roleLabel})`,
         );

         setTransferredAssignee(
            target.staff ||
               ({
                  id: target.id,
                  fullName: target.fullName,
                  role: target.roleLabel as unknown as Staff["role"],
               } as Staff),
         );

         onSuccess?.();
         // Khi đã chuyển ca xong thì không được xử lý nữa -> tự động đóng modal
         onClose();
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(error.data?.message || "Không thể chuyển ca");
      }
   };

   // Save conclusion & resolve request
   const handleFormSubmit = async (data: CareRequestFormData) => {
      if (!activeRequest?.id || !isAssignedToCurrentUser) return;
      try {
         await resolveCareRequest({
            id: activeRequest.id,
            body: {
               resolutionNote: data.resolutionNote.trim(),
            },
         }).unwrap();

         toast.success("Lưu kết luận và hoàn thành yêu cầu thành công");
         onSuccess?.();
         onClose();
      } catch (err: unknown) {
         const error = err as { data?: { message?: string } };
         toast.error(error.data?.message || "Không thể lưu kết luận");
      }
   };

   const patient =
      activeRequest?.subscription?.healthProfile ||
      (
         activeRequest as unknown as {
            patient?: {
               fullName?: string;
               phoneNumber?: string;
               hospitalPatientCode?: string;
            };
         }
      )?.patient ||
      (
         activeRequest as unknown as {
            healthProfile?: {
               fullName?: string;
               phoneNumber?: string;
               hospitalPatientCode?: string;
            };
         }
      )?.healthProfile;

   return (
      <DialogContent className="sm:max-w-2xl rounded-sm max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
         {/* Header */}
         <DialogHeader className="px-5 py-3 border-b border-slate-200">
            <DialogTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
               Yêu cầu chăm sóc
            </DialogTitle>
         </DialogHeader>

         <ScrollArea className="flex-1 overflow-y-auto px-5 py-4 max-h-[calc(90vh-140px)]">
            <div className="space-y-4 p-0.5">
               {/* Thông báo phân quyền nếu không phải người phụ trách */}
               {!isAssignedToCurrentUser && (
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                     <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                     <div className="leading-relaxed">
                        Yêu cầu này hiện đang do{" "}
                        <strong className="text-amber-950 font-semibold">
                           {currentAssignee?.fullName || "nhân viên khác"}
                        </strong>{" "}
                        phụ trách. Bạn chỉ có quyền xem chi tiết; chỉ người nhận
                        chuyển ca mới có thể xử lý hoặc chuyển ca lại cho bạn.
                     </div>
                  </div>
               )}

               {/* PHẦN ĐẦU: Tên bệnh nhân & Nội dung care request */}
               <div className="bg-white rounded-sm border border-slate-200 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                     <div>
                        <span className="text-xs text-slate-500 font-medium block">
                           Bệnh nhân
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                           {patient?.fullName || "—"}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                           {patient?.phoneNumber && (
                              <span>
                                 SĐT:{" "}
                                 <strong className="text-slate-700 font-medium">
                                    {patient.phoneNumber}
                                 </strong>
                              </span>
                           )}
                           {patient?.hospitalPatientCode && (
                              <span>
                                 Mã BN:{" "}
                                 <strong className="text-slate-700 font-medium">
                                    {patient.hospitalPatientCode}
                                 </strong>
                              </span>
                           )}
                        </div>
                     </div>

                     {activeRequest?.createdAt && (
                        <div className="text-right text-xs text-slate-500">
                           <span className="block text-[11px] text-slate-400">
                              Thời gian gửi
                           </span>
                           <span className="font-medium text-slate-600">
                              {formatDate(activeRequest.createdAt, true)}
                           </span>
                        </div>
                     )}
                  </div>

                  {/* Nội dung yêu cầu */}
                  <div className="space-y-2">
                     <div>
                        <span className="text-xs font-medium text-slate-500 block">
                           Tiêu đề yêu cầu:
                        </span>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">
                           {activeRequest?.title || "—"}
                        </p>
                     </div>

                     <div>
                        <span className="text-xs font-medium text-slate-500 block">
                           Nội dung chi tiết:
                        </span>
                        <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-100 whitespace-pre-wrap leading-relaxed mt-1">
                           {activeRequest?.description ||
                              "Không có nội dung mô tả chi tiết."}
                        </div>
                     </div>

                     {/* Tệp đính kèm */}
                     {activeRequest?.mediaUrls &&
                        activeRequest.mediaUrls.length > 0 && (
                           <div>
                              <span className="text-xs font-medium text-slate-500 block mb-1">
                                 Tệp / Hình ảnh đính kèm (
                                 {activeRequest.mediaUrls.length}):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                 {activeRequest.mediaUrls.map((url, idx) => (
                                    <a
                                       key={idx}
                                       href={url}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                                    >
                                       <ImageIcon className="w-3.5 h-3.5" />
                                       <span>Tệp đính kèm {idx + 1}</span>
                                    </a>
                                 ))}
                              </div>
                           </div>
                        )}
                  </div>
               </div>

               {/* TIẾP ĐẾN: Thông tin người tiếp nhận & Button chuyển ca */}
               <div className="bg-slate-50 rounded-sm border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                           {currentAssignee?.fullName ? (
                              currentAssignee.fullName.charAt(0).toUpperCase()
                           ) : (
                              <User className="w-4 h-4" />
                           )}
                        </div>
                        <div>
                           <div className="text-xs text-slate-500 font-medium">
                              Người tiếp nhận:
                           </div>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-semibold text-slate-900">
                                 {currentAssignee?.fullName || "Chưa tiếp nhận"}
                              </span>
                              {user?.id && currentAssigneeId === user.id && (
                                 <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                    (Tôi)
                                 </span>
                              )}
                           </div>
                           <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>
                                 {currentAssignee?.role
                                    ? STAFF_ROLE_LABELS[currentAssignee.role] ||
                                      currentAssignee.role
                                    : "Nhân viên y tế"}
                              </span>
                              {currentAssignee?.phoneNumber && (
                                 <span>
                                    • SĐT: {currentAssignee.phoneNumber}
                                 </span>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Button Chuyển ca: Chỉ người đang tiếp nhận mới có quyền chuyển ca */}
                     {isAssignedToCurrentUser && (
                        <div>
                           {otherTeamMembers.length === 0 ? (
                              <CustomButton
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                    toast.warn(
                                       "Gói chăm sóc này chưa có nhân viên y tế khác trong đội ngũ để chuyển ca.",
                                    );
                                 }}
                                 className="h-8 gap-1.5 text-xs text-slate-600 border-slate-300"
                              >
                                 <ArrowRightLeft className="w-3.5 h-3.5" />
                                 Chuyển ca
                              </CustomButton>
                           ) : otherTeamMembers.length === 1 ? (
                              <CustomButton
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 isLoading={isTransferring}
                                 onClick={() =>
                                    handleTransferShift(otherTeamMembers[0])
                                 }
                                 className="h-8 gap-1.5 text-xs text-blue-700 border-blue-200 bg-white hover:bg-blue-50"
                              >
                                 <ArrowRightLeft className="w-3.5 h-3.5" />
                                 Chuyển ca sang {otherTeamMembers[0].fullName}
                              </CustomButton>
                           ) : (
                              <DropdownMenu>
                                 <DropdownMenuTrigger
                                    disabled={isTransferring}
                                    className="h-8 gap-1.5 text-xs text-blue-700 border border-blue-200 bg-white hover:bg-blue-50 px-3 inline-flex items-center justify-center rounded-sm font-medium cursor-pointer"
                                 >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    Chuyển ca ({otherTeamMembers.length})
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent
                                    align="end"
                                    className="w-64 p-1 rounded-sm"
                                 >
                                    <div className="px-2 py-1.5 text-[11px] font-medium text-slate-400">
                                       Chọn người nhận trong gói chăm sóc:
                                    </div>
                                    {otherTeamMembers.map((member) => (
                                       <DropdownMenuItem
                                          key={member.id}
                                          onClick={() =>
                                             handleTransferShift(member)
                                          }
                                          className="flex flex-col items-start gap-0.5 p-2 cursor-pointer hover:bg-slate-100 rounded"
                                       >
                                          <div className="text-xs font-medium text-slate-900">
                                             {member.fullName}
                                          </div>
                                          <div className="text-[11px] text-slate-500">
                                             {member.roleLabel}
                                          </div>
                                       </DropdownMenuItem>
                                    ))}
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           )}
                        </div>
                     )}
                  </div>
               </div>

               {/* FORM NHẬP KẾT LUẬN */}
               <form
                  id="care-request-form"
                  onSubmit={handleSubmit(handleFormSubmit)}
                  className="space-y-4"
               >
                  <div>
                     <FormTextarea
                        label="Kết luận / Lời dặn"
                        placeholder={
                           isAssignedToCurrentUser
                              ? "Nhập nội dung kết luận xử lý hoặc lời dặn của bác sĩ/điều dưỡng dành cho bệnh nhân..."
                              : "Chỉ người đang tiếp nhận yêu cầu mới có quyền nhập kết luận xử lý."
                        }
                        rows={4}
                        {...register("resolutionNote")}
                        error={errors.resolutionNote?.message}
                        className="text-xs"
                        disabled={!isAssignedToCurrentUser}
                        readOnly={!isAssignedToCurrentUser}
                        required={isAssignedToCurrentUser}
                     />
                  </div>
               </form>
            </div>
         </ScrollArea>

         {/* BÊN DƯỚI: Option Đóng, Lưu lại */}
         <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
            <CustomButton
               type="button"
               variant="outline"
               onClick={onClose}
               disabled={isResolving || isTransferring}
               className="h-9 px-4 text-xs"
            >
               Đóng
            </CustomButton>
            {isAssignedToCurrentUser && (
               <CustomButton
                  type="submit"
                  form="care-request-form"
                  isLoading={isResolving}
                  loadingText="Đang lưu..."
                  className="h-9 px-6 text-xs bg-blue-600 hover:bg-blue-700 text-white"
               >
                  Lưu lại
               </CustomButton>
            )}
         </div>
      </DialogContent>
   );
}

export function CareRequestModal({
   isOpen,
   onClose,
   requestData,
   onSuccess,
}: CareRequestModalProps) {
   return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
         {isOpen && requestData && (
            <CareRequestModalContent
               key={requestData.id}
               request={requestData}
               onClose={onClose}
               onSuccess={onSuccess}
            />
         )}
      </Dialog>
   );
}
