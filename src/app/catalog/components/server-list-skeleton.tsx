import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_KEYS = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "s12",
] as const;

export function ServerListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 pb-3 md:grid-cols-2 lg:grid-cols-3">
      {SKELETON_KEYS.map((key) => (
        <Card
          key={key}
          className="flex h-full w-full flex-col shadow-none rounded-md gap-4 py-4"
        >
          <CardHeader className="gap-1">
            <Skeleton className="h-7 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-[54px] w-full rounded" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
