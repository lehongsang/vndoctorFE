"use client";

import React from "react";
import { Consultation } from "@/store/api/consultation/type";
import { Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";

interface ConsultationStatsProps {
   consultations: Consultation[];
}

export function ConsultationStats({ consultations }: ConsultationStatsProps) {
   const total = consultations.length;
   const pending = consultations.filter((c) => c.status === "PENDING").length;
   const inProgress = consultations.filter(
      (c) => c.status === "IN_PROGRESS",
   ).length;
   const completed = consultations.filter(
      (c) => c.status === "COMPLETED" || c.status === "RESOLVED",
   ).length;

   const stats = [
      {
         label: "Tổng phiếu hội chẩn",
         value: total,
         icon: FileText,
         color: "text-slate-700",
         bgColor: "bg-slate-100",
         borderColor: "border-slate-200",
      },
      {
         label: "Chờ hội chẩn",
         value: pending,
         icon: Clock,
         color: "text-amber-700",
         bgColor: "bg-amber-50",
         borderColor: "border-amber-200",
      },
      {
         label: "Đang xử lý",
         value: inProgress,
         icon: AlertCircle,
         color: "text-blue-700",
         bgColor: "bg-blue-50",
         borderColor: "border-blue-200",
      },
      {
         label: "Đã có kết luận",
         value: completed,
         icon: CheckCircle2,
         color: "text-emerald-700",
         bgColor: "bg-emerald-50",
         borderColor: "border-emerald-200",
      },
   ];

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
               <div
                  key={i}
                  className={`p-3.5 rounded-lg border ${stat.borderColor} ${stat.bgColor} flex items-center justify-between shadow-xs transition-all`}
               >
                  <div>
                     <p className="text-xs font-medium text-slate-500">
                        {stat.label}
                     </p>
                     <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>
                        {stat.value}
                     </p>
                  </div>
                  <div
                     className={`size-9 rounded-full flex items-center justify-center bg-white/80 shadow-2xs ${stat.color}`}
                  >
                     <Icon className="size-5" />
                  </div>
               </div>
            );
         })}
      </div>
   );
}
