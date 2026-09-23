"use client";

import { Suspense } from "react";
import { MainWorkPage } from "@/features/main-work";
import { CloverLoading } from "@/components/common/clover-loading";

export default function WorkPage() {
   return (
      <Suspense
         fallback={
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
               <CloverLoading size="md" />
            </div>
         }
      >
         <MainWorkPage />
      </Suspense>
   );
}
