import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 last:col-span-2 lg:last:col-span-1" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
