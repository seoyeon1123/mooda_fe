'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EmotionCalendar from '@/app/(layout)/calendar/components/EmotionCalendar';
import CalendarHeader from '@/app/(layout)/calendar/components/CalendarHeader';

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
      <div className="flex flex-col h-full bg-stone-50">
        <CalendarHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <CalendarHeader />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto">
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
    </div>
  );
}
