import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  /** Which preset layout to render. */
  variant?: "list" | "cards" | "detail-header";
  /** For "list"/"cards": how many placeholder rows/cards to render. */
  count?: number;
  className?: string;
}

function ListRowsSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * A few preset skeleton layouts (list rows, cards, detail header) built from
 * the base `Skeleton` block. `role="status"` + a visually-hidden "Loading"
 * label so assistive tech announces the loading state, since the skeleton
 * blocks themselves carry no text a screen reader could otherwise read.
 */
export function LoadingSkeleton({ variant = "list", count = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn(className)} role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      {variant === "list" && <ListRowsSkeleton count={count} />}
      {variant === "cards" && <CardsSkeleton count={count} />}
      {variant === "detail-header" && <DetailHeaderSkeleton />}
    </div>
  );
}
