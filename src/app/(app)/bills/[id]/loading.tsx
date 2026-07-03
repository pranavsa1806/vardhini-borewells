import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Receipt-shaped skeleton so opening a bill feels instant.
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Card className="mx-auto max-w-3xl p-10">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-6 w-24" />
            <Skeleton className="ml-auto h-4 w-32" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-24 w-64" />
        </div>
      </Card>
    </div>
  );
}
