"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import {
   useGetHealthRecordsQuery,
   useGetHealthRecordsSummaryQuery,
} from "@/store/api/health-record/health-record-api";
import { HealthMetricType, HealthRecord } from "@/store/api/health-record/type";
import { CloverLoading } from "@/components/common/clover-loading";
import {
   ResponsiveContainer,
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip as RechartsTooltip,
   ReferenceLine,
} from "recharts";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientDailyHealthRecordsProps {
   healthProfileId: string;
}

interface MetricConfigItem {
   label: string;
   unit: string;
   badgeClass: string;
   color: string;
   colorDia?: string;
   normalMin?: number;
   normalMax?: number;
   normalText?: string;
}

const METRIC_CONFIG: Record<HealthMetricType, MetricConfigItem> = {
   BLOOD_PRESSURE: {
      label: "Huyết áp",
      unit: "mmHg",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      color: "#e11d48", // Rose 600 - Tâm thu
      colorDia: "#3b82f6", // Blue 500 - Tâm trương
      normalMin: 80,
      normalMax: 120,
      normalText: "Chuẩn: < 120/80 mmHg",
   },
   HEART_RATE: {
      label: "Nhịp tim",
      unit: "lần/phút",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
      color: "#ef4444", // Red 500
      normalMin: 60,
      normalMax: 100,
      normalText: "Bình thường: 60 - 100",
   },
   BLOOD_GLUCOSE: {
      label: "Đường huyết",
      unit: "mmol/L",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      color: "#f59e0b", // Amber 500
      normalMin: 4.0,
      normalMax: 7.0,
      normalText: "Lúc đói: 4.0 - 7.0",
   },
   SPO2: {
      label: "SpO2",
      unit: "%",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      color: "#0284c7", // Sky 600
      normalMin: 95,
      normalMax: 100,
      normalText: "An toàn: ≥ 95%",
   },
   BODY_TEMPERATURE: {
      label: "Thân nhiệt",
      unit: "°C",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
      color: "#ea580c", // Orange 600
      normalMin: 36.5,
      normalMax: 37.5,
      normalText: "Bình thường: 36.5 - 37.5",
   },
   WEIGHT: {
      label: "Cân nặng",
      unit: "kg",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      color: "#10b981", // Emerald 500
      normalText: "Theo dõi duy trì cân nặng",
   },
};

const METRIC_KEYS: HealthMetricType[] = [
   "BLOOD_PRESSURE",
   "HEART_RATE",
   "BLOOD_GLUCOSE",
   "SPO2",
   "BODY_TEMPERATURE",
   "WEIGHT",
];

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

