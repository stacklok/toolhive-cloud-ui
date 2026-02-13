import { Skeleton } from "@/components/ui/skeleton";

export default function DetailLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-20 rounded-md" />

      <div className="flex flex-col gap-1">
        <Skeleton className="h-10 w-96" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-11 w-48 rounded-xl" />

      <div className="space-y-2">
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>

      <Skeleton className="h-9 w-40 rounded-full" />

      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </div>
  );
}
