"use client";

import * as React from "react";
import {
   Pagination,
   PaginationContent,
   PaginationEllipsis,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";

export interface CustomPaginationProps {
   currentPage: number;
   totalPages?: number;
   totalItems?: number;
   pageSize?: number;
   pageSizeOptions?: number[];
   siblingCount?: number;
   showTotalInfo?: boolean;
   showPageSizeSelector?: boolean;
   hideOnSinglePage?: boolean;
   className?: string;
   onPageChange: (page: number) => void;
   onPageSizeChange?: (pageSize: number) => void;
}

function getPaginationRange({
   currentPage,
   totalPages,
   siblingCount = 1,
}: {
   currentPage: number;
   totalPages: number;
   siblingCount?: number;
}): (number | "ellipsis-left" | "ellipsis-right")[] {
   const totalPageNumbers = siblingCount * 2 + 5;

   if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
   }

   const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
   const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

   const shouldShowLeftDots = leftSiblingIndex > 2;
   const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

   const firstPageIndex = 1;
   const lastPageIndex = totalPages;

   if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "ellipsis-right", lastPageIndex];
   }

   if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
         { length: rightItemCount },
         (_, i) => totalPages - rightItemCount + i + 1,
      );
      return [firstPageIndex, "ellipsis-left", ...rightRange];
   }

   if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
         { length: rightSiblingIndex - leftSiblingIndex + 1 },
         (_, i) => leftSiblingIndex + i,
      );
      return [
         firstPageIndex,
         "ellipsis-left",
         ...middleRange,
         "ellipsis-right",
         lastPageIndex,
      ];
   }

   return [];
}

export const CustomPagination = ({
   currentPage,
   totalPages,
   totalItems,
   pageSize = 5,
   pageSizeOptions = [5, 10, 20, 50, 100],
   siblingCount = 1,
   showTotalInfo = true,
   showPageSizeSelector = false,
   hideOnSinglePage = false,
   className,
   onPageChange,
   onPageSizeChange,
}: CustomPaginationProps) => {
   const computedTotalPages = React.useMemo(() => {
      if (typeof totalPages === "number") {
         return Math.max(totalPages, 1);
      }
      if (typeof totalItems === "number") {
         return Math.max(Math.ceil(totalItems / pageSize), 1);
      }
      return 1;
   }, [totalPages, totalItems, pageSize]);

   if (hideOnSinglePage && computedTotalPages <= 1) {
      return null;
   }

   const paginationRange = getPaginationRange({
      currentPage,
      totalPages: computedTotalPages,
      siblingCount,
   });

   const handlePrevious = (e: React.MouseEvent) => {
      e.preventDefault();
      if (currentPage > 1) {
         onPageChange(currentPage - 1);
      }
   };

   const handleNext = (e: React.MouseEvent) => {
      e.preventDefault();
      if (currentPage < computedTotalPages) {
         onPageChange(currentPage + 1);
      }
   };

   const handlePageClick = (page: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (page !== currentPage) {
         onPageChange(page);
      }
   };

   const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
   const toItem =
      typeof totalItems === "number"
         ? Math.min(currentPage * pageSize, totalItems)
         : currentPage * pageSize;

   return (
      <div
         className={cn(
            "flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-sm",
            className,
         )}
      >
         <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {showTotalInfo && typeof totalItems === "number" && (
               <p>
                  <span className="font-semibold text-slate-700">
                     {fromItem}
                  </span>
                  {" - "}
                  <span className="font-semibold text-slate-700">{toItem}</span>
                  {" / "}
                  <span className="font-semibold text-slate-700">
                     {totalItems}
                  </span>
               </p>
            )}
            {(showPageSizeSelector || !!onPageSizeChange) &&
               onPageSizeChange && (
                  <div className="flex items-center gap-1.5">
                     <Select
                        value={pageSize.toString()}
                        onValueChange={(val) => {
                           if (val) {
                              onPageSizeChange(Number(val));
                           }
                        }}
                     >
                        <SelectTrigger size="sm" className="h-7 text-xs">
                           <SelectValue>{pageSize}</SelectValue>
                        </SelectTrigger>
                        <SelectContent
                           side="bottom"
                           align="start"
                           alignItemWithTrigger={false}
                        >
                           {pageSizeOptions.map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                 {size}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               )}
         </div>

         <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-1">
               <PaginationItem>
                  <PaginationPrevious
                     href="#"
                     text="Trước"
                     onClick={handlePrevious}
                     className={cn(
                        "h-8 text-xs cursor-pointer",
                        currentPage <= 1 &&
                           "pointer-events-none opacity-40 select-none cursor-not-allowed",
                     )}
                     aria-disabled={currentPage <= 1}
                  />
               </PaginationItem>

               <li className="flex sm:hidden items-center px-2 text-xs font-medium text-slate-600">
                  {currentPage} / {computedTotalPages}
               </li>

               {paginationRange.map((page, index) => {
                  if (page === "ellipsis-left" || page === "ellipsis-right") {
                     return (
                        <PaginationItem
                           key={`${page}-${index}`}
                           className="hidden sm:inline-block"
                        >
                           <PaginationEllipsis />
                        </PaginationItem>
                     );
                  }

                  const isActive = page === currentPage;
                  return (
                     <PaginationItem
                        key={page}
                        className="hidden sm:inline-block"
                     >
                        <PaginationLink
                           href="#"
                           isActive={isActive}
                           onClick={handlePageClick(page)}
                           className={cn(
                              "size-8 text-xs cursor-pointer transition-colors",
                              isActive
                                 ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white font-semibold shadow-2xs"
                                 : "hover:bg-slate-100 text-slate-700",
                           )}
                        >
                           {page}
                        </PaginationLink>
                     </PaginationItem>
                  );
               })}

               <PaginationItem>
                  <PaginationNext
                     href="#"
                     text="Sau"
                     onClick={handleNext}
                     className={cn(
                        "h-8 text-xs cursor-pointer",
                        currentPage >= computedTotalPages &&
                           "pointer-events-none opacity-40 select-none cursor-not-allowed",
                     )}
                     aria-disabled={currentPage >= computedTotalPages}
                  />
               </PaginationItem>
            </PaginationContent>
         </Pagination>
      </div>
   );
};
