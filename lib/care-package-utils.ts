// Utility kiểm tra tính hợp lệ và thời hạn của gói chăm sóc sức khỏe

import { HealthProfile } from "@/store/api/health-profile/type";
import { CareSubscriptions } from "@/store/api/coordinate/type";
import { ConversationSubscription } from "@/store/api/conversation/type";

export interface CarePackageStatusCheck {
   hasPackage: boolean;
   isExpired: boolean;
   isActive: boolean;
   canCreateExamination: boolean;
   canChat: boolean;
   packageName?: string;
   packageType?: string;
   expiresAt?: string;
   status?: string;
   reason?: string;
}

/**
 * Kiểm tra trạng thái gói chăm sóc từ đối tượng Subscription
 */
export function checkCarePackageStatus(
   subscription?: CareSubscriptions | ConversationSubscription | null,
): CarePackageStatusCheck {
   if (!subscription || !subscription.carePackage) {
      return {
         hasPackage: false,
         isExpired: false,
         isActive: false,
         canCreateExamination: false,
         canChat: false,
         reason: "Hồ sơ chưa đăng ký gói chăm sóc sức khỏe nào.",
      };
   }

   const packageName = subscription.carePackage.name;
   const packageType = subscription.carePackage.type;
   const status = subscription.status;
   const expiresAt = subscription.expiresAt;

   // Kiểm tra hết hạn: trạng thái EXPIRED hoặc thời điểm expiresAt đã qua
   const isExpiredByStatus = status === "EXPIRED";
   const isExpiredByDate =
      expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
   const isExpired = isExpiredByStatus || isExpiredByDate;

   if (isExpired) {
      return {
         hasPackage: true,
         isExpired: true,
         isActive: false,
         canCreateExamination: false,
         canChat: false,
         packageName,
         packageType,
         expiresAt,
         status: "EXPIRED",
         reason: "Gói chăm sóc sức khỏe đã hết hạn.",
      };
   }

   if (status === "CANCELLED") {
      return {
         hasPackage: true,
         isExpired: false,
         isActive: false,
         canCreateExamination: false,
         canChat: false,
         packageName,
         packageType,
         expiresAt,
         status: "CANCELLED",
         reason: "Gói chăm sóc đã bị hủy hoặc bệnh nhân từ chối.",
      };
   }

   if (status === "PENDING") {
      return {
         hasPackage: true,
         isExpired: false,
         isActive: false,
         canCreateExamination: false,
         canChat: false,
         packageName,
         packageType,
         expiresAt,
         status: "PENDING",
         reason: "Gói chăm sóc đang trong quá trình chờ xác nhận hoặc điều phối.",
      };
   }

   const isActive = status === "ACTIVE";

   return {
      hasPackage: true,
      isExpired: false,
      isActive,
      canCreateExamination: isActive,
      canChat: isActive,
      packageName,
      packageType,
      expiresAt,
      status: status || "ACTIVE",
      reason: isActive ? undefined : "Gói chăm sóc chưa được kích hoạt.",
   };
}

/**
 * Kiểm tra trạng thái gói chăm sóc của một hồ sơ sức khỏe
 */
export function checkHealthProfileCarePackage(
   profile?: HealthProfile | null,
): CarePackageStatusCheck {
   return checkCarePackageStatus(profile?.careSubscription);
}
