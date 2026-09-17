import { CloverLoading } from "@/components/common/clover-loading";

export default function Loading() {
   return (
      <div className="min-h-[50vh] w-full flex items-center justify-center">
         <CloverLoading size="lg" text="Đang tải dữ liệu..." />
      </div>
   );
}
