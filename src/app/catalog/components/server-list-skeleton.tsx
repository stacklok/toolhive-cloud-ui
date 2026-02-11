import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export function ServerListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2 lg:grid-cols-3 px-4">
      {SKELETON_KEYS.map((key) => (
        <Card
          key={key}
          className="flex h-full w-full flex-col shadow-none rounded-md gap-4"
        >
          <CardHeader className="gap-2 pb-2">
            <Skeleton className="h-7 w-3/4 rounded" />
            <Skeleton className="h-5 w-1/3 rounded" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-[54px] w-full rounded" />
            <Skeleton className="h-9 w-28 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
