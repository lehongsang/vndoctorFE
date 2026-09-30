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
   AreaChart,
   Area,
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

const WEEKDAYS = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

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

const getRecordDateKey = (dateStr?: string) => {
   if (!dateStr) return "";
   try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
   } catch {
      return "";
   }
};

interface DaySlot {
   dateKey: string;
   displayDate: string;
   fullDate: string;
   weekday: string;
   isToday: boolean;
}

interface OverviewDayPoint {
   dateKey: string;
   displayDate: string;
   fullDate: string;
   weekday: string;
   isToday: boolean;
   BLOOD_PRESSURE?: number;
   BLOOD_PRESSURE_DIA?: number;
   HEART_RATE?: number;
   BLOOD_GLUCOSE?: number;
   SPO2?: number;
   BODY_TEMPERATURE?: number;
   WEIGHT?: number;
   notes: string[];
   hasData: boolean;
}

interface MetricDayPoint {
   dateKey: string;
   displayDate: string;
   fullDate: string;
   weekday: string;
   isToday: boolean;
   value?: number;
   secondaryValue?: number | null;
   measuredTime?: string;
   note?: string | null;
   hasData: boolean;
   allDayMeasurements: HealthRecord[];
}

interface OverviewTooltipProps {
   active?: boolean;
   payload?: Array<{
      dataKey?: string | number;
      name?: string;
      value?: number | string;
      color?: string;
      payload?: OverviewDayPoint;
   }>;
   label?: string;
}

function OverviewTooltip({ active, payload, label }: OverviewTooltipProps) {
   if (!active || !payload || payload.length === 0) return null;
   const point = payload[0]?.payload;
   const fullDate = point?.fullDate || label;
   const weekday = point?.weekday ? `(${point.weekday})` : "";

   return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg min-w-48 space-y-2">
         <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-slate-600 font-medium">
            <span>
               {weekday} {fullDate}
            </span>
            {point?.isToday && (
               <span className="px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded text-[10px] font-semibold border border-blue-200">
                  Hôm nay
               </span>
            )}
         </div>

         {!point?.hasData ? (
            <div className="text-slate-400 italic text-[11px] py-0.5">
               Chưa có chỉ số đo trong ngày này
            </div>
         ) : (
            <div className="space-y-1.5">
               {METRIC_KEYS.map((key) => {
                  const cfg = METRIC_CONFIG[key];
                  const val = point ? point[key] : undefined;
                  if (val === undefined || val === null) return null;

                  const isBP = key === "BLOOD_PRESSURE";
                  const diaVal = point?.BLOOD_PRESSURE_DIA;

                  return (
                     <div
                        key={key}
                        className="flex items-center justify-between gap-3 text-xs"
                     >
                        <div className="flex items-center gap-1.5">
                           <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cfg.color }}
                           />
                           <span className="text-slate-600">{cfg.label}:</span>
                        </div>
                        <span className="font-bold text-slate-900 tabular-nums">
                           {isBP && diaVal != null
                              ? `${val}/${diaVal} ${cfg.unit}`
                              : `${val} ${cfg.unit}`}
                        </span>
                     </div>
                  );
               })}
            </div>
         )}

         {point?.notes && point.notes.length > 0 && (
            <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 italic space-y-0.5">
               {point.notes.map((n, i) => (
                  <div key={i}>• {n}</div>
               ))}
            </div>
         )}
      </div>
   );
}

interface SingleMetricTooltipProps {
   active?: boolean;
   payload?: Array<{
      dataKey?: string | number;
      name?: string;
      value?: number | string;
      color?: string;
      payload?: MetricDayPoint;
   }>;
   label?: string;
   unit: string;
   metricType: HealthMetricType;
}

