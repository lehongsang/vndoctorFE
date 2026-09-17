"use client";

import * as React from "react";
import {
   Menu,
   Bell,
   User as UserIcon,
   ChevronRight,
   LogOut,
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

   const handleLogout = () => {
      logout();
      router.replace("/login");
   };

   const breadcrumbs = React.useMemo(() => {
      if (!pathname || pathname === "/") return [];

      const segments = pathname.split("/").filter(Boolean);
      let accumulatedPath = "";

      return segments.map((seg, idx) => {
         accumulatedPath += `/${seg}`;
         const matchedMenuItem = menuItems.find(
            (item) => item.href === accumulatedPath,
         );
         const label =
            matchedMenuItem?.label ||
            ROUTE_LABELS[seg] ||
            seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");

         const isLast = idx === segments.length - 1;

         return {
            path: accumulatedPath,
            label,
            isLast,
         };
      });
   }, [pathname]);

   return (
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-2 sm:px-4 backdrop-blur-xs">
         <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 sm:mr-4">
            <button
               type="button"
               onClick={onMenuClick}
               className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
               aria-label="Toggle menu"
            >
               <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 sm:text-lg text-sm whitespace-nowrap overflow-hidden">
               <h2
                  className="font-semibold text-slate-800 leading-tight truncate shrink-0 max-w-30 xs:max-w-[160px] sm:max-w-55 md:max-w-xs lg:max-w-none"
                  title={user?.facility?.facilityName || "VNDOCTOR"}
               >
                  {user?.facility?.facilityName || "VNDOCTOR"}
               </h2>

               {breadcrumbs.map((crumb) => (
                  <div
                     key={crumb.path}
                     className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0"
                  >
                     <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
                     {crumb.isLast ? (
                        <span
                           className="font-medium text-slate-600 leading-tight truncate"
                           title={crumb.label}
                        >
                           {crumb.label}
                        </span>
                     ) : (
                        <Link
                           href={crumb.path}
                           className="text-slate-500 hover:text-primary transition-colors leading-tight truncate"
                           title={crumb.label}
                        >
                           {crumb.label}
                        </Link>
                     )}
                  </div>
               ))}
            </div>
         </div>

         <div className="flex items-center gap-3 shrink-0">
            <button
               type="button"
               className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
               aria-label="Thông báo"
            >
               <Bell className="size-4.5" />
            </button>

            <DropdownMenu>
               <DropdownMenuTrigger className="flex items-center gap-2 pl-3 border-l-2 border-slate-200 outline-none hover:opacity-85 transition-opacity cursor-pointer text-left py-1">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                     {user?.fullName?.charAt(0) || (
                        <UserIcon className="size-4.5" />
                     )}
                  </div>
                  <div className="hidden md:block text-left">
                     <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {user?.fullName || "N/A"}
                     </p>
                     <p className="text-xs text-slate-500 leading-tight">
                        {user?.role
                           ? (STAFF_ROLE_LABELS[user.role as StaffRole] ??
                             user.role)
                           : "N/A"}
                     </p>
                  </div>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-56 bg-white p-1.5 border border-slate-200 rounded-md"
               >
                  <DropdownMenuItem
                     onClick={() => router.push("/profile")}
                     className="cursor-pointer gap-2.5 px-2.5 py-2 text-slate-700 hover:text-slate-900 rounded-sm hover:bg-slate-100"
                  >
                     <UserIcon className="size-4 text-slate-500" />
                     <span className="text-sm font-medium">Hồ sơ cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                     onClick={handleLogout}
                     variant="destructive"
                     className="cursor-pointer gap-2.5 px-2.5 py-2 text-rose-600 focus:bg-rose-50 hover:bg-rose-50 rounded-sm"
                  >
                     <LogOut className="size-4 text-rose-600" />
                     <span className="text-sm font-medium">Đăng xuất</span>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </header>
   );
};
