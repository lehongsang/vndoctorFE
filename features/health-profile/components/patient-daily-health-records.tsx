"use client";

import { useState, useMemo } from "react";
import {
   useGetHealthRecordsQuery,
   useGetHealthRecordsSummaryQuery,
} from "@/store/api/health-record/health-record-api";
import {
   HealthMetricType,
   HealthRecord,
   BloodPressureEvaluation,
} from "@/store/api/health-record/type";
import { CloverLoading } from "@/components/common/clover-loading";
import { CustomPagination } from "@/components/common/custom-pagination";
import {
   Activity,
   Heart,
   Droplet,
   Wind,
   Thermometer,
   Scale,
   Clock,
   ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientDailyHealthRecordsProps {
   healthProfileId: string;
}

const METRIC_TABS: { key: HealthMetricType | "ALL"; label: string }[] = [
   { key: "ALL", label: "Tất cả chỉ số" },
   { key: "BLOOD_PRESSURE", label: "Huyết áp" },
   { key: "HEART_RATE", label: "Nhịp tim" },
   { key: "BLOOD_GLUCOSE", label: "Đường huyết" },
   { key: "SPO2", label: "SpO2" },
   { key: "BODY_TEMPERATURE", label: "Thân nhiệt" },
   { key: "WEIGHT", label: "Cân nặng" },
];

const METRIC_CONFIG: Record<
   HealthMetricType,
   {
      label: string;
      unit: string;
      badgeClass: string;
      icon: typeof Activity;
   }
> = {
   BLOOD_PRESSURE: {
      label: "Huyết áp",
      unit: "mmHg",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      icon: Activity,
   },
   HEART_RATE: {
      label: "Nhịp tim",
      unit: "lần/phút",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
      icon: Heart,
   },
   BLOOD_GLUCOSE: {
      label: "Đường huyết",
      unit: "mmol/L",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Droplet,
   },
   SPO2: {
      label: "SpO2",
      unit: "%",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      icon: Wind,
   },
   BODY_TEMPERATURE: {
      label: "Thân nhiệt",
      unit: "°C",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
      icon: Thermometer,
   },
   WEIGHT: {
      label: "Cân nặng",
      unit: "kg",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Scale,
   },
};

const formatDateTime = (dateStr?: string) => {
   if (!dateStr) return "—";
   try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${hours}:${minutes} • ${day}/${month}/${year}`;
   } catch {
      return dateStr;
   }
};

const renderEvaluationBadge = (record: HealthRecord) => {
   if (!record.evaluation) return null;

   if (typeof record.evaluation === "string") {
      return (
         <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {record.evaluation}
         </span>
      );
   }

   const evalObj = record.evaluation as BloodPressureEvaluation;
   const stage = evalObj.stage || evalObj.systolicStage || evalObj.riskLevel;
   if (stage) {
      return (
         <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {stage}
         </span>
      );
   }

   return null;
};

export function PatientDailyHealthRecords({
   healthProfileId,
}: PatientDailyHealthRecordsProps) {
   const [selectedMetric, setSelectedMetric] = useState<
      HealthMetricType | "ALL"
   >("ALL");
   const [page, setPage] = useState<number>(1);
   const [limit, setLimit] = useState<number>(10);

   // Tải tóm tắt các chỉ số gần nhất
   const { data: summaryData, isLoading: isLoadingSummary } =
      useGetHealthRecordsSummaryQuery(
         { healthProfileId },
         { skip: !healthProfileId },
      );

   // Tải danh sách lịch sử đo lường chỉ số có phân trang & lọc theo loại chỉ số
   const { data: listResponse, isLoading: isLoadingList, isFetching } =
      useGetHealthRecordsQuery(
         {
            healthProfileId,
            metricType: selectedMetric === "ALL" ? undefined : selectedMetric,
            page,
            limit,
         },
         { skip: !healthProfileId },
      );

   const records: HealthRecord[] = useMemo(() => {
      if (!listResponse) return [];
      if (Array.isArray(listResponse)) return listResponse;
      return listResponse.data || listResponse.items || [];
   }, [listResponse]);

   const total = useMemo(() => {
      if (!listResponse) return 0;
      if (Array.isArray(listResponse)) return listResponse.length;
      return listResponse.total || listResponse.totalItems || records.length;
   }, [listResponse, records]);

   const totalPages = Math.ceil(total / limit) || 1;

   // Danh sách thẻ tóm tắt
   const summaryCards: {
      type: HealthMetricType;
      record?: HealthRecord;
   }[] = useMemo(() => {
      const metricKeys: HealthMetricType[] = [
         "BLOOD_PRESSURE",
         "HEART_RATE",
         "BLOOD_GLUCOSE",
         "SPO2",
         "BODY_TEMPERATURE",
         "WEIGHT",
      ];

      return metricKeys.map((type) => {
         let rec: HealthRecord | undefined = undefined;
         if (summaryData) {
            const direct = (summaryData as Record<string, unknown>)[type];
            if (
               direct &&
               typeof direct === "object" &&
               "valueNumeric" in direct
            ) {
               rec = direct as HealthRecord;
            }
         }
         return { type, record: rec };
      });
   }, [summaryData]);

   if (!healthProfileId) {
      return (
         <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-sm">
            Chưa có thông tin hồ sơ sức khỏe để tải chỉ số hàng ngày.
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-5 text-xs">
         {/* Thông báo quyền xem dữ liệu (Chỉ xem - không sửa, xóa, tạo) */}
         <div className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2.5 bg-blue-50/60 border border-blue-200 rounded-sm text-blue-900">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
               <span className="font-medium text-xs">
                  Dữ liệu đồng bộ từ ứng dụng theo dõi sức khỏe hàng ngày của
                  bệnh nhân (Chế độ chỉ xem).
               </span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium">
               Cập nhật tự động
            </span>
         </div>

         {/* 1. Tóm tắt các chỉ số gần nhất */}
         <div className="space-y-2">
            <div className="flex items-center justify-between">
               <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Chỉ số đo lường mới nhất
               </span>
               {isLoadingSummary && (
                  <span className="text-[11px] text-slate-400">
                     Đang đồng bộ...
                  </span>
               )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
               {summaryCards.map(({ type, record }) => {
                  const cfg = METRIC_CONFIG[type];
                  const Icon = cfg.icon;
                  return (
                     <div
                        key={type}
                        className="p-3 rounded-sm border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col justify-between gap-1.5 transition-colors"
                     >
                        <div className="flex items-center justify-between gap-1">
                           <span className="text-[11px] font-medium text-slate-500">
                              {cfg.label}
                           </span>
                           <Icon className="w-3.5 h-3.5 text-slate-400" />
                        </div>

                        {record ? (
                           <div>
                              <div className="flex items-baseline gap-1">
                                 <span className="text-base font-bold text-slate-900">
                                    {type === "BLOOD_PRESSURE" &&
                                    record.secondaryValue != null
                                       ? `${record.valueNumeric}/${record.secondaryValue}`
                                       : record.valueNumeric}
                                 </span>
                                 <span className="text-[11px] text-slate-500 font-medium">
                                    {record.unit || cfg.unit}
                                 </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                 {formatDateTime(record.measuredAt)}
                              </div>
                           </div>
                        ) : (
                           <div className="text-slate-400 text-xs py-1">
                              Chưa có đo
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>

         {/* 2. Bộ lọc & Danh sách lịch sử đo lường */}
         <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
               <div className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Lịch sử đo lường ({total} bản ghi)
               </div>

               {/* Tabs chọn loại chỉ số */}
               <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                  {METRIC_TABS.map((tab) => (
                     <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                           setSelectedMetric(tab.key);
                           setPage(1);
                        }}
                        className={cn(
                           "px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer",
                           selectedMetric === tab.key
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        )}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>
            </div>

            {/* Bảng dữ liệu hoặc trạng thái loading/empty */}
            {isLoadingList || isFetching ? (
               <div className="p-10 flex flex-col items-center justify-center gap-2">
                  <CloverLoading size="sm" />
                  <span className="text-xs text-slate-500">
                     Đang tải dữ liệu chỉ số sức khỏe...
                  </span>
               </div>
            ) : records.length === 0 ? (
               <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-sm">
                  Chưa có dữ liệu đo lường chỉ số nào được ghi nhận cho mục đã
                  chọn.
               </div>
            ) : (
               <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-xs border-collapse">
                        <thead>
                           <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="py-2.5 px-3 whitespace-nowrap">
                                 Thời gian đo
                              </th>
                              <th className="py-2.5 px-3 whitespace-nowrap">
                                 Chỉ số
                              </th>
                              <th className="py-2.5 px-3 whitespace-nowrap">
                                 Giá trị đo
                              </th>
                              <th className="py-2.5 px-3 whitespace-nowrap">
                                 Đánh giá / Phân độ
                              </th>
                              <th className="py-2.5 px-3 whitespace-nowrap">
                                 Ngữ cảnh / Ghi chú
                              </th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {records.map((rec) => {
                              const cfg =
                                 METRIC_CONFIG[rec.metricType] || {
                                    label: rec.metricType,
                                    unit: rec.unit,
                                    badgeClass:
                                       "bg-slate-100 text-slate-700 border-slate-200",
                                    icon: Activity,
                                 };
                              const Icon = cfg.icon;

                              return (
                                 <tr
                                    key={rec.id}
                                    className="hover:bg-slate-50/70 transition-colors"
                                 >
                                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                                       <div className="flex items-center gap-1.5">
                                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span>
                                             {formatDateTime(rec.measuredAt)}
                                          </span>
                                       </div>
                                    </td>

                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                       <span
                                          className={cn(
                                             "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border",
                                             cfg.badgeClass,
                                          )}
                                       >
                                          <Icon className="w-3 h-3 shrink-0" />
                                          {cfg.label}
                                       </span>
                                    </td>

                                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900 text-sm">
                                       {rec.metricType === "BLOOD_PRESSURE" &&
                                       rec.secondaryValue != null
                                          ? `${rec.valueNumeric}/${rec.secondaryValue} ${rec.unit || "mmHg"}`
                                          : `${rec.valueNumeric} ${rec.unit || cfg.unit}`}
                                    </td>

                                    <td className="py-2.5 px-3">
                                       {renderEvaluationBadge(rec) || (
                                          <span className="text-slate-400 text-[11px]">
                                             —
                                          </span>
                                       )}
                                    </td>

                                    <td className="py-2.5 px-3 text-slate-700 text-xs">
                                       {rec.note ? (
                                          <span className="italic text-slate-600">
                                             {rec.note}
                                          </span>
                                       ) : (
                                          <span className="text-slate-400 text-[11px]">
                                             —
                                          </span>
                                       )}
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>

                  {/* Phân trang */}
                  {total > limit && (
                     <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                        <CustomPagination
                           currentPage={page}
                           totalPages={totalPages}
                           totalItems={total}
                           pageSize={limit}
                           showPageSizeSelector
                           pageSizeOptions={[5, 10, 20, 50]}
                           onPageChange={(p) => setPage(p)}
                           onPageSizeChange={(newLimit) => {
                              setLimit(newLimit);
                              setPage(1);
                           }}
                        />
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>
   );
}
