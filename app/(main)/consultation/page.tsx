"use client";

import { Suspense } from "react";
import ConsultationModule from "@/features/consultation";
import { CloverLoading } from "@/components/common/clover-loading";

export default function ConsultationPage() {
   return (
      <div className="p-4">
         <Suspense
            fallback={
               <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                  <CloverLoading size="md" text="Đang tải danh sách hội chẩn..." />
               </div>
            }
         >
            <ConsultationModule />
         </Suspense>
      </div>
   );
}
