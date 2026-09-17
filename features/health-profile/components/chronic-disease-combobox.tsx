"use client";

import { useState, useEffect, useMemo } from "react";
import { useGetAllChronicDiseasesQuery } from "@/store/api/chronic-diseases/chronic-diseases-api";
import { ChronicDisease } from "@/store/api/chronic-diseases/type";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomButton } from "@/components/common/custom-button";
import { CloverLoading } from "@/components/common/clover-loading";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChronicDiseaseComboboxProps {
   label?: React.ReactNode;
   required?: boolean;
   error?: string;
   value?: string[];
   onChange?: (value: string[]) => void;
   disabled?: boolean;
   initialDiseases?: { id: string; code: string; name: string }[] | null;
   className?: string;
}

export function ChronicDiseaseCombobox({
   label,
   required,
   error,
   value = [],
   onChange,
   disabled = false,
   initialDiseases = [],
   className,
}: ChronicDiseaseComboboxProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearch, setDebouncedSearch] = useState("");
   const [page, setPage] = useState(1);
   const [limit, setLimit] = useState(10);

   // Store locally selected diseases so their names persist across pages
   const [localSelectedMap, setLocalSelectedMap] = useState<
      Record<string, { id: string; code: string; name: string }>
   >({});

   // Debounce search input
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(searchTerm);
         setPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   // Query chronic diseases from API
   const { data, isLoading, isFetching } = useGetAllChronicDiseasesQuery({
      search: debouncedSearch.trim() || undefined,
      page,
      limit,
   });

   // Derive diseaseMap during render (avoids cascading render effects)
   const diseaseMap = useMemo(() => {
      const map: Record<string, { id: string; code: string; name: string }> =
         {};

      if (Array.isArray(initialDiseases)) {
         initialDiseases.forEach((d) => {
            if (d && d.id) {
               map[d.id] = { id: d.id, code: d.code, name: d.name };
            }
         });
      }

      if (Array.isArray(data?.items)) {
         data.items.forEach((item) => {
            if (item && item.id) {
               map[item.id] = {
                  id: item.id,
                  code: item.code,
                  name: item.name,
               };
            }
         });
      }

      Object.assign(map, localSelectedMap);
      return map;
   }, [initialDiseases, data, localSelectedMap]);

   const items: ChronicDisease[] = data?.items ?? [];
   const totalItems = data?.total ?? 0;
   const totalPages = Math.max(1, Math.ceil(totalItems / limit));

   const currentValues = useMemo(
      () => (Array.isArray(value) ? value : []),
      [value],
   );

   const handleToggle = (disease: {
      id: string;
      code: string;
      name: string;
   }) => {
      if (disabled) return;
      const isSelected = currentValues.includes(disease.id);
      let nextValue: string[];
      if (isSelected) {
         nextValue = currentValues.filter((id) => id !== disease.id);
      } else {
         nextValue = [...currentValues, disease.id];
         setLocalSelectedMap((prev) => ({
            ...prev,
            [disease.id]: {
               id: disease.id,
               code: disease.code,
               name: disease.name,
            },
         }));
      }
      onChange?.(nextValue);
   };

   const handleRemove = (idToRemove: string) => {
      if (disabled) return;
      onChange?.(currentValues.filter((id) => id !== idToRemove));
   };

   const selectedBadges = useMemo(() => {
      return currentValues.map((id) => {
         const info = diseaseMap[id];
         return {
            id,
            name: info ? info.name : id,
            code: info?.code,
         };
      });
   }, [currentValues, diseaseMap]);

   return (
      <Field invalid={Boolean(error)} className={className}>
         {/* Label & Summary Badge */}
         <div className="flex items-center justify-between">
            {label && (
               <FieldLabel className="text-sm font-semibold text-slate-700 flex items-center">
                  {label}
                  {required && (
                     <span className="ml-1 text-red-600 font-bold">*</span>
                  )}
               </FieldLabel>
            )}
            {selectedBadges.length > 0 && (
               <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                  Đã chọn: {selectedBadges.length} bệnh
               </span>
            )}
         </div>

         {/* Accordion Container */}
         <div
            className={cn(
               "w-full rounded-lg border border-slate-200 bg-white transition-all overflow-hidden shadow-none",
               error && "border-destructive",
            )}
         >
            {/* Accordion Header / Trigger */}
            <div
               role="button"
               tabIndex={0}
               onClick={() => !disabled && setIsOpen(!isOpen)}
               className={cn(
                  "w-full min-h-10 flex items-center justify-between p-4 cursor-pointer bg-slate-100 transition-colors select-none",
                  disabled &&
                     "cursor-not-allowed opacity-80 hover:bg-slate-50/70",
               )}
            >
               {/* Badges Display Area */}
               <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 mr-2">
                  {selectedBadges.length > 0 ? (
                     selectedBadges.map((badge) => (
                        <span
                           key={badge.id}
                           className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-none"
                        >
                           <span>
                              {badge.name}
                              {badge.code ? ` (${badge.code})` : ""}
                           </span>
                           {!disabled && (
                              <span
                                 role="button"
                                 tabIndex={0}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(badge.id);
                                 }}
                                 className="hover:bg-emerald-200/80 rounded-xs p-0.5 transition-colors cursor-pointer ml-0.5"
                              >
                                 <X className="w-3 h-3" />
                              </span>
                           )}
                        </span>
                     ))
                  ) : (
                     <span className="text-xs text-slate-400 px-1">
                        Nhấn để mở rộng và chọn bệnh mạn tính...
                     </span>
                  )}
               </div>

               {/* Chevron toggle button */}
               {!disabled && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium shrink-0">
                     <span>{isOpen ? "Thu gọn" : "Chọn bệnh"}</span>
                     <ChevronDown
                        className={cn(
                           "w-4 h-4 text-slate-400 transition-transform duration-200",
                           isOpen && "rotate-180",
                        )}
                     />
                  </div>
               )}
            </div>

            {/* Accordion Collapsible Body with smooth slide-down grid transition */}
            <div
               className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out border-slate-200",
                  isOpen && !disabled
                     ? "grid-rows-[1fr] opacity-100 border-t"
                     : "grid-rows-[0fr] opacity-0 border-t-0 pointer-events-none",
               )}
            >
               <div className="overflow-hidden">
                  <div className="p-5 bg-white flex flex-col gap-4">
                     <div className="flex justify-between">
                        <div className="relative flex-1">
                           <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                           <Input
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Tìm theo tên bệnh, mã, ICD-10..."
                              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-sm"
                           />
                        </div>

                        <div className="flex-1 flex items-center justify-between text-xs text-slate-500 px-0.5">
                           <span>
                              Tìm thấy: <strong>{totalItems}</strong> bệnh mạn
                              tính
                           </span>
                        </div>
                     </div>

                     {/* Disease Items Grid */}
                     <div className="max-h-78 overflow-y-auto pr-1">
                        {isLoading || isFetching ? (
                           <div className="py-8 flex justify-center">
                              <CloverLoading
                                 size="sm"
                                 text="Đang tải danh sách bệnh..."
                              />
                           </div>
                        ) : items.length === 0 ? (
                           <div className="py-8 text-center text-xs text-slate-400">
                              Không tìm thấy bệnh mạn tính phù hợp.
                           </div>
                        ) : (
                           <div className="grid grid-cols-1 gap-2">
                              {items.map((disease) => {
                                 const isSelected = currentValues.includes(
                                    disease.id,
                                 );
                                 return (
                                    <div
                                       key={disease.id}
                                       onClick={() => handleToggle(disease)}
                                       className={cn(
                                          "flex items-start gap-2.5 p-2 rounded-sm cursor-pointer transition-colors text-xs border",
                                          isSelected
                                             ? "bg-emerald-50/70 border-emerald-300"
                                             : "bg-slate-50/60 hover:bg-slate-100/70 border-slate-200",
                                       )}
                                    >
                                       <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                             handleToggle(disease)
                                          }
                                          className="mt-0.5 rounded-sm"
                                       />
                                       <div className="flex flex-col flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1">
                                             <span className="font-semibold text-slate-800 truncate">
                                                {disease.name}
                                             </span>
                                             <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-medium">
                                                {disease.icd10Code ||
                                                   disease.code}
                                             </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                                             <span>Mã: {disease.code}</span>
                                             {disease.category && (
                                                <span>
                                                   • {disease.category}
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        )}
                     </div>

                     {/* Pagination footer */}
                     <div className="flex gap-4 items-center justify-end pt-2 border-t border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                           <span>Hiển thị:</span>
                           <select
                              value={limit}
                              onChange={(e) => {
                                 setLimit(Number(e.target.value));
                                 setPage(1);
                              }}
                              className="border border-slate-200 rounded-sm px-1.5 py-0.5 text-xs bg-white cursor-pointer"
                           >
                              <option value={5}>5 dòng</option>
                              <option value={10}>10 dòng</option>
                              <option value={20}>20 dòng</option>
                           </select>
                        </div>
                        <span className="text-slate-500">
                           Trang {page} / {totalPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                           <CustomButton
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs rounded-sm"
                              disabled={page <= 1 || isFetching}
                              onClick={() => setPage((p) => Math.max(1, p - 1))}
                           >
                              Trước
                           </CustomButton>
                           <CustomButton
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs rounded-sm"
                              disabled={page >= totalPages || isFetching}
                              onClick={() => setPage((p) => p + 1)}
                           >
                              Sau
                           </CustomButton>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {error && <FieldError className="text-sm mt-1">{error}</FieldError>}
      </Field>
   );
}

export default ChronicDiseaseCombobox;
