"use client";

import React, { useState } from "react";
import { FieldDiffItem } from "@/lib/diff-utils";
import { CustomButton } from "@/components/common/custom-button";
import {
   Activity,
   CheckCircle,
   ChevronDown,
   ChevronRight,
   FileText,
   GitCompare,
   Layers,
   RotateCcw,
   Split,
   Stethoscope,
   Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsultationDiffViewerProps {
   diffItems: FieldDiffItem[];
   onRevertField?: (fieldKey: string) => void;
   onRevertAll?: () => void;
}

export function ConsultationDiffViewer({
   diffItems,
   onRevertField,
   onRevertAll,
}: ConsultationDiffViewerProps) {
   const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
   const [collapsedFields, setCollapsedFields] = useState<
      Record<string, boolean>
   >({});

   const toggleCollapse = (key: string) => {
      setCollapsedFields((prev) => ({
         ...prev,
         [key]: !prev[key],
      }));
   };

   // Calculate stats
   let addedCount = 0;
   let removedCount = 0;

   diffItems.forEach((item) => {
      if (item.isWordDiff) {
         item.diffParts.forEach((part) => {
            if (part.type === "added")
               addedCount += part.value
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length;
            if (part.type === "removed")
               removedCount += part.value
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length;
         });
      } else {
         if (item.oldValue) removedCount += 1;
         if (item.newValue) addedCount += 1;
      }
   });

   const totalChanges = diffItems.length;

   if (totalChanges === 0) {
      return (
         <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs">
            <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">
               Chưa có thay đổi nào so với phiếu khám gốc
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-4">
               Hiện tại nội dung phiếu khám đang trùng khớp hoàn toàn với bản
               gốc do Bác sĩ gửi yêu cầu tạo. Bác sĩ chuyên gia có thể chỉnh sửa
               trực tiếp ở tab <strong>Chỉnh sửa phiếu khám</strong> để xem chi
               tiết các thay đổi dạng diff tại đây.
            </p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {/* Diff Summary Top Bar (GitHub Style) */}
         <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                  <GitCompare className="size-5" />
               </div>
               <div>
                  <div className="flex items-center gap-2 flex-wrap">
                     <span className="font-semibold text-sm">
                        So sánh thay đổi ({totalChanges} trường điều chỉnh)
                     </span>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                        +{addedCount} thêm mới
                     </span>
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-950 text-rose-300 border border-rose-700/60">
                        -{removedCount} xóa bỏ
                     </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                     Xem lại chi tiết từng mục chuyên gia đã chỉnh sửa trên
                     phiếu khám trước khi xác nhận lưu.
                  </p>
               </div>
            </div>

            {/* View Mode controls & Revert All */}
            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
               <div className="inline-flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                  <button
                     type="button"
                     onClick={() => setViewMode("unified")}
                     className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        viewMode === "unified"
                           ? "bg-blue-600 text-white shadow-xs"
                           : "text-slate-300 hover:text-white hover:bg-slate-700/60",
                     )}
                  >
                     <Layers className="size-3.5" />
                     Gộp dòng (Unified)
                  </button>
                  <button
                     type="button"
                     onClick={() => setViewMode("split")}
                     className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        viewMode === "split"
                           ? "bg-blue-600 text-white shadow-xs"
                           : "text-slate-300 hover:text-white hover:bg-slate-700/60",
                     )}
                  >
                     <Split className="size-3.5" />
                     Song song (Split)
                  </button>
               </div>

               {onRevertAll && (
                  <CustomButton
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={onRevertAll}
                     className="h-8 text-xs bg-slate-800 text-slate-200 border-slate-700 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-800"
                  >
                     <RotateCcw className="size-3.5 mr-1 text-rose-400" />
                     Khôi phục tất cả về gốc
                  </CustomButton>
               )}
            </div>
         </div>

         {/* Changes list (File changes representation) */}
         <div className="space-y-3">
            {diffItems.map((item) => {
               const isCollapsed = Boolean(collapsedFields[item.key]);

               let categoryIcon = (
                  <FileText className="size-3.5 text-slate-500" />
               );
               let categoryBadge = "bg-slate-100 text-slate-700";

               if (item.category === "vitals") {
                  categoryIcon = (
                     <Activity className="size-3.5 text-rose-500" />
                  );
                  categoryBadge = "bg-rose-50 text-rose-700 border-rose-200";
               } else if (item.category === "diagnosis") {
                  categoryIcon = (
                     <Stethoscope className="size-3.5 text-blue-500" />
                  );
                  categoryBadge = "bg-blue-50 text-blue-700 border-blue-200";
               } else if (item.category === "treatment") {
                  categoryIcon = (
                     <Target className="size-3.5 text-emerald-500" />
                  );
                  categoryBadge =
                     "bg-emerald-50 text-emerald-700 border-emerald-200";
               } else if (item.category === "conclusion") {
                  categoryIcon = (
                     <CheckCircle className="size-3.5 text-purple-500" />
                  );
                  categoryBadge =
                     "bg-purple-50 text-purple-700 border-purple-200";
               }

               return (
                  <div
                     key={item.key}
                     className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200"
                  >
                     {/* Item Header */}
                     <div className="bg-slate-50/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 select-none">
                        <div
                           className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                           onClick={() => toggleCollapse(item.key)}
                        >
                           {isCollapsed ? (
                              <ChevronRight className="size-4 text-slate-400" />
                           ) : (
                              <ChevronDown className="size-4 text-slate-400" />
                           )}
                           <div className="flex items-center gap-1.5 shrink-0">
                              {categoryIcon}
                              <span className="font-semibold text-xs text-slate-800">
                                 {item.label}
                              </span>
                           </div>
                           <span className="text-[11px] font-mono text-slate-400 truncate">
                              ({item.key})
                           </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                           <span
                              className={cn(
                                 "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                                 categoryBadge,
                              )}
                           >
                              Đã sửa đổi
                           </span>

                           {onRevertField && (
                              <button
                                 type="button"
                                 title="Hoàn tác trường này về bản gốc"
                                 onClick={() => onRevertField(item.key)}
                                 className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors text-xs flex items-center gap-1"
                              >
                                 <RotateCcw className="size-3" />
                                 <span className="text-[11px]">Hoàn tác</span>
                              </button>
                           )}
                        </div>
                     </div>

                     {/* Item Content */}
                     {!isCollapsed && (
                        <div className="p-4 text-xs font-mono">
                           {item.isWordDiff ? (
                              viewMode === "unified" ? (
                                 /* Unified Diff for Word Text */
                                 <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/80 leading-relaxed font-sans text-xs space-y-2">
                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mb-1.5">
                                       <span className="inline-block size-2 rounded-full bg-rose-500" />
                                       <span className="line-through text-rose-700">
                                          Đỏ: Đã xóa/thay thế
                                       </span>
                                       <span className="mx-2">•</span>
                                       <span className="inline-block size-2 rounded-full bg-emerald-500" />
                                       <span className="text-emerald-700 font-semibold">
                                          Xanh: Thêm mới
                                       </span>
                                    </div>
                                    <div className="p-3 bg-white rounded border border-slate-200/90 whitespace-pre-wrap leading-loose">
                                       {item.diffParts.map((part, pIdx) => {
                                          if (part.type === "removed") {
                                             return (
                                                <span
                                                   key={pIdx}
                                                   className="bg-rose-100/90 text-rose-800 line-through decoration-rose-500 px-1 py-0.5 rounded mx-0.5 border border-rose-200 font-normal"
                                                >
                                                   {part.value}
                                                </span>
                                             );
                                          }
                                          if (part.type === "added") {
                                             return (
                                                <span
                                                   key={pIdx}
                                                   className="bg-emerald-100 text-emerald-800 font-semibold px-1 py-0.5 rounded mx-0.5 border border-emerald-300"
                                                >
                                                   {part.value}
                                                </span>
                                             );
                                          }
                                          return (
                                             <span
                                                key={pIdx}
                                                className="text-slate-800"
                                             >
                                                {part.value}
                                             </span>
                                          );
                                       })}
                                    </div>
                                 </div>
                              ) : (
                                 /* Split Diff for Word Text */
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                                    {/* Left: Original (Old) */}
                                    <div className="border border-rose-200 rounded-lg bg-rose-50/30 overflow-hidden">
                                       <div className="bg-rose-100/60 border-b border-rose-200 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-rose-800 font-semibold">
                                          <span>
                                             - Bản ban đầu (Bác sĩ điều trị)
                                          </span>
                                       </div>
                                       <div className="p-3 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap bg-white/70">
                                          {item.diffParts
                                             .filter((p) => p.type !== "added")
                                             .map((part, pIdx) => (
                                                <span
                                                   key={pIdx}
                                                   className={cn(
                                                      part.type === "removed"
                                                         ? "bg-rose-100 text-rose-900 font-medium px-1 py-0.5 rounded mx-0.5 border border-rose-200 line-through"
                                                         : "text-slate-700",
                                                   )}
                                                >
                                                   {part.value}
                                                </span>
                                             ))}
                                          {!item.oldValue && (
                                             <span className="italic text-slate-400">
                                                (Để trống)
                                             </span>
                                          )}
                                       </div>
                                    </div>

                                    {/* Right: Edited (New) */}
                                    <div className="border border-emerald-200 rounded-lg bg-emerald-50/30 overflow-hidden">
                                       <div className="bg-emerald-100/60 border-b border-emerald-200 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-emerald-800 font-semibold">
                                          <span>
                                             + Bản điều chỉnh (Bác sĩ chuyên
                                             gia)
                                          </span>
                                       </div>
                                       <div className="p-3 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap bg-white/70">
                                          {item.diffParts
                                             .filter(
                                                (p) => p.type !== "removed",
                                             )
                                             .map((part, pIdx) => (
                                                <span
                                                   key={pIdx}
                                                   className={cn(
                                                      part.type === "added"
                                                         ? "bg-emerald-100 text-emerald-900 font-bold px-1 py-0.5 rounded mx-0.5 border border-emerald-300"
                                                         : "text-slate-700",
                                                   )}
                                                >
                                                   {part.value}
                                                </span>
                                             ))}
                                          {!item.newValue && (
                                             <span className="italic text-slate-400">
                                                (Xóa trống)
                                             </span>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              )
                           ) : (
                              /* Scalar (numbers, vital signs, single values) */
                              <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/80 font-sans">
                                 <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[11px] text-slate-500 font-medium">
                                          Bản gốc:
                                       </span>
                                       <span className="bg-rose-100 text-rose-800 font-mono text-xs px-2 py-1 rounded border border-rose-200 line-through">
                                          - {item.oldValue || "Chưa có"}
                                       </span>
                                    </div>
                                    <span className="text-slate-400 font-bold">
                                       ➔
                                    </span>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[11px] text-slate-500 font-medium">
                                          Chuyên gia sửa:
                                       </span>
                                       <span className="bg-emerald-100 text-emerald-800 font-mono text-xs px-2 py-1 rounded border border-emerald-300 font-bold">
                                          + {item.newValue || "Trống"}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>
   );
}
