"use client";

import { use } from "react";
import { useParams } from "next/navigation";
import { ConsultationDetailPage } from "@/features/consultation/components/consultation-detail-page";
import { CloverLoading } from "@/components/common/clover-loading";

interface PageProps {
   params: Promise<{ id: string }>;
}

export default function ConsultationItemPage({ params }: PageProps) {
   const resolvedParams = use(params);
   const routeParams = useParams();
   const consultationId = resolvedParams?.id || (routeParams?.id as string);

   if (!consultationId) {
      return (
         <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <CloverLoading size="md" text="Đang tải dữ liệu hội chẩn..." />
         </div>
      );
   }

   return (
      <div className="p-4 sm:p-6">
         <ConsultationDetailPage consultationId={consultationId} />
      </div>
   );
}
