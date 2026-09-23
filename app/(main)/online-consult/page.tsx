"use client";

import { Suspense } from "react";
import ConversationWorkspace from "@/features/conversations/conversation-workspace";
import { CloverLoading } from "@/components/common/clover-loading";

const OnlineConsultPage = () => {
   return (
      <Suspense
         fallback={
            <div className="flex h-screen items-center justify-center">
               <CloverLoading size="lg" />
            </div>
         }
      >
         <ConversationWorkspace />
      </Suspense>
   );
};

export default OnlineConsultPage;
