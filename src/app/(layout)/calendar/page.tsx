'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EmotionCalendar from '@/app/(layout)/calendar/components/EmotionCalendar';

export default function CalendarTab() {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
    }
  }, [session]);

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">감정 캘린더</h1>

      <div className="max-w-3xl mx-auto">
        <EmotionCalendar userId={userId} onDateSelect={setSelectedDate} />

        {!selectedDate && (
          <div className="mt-6 p-4 border-2 border-[#97B067] bg-white/60 rounded-xl text-center ">
            <p className="text-sm text-gray-500">
              날짜를 클릭해서 <br />
              그날의 감정과 대화 내용을 확인해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
