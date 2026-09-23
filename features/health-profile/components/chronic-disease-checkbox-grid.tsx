"use client";

import { useMemo } from "react";
import {
   useGetAllChronicDiseasesQuery,
   useGetChronicDiseasesByHealthProfileIdQuery,
} from "@/store/api/chronic-diseases/chronic-diseases-api";
import { ChronicDisease } from "@/store/api/chronic-diseases/type";
import { Checkbox } from "@/components/ui/checkbox";
import { CloverLoading } from "@/components/common/clover-loading";
import { cn } from "@/lib/utils";

export interface ChronicDiseaseCheckboxGridProps {
   value?: string[];
   onChange?: (value: string[]) => void;
   disabled?: boolean;
   healthProfileId?: string;
   error?: string;
   className?: string;
}

export function ChronicDiseaseCheckboxGrid({
   value = [],
   onChange,
   disabled = false,
   healthProfileId,
   error,
   className,
}: ChronicDiseaseCheckboxGridProps) {
   const { data: allDiseasesData, isLoading: isLoadingAll } =
      useGetAllChronicDiseasesQuery({
         page: 1,
         limit: 50,
      });

   const { data: profileDiseases, isLoading: isLoadingProfile } =
      useGetChronicDiseasesByHealthProfileIdQuery(
         { healthProfileId: healthProfileId ?? "" },
         { skip: !healthProfileId },
      );

   const diseaseList = useMemo(() => {
      const list: ChronicDisease[] = [];
      const seenIds = new Set<string>();

      if (Array.isArray(allDiseasesData?.items)) {
         allDiseasesData.items.forEach((d) => {
            if (d?.id && !seenIds.has(d.id)) {
               seenIds.add(d.id);
               list.push(d);
            }
         });
      }

      if (Array.isArray(profileDiseases)) {
         profileDiseases.forEach((pd) => {
            if (pd?.id && !seenIds.has(pd.id)) {
               seenIds.add(pd.id);
               list.push(pd);
            }
         });
      }

      return list;
   }, [allDiseasesData, profileDiseases]);

   const currentValues = useMemo(
      () => (Array.isArray(value) ? value : []),
      [value],
   );

   const handleToggle = (diseaseId: string) => {
      if (disabled) return;
      if (currentValues.includes(diseaseId)) {
         onChange?.(currentValues.filter((id) => id !== diseaseId));
      } else {
         onChange?.([...currentValues, diseaseId]);
      }
   };

   const isLoading =
      isLoadingAll || (Boolean(healthProfileId) && isLoadingProfile);

   return (
      <div className={cn("w-full space-y-3", className)}>
         <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm text-slate-600">
               Bệnh lý mạn tính
            </h4>
            {diseaseList.length > 0 && (
               <span className="text-xs text-slate-400">
                  {currentValues.length} đã chọn
               </span>
            )}
         </div>

         {isLoading ? (
            <div className="flex items-center justify-center py-6">
               <CloverLoading
                  size="sm"
                  text="Đang tải danh sách bệnh mạn tính..."
               />
            </div>
         ) : diseaseList.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-sm">
               Không có danh sách bệnh lý mạn tính từ hệ thống
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {diseaseList.map((disease) => {
                  const checked = currentValues.includes(disease.id);

                  return (
                     <div
                        key={disease.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => !disabled && handleToggle(disease.id)}
                        onKeyDown={(e) => {
                           if (
                              !disabled &&
                              (e.key === "Enter" || e.key === " ")
                           ) {
                              e.preventDefault();
                              handleToggle(disease.id);
                           }
                        }}
                        className={cn(
                           "flex items-center justify-between p-3 sm:px-4 rounded-sm border bg-slate-100 transition-all select-none text-left",
                           disabled
                              ? "cursor-not-allowed opacity-80"
                              : "cursor-pointer hover:border-slate-300 hover:bg-slate-50/40",
                           checked
                              ? "border-emerald-400 bg-emerald-50/20 shadow-xs"
                              : "border-slate-200",
                        )}
                     >
                        <span className="text-sm font-medium text-slate-800">
                           {disease.name}
                        </span>
                        <div
                           onClick={(e) => e.stopPropagation()}
                           className="flex items-center shrink-0"
                        >
                           <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                 !disabled && handleToggle(disease.id)
                              }
                              disabled={disabled}
                              className="size-5 rounded! border-slate-500 data-checked:bg-emerald-600 data-checked:text-white"
                           />
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>
   );
}

export default ChronicDiseaseCheckboxGrid;
