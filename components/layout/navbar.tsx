"use client";

import * as React from "react";
import {
   Menu,
   Bell,
   User as UserIcon,
   ChevronRight,
   LogOut,
   Hospital,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { STAFF_ROLE_LABELS, StaffRole } from "@/types/staff";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { menuItems } from "@/lib/menu-tiem";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
   onMenuClick?: () => void;
   isCollapsed?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
   dashboard: "Tổng quan",
   facility: "Quản lý cơ sở y tế",
   "care-package": "Gói chăm sóc",
   "health-profile": "Hồ sơ sức khỏe",
   patients: "Quản lý khách hàng",
   appointments: "Lịch hẹn",
   notifications: "Trung tâm thông báo",
   "sos-cases": "Trường hợp SOS",
   "medical-order": "Xử lý chỉ định",
   "care-requests": "Yêu cầu chăm sóc",
   "online-consult": "Tin nhắn",
   consultations: "Hội chẩn",
   "assign-staff": "Điều phối nhân viên",
};

export const Navbar = ({ onMenuClick }: NavbarProps) => {
   const { user, logout } = useAuth();
   const pathname = usePathname();
   const router = useRouter();

   const breadcrumbs = React.useMemo(() => {
      if (!pathname || pathname === "/") return [];
      let acc = "";
      return pathname
         .split("/")
         .filter(Boolean)
         .map((seg, idx, arr) => {
            acc += `/${seg}`;
            const label =
               menuItems.find((m) => m.href === acc)?.label ||
               ROUTE_LABELS[seg] ||
               seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
            return { path: acc, label, isLast: idx === arr.length - 1 };
         });
   }, [pathname]);

   const initials = user?.fullName?.charAt(0)?.toUpperCase() ?? "";
   const roleLabel = user?.role
      ? (STAFF_ROLE_LABELS[user.role as StaffRole] ?? user.role)
      : "";

   return (
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5">
         {/* Left: hamburger + breadcrumb */}
         <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
               type="button"
               onClick={onMenuClick}
               className="flex lg:hidden size-8 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
               aria-label="Toggle menu"
            >
               <Menu className="size-4.5" />
            </button>

            {/* Facility name */}
            <span
               className="hidden sm:flex gap-2 items-center font-semibold text-sm text-slate-800 truncate shrink-0 max-w-44 lg:max-w-none"
               title={user?.facility?.facilityName ?? "VNDOCTOR"}
            >
               <Hospital className="size-6 text-primary" />{" "}
               {user?.facility?.facilityName ?? "VNDOCTOR"}
            </span>

            {/* Breadcrumbs */}
            {breadcrumbs.map((crumb) => (
               <div
                  key={crumb.path}
                  className="flex items-center gap-1.5 shrink-0 min-w-0"
               >
                  <ChevronRight className="size-3.5 text-slate-300 shrink-0" />
                  {crumb.isLast ? (
                     <span className="text-sm font-medium text-slate-500 truncate">
                        {crumb.label}
                     </span>
                  ) : (
                     <Link
                        href={crumb.path}
                        className="text-sm text-slate-400 hover:text-slate-700 transition-colors truncate"
                     >
                        {crumb.label}
                     </Link>
                  )}
               </div>
            ))}
         </div>

         {/* Right: actions */}
         <div className="flex items-center gap-1 shrink-0">
            <button
               type="button"
               className="flex size-8 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
               aria-label="Thông báo"
            >
               <Bell className="size-4" />
            </button>

            <DropdownMenu>
               <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white font-semibold text-sm">
                     {initials || <UserIcon className="size-4" />}
                  </div>
                  <div className="hidden md:block text-left">
                     <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {user?.fullName ?? "—"}
                     </p>
                  </div>
               </DropdownMenuTrigger>

               <DropdownMenuContent
                  align="end"
                  sideOffset={6}
                  className="w-52 rounded shadow-none"
               >
                  <div className="px-4 py-2 border-b border-slate-100">
                     <p className="text-sm font-semibold text-slate-800 truncate">
                        {user?.fullName ?? "—"}
                     </p>
                     <p className="text-xs text-slate-400 truncate">
                        {roleLabel}
                     </p>
                  </div>
                  <DropdownMenuItem
                     onClick={() => router.push("/profile")}
                     className="cursor-pointer gap-2 px-3 py-2 rounded-sm text-sm text-slate-700 hover:text-slate-600 hover:bg-slate-100"
                  >
                     <UserIcon className="size-3.5 text-slate-400" />
                     Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                     onClick={() => {
                        logout();
                        router.replace("/login");
                     }}
                     className="cursor-pointer gap-2 px-3 py-2 rounded-sm text-sm text-rose-600 hover:text-rose-500 hover:bg-rose-50"
                  >
                     <LogOut className="size-3.5" />
                     Đăng xuất
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </header>
   );
};
