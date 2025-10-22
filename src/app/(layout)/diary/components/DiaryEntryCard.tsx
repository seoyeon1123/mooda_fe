import type { DiaryEntry } from '@/lib/diary-service';
import { Card } from '@/components/ui/Card';

interface DiaryEntryCardProps {
  entry: DiaryEntry;
}

export function DiaryEntryCard({ entry }: DiaryEntryCardProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    console.log('현재 시간:', now.toISOString(), now.toString());
    console.log('일기 시간:', date.toISOString(), date.toString());
    console.log(
      '시간 차이(분):',
      Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    );

    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return '방금 전';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}일 전`;
      }
    }
  };

  const timeAgo = getTimeAgo(entry.date);

  return (
    <Card className="overflow-hidden rounded-3xl border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Emotion Icon */}
        <div className="flex-shrink-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            {entry.emotion}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight text-card-foreground">
              {entry.title}
            </h3>
            <time className="flex-shrink-0 text-xs text-muted-foreground">
              {timeAgo}
            </time>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {entry.content}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">
              {entry.date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
