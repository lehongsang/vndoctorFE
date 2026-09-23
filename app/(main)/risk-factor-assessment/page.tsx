"use client";

import { Suspense } from "react";
import { RiskFactorAssessmentFeature } from "@/features/risk-factor-assessment";
import { CloverLoading } from "@/components/common/clover-loading";

export default function RiskFactorAssessmentPage() {
   return (
      <Suspense
         fallback={
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
               <CloverLoading size="md" />
            </div>
         }
      ></Suspense>
   );
}
