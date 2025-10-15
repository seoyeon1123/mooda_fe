'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { DiaryEntryCard } from './components/DiaryEntryCard';
import { NewDiaryDialog } from './components/NewDiaryDialog';
import { DiaryEntry, DiaryService } from '@/lib/diary-service';
import useUserStore from '@/store/userStore';

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();

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

  const handleAddEntry = async (entry: Omit<DiaryEntry, 'id'>) => {
    if (!user?.id) return;

    try {
      const newEntry = await DiaryService.createEntry({
        ...entry,
        userId: user.id, // userId 추가
      });
      setEntries([newEntry, ...entries]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('일기 생성 실패:', error);
      // 에러 처리
    }
  };

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
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">감정 일기</h2>
              <p className="text-sm text-muted-foreground">
                오늘의 감정을 기록해보세요
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="rounded-full bg-green-600 text-primary-foreground shadow-lg hover:bg-green-600/90 cursor-pointer"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />새 일기
            </Button>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 text-6xl">📝</div>
                <h3 className="mb-2 text-lg font-semibold">
                  아직 일기가 없어요
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  첫 번째 감정 일기를 작성해보세요!
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="rounded-full bg-primary text-primary-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  일기 쓰기
                </Button>
              </div>
            ) : (
              entries.map((entry) => (
                <DiaryEntryCard key={entry.id} entry={entry} />
              ))
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