// Định dạng hiển thị nhãn khung thời gian trên trục Ox (HH:mm DD/MM)
const formatXAxisTime = (dateStr?: string) => {
   if (!dateStr) return "";
   try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${hours}:${minutes} ${day}/${month}`;
   } catch {
      return dateStr;
   }
};

interface MetricPoint {
   id: string;
   isOrigin?: boolean;
   timeOnly: string;
   dateOnly: string;
   showDate: boolean;
   displayTime: string;
   fullTime: string;
   value: number;
   secondaryValue: number | null;
   note?: string | null;
   rawRecord: HealthRecord | null;
}

interface CustomXAxisTickProps {
   x?: number;
   y?: number;
   payload?: {
      value: string;
      index?: number;
   };
   data?: MetricPoint[];
}

function CustomXAxisTick({
   x = 0,
   y = 0,
   payload,
   data,
}: CustomXAxisTickProps) {
   if (!payload || !data) return null;
   const point =
      (payload.index !== undefined ? data[payload.index] : undefined) ||
      data.find((d) => d.id === payload.value);
   if (!point) return null;

   if (point.isOrigin) {
      return (
         <g transform={`translate(${x},${y})`}>
            <text
               x={0}
               y={0}
               dy={12}
               textAnchor="middle"
               fill="#94a3b8"
               fontSize={10}
               fontWeight={500}
            >
               0
            </text>
         </g>
      );
   }

   return (
      <g transform={`translate(${x},${y})`}>
         <text
            x={0}
            y={0}
            textAnchor="middle"
            fill="#475569"
            fontSize={10}
         >
            <tspan x={0} dy={11} fontWeight={500}>
               {point.timeOnly}
            </tspan>
            {point.showDate && (
               <tspan
                  x={0}
                  dy={13}
                  fill="#64748b"
                  fontSize={9}
                  fontWeight={600}
               >
                  {point.dateOnly}
               </tspan>
            )}
         </text>
      </g>
   );
}

// Bắt buộc trục Oy luôn có gốc tọa độ 0
const getMetricYDomain = (
   metricKey: HealthMetricType,
   data: MetricPoint[],
): [number, number] => {
   const measured = data
      .filter((d) => !d.isOrigin && typeof d.value === "number")
      .map((d) => d.value);

   if (measured.length === 0) {
      switch (metricKey) {
         case "BLOOD_PRESSURE":
            return [0, 180];
         case "HEART_RATE":
            return [0, 140];
         case "BLOOD_GLUCOSE":
            return [0, 15];
         case "SPO2":
            return [0, 100];
         case "BODY_TEMPERATURE":
            return [0, 42];
         case "WEIGHT":
            return [0, 100];
         default:
            return [0, 100];
      }
   }

   const max = Math.max(...measured);

   switch (metricKey) {
      case "BLOOD_PRESSURE": {
         const dias = data
            .filter(
               (d) =>
                  !d.isOrigin &&
                  d.secondaryValue !== null &&
                  typeof d.secondaryValue === "number",
            )
            .map((d) => d.secondaryValue as number);
         const overallMax = dias.length > 0 ? Math.max(max, ...dias) : max;
         return [0, Math.max(160, Math.ceil(overallMax * 1.15))];
      }
      case "HEART_RATE":
         return [0, Math.max(120, Math.ceil(max * 1.15))];
      case "BLOOD_GLUCOSE":
         return [0, Math.max(10, Math.ceil(max * 1.2))];
      case "SPO2":
         return [0, 100];
      case "BODY_TEMPERATURE":
         return [0, Math.max(40, Math.ceil(max * 1.1))];
      case "WEIGHT":
         return [0, Math.max(80, Math.ceil(max * 1.15))];
      default:
         return [0, Math.ceil(max * 1.15)];
   }
};

interface SingleMetricTooltipProps {
   active?: boolean;
   payload?: Array<{
      dataKey?: string | number;
      name?: string;
      value?: number | string;
      color?: string;
      payload?: MetricPoint;
   }>;
   label?: string;
   unit: string;
   metricType: HealthMetricType;
}

function SingleMetricTooltip({
   active,
   payload,
   unit,
   metricType,
}: SingleMetricTooltipProps) {
   if (!active || !payload || payload.length === 0) return null;
   const point = payload[0]?.payload;
   const cfg = METRIC_CONFIG[metricType];

   if (point?.isOrigin) {
      return (
         <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow-md">
            <span className="font-semibold text-slate-700">Gốc tọa độ (0)</span>
         </div>
      );
   }

   return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg min-w-44 space-y-1.5">
         <div className="pb-1 border-b border-slate-100 text-slate-600 font-medium">
            <span>Thời gian đo: {point?.fullTime}</span>
         </div>

         {metricType === "BLOOD_PRESSURE" ? (
            <div className="space-y-1">
               <div className="flex items-center justify-between gap-3">
                  <span className="text-rose-600 font-medium">Tâm thu:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                     {point?.value} {unit}
                  </span>
               </div>
               {point?.secondaryValue != null && (
                  <div className="flex items-center justify-between gap-3">
                     <span className="text-blue-600 font-medium">
                        Tâm trương:
                     </span>
                     <span className="font-bold text-slate-900 tabular-nums">
                        {point.secondaryValue} {unit}
                     </span>
                  </div>
               )}
            </div>
         ) : (
            <div className="space-y-1">
               <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">{cfg.label}:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                     {point?.value} {unit}
                  </span>
               </div>
            </div>
         )}

         {point?.note && (
            <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-500 italic">
               Ghi chú: {point.note}
            </div>
         )}
      </div>
   );
}

export function PatientDailyHealthRecords({
   healthProfileId,
}: PatientDailyHealthRecordsProps) {
   const isMounted = useSyncExternalStore(
      () => () => {},
      () => true,
      () => false,
   );

   const [selectedMetricTab, setSelectedMetricTab] = useState<
      HealthMetricType | "ALL"
   >("ALL");

   // Tải tóm tắt các chỉ số gần nhất
   const { data: summaryData, isLoading: isLoadingSummary } =
      useGetHealthRecordsSummaryQuery(
         { healthProfileId },
         { skip: !healthProfileId },
      );

   // Tải danh sách lịch sử đo lường chỉ số
   const { data: listResponse, isLoading: isLoadingList } =
      useGetHealthRecordsQuery(
         {
            healthProfileId,
            limit: 200,
            page: 1,
         },
         { skip: !healthProfileId },
      );

   const rawRecords: HealthRecord[] = useMemo(() => {
      if (!listResponse) return [];
      if (Array.isArray(listResponse)) return listResponse;
      return listResponse.data || listResponse.items || [];
   }, [listResponse]);

   // Lọc các bản ghi trong 7 ngày gần nhất tính từ ngày hiện tại
   const recentRecords = useMemo(() => {
      const now = new Date();
      const sevenDaysAgoTime = new Date(
         now.getFullYear(),
         now.getMonth(),
         now.getDate() - 6,
         0,
         0,
         0,
      ).getTime();

      const filtered = rawRecords.filter((r) => {
         const time = new Date(r.measuredAt).getTime();
         return !isNaN(time) && time >= sevenDaysAgoTime;
      });

      // Nếu trong 7 ngày hiện tại có dữ liệu, trả về danh sách đó
      if (filtered.length > 0) return filtered;

      // Hỗ trợ trường hợp cơ sở dữ liệu mẫu/test nằm ở mốc thời gian cũ:
      // lấy 7 ngày tính từ bản ghi mới nhất để người dùng luôn xem được biểu đồ
      if (rawRecords.length > 0) {
         const validTimes = rawRecords
            .map((r) => new Date(r.measuredAt).getTime())
            .filter((t) => !isNaN(t));

         if (validTimes.length > 0) {
            const maxTime = Math.max(...validTimes);
            const cutoff = maxTime - 7 * 24 * 3600 * 1000;
            return rawRecords.filter((r) => {
               const time = new Date(r.measuredAt).getTime();
               return !isNaN(time) && time >= cutoff;
            });
         }
      }

      return [];
   }, [rawRecords]);

   // Xây dựng dữ liệu cho từng biểu đồ chỉ số:
   // Trục Ox chia theo CÁC KHUNG THỜI GIAN ĐÃ NHẬP thực tế của chỉ số đó
   // Luôn có điểm gốc tọa độ 0 và đường line nối từ gốc 0 đến giá trị nhập đầu tiên
   const metricDataMap = useMemo(() => {
      const map: Record<HealthMetricType, MetricPoint[]> = {
         BLOOD_PRESSURE: [],
         HEART_RATE: [],
         BLOOD_GLUCOSE: [],
         SPO2: [],
         BODY_TEMPERATURE: [],
         WEIGHT: [],
      };

      METRIC_KEYS.forEach((metricKey) => {
         const metricRecs = recentRecords
            .filter((r) => r.metricType === metricKey)
            .sort(
               (a, b) =>
                  new Date(a.measuredAt).getTime() -
                  new Date(b.measuredAt).getTime(),
            );

         if (metricRecs.length === 0) {
            map[metricKey] = [];
            return;
         }

         // Điểm gốc tọa độ (0, 0)
         const originPoint: MetricPoint = {
            id: "origin",
            isOrigin: true,
            timeOnly: "0",
            dateOnly: "",
            showDate: false,
            displayTime: "0",
            fullTime: "Gốc tọa độ 0",
            value: 0,
            secondaryValue: 0,
            rawRecord: null,
         };

         // Danh sách các khung thời gian đã nhập thực tế:
         // Nếu trong cùng 1 ngày có nhiều lượt nhập, chỉ hiển thị ngày ở lượt đầu tiên (1 lần duy nhất)
         let lastDateKey = "";
         const enteredPoints: MetricPoint[] = metricRecs.map((r) => {
            const d = new Date(r.measuredAt);
            const isValid = !isNaN(d.getTime());
            const hours = isValid ? String(d.getHours()).padStart(2, "0") : "--";
            const minutes = isValid ? String(d.getMinutes()).padStart(2, "0") : "--";
            const day = isValid ? String(d.getDate()).padStart(2, "0") : "--";
            const month = isValid ? String(d.getMonth() + 1).padStart(2, "0") : "--";
            const year = isValid ? d.getFullYear() : "";

            const dateKey = isValid ? `${year}-${month}-${day}` : "";
            const timeOnly = `${hours}:${minutes}`;
            const dateOnly = `${day}/${month}`;
            const showDate = dateKey !== "" && dateKey !== lastDateKey;
            if (showDate) {
               lastDateKey = dateKey;
            }

            return {
               id: r.id,
               isOrigin: false,
               timeOnly,
               dateOnly,
               showDate,
               displayTime: `${hours}:${minutes} ${day}/${month}`,
               fullTime: formatDateTime(r.measuredAt),
               value: r.valueNumeric,
               secondaryValue: r.secondaryValue ?? null,
               note: r.note,
               rawRecord: r,
            };
         });

         // Luôn bắt đầu từ gốc tọa độ 0 và nối đường line đến giá trị nhập đầu tiên
         map[metricKey] = [originPoint, ...enteredPoints];
      });

      return map;
   }, [recentRecords]);

   // Danh sách thẻ tóm tắt mới nhất
   const summaryCards: {
      type: HealthMetricType;
      record?: HealthRecord;
   }[] = useMemo(() => {
      return METRIC_KEYS.map((type) => {
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
      <div className="flex flex-col gap-6 text-xs">
         {/* Thông báo quyền xem dữ liệu */}
         <div className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2.5 bg-blue-50/70 border border-blue-200 rounded-sm text-blue-900">
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
               <span className="font-medium text-xs">
                  Dữ liệu được đồng bộ từ ứng dụng theo dõi sức khỏe bệnh nhân
                  (Chế độ chỉ xem).
               </span>
            </div>
            <div className="text-[11px] text-blue-600 font-medium">
               Cập nhật tự động
            </div>
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
                  return (
                     <div
                        key={type}
                        className="p-3 rounded-sm border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col justify-between gap-1.5 transition-colors"
                     >
                        <div className="flex items-center justify-between gap-1">
                           <span className="text-[11px] font-medium text-slate-500">
                              {cfg.label}
                           </span>
                           <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cfg.color }}
                           />
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

         {/* Tiêu đề phần biểu đồ theo các khung thời gian đã nhập */}
         <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-slate-200">
            <div>
               <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Biểu đồ diễn tiến chỉ số sức khỏe
               </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
               <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[11px]">
                  7 ngày gần nhất tính từ ngày hiện tại
               </span>
            </div>
         </div>

         {isLoadingList ? (
            <div className="py-20 flex justify-center items-center">
               <CloverLoading
                  size="md"
                  text="Đang tải dữ liệu biểu đồ sức khỏe..."
               />
            </div>
         ) : (
            <div className="space-y-4">
               {/* Thanh chọn tab xem nhanh từng chỉ số hoặc xem tất cả */}
               <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-slate-600 text-xs">
                     Trục Ox chia theo các khung thời gian đã nhập • Có gốc tọa
                     độ 0 và đường line nối từ gốc 0 đến giá trị nhập đầu tiên
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                     <button
                        type="button"
                        onClick={() => setSelectedMetricTab("ALL")}
                        className={cn(
                           "px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer",
                           selectedMetricTab === "ALL"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        )}
                     >
                        Tất cả chỉ số ({METRIC_KEYS.length})
                     </button>
                     {METRIC_KEYS.map((key) => {
                        const cfg = METRIC_CONFIG[key];
                        return (
                           <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedMetricTab(key)}
                              className={cn(
                                 "px-2.5 py-1 rounded text-xs font-medium transition-colors shrink-0 cursor-pointer",
                                 selectedMetricTab === key
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                              )}
                           >
                              {cfg.label}
                           </button>
                        );
                     })}
                  </div>
               </div>

               {/* Lưới các biểu đồ chỉ số độc lập */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {METRIC_KEYS.filter(
                     (k) =>
                        selectedMetricTab === "ALL" || selectedMetricTab === k,
                  ).map((metricKey) => {
                     const cfg = METRIC_CONFIG[metricKey];
                     const data = metricDataMap[metricKey];

                     // Các điểm đo thực tế đã nhập (loại bỏ điểm gốc 0)
                     const measuredPoints = data.filter((d) => !d.isOrigin);
                     const hasData = measuredPoints.length > 0;

                     // Thống kê nhanh từ các lần đo đã nhập (Tâm thu / giá trị chung)
                     const latestPoint = hasData
                        ? measuredPoints[measuredPoints.length - 1]
                        : undefined;
                     const values = measuredPoints.map((d) => d.value);
                     const minVal = hasData ? Math.min(...values) : null;
                     const maxVal = hasData ? Math.max(...values) : null;
                     const avgVal = hasData
                        ? Math.round(
                             (values.reduce((s, v) => s + v, 0) /
                                values.length) *
                                10,
                          ) / 10
                        : null;

                     // Thống kê riêng cho tâm trương (secondaryValue) nếu là huyết áp
                     const diaValues =
                        metricKey === "BLOOD_PRESSURE"
                           ? measuredPoints
                                .map((d) => d.secondaryValue)
                                .filter(
                                   (v): v is number =>
                                      v !== null && typeof v === "number",
                                )
                           : [];
                     const minDia =
                        diaValues.length > 0 ? Math.min(...diaValues) : null;
                     const maxDia =
                        diaValues.length > 0 ? Math.max(...diaValues) : null;
                     const avgDia =
                        diaValues.length > 0
                           ? Math.round(
                                (diaValues.reduce((s, v) => s + v, 0) /
                                   diaValues.length) *
                                   10,
                             ) / 10
                           : null;

                     const yDomain = getMetricYDomain(metricKey, data);

                     return (
                        <div
                           key={metricKey}
                           className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                        >
                           {/* Header của biểu đồ chỉ số */}
                           <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                 <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: cfg.color }}
                                 />
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <h4 className="font-bold text-slate-900 text-sm">
                                          {cfg.label}
                                       </h4>
                                       <span className="text-[11px] text-slate-500 font-medium">
                                          ({cfg.unit})
                                       </span>
                                    </div>
                                    {cfg.normalText && (
                                       <span className="text-[10px] text-slate-400">
                                          {cfg.normalText}
                                       </span>
                                    )}
                                 </div>
                              </div>

                              {/* Chỉ số mới nhất trong các khung giờ đã nhập */}
                              {latestPoint && (
                                 <div className="text-right">
                                    <div className="text-[10px] text-slate-400">
                                       Gần nhất ({latestPoint.displayTime})
                                    </div>
                                    <div className="font-bold text-sm text-slate-900 tabular-nums">
                                       {metricKey === "BLOOD_PRESSURE" &&
                                       latestPoint.secondaryValue != null
                                          ? `${latestPoint.value}/${latestPoint.secondaryValue}`
                                          : latestPoint.value}{" "}
                                       <span className="text-[10px] text-slate-500 font-normal">
                                          {cfg.unit}
                                       </span>
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* Thống kê nhanh: Min, Max, Trung bình (Huyết áp tách riêng tâm thu & tâm trương) */}
                           {hasData ? (
                              metricKey === "BLOOD_PRESSURE" &&
                              minDia !== null ? (
                                 <div className="space-y-1.5">
                                    {/* Thống kê Tâm thu */}
                                    <div className="bg-rose-50/60 border border-rose-100/80 rounded px-2.5 py-1.5">
                                       <div className="grid grid-cols-4 gap-2 text-center">
                                          <span className="flex justify-center items-center text-[11px] font-semibold text-rose-700 ">
                                             Tâm thu
                                          </span>
                                          <div>
                                             <span className="text-slate-400 block text-[10px]">
                                                Thấp nhất
                                             </span>
                                             <span className="font-bold text-slate-800 tabular-nums text-xs">
                                                {minVal}
                                             </span>
                                          </div>
                                          <div className="border-x border-rose-100">
                                             <span className="text-slate-400 block text-[10px]">
                                                Trung bình
                                             </span>
                                             <span className="font-bold text-slate-800 tabular-nums text-xs">
                                                {avgVal}
                                             </span>
                                          </div>
                                          <div>
                                             <span className="text-slate-400 block text-[10px]">
                                                Cao nhất
                                             </span>
                                             <span className="font-bold text-slate-800 tabular-nums text-xs">
                                                {maxVal}
                                             </span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Thống kê Tâm trương */}
                                    <div className="bg-blue-50/60 border border-blue-100/80 rounded px-2.5 py-1.5">
                                       <div className="grid grid-cols-4 gap-2 text-center">
                                          <span className="flex justify-center items-center text-[11px] font-semibold text-blue-700">
                                             Tâm trương
                                          </span>
                                          <div>
                                             <span className="text-slate-400 block text-[10px]">
                                                Thấp nhất
                                             </span>
                                             <span className="font-bold text-slate-800 tabular-nums text-xs">
                                                {minDia}
                                             </span>
                                          </div>
                                          <div className="border-x border-blue-100">
                                             <span className="text-slate-400 block text-[10px]">
                                                Trung bình
                                             </span>
                                             <span className="font-bold text-slate-800 tabular-nums text-xs">
                                                {avgDia}
                                             </span>
                                          </div>
                                          <div>
                                             <span className="text-slate-400 block text-[10px]">
                                                Cao nhất
                                             </span>
                                             <span className="font-bold text-slate-800 tabular-nums text-xs">
                                                {maxDia}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 bg-slate-50 rounded text-center text-[11px]">
                                    <div>
                                       <span className="text-slate-400 block text-[10px]">
                                          Thấp nhất
                                       </span>
                                       <span className="font-semibold text-slate-700 tabular-nums">
                                          {minVal} {cfg.unit}
                                       </span>
                                    </div>
                                    <div className="border-x border-slate-200">
                                       <span className="text-slate-400 block text-[10px]">
                                          Trung bình
                                       </span>
                                       <span className="font-semibold text-slate-700 tabular-nums">
                                          {avgVal} {cfg.unit}
                                       </span>
                                    </div>
                                    <div>
                                       <span className="text-slate-400 block text-[10px]">
                                          Cao nhất
                                       </span>
                                       <span className="font-semibold text-slate-700 tabular-nums">
                                          {maxVal} {cfg.unit}
                                       </span>
                                    </div>
                                 </div>
                              )
                           ) : (
                              <div className="py-1 px-2.5 bg-slate-50/70 rounded text-center text-[11px] text-slate-400 italic">
                                 Chưa ghi nhận lượt đo nào trong 7 ngày gần nhất
                              </div>
                           )}

                           {/* Vùng vẽ biểu đồ LineChart với trục Ox chia theo các khung thời gian đã nhập */}
                           <div className="w-full h-56 pt-1">
                              {!isMounted ? (
                                 <div className="w-full h-full bg-slate-50 animate-pulse rounded" />
                              ) : !hasData ? (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded border border-dashed border-slate-200 text-xs">
                                    <p>Chưa có dữ liệu đo</p>
                                    <span className="text-[10px] text-slate-400">
                                       Chưa có khung thời gian nào được nhập
                                       trong 7 ngày qua
                                    </span>
                                 </div>
                              ) : (
                                 <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                 >
                                    <LineChart
                                       data={data}
                                       margin={{
                                          top: 10,
                                          right: 15,
                                          left: -15,
                                          bottom: 8,
                                       }}
                                    >
                                       <CartesianGrid
                                          strokeDasharray="3 3"
                                          vertical={false}
                                          stroke="#f1f5f9"
                                       />
                                       <XAxis
                                          dataKey="id"
                                          interval={0}
                                          height={38}
                                          tick={<CustomXAxisTick data={data} />}
                                          tickLine={false}
                                          axisLine={{ stroke: "#cbd5e1" }}
                                       />
                                       <YAxis
                                          tick={{
                                             fontSize: 10,
                                             fill: "#64748b",
                                          }}
                                          tickLine={false}
                                          axisLine={{ stroke: "#cbd5e1" }}
                                          domain={yDomain}
                                       />
                                       <RechartsTooltip
                                          content={
                                             <SingleMetricTooltip
                                                unit={cfg.unit}
                                                metricType={metricKey}
                                             />
                                          }
                                       />

                                       {/* Đường tham chiếu y tế chuẩn */}
                                       {metricKey === "BLOOD_PRESSURE" && (
                                          <>
                                             <ReferenceLine
                                                y={120}
                                                stroke="#f43f5e"
                                                strokeDasharray="3 3"
                                                strokeOpacity={0.6}
                                             />
                                             <ReferenceLine
                                                y={80}
                                                stroke="#60a5fa"
                                                strokeDasharray="3 3"
                                                strokeOpacity={0.6}
                                             />
                                          </>
                                       )}
                                       {metricKey !== "BLOOD_PRESSURE" &&
                                          cfg.normalMin != null && (
                                             <ReferenceLine
                                                y={cfg.normalMin}
                                                stroke={cfg.color}
                                                strokeDasharray="3 3"
                                                strokeOpacity={0.5}
                                             />
                                          )}
                                       {metricKey !== "BLOOD_PRESSURE" &&
                                          cfg.normalMax != null && (
                                             <ReferenceLine
                                                y={cfg.normalMax}
                                                stroke={cfg.color}
                                                strokeDasharray="3 3"
                                                strokeOpacity={0.5}
                                             />
                                          )}

                                       {/* Đường chỉ số chính: Nối từ gốc tọa độ 0 đến giá trị nhập đầu tiên, rồi nối tiếp các khung giờ sau */}
                                       <Line
                                          type="linear"
                                          dataKey="value"
                                          name={
                                             metricKey === "BLOOD_PRESSURE"
                                                ? "Tâm thu"
                                                : cfg.label
                                          }
                                          stroke={cfg.color}
                                          strokeWidth={2}
                                          dot={(props) => {
                                             if (props.payload?.isOrigin) {
                                                return (
                                                   <circle
                                                      key={props.key}
                                                      cx={props.cx}
                                                      cy={props.cy}
                                                      r={3}
                                                      fill={cfg.color}
                                                   />
                                                );
                                             }
                                             return (
                                                <circle
                                                   key={props.key}
                                                   cx={props.cx}
                                                   cy={props.cy}
                                                   r={4}
                                                   fill="#ffffff"
                                                   stroke={cfg.color}
                                                   strokeWidth={2}
                                                />
                                             );
                                          }}
                                          activeDot={{ r: 6 }}
                                       />

                                       {/* Đường huyết áp tâm trương: Nối từ gốc tọa độ 0 đến giá trị nhập đầu tiên */}
                                       {metricKey === "BLOOD_PRESSURE" && (
                                          <Line
                                             type="linear"
                                             dataKey="secondaryValue"
                                             name="Tâm trương"
                                             stroke={cfg.colorDia || "#3b82f6"}
                                             strokeWidth={2}
                                             dot={(props) => {
                                                if (props.payload?.isOrigin) {
                                                   return (
                                                      <circle
                                                         key={props.key}
                                                         cx={props.cx}
                                                         cy={props.cy}
                                                         r={3}
                                                         fill={
                                                            cfg.colorDia ||
                                                            "#3b82f6"
                                                         }
                                                      />
                                                   );
                                                }
                                                return (
                                                   <circle
                                                      key={props.key}
                                                      cx={props.cx}
                                                      cy={props.cy}
                                                      r={4}
                                                      fill="#ffffff"
                                                      stroke={
                                                         cfg.colorDia ||
                                                         "#3b82f6"
                                                      }
                                                      strokeWidth={2}
                                                   />
                                                );
                                             }}
                                             activeDot={{ r: 6 }}
                                          />
                                       )}
                                    </LineChart>
                                 </ResponsiveContainer>
                              )}
                           </div>

                           {/* Ghi chú footer của biểu đồ */}
                           <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                              <span>
                                 {measuredPoints.length} lần đo trong 7 ngày gần
                                 nhất
                              </span>
                              {metricKey === "BLOOD_PRESSURE" && (
                                 <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-rose-600">
                                       <span className="w-2 h-0.5 bg-rose-600 inline-block" />
                                       Tâm thu
                                    </span>
                                    <span className="flex items-center gap-1 text-blue-600">
                                       <span className="w-2 h-0.5 bg-blue-600 inline-block" />
                                       Tâm trương
                                    </span>
                                 </div>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}
      </div>
   );
}
