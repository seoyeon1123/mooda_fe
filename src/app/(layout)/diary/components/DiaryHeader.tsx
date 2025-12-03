'use client';

import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { RiBallPenLine } from 'react-icons/ri';

interface DiaryHeaderProps {
  onNewEntryClick: () => void;
}

export default function DiaryHeader({ onNewEntryClick }: DiaryHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 px-4 py-2.5 flex-shrink-0 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex-1 min-w-0 flex flex-row items-center gap-2">
            <RiBallPenLine color="green" />

            <h1 className="text-lg font-semibold text-gray-900">감정 일기</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onNewEntryClick}
            className="rounded-full bg-green-600 text-white shadow-lg hover:bg-green-600/90 cursor-pointer"
            size="sm"
          >
            <Plus className="mr-1 h-4 w-4" />새 일기
          </Button>
        </div>
      </div>
    </div>
  );
}
