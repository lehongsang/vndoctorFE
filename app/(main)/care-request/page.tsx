"use client";

import { Suspense } from "react";
import CareRequestModule from "@/features/care-request";
import { CloverLoading } from "@/components/common/clover-loading";

export default function CareRequestPage() {
   return (
      <div className="p-4">
         <Suspense
            fallback={
               <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                  <CloverLoading size="md" />
               </div>
            }
         >
            <CareRequestModule />
         </Suspense>
      </div>
   );
}
