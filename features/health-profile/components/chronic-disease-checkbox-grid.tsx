"use client";

import { useMemo } from "react";
import {
   useGetAllChronicDiseasesQuery,
   useGetChronicDiseasesByHealthProfileIdQuery,
} from "@/store/api/chronic-diseases/chronic-diseases-api";
import { ChronicDisease } from "@/store/api/chronic-diseases/type";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface ChronicDiseaseCheckboxGridProps {
   value?: string[];
   onChange?: (value: string[]) => void;
   disabled?: boolean;
   healthProfileId?: string;
   error?: string;
   className?: string;
}

interface DiseaseItemDefinition {
   key: string;
   label: string;
   keywords: string[];
   codes: string[];
}

export const CHRONIC_DISEASE_ITEMS: DiseaseItemDefinition[] = [
   {
      key: "diabetes",
      label: "Bệnh Đái tháo đường",
      keywords: ["daithaoduong", "tieuduong", "diabetes"],
      codes: ["dtd", "e10", "e11", "e14"],
   },
   {
      key: "stroke",
      label: "Tiền sử Đột quỵ não",
      keywords: ["dotquy", "taibien", "stroke"],
      codes: ["cva", "i63", "i64"],
   },
   {
      key: "hasMyocardialInfarction",
      label: "Tiền sử Nhồi máu cơ tim",
      keywords: ["nhoimaucotim", "myocardial"],
      codes: ["mi", "i21"],
   },
   {
      key: "hasAcuteCoronarySyndrome",
      label: "Hội chứng mạch vành cấp",
      keywords: ["vanhcap", "acutecoronary"],
      codes: ["acs"],
   },
   {
      key: "hasCoronaryArteryDisease",
      label: "Bệnh lý động mạch vành",
      keywords: ["dongmachvanh", "machvanh", "coronary"],
      codes: ["cad", "i25"],
   },
   {
      key: "hasTia",
      label: "Cơn thiếu máu não thoáng qua (TIA)",
      keywords: ["tia", "thoangqua"],
      codes: ["g45"],
   },
   {
      key: "hasAorticAneurysm",
      label: "Phình động mạch chủ",
      keywords: ["phinhdongmachchu", "aorticaneurysm", "dongmachchu"],
      codes: ["i71"],
   },
   {
      key: "hasPeripheralArteryDisease",
      label: "Bệnh động mạch ngoại vi",
      keywords: [
         "dongmachngoaivi",
         "machmaungoaivi",
         "machngoaivi",
         "peripheral",
      ],
      codes: ["pad", "i73"],
   },
   {
      key: "hasAtherosclerosis",
      label: "Vữa xơ mạch máu lớn",
      keywords: ["vuaxomachmau", "vuaxo", "xovua", "atherosclerosis"],
      codes: ["i70"],
   },
   {
      key: "hasFamilialHypercholesterolemia",
      label: "Tăng Cholesterol máu gia đình",
      keywords: [
         "tangcholesterol",
         "cholesterolgiadinh",
         "hypercholesterolemia",
      ],
      codes: ["fh", "e78"],
   },
];

function cleanString(str?: string): string {
   if (!str) return "";
   return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
}

function matchDiseaseToItemKey(disease: {
   id?: string;
   code?: string;
   icd10Code?: string;
   name?: string;
}): string | null {
   const codeKey = cleanString(disease.code);
   const icdKey = cleanString(disease.icd10Code);
   const nameKey = cleanString(disease.name);

   for (const item of CHRONIC_DISEASE_ITEMS) {
      if (
         (codeKey && item.codes.some((c) => codeKey.includes(c))) ||
         (icdKey && item.codes.some((c) => icdKey.includes(c)))
      ) {
         return item.key;
      }
      if (nameKey && item.keywords.some((kw) => nameKey.includes(kw))) {
         return item.key;
      }
      if (nameKey && nameKey === cleanString(item.label)) {
         return item.key;
      }
   }
   return null;
}

export function ChronicDiseaseCheckboxGrid({
   value = [],
   onChange,
   disabled = false,
   healthProfileId,
   error,
   className,
}: ChronicDiseaseCheckboxGridProps) {
   const { data: allDiseasesData } = useGetAllChronicDiseasesQuery({
      page: 1,
      limit: 100,
   });

   const { data: profileDiseases } =
      useGetChronicDiseasesByHealthProfileIdQuery(
         { healthProfileId: healthProfileId ?? "" },
         { skip: !healthProfileId },
      );

   const { keyToDiseaseMap, diseaseIdToKeyMap } = useMemo(() => {
      const keyMap: Record<string, ChronicDisease> = {};
      const idMap: Record<string, string> = {};

      const combined: ChronicDisease[] = [];
      if (Array.isArray(allDiseasesData?.items)) {
         combined.push(...allDiseasesData.items);
      }
      if (Array.isArray(profileDiseases)) {
         profileDiseases.forEach((pd) => {
            if (!combined.some((d) => d.id === pd.id)) {
               combined.push(pd);
            }
         });
      }

      combined.forEach((d) => {
         const matchedKey = matchDiseaseToItemKey(d);
         if (matchedKey) {
            if (!keyMap[matchedKey]) {
               keyMap[matchedKey] = d;
            }
            idMap[d.id] = matchedKey;
         }
      });

      return { keyToDiseaseMap: keyMap, diseaseIdToKeyMap: idMap };
   }, [allDiseasesData, profileDiseases]);

   const currentValues = useMemo(
      () => (Array.isArray(value) ? value : []),
      [value],
   );

   const isChecked = (key: string): boolean => {
      const disease = keyToDiseaseMap[key];
      if (disease?.id && currentValues.includes(disease.id)) return true;
      if (currentValues.includes(key)) return true;
      return currentValues.some((id) => diseaseIdToKeyMap[id] === key);
   };

   const handleToggle = (key: string) => {
      if (disabled) return;
      const disease = keyToDiseaseMap[key];
      const currentlyChecked = isChecked(key);

      if (currentlyChecked) {
         const nextValues = currentValues.filter((id) => {
            if (id === key) return false;
            if (disease?.id && id === disease.id) return false;
            if (diseaseIdToKeyMap[id] === key) return false;
            return true;
         });
         onChange?.(nextValues);
      } else {
         const idToAdd = disease?.id || key;
         if (!currentValues.includes(idToAdd)) {
            onChange?.([...currentValues, idToAdd]);
         }
      }
   };

   return (
      <div className={cn("w-full space-y-3", className)}>
         <h4 className="text-xs sm:text-sm text-slate-600">
            Bệnh lý mạn tính (10 Chỉ số)
         </h4>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHRONIC_DISEASE_ITEMS.map((item) => {
               const checked = isChecked(item.key);

               return (
                  <div
                     key={item.key}
                     role="button"
                     tabIndex={0}
                     onClick={() => !disabled && handleToggle(item.key)}
                     onKeyDown={(e) => {
                        if (!disabled && (e.key === "Enter" || e.key === " ")) {
                           e.preventDefault();
                           handleToggle(item.key);
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
                     <span className="text-sm font-medium text-slate-800 pr-2">
                        {item.label}
                     </span>
                     <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center shrink-0"
                     >
                        <Checkbox
                           checked={checked}
                           onCheckedChange={() =>
                              !disabled && handleToggle(item.key)
                           }
                           disabled={disabled}
                           className="size-5 rounded! border-slate-500 data-checked:bg-emerald-600 data-checked:text-white"
                        />
                     </div>
                  </div>
               );
            })}
         </div>

         {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>
   );
}

export default ChronicDiseaseCheckboxGrid;
