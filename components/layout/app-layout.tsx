"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { cn } from "@/lib/utils";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [isCollapsed, setIsCollapsed] = useState(false);

   useEffect(() => {
      const handleResize = () => {
         if (window.innerWidth >= 1024) {
            setIsSidebarOpen(false);
         }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   const handleToggleMenu = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
         setIsCollapsed((prev) => !prev);
      } else {
         setIsSidebarOpen((prev) => !prev);
      }
   };

   return (
      <div className="min-h-screen bg-[#F8FAFC]">
         <Sidebar
            isOpen={isSidebarOpen}
            isCollapsed={isCollapsed}
            onOpenChange={setIsSidebarOpen}
         />
         <div
            className={cn(
               "flex min-h-screen min-w-0 flex-col transition-[padding-left] duration-300 ease-in-out",
               isCollapsed ? "lg:pl-18" : "lg:pl-60",
            )}
         >
            <Navbar onMenuClick={handleToggleMenu} isCollapsed={isCollapsed} />
            <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden">
               {children}
            </main>
         </div>
      </div>
   );
};

export default AppLayout;
