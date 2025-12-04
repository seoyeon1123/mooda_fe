export function CustomAISkeleton() {
  return (
    <div className="relative bg-white/60 rounded-xl p-5 border border-gray-200">
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-4 mb-3 flex-1">
          {/* MooIcon Skeleton */}
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          {/* Name Skeleton */}
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        </div>
      </div>
      {/* Description Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

