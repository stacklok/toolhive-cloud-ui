import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export function ServerListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2 lg:grid-cols-3 px-4">
      {SKELETON_KEYS.map((key) => (
        <>
          <Skeleton key={key} className="h-32 rounded-xl" />
          <Skeleton key={key} className="h-10 rounded-xl" />
          <Skeleton key={key} className="h-6 rounded-xl" />
        </>
      ))}
    </div>
  );
}
