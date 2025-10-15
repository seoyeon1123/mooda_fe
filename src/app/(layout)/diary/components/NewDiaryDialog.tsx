'use client';

import { useState } from 'react';
import type { DiaryEntry } from '@/lib/diary-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EmotionSelector } from './EmotionSelector';
import useUserStore from '@/store/userStore';

interface NewDiaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<DiaryEntry, 'id'>) => void;
}

export function NewDiaryDialog({
  open,
  onOpenChange,
  onSave,
}: NewDiaryDialogProps) {
  const [emotion, setEmotion] = useState('😊');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { user } = useUserStore();
  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    onSave({
      date: new Date(), // selectedDate 대신 현재 날짜 사용
      emotion: emotion, // selectedEmotion 대신 emotion 사용
      title: title.trim(),
      content: content.trim(),
      userId: user?.id || '', // 이 부분 추가 필요
    });

    // Reset form
    setEmotion('😊');
    setTitle('');
    setContent('');
  };

  const handleCancel = () => {
    setEmotion('😊');
    setTitle('');
    setContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            새로운 일기 ✨
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Emotion Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium">오늘의 기분</label>
            <EmotionSelector value={emotion} onChange={setEmotion} />
          </div>

          {/* Title Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium">제목</label>
            <Input
              placeholder="오늘 하루를 한 줄로 표현해보세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border-border bg-secondary/50 px-4 py-3 text-base"
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-3">
            <label className="text-sm font-medium">내용</label>
            <Textarea
              placeholder="오늘 있었던 일이나 느낀 감정을 자유롭게 적어보세요..."
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setContent(e.target.value)
              }
              className="min-h-[160px] rounded-2xl border-border bg-secondary/50 px-4 py-3 text-base leading-relaxed resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 rounded-full border-border py-6 text-base bg-transparent cursor-pointer"
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
              className="flex-1 rounded-full bg-primary py-6 text-base text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              저장하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
