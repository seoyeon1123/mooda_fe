'use client';

import { Button } from '@/components/ui/Button';

const emotions = [
  { emoji: '😊', label: '행복해요' },
  { emoji: '😌', label: '평온해요' },
  { emoji: '😢', label: '슬퍼요' },
  { emoji: '😠', label: '화나요' },
  { emoji: '😰', label: '불안해요' },
  { emoji: '🤔', label: '생각중' },
  { emoji: '😴', label: '피곤해요' },
  { emoji: '🥰', label: '사랑해요' },
];

interface EmotionSelectorProps {
  value: string;
  onChange: (emotion: string) => void;
}

export function EmotionSelector({ value, onChange }: EmotionSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {emotions.map((emotion) => (
        <Button
          key={emotion.emoji}
          type="button"
          variant="outline"
          onClick={() => onChange(emotion.emoji)}
          className={`flex flex-row items-center gap-2 rounded-2xl border-2 py-5   transition-all hover:scale-105 ${
            value === emotion.emoji
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border bg-secondary/30'
          }`}
        >
          <span className="text-3xl">{emotion.emoji}</span>
          <span className="text-xs font-medium">{emotion.label}</span>
        </Button>
      ))}
    </div>
  );
}
