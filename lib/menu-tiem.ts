import {
   Building2,
   Folders,
   LayoutDashboard,
   MessageCircle,
   Book,
   type LucideIcon,
   Radiation,
   Share2,
   Heart,
} from "lucide-react";
import { StaffRole } from "@/types/staff";

export type Role = StaffRole;

export type MenuItem = {
   id: string;
   label: string;
   icon: LucideIcon;
   href: string;
   role: StaffRole[];
};

export const menuItems: MenuItem[] = [
   {
      id: "dashboard",
      label: "Tổng quan",
      icon: LayoutDashboard,
      href: "/dashboard",
      role: ["VNDOCTOR_ADMIN", "ADMIN", "DOCTOR", "DOCTOR_EXPERT"],
   },
   {
      id: "health-profile",
      label: "Quản lý khách hàng",
      icon: Book,
      href: "/health-profile",
      role: ["VNDOCTOR_ADMIN", "ADMIN", "DOCTOR", "DOCTOR_EXPERT", "NURSE"],
   },
   {
      id: "care-request",
      label: "Yêu cầu chăm sóc",
      icon: Heart,
      href: "/care-request",
      role: ["VNDOCTOR_ADMIN", "ADMIN", "DOCTOR", "DOCTOR_EXPERT", "NURSE"],
   },
   {
      id: "coordinate",
      label: "Điều phối nhân viên",
      icon: Share2,
      href: "/coordinate",
      role: ["VNDOCTOR_ADMIN", "ADMIN", "DOCTOR", "DOCTOR_EXPERT"],
   },
   {
      id: "care-package",
      label: "Gói chăm sóc",
      icon: Folders,
      href: "/care-package",
      role: ["VNDOCTOR_ADMIN", "ADMIN", "DOCTOR", "DOCTOR_EXPERT"],
   },
   // {
   //    id: "chronic-diseases",
   //    label: "Bệnh mạn tính",
   //    icon: Radiation,
   //    href: "/chronic-disease",
   //    role: ["VNDOCTOR_ADMIN", "ADMIN", "DOCTOR", "DOCTOR_EXPERT"],
   // },
   {
      id: "online-consult",
      label: "Tin nhắn",
      icon: MessageCircle,
      href: "/online-consult",
      role: [
         "VNDOCTOR_ADMIN",
         "ADMIN",
         "DOCTOR",
         "DOCTOR_EXPERT",
         "NURSE",
         "STAFF",
      ],
   },
   {
      id: "facility",
      label: "Quản lý cơ sở y tế",
      icon: Building2,
      href: "/facility",
      role: ["VNDOCTOR_ADMIN", "ADMIN"],
   },
];

export const getMenuItemsByRole = (role?: string | null): MenuItem[] => {
   if (!role) return [];
   const normalizedRole = role.trim().toUpperCase();

   return menuItems.filter((item) => {
      const allowedRoles = item.role as string[];

      // Tương thích nếu role người dùng là EXPERT hoặc DOCTOR_EXPERT
      if (
         (normalizedRole === "DOCTOR_EXPERT" || normalizedRole === "EXPERT") &&
         allowedRoles.includes("DOCTOR_EXPERT")
      ) {
         return true;
      }

      // Tương thích nếu role người dùng là FACILITY_ADMIN hoặc ADMIN
      if (
         (normalizedRole === "FACILITY_ADMIN" || normalizedRole === "ADMIN") &&
         allowedRoles.includes("ADMIN")
      ) {
         return true;
      }

      // Tương thích nếu role người dùng là SUPER_ADMIN
      if (
         normalizedRole === "SUPER_ADMIN" &&
         (allowedRoles.includes("VNDOCTOR_ADMIN") ||
            allowedRoles.includes("ADMIN"))
      ) {
         return true;
      }

      return allowedRoles.includes(normalizedRole);
   });
};
