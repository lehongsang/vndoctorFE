"use client";

import { Suspense } from "react";
import HealthProfileFeature from "@/features/health-profile";
import { CloverLoading } from "@/components/common/clover-loading";

export default function HealthProfile() {
   return (
      <Suspense
         fallback={
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
               <CloverLoading size="md" />
            </div>
         }
      >
         <HealthProfileFeature />
      </Suspense>
   );
}
