import { Card } from '@/components/ui/Card';

export function DiaryEntrySkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Emotion Icon Skeleton */}
        <div className="flex-shrink-0">
          <div className="h-14 w-14 rounded-2xl bg-muted animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1 w-1 rounded-full bg-muted" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}