function SingleMetricTooltip({
   active,
   payload,
   label,
   unit,
   metricType,
}: SingleMetricTooltipProps) {
   if (!active || !payload || payload.length === 0) return null;
   const point = payload[0]?.payload;
   const fullDate = point?.fullDate || label;
   const weekday = point?.weekday ? `(${point.weekday})` : "";
   const cfg = METRIC_CONFIG[metricType];

   return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg min-w-44 space-y-1.5">
         <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-slate-600 font-medium">
            <span>
               {weekday} {fullDate}
            </span>
            {point?.isToday && (
               <span className="px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded text-[10px] font-semibold border border-blue-200">
                  Hôm nay
               </span>
            )}
         </div>

         {!point?.hasData ? (
            <div className="text-slate-400 italic text-[11px] py-0.5">
               Chưa có lượt đo trong ngày này
            </div>
         ) : metricType === "BLOOD_PRESSURE" ? (
            <div className="space-y-1">
               <div className="flex items-center justify-between gap-3">
                  <span className="text-rose-600 font-medium">Tâm thu:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                     {point?.value} {unit}
                  </span>
               </div>
               {point?.secondaryValue != null && (
                  <div className="flex items-center justify-between gap-3">
                     <span className="text-blue-600 font-medium">Tâm trương:</span>
                     <span className="font-bold text-slate-900 tabular-nums">
                        {point.secondaryValue} {unit}
                     </span>
                  </div>
               )}
               {point?.measuredTime && (
                  <div className="text-[10px] text-slate-400 pt-0.5">
                     Thời điểm đo: {point.measuredTime}
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
               {point?.measuredTime && (
                  <div className="text-[10px] text-slate-400">
                     Thời điểm đo: {point.measuredTime}
                  </div>
               )}
            </div>
         )}

         {/* Nếu trong ngày có nhiều hơn 1 lần đo */}
         {point?.allDayMeasurements && point.allDayMeasurements.length > 1 && (
            <div className="pt-1 border-t border-slate-100 text-[10px] text-slate-500">
               <span className="font-medium text-slate-600">
                  Tổng {point.allDayMeasurements.length} lần đo trong ngày
               </span>
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

   // Trạng thái bật/tắt hiển thị từng đường trong biểu đồ tổng quan
   const [visibleOverviewLines, setVisibleOverviewLines] = useState<
      Record<HealthMetricType, boolean>
   >({
      BLOOD_PRESSURE: true,
      HEART_RATE: true,
      BLOOD_GLUCOSE: true,
      SPO2: true,
      BODY_TEMPERATURE: true,
      WEIGHT: true,
   });

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

   // Xác định ngày mốc kết thúc cho 7 ngày gần nhất (hôm nay, hoặc ngày đo mới nhất nếu dùng dữ liệu test trong quá khứ)
   const endDate = useMemo(() => {
      const now = new Date();
      const todayMidnight = new Date(
         now.getFullYear(),
         now.getMonth(),
         now.getDate(),
      );

      if (rawRecords.length === 0) return todayMidnight;

      const validTimes = rawRecords
         .map((r) => new Date(r.measuredAt).getTime())
         .filter((t) => !isNaN(t));

      if (validTimes.length === 0) return todayMidnight;

      const maxRecordTime = Math.max(...validTimes);
      const maxRecordDate = new Date(maxRecordTime);
      const maxRecordMidnight = new Date(
         maxRecordDate.getFullYear(),
         maxRecordDate.getMonth(),
         maxRecordDate.getDate(),
      );

      // Nếu dữ liệu bản ghi cách hôm nay quá xa (> 30 ngày), neo vào ngày bản ghi mới nhất để các biểu đồ không bị trống
      const diffDays = Math.abs(
         (todayMidnight.getTime() - maxRecordMidnight.getTime()) /
            (1000 * 3600 * 24),
      );
      if (diffDays > 30) {
         return maxRecordMidnight;
      }

      return todayMidnight;
   }, [rawRecords]);

   // Khởi tạo cố định 7 ngày gần nhất hiển thị trên trục Ox
   const last7Days: DaySlot[] = useMemo(() => {
      const days: DaySlot[] = [];
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      for (let i = 6; i >= 0; i--) {
         const d = new Date(endDate);
         d.setDate(d.getDate() - i);
         const year = d.getFullYear();
         const month = String(d.getMonth() + 1).padStart(2, "0");
         const day = String(d.getDate()).padStart(2, "0");
         const dateKey = `${year}-${month}-${day}`;
         const displayDate = `${day}/${month}`;
         const fullDate = `${day}/${month}/${year}`;
         const weekday = WEEKDAYS[d.getDay()];
         const isToday = dateKey === todayStr;

         days.push({ dateKey, displayDate, fullDate, weekday, isToday });
      }
      return days;
   }, [endDate]);

   // Dữ liệu cho Biểu đồ tổng quan (chuẩn hóa theo 7 ngày gần nhất trên trục Ox)
   const overviewChartData: OverviewDayPoint[] = useMemo(() => {
      return last7Days.map((slot) => {
         const dayRecords = rawRecords.filter(
            (r) => getRecordDateKey(r.measuredAt) === slot.dateKey,
         );

         const point: OverviewDayPoint = {
            dateKey: slot.dateKey,
            displayDate: slot.displayDate,
            fullDate: slot.fullDate,
            weekday: slot.weekday,
            isToday: slot.isToday,
            notes: [],
            hasData: dayRecords.length > 0,
         };

         METRIC_KEYS.forEach((metricKey) => {
            const metricRecs = dayRecords.filter(
               (r) => r.metricType === metricKey,
            );
            if (metricRecs.length > 0) {
               // Sắp xếp lấy bản ghi đo mới nhất trong ngày
               const sortedRecs = [...metricRecs].sort(
                  (a, b) =>
                     new Date(a.measuredAt).getTime() -
                     new Date(b.measuredAt).getTime(),
               );
               const latestRec = sortedRecs[sortedRecs.length - 1];

               point[metricKey] = latestRec.valueNumeric;
               if (
                  metricKey === "BLOOD_PRESSURE" &&
                  latestRec.secondaryValue != null
               ) {
                  point.BLOOD_PRESSURE_DIA = latestRec.secondaryValue;
               }
               if (latestRec.note && !point.notes.includes(latestRec.note)) {
                  point.notes.push(
                     `${METRIC_CONFIG[metricKey].label}: ${latestRec.note}`,
                  );
               }
            }
         });

         return point;
      });
   }, [last7Days, rawRecords]);

   // Dữ liệu cho từng biểu đồ chỉ số (chuẩn hóa theo 7 ngày gần nhất trên trục Ox)
   const metricDataMap = useMemo(() => {
      const map: Record<HealthMetricType, MetricDayPoint[]> = {
         BLOOD_PRESSURE: [],
         HEART_RATE: [],
         BLOOD_GLUCOSE: [],
         SPO2: [],
         BODY_TEMPERATURE: [],
         WEIGHT: [],
      };

      METRIC_KEYS.forEach((metricKey) => {
         map[metricKey] = last7Days.map((slot) => {
            const dayRecs = rawRecords.filter(
               (r) =>
                  r.metricType === metricKey &&
                  getRecordDateKey(r.measuredAt) === slot.dateKey,
            );

            if (dayRecs.length === 0) {
               return {
                  dateKey: slot.dateKey,
                  displayDate: slot.displayDate,
                  fullDate: slot.fullDate,
                  weekday: slot.weekday,
                  isToday: slot.isToday,
                  hasData: false,
                  value: undefined,
                  secondaryValue: undefined,
                  allDayMeasurements: [],
               };
            }

            const sortedDayRecs = [...dayRecs].sort(
               (a, b) =>
                  new Date(a.measuredAt).getTime() -
                  new Date(b.measuredAt).getTime(),
            );
            const latestRec = sortedDayRecs[sortedDayRecs.length - 1];

            return {
               dateKey: slot.dateKey,
               displayDate: slot.displayDate,
               fullDate: slot.fullDate,
               weekday: slot.weekday,
               isToday: slot.isToday,
               hasData: true,
               value: latestRec.valueNumeric,
               secondaryValue: latestRec.secondaryValue,
               measuredTime: latestRec.measuredAt
                  ? new Date(latestRec.measuredAt).toLocaleTimeString("vi-VN", {
                       hour: "2-digit",
                       minute: "2-digit",
                    })
                  : undefined,
               note: latestRec.note,
               allDayMeasurements: sortedDayRecs,
            };
         });
      });

      return map;
   }, [last7Days, rawRecords]);

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

   const toggleOverviewLine = (key: HealthMetricType) => {
      setVisibleOverviewLines((prev) => ({
         ...prev,
         [key]: !prev[key],
      }));
   };

   const toggleAllOverviewLines = () => {
      const allActive = METRIC_KEYS.every((k) => visibleOverviewLines[k]);
      const nextState = !allActive;
      const updated = {} as Record<HealthMetricType, boolean>;
      METRIC_KEYS.forEach((k) => {
         updated[k] = nextState;
      });
      setVisibleOverviewLines(updated);
   };

   if (!healthProfileId) {
      return (
         <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-sm">
            Chưa có thông tin hồ sơ sức khỏe để tải chỉ số hàng ngày.
         </div>
      );
   }

   const dateRangeLabel =
      last7Days.length >= 7
         ? `Từ ${last7Days[0].displayDate} đến ${last7Days[6].displayDate}/${endDate.getFullYear()}`
         : "";

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

         {/* Tiêu đề phần biểu đồ 7 ngày gần nhất */}
         <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-slate-200">
            <div>
               <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Diễn tiến sức khỏe 7 ngày gần nhất
               </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
               <span className="font-medium text-slate-700">
                  {dateRangeLabel}
               </span>
               <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[11px]">
                  7 ngày gần nhất
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
            <div className="space-y-7">
               {/* 2. BIỂU ĐỒ TỔNG QUAN CÁC CHỈ SỐ (MỖI CHỈ SỐ 1 LINE - TRỤC OX 7 NGÀY GẦN NHẤT) */}
               <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                     <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                           Biểu đồ tổng quan các chỉ số (7 ngày gần nhất)
                        </h3>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                           Trục hoành (Ox) hiển thị liên tục 7 ngày gần nhất • Mỗi
                           chỉ số là 1 đường line
                        </p>
                     </div>

                     {/* Bật / Tắt tất cả các line */}
                     <button
                        type="button"
                        onClick={toggleAllOverviewLines}
                        className="text-[11px] text-slate-600 hover:text-primary font-medium transition-colors cursor-pointer"
                     >
                        {METRIC_KEYS.every((k) => visibleOverviewLines[k])
                           ? "Bỏ chọn tất cả"
                           : "Hiện tất cả đường"}
                     </button>
                  </div>

                  {/* Nút bật/tắt từng đường chỉ số */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                     {METRIC_KEYS.map((key) => {
                        const cfg = METRIC_CONFIG[key];
                        const isVisible = visibleOverviewLines[key];
                        return (
                           <button
                              key={key}
                              type="button"
                              onClick={() => toggleOverviewLine(key)}
                              className={cn(
                                 "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                                 isVisible
                                    ? "bg-slate-50 border-slate-300 text-slate-800 shadow-2xs font-semibold"
                                    : "bg-slate-100/60 border-slate-200 text-slate-400 opacity-60 hover:opacity-100",
                              )}
                           >
                              <span
                                 className="w-2 h-2 rounded-full shrink-0"
                                 style={{ backgroundColor: cfg.color }}
                              />
                              <span>{cfg.label}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                 ({cfg.unit})
                              </span>
                           </button>
                        );
                     })}
                  </div>

                  {/* Khu vực vẽ biểu đồ tổng quan với trục Ox 7 ngày */}
                  <div className="w-full h-80 pt-2">
                     {isMounted ? (
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart
                              data={overviewChartData}
                              margin={{
                                 top: 10,
                                 right: 15,
                                 left: -10,
                                 bottom: 5,
                              }}
                           >
                              <CartesianGrid
                                 strokeDasharray="3 3"
                                 vertical={false}
                                 stroke="#f1f5f9"
                              />
                              <XAxis
                                 dataKey="displayDate"
                                 interval={0}
                                 tick={{
                                    fontSize: 11,
                                    fill: "#64748b",
                                    fontWeight: 500,
                                 }}
                                 tickLine={false}
                                 axisLine={{ stroke: "#e2e8f0" }}
                              />
                              <YAxis
                                 tick={{ fontSize: 11, fill: "#64748b" }}
                                 tickLine={false}
                                 axisLine={{ stroke: "#e2e8f0" }}
                              />
                              <RechartsTooltip content={<OverviewTooltip />} />

                              {/* Mỗi chỉ số 1 line kết nối qua 7 ngày */}
                              {visibleOverviewLines.BLOOD_PRESSURE && (
                                 <Line
                                    type="monotone"
                                    dataKey="BLOOD_PRESSURE"
                                    name="Huyết áp (Tâm thu)"
                                    stroke={METRIC_CONFIG.BLOOD_PRESSURE.color}
                                    strokeWidth={2}
                                    dot={{
                                       r: 3,
                                       fill: METRIC_CONFIG.BLOOD_PRESSURE.color,
                                    }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                 />
                              )}
                              {visibleOverviewLines.HEART_RATE && (
                                 <Line
                                    type="monotone"
                                    dataKey="HEART_RATE"
                                    name="Nhịp tim"
                                    stroke={METRIC_CONFIG.HEART_RATE.color}
                                    strokeWidth={2}
                                    dot={{
                                       r: 3,
                                       fill: METRIC_CONFIG.HEART_RATE.color,
                                    }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                 />
                              )}
                              {visibleOverviewLines.BLOOD_GLUCOSE && (
                                 <Line
                                    type="monotone"
                                    dataKey="BLOOD_GLUCOSE"
                                    name="Đường huyết"
                                    stroke={METRIC_CONFIG.BLOOD_GLUCOSE.color}
                                    strokeWidth={2}
                                    dot={{
                                       r: 3,
                                       fill: METRIC_CONFIG.BLOOD_GLUCOSE.color,
                                    }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                 />
                              )}
                              {visibleOverviewLines.SPO2 && (
                                 <Line
                                    type="monotone"
                                    dataKey="SPO2"
                                    name="SpO2"
                                    stroke={METRIC_CONFIG.SPO2.color}
                                    strokeWidth={2}
                                    dot={{
                                       r: 3,
                                       fill: METRIC_CONFIG.SPO2.color,
                                    }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                 />
                              )}
                              {visibleOverviewLines.BODY_TEMPERATURE && (
                                 <Line
                                    type="monotone"
                                    dataKey="BODY_TEMPERATURE"
                                    name="Thân nhiệt"
                                    stroke={
                                       METRIC_CONFIG.BODY_TEMPERATURE.color
                                    }
                                    strokeWidth={2}
                                    dot={{
                                       r: 3,
                                       fill: METRIC_CONFIG.BODY_TEMPERATURE
                                          .color,
                                    }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                 />
                              )}
                              {visibleOverviewLines.WEIGHT && (
                                 <Line
                                    type="monotone"
                                    dataKey="WEIGHT"
                                    name="Cân nặng"
                                    stroke={METRIC_CONFIG.WEIGHT.color}
                                    strokeWidth={2}
                                    dot={{
                                       r: 3,
                                       fill: METRIC_CONFIG.WEIGHT.color,
                                    }}
                                    activeDot={{ r: 5 }}
                                    connectNulls
                                 />
                              )}
                           </LineChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="w-full h-full bg-slate-50 animate-pulse rounded" />
                     )}
                  </div>
               </div>

               {/* 3. TỪNG CHỈ SỐ - MỖI CHỈ SỐ 1 CHART (TRỤC OX 7 NGÀY GẦN NHẤT) */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                     <div>
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                           Biểu đồ chi tiết từng chỉ số (7 ngày gần nhất)
                        </h3>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                           Trục hoành hiển thị đầy đủ 7 ngày gần nhất với ngưỡng
                           tham chiếu y tế
                        </p>
                     </div>

                     {/* Tab chọn xem nhanh từng chỉ số hoặc tất cả */}
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

                  {/* Lưới các biểu đồ chỉ số */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {METRIC_KEYS.filter(
                        (k) =>
                           selectedMetricTab === "ALL" ||
                           selectedMetricTab === k,
                     ).map((metricKey) => {
                        const cfg = METRIC_CONFIG[metricKey];
                        const data = metricDataMap[metricKey];

                        // Lọc các điểm có dữ liệu trong 7 ngày
                        const measuredPoints = data.filter(
                           (d) => d.value !== undefined && d.value !== null,
                        );
                        const hasData = measuredPoints.length > 0;

                        // Tính toán thống kê cơ bản trong 7 ngày
                        const latestPoint = hasData
                           ? measuredPoints[measuredPoints.length - 1]
                           : undefined;
                        const values = measuredPoints.map((d) => d.value as number);
                        const minVal = hasData ? Math.min(...values) : null;
                        const maxVal = hasData ? Math.max(...values) : null;
                        const avgVal = hasData
                           ? Math.round(
                                (values.reduce((s, v) => s + v, 0) /
                                   values.length) *
                                   10,
                             ) / 10
                           : null;

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

                                 {/* Chỉ số mới nhất trong 7 ngày */}
                                 {latestPoint && (
                                    <div className="text-right">
                                       <div className="text-[10px] text-slate-400">
                                          Gần nhất ({latestPoint.displayDate})
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

                              {/* Thống kê nhanh: Min, Max, Trung bình trong 7 ngày */}
                              {hasData ? (
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
                              ) : (
                                 <div className="py-1 px-2.5 bg-slate-50/70 rounded text-center text-[11px] text-slate-400 italic">
                                    Chưa ghi nhận lượt đo nào trong 7 ngày gần nhất
                                 </div>
                              )}

                              {/* Vùng vẽ biểu đồ với trục Ox cố định 7 ngày */}
                              <div className="w-full h-52 pt-1">
                                 {!isMounted ? (
                                    <div className="w-full h-full bg-slate-50 animate-pulse rounded" />
                                 ) : metricKey === "BLOOD_PRESSURE" ? (
                                    // Biểu đồ huyết áp (2 đường: Tâm thu và Tâm trương trên trục Ox 7 ngày)
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
                                             bottom: 0,
                                          }}
                                       >
                                          <CartesianGrid
                                             strokeDasharray="3 3"
                                             vertical={false}
                                             stroke="#f1f5f9"
                                          />
                                          <XAxis
                                             dataKey="displayDate"
                                             interval={0}
                                             tick={{
                                                fontSize: 10,
                                                fill: "#64748b",
                                                fontWeight: 500,
                                             }}
                                             tickLine={false}
                                             axisLine={{ stroke: "#e2e8f0" }}
                                          />
                                          <YAxis
                                             tick={{
                                                fontSize: 10,
                                                fill: "#64748b",
                                             }}
                                             tickLine={false}
                                             axisLine={{ stroke: "#e2e8f0" }}
                                             domain={
                                                hasData
                                                   ? [
                                                        "dataMin - 10",
                                                        "dataMax + 10",
                                                     ]
                                                   : [60, 160]
                                             }
                                          />
                                          <RechartsTooltip
                                             content={
                                                <SingleMetricTooltip
                                                   unit={cfg.unit}
                                                   metricType={metricKey}
                                                />
                                             }
                                          />
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
                                          <Line
                                             type="monotone"
                                             dataKey="value"
                                             name="Tâm thu"
                                             stroke={cfg.color}
                                             strokeWidth={2}
                                             dot={{ r: 3, fill: cfg.color }}
                                             activeDot={{ r: 5 }}
                                             connectNulls
                                          />
                                          <Line
                                             type="monotone"
                                             dataKey="secondaryValue"
                                             name="Tâm trương"
                                             stroke={cfg.colorDia || "#3b82f6"}
                                             strokeWidth={2}
                                             dot={{
                                                r: 3,
                                                fill: cfg.colorDia || "#3b82f6",
                                             }}
                                             activeDot={{ r: 5 }}
                                             connectNulls
                                          />
                                       </LineChart>
                                    </ResponsiveContainer>
                                 ) : (
                                    // Biểu đồ cho các chỉ số đơn lẻ khác trên trục Ox 7 ngày
                                    <ResponsiveContainer
                                       width="100%"
                                       height="100%"
                                    >
                                       <AreaChart
                                          data={data}
                                          margin={{
                                             top: 10,
                                             right: 15,
                                             left: -15,
                                             bottom: 0,
                                          }}
                                       >
                                          <defs>
                                             <linearGradient
                                                id={`gradient-${metricKey}`}
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                             >
                                                <stop
                                                   offset="5%"
                                                   stopColor={cfg.color}
                                                   stopOpacity={0.25}
                                                />
                                                <stop
                                                   offset="95%"
                                                   stopColor={cfg.color}
                                                   stopOpacity={0.0}
                                                />
                                             </linearGradient>
                                          </defs>
                                          <CartesianGrid
                                             strokeDasharray="3 3"
                                             vertical={false}
                                             stroke="#f1f5f9"
                                          />
                                          <XAxis
                                             dataKey="displayDate"
                                             interval={0}
                                             tick={{
                                                fontSize: 10,
                                                fill: "#64748b",
                                                fontWeight: 500,
                                             }}
                                             tickLine={false}
                                             axisLine={{ stroke: "#e2e8f0" }}
                                          />
                                          <YAxis
                                             tick={{
                                                fontSize: 10,
                                                fill: "#64748b",
                                             }}
                                             tickLine={false}
                                             axisLine={{ stroke: "#e2e8f0" }}
                                             domain={
                                                hasData
                                                   ? [
                                                        "dataMin - 5",
                                                        "dataMax + 5",
                                                     ]
                                                   : ["auto", "auto"]
                                             }
                                          />
                                          <RechartsTooltip
                                             content={
                                                <SingleMetricTooltip
                                                   unit={cfg.unit}
                                                   metricType={metricKey}
                                                />
                                             }
                                          />
                                          {cfg.normalMin != null && (
                                             <ReferenceLine
                                                y={cfg.normalMin}
                                                stroke={cfg.color}
                                                strokeDasharray="3 3"
                                                strokeOpacity={0.5}
                                             />
                                          )}
                                          {cfg.normalMax != null && (
                                             <ReferenceLine
                                                y={cfg.normalMax}
                                                stroke={cfg.color}
                                                strokeDasharray="3 3"
                                                strokeOpacity={0.5}
                                             />
                                          )}
                                          <Area
                                             type="monotone"
                                             dataKey="value"
                                             name={cfg.label}
                                             stroke={cfg.color}
                                             strokeWidth={2}
                                             fillOpacity={1}
                                             fill={`url(#gradient-${metricKey})`}
                                             dot={{ r: 3, fill: cfg.color }}
                                             activeDot={{ r: 5 }}
                                             connectNulls
                                          />
                                       </AreaChart>
                                    </ResponsiveContainer>
                                 )}
                              </div>

                              {/* Ghi chú footer của biểu đồ */}
                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                                 <span>
                                    {measuredPoints.length}/7 ngày có ghi nhận
                                    đo
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
            </div>
         )}
      </div>
   );
}
