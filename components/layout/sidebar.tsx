"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getMenuItemsByRole, MenuItem } from "@/lib/menu-tiem";
import { cn } from "@/lib/utils";
import { CustomButton } from "@/components/common/custom-button";

interface SidebarProps {
   isOpen?: boolean;
   isCollapsed?: boolean;
   onOpenChange?: (open: boolean) => void;
   className?: string;
}

export const Sidebar = ({
   isOpen = false,
   isCollapsed = true,
   onOpenChange,
   className,
}: SidebarProps) => {
   const [isDesktop, setIsDesktop] = useState(false);
   const [isHovered, setIsHovered] = useState(false);
   const pathname = usePathname();
   const { user, logout } = useAuth();

   useEffect(() => {
      const checkDesktop = () => {
         setIsDesktop(window.innerWidth >= 1024);
      };
      checkDesktop();
      window.addEventListener("resize", checkDesktop);
      return () => window.removeEventListener("resize", checkDesktop);
   }, []);

   const isExpanded = !isDesktop || !isCollapsed || isHovered;

   const visibleMenuItems: MenuItem[] = getMenuItemsByRole(user?.role);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape" && isOpen) {
            onOpenChange?.(false);
         }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
   }, [isOpen, onOpenChange]);

   useEffect(() => {
      if (isOpen && typeof window !== "undefined" && window.innerWidth < 1024) {
         document.body.style.overflow = "hidden";
      } else {
         document.body.style.overflow = "";
      }
      return () => {
         document.body.style.overflow = "";
      };
   }, [isOpen]);

   const handleLogout = () => {
      logout();
      onOpenChange?.(false);
   };

   const handleItemClick = () => {
      setIsHovered(false);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
         onOpenChange?.(false);
      }
   };

   return (
      <>
         <div
            className={cn(
               "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out lg:hidden",
               isOpen
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none",
            )}
            onClick={() => onOpenChange?.(false)}
            aria-hidden="true"
         />

         <aside
            onMouseEnter={() => {
               if (isDesktop && isCollapsed) setIsHovered(true);
            }}
            onMouseLeave={() => {
               if (isDesktop) setIsHovered(false);
            }}
            className={cn(
               "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white text-slate-800 transition-all duration-300 ease-in-out",
               isExpanded ? "w-64 lg:w-72" : "w-64 lg:w-18",
               isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
               className,
            )}
         >
            <div
               className={cn(
                  "flex h-16 shrink-0 items-center px-4 border-b border-slate-100 transition-all duration-300",
                  !isExpanded ? "justify-center px-2" : "justify-between",
               )}
            >
               <Link
                  href="/dashboard"
                  onClick={handleItemClick}
                  className="flex items-center gap-2 overflow-hidden"
                  title="VNDoctor"
               >
                  <Image
                     src={
                        !isExpanded
                           ? "/tmt/logo-navi-browser.png"
                           : "/tmt/logo-navi.png"
                     }
                     alt="VNDoctor logo"
                     width={!isExpanded ? 32 : 140}
                     height={36}
                     className={cn(
                        "object-contain transition-all duration-300",
                        !isExpanded ? "size-8" : "h-9 w-auto",
                     )}
                     priority
                  />
               </Link>

               <button
                  type="button"
                  onClick={() => onOpenChange?.(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden cursor-pointer transition-colors"
                  aria-label="Đóng menu"
               >
                  <X className="size-5" />
               </button>
            </div>

            <nav className="flex-1 space-y-3 overflow-y-auto p-3 select-none">
               {visibleMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                     item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                  return (
                     <Link
                        key={item.id}
                        href={item.href}
                        onClick={handleItemClick}
                        title={!isExpanded ? item.label : undefined}
                        className={cn(
                           "group relative flex h-10 w-full items-center rounded-sm text-sm font-medium transition-colors",
                           !isExpanded
                              ? "justify-center px-0"
                              : "justify-start gap-3 px-3",
                           isActive
                              ? "bg-[#EAF2FC] text-blue-700 font-semibold shadow-xs"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        )}
                     >
                        <Icon
                           className={cn(
                              "size-7 shrink-0 transition-colors",
                              isActive
                                 ? "text-blue-600"
                                 : "text-slate-500 group-hover:text-slate-700",
                           )}
                        />
                        <span
                           className={cn(
                              "min-w-0 flex-1 truncate transition-all duration-300 text-sm whitespace-nowrap",
                              !isExpanded
                                 ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden"
                                 : "opacity-100 translate-x-0",
                           )}
                        >
                           {item.label}
                        </span>
                     </Link>
                  );
               })}
            </nav>

            <div className="shrink-0 p-3 border-t border-slate-100 space-y-2">
               <CustomButton
                  type="button"
                  variant="destructive"
                  fullWidth
                  onClick={handleLogout}
                  title="Đăng xuất"
                  startIcon={
                     <LogOut className="size-4 shrink-0 text-rose-500" />
                  }
                  className={cn(
                     "h-10",
                     !isExpanded
                        ? "justify-center px-0"
                        : "justify-center gap-2 px-3",
                  )}
               >
                  {isExpanded && (
                     <span className="truncate text-sm">Đăng xuất</span>
                  )}
               </CustomButton>
            </div>
         </aside>
      </>
   );
};
