'use client';
import { useState } from 'react';
import EmotionCalendar from '@/app/(layout)/calendar/components/EmotionCalendar';

export default function CalendarTab() {
  const [userId] = useState(`user_${Date.now()}`); // 임시 사용자 ID

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">감정 캘린더</h1>

      <div className="max-w-3xl mx-auto">
        <EmotionCalendar userId={userId} />

        <div className="mt-6 p-4 bg-white/60 rounded-xl text-center">
          <p className="text-sm text-gray-500">
            날짜를 클릭해서 <br />
            그날의 감정과 대화 내용을 확인해보세요
          </p>
        </div>
      </div>
    </div>
  );
}
