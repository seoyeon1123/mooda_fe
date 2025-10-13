export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-stone-50">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
        {/* Loading Animation */}
        <div className="flex flex-col items-center gap-6">
          {/* Animated Avatar */}
          <div className="relative">
            <div className="h-20 w-20 animate-pulse rounded-full bg-primary/20" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 animate-bounce rounded-full bg-primary" />
          </div>

          {/* Loading Message Bubbles */}
          <div className="flex w-full max-w-sm flex-col gap-3">
            {/* Received Message Skeleton */}
            <div className="flex items-end gap-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="animate-pulse rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-sm">
                <div className="h-4 w-32 rounded bg-muted" />
              </div>
            </div>

            {/* Sent Message Skeleton */}
            <div className="flex items-end justify-end gap-2">
              <div className="animate-pulse rounded-2xl rounded-br-sm bg-primary px-4 py-3 shadow-sm">
                <div className="h-4 w-24 rounded bg-primary-foreground/30" />
              </div>
            </div>

            {/* Typing Indicator */}
            <div className="flex items-end gap-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="font-sans text-base text-muted-foreground">
              메시지를 불러오는 중...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
