'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DiaryEntryCard } from './components/DiaryEntryCard';
import { DiaryEntrySkeleton } from './components/DiaryEntrySkeleton';
import { NewDiaryDialog } from './components/NewDiaryDialog';
import DiaryHeader from './components/DiaryHeader';
import { DiaryEntry, DiaryService } from '@/lib/diary-service';
import useUserStore from '@/store/userStore';

const emotions = [
  { emoji: '😊', label: '행복' },
  { emoji: '😌', label: '평온' },
  { emoji: '😢', label: '슬픔' },
  { emoji: '😠', label: '화남' },
  { emoji: '😰', label: '불안' },
  { emoji: '🤔', label: '생각' },
  { emoji: '😴', label: '피곤' },
  { emoji: '🥰', label: '사랑' },
];

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { user } = useUserStore();

  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(6);

  const handleEmotionFilter = (emoji: string) => {
    setSelectedEmotion(selectedEmotion === emoji ? null : emoji);
    setDisplayCount(6); // Reset pagination when filter changes
  };

  useEffect(() => {
    const loadEntries = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const diaryEntries = await DiaryService.getEntries(user.id);
        setEntries(diaryEntries);
      } catch (error) {
        console.error('일기 목록 로드 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, [user?.id]);

  const filteredEntries = useMemo(() => {
    if (!selectedEmotion) return entries;
    return entries.filter((entry) => entry.emotion === selectedEmotion);
  }, [entries, selectedEmotion]);

  const displayedEntries = filteredEntries.slice(0, displayCount);
  const hasMore = displayCount < filteredEntries.length;

  const handleAddEntry = async (entry: Omit<DiaryEntry, 'id'>) => {
    try {
      const newEntry = await DiaryService.createEntry(entry);
      setEntries([newEntry, ...entries]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('일기 저장 중 오류:', error);
      alert('일기 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 무한스크롤: 스크롤이 하단에 가까워지면 자동으로 더 불러오기
  useEffect(() => {
    const handleScroll = () => {
      const scrollElement = document.querySelector('main');
      if (!scrollElement) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200; // 하단 200px 전에 로드

      if (isNearBottom && hasMore && !loading && !isLoadingMore) {
        setIsLoadingMore(true);
        // 약간의 딜레이를 주어 자연스러운 로딩 효과
        setTimeout(() => {
          setDisplayCount((prev) => prev + 6);
          setIsLoadingMore(false);
        }, 300);
      }
    };

    const scrollElement = document.querySelector('main');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loading, isLoadingMore]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📝</div>
          <p>일기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <DiaryHeader onNewEntryClick={() => setIsDialogOpen(true)} />
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <div className="mx-auto ">
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                감정 필터
              </h3>
              {selectedEmotion && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEmotion(null);
                    setDisplayCount(6);
                  }}
                  className="h-auto rounded-full px-3 py-1 text-xs"
                >
                  전체 보기
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {emotions.map((emotion) => (
                <Button
                  key={emotion.emoji}
                  variant="outline"
                  size="sm"
                  onClick={() => handleEmotionFilter(emotion.emoji)}
                  className={`rounded-full border-2 transition-all hover:scale-105 ${
                    selectedEmotion === emotion.emoji
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-secondary/30'
                  }`}
                >
                  <span className="mr-1.5 text-base">{emotion.emoji}</span>
                  <span className="text-xs">{emotion.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 text-6xl">📝</div>
                <h3 className="mb-2 text-lg font-semibold">
                  {selectedEmotion
                    ? '해당 감정의 일기가 없어요'
                    : '아직 일기가 없어요'}
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {selectedEmotion
                    ? '다른 감정을 선택하거나 새 일기를 작성해보세요!'
                    : '첫 번째 감정 일기를 작성해보세요!'}
                </p>
              </div>
            ) : (
              <>
                {displayedEntries.map((entry) => (
                  <DiaryEntryCard key={entry.id} entry={entry} />
                ))}
                {hasMore && isLoadingMore && <DiaryEntrySkeleton />}
              </>
            )}
          </div>
        </div>
      </main>

      {/* New Journal Dialog */}
      <NewDiaryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleAddEntry}
      />
    </div>
  );
}
