import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  EmotionData,
  emotionColors,
  emotionIcons,
  emotionLabels,
  monthNames,
} from '@/lib/calendar-types';
import { loadMonthlyEmotionData } from '@/lib/emotion-service';

interface EmotionCalendarProps {
  userId: string;
  onDateSelect?: (date: Date | null) => void;
}

export default function EmotionCalendar({
  userId,
  onDateSelect,
}: EmotionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);

  useEffect(() => {
    const fetchEmotionData = async () => {
      console.log('🔍 Fetching emotion data for userId:', userId);
      console.log(
        '🔍 Year:',
        currentDate.getFullYear(),
        'Month:',
        currentDate.getMonth() + 1
      );

      const data = await loadMonthlyEmotionData(
        userId,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1 // JavaScript의 월은 0부터 시작하므로 +1
      );

      console.log('📅 Received emotion data:', data);
      setEmotionData(data);
    };
    fetchEmotionData();
  }, [userId, currentDate]); // currentDate도 의존성에 추가

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date); // 부모 컴포넌트에 날짜 선택 알림
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // 이전 달의 날짜들
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dateString = date.toISOString().split('T')[0];
      const emotion = emotionData.find((d) => d.date === dateString);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors
            ${selectedDate?.getDate() === day ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="text-center">
            <span className="text-sm">{day}</span>
            {emotion && (
              <div
                className={`mt-1 p-1 rounded-full ${
                  emotionColors[emotion.emotion]
                }`}
              >
                <Image
                  src={emotion.characterName || emotionIcons[emotion.emotion]}
                  alt={emotionLabels[emotion.emotion]}
                  width={20}
                  height={20}
                  className="mx-auto"
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center text-gray-500 text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

      {selectedDate && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일의 감정
          </h3>
          {emotionData.find(
            (d) => d.date === selectedDate.toISOString().split('T')[0]
          ) ? (
            <div className="space-y-3">
              {/* 감정 아이콘과 퍼센트 */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Image
                    src={
                      emotionData.find(
                        (d) =>
                          d.date === selectedDate.toISOString().split('T')[0]
                      )?.characterName || '/images/emotion/soso.svg'
                    }
                    alt="감정"
                    width={24}
                    height={24}
                  />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-800">
                    {
                      emotionData.find(
                        (d) =>
                          d.date === selectedDate.toISOString().split('T')[0]
                      )?.summary
                    }
                  </div>
                  <div className="text-sm text-gray-500">오늘의 감정</div>
                </div>
              </div>

              {/* 대화 요약 */}
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  오늘의 대화
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {
                    emotionData.find(
                      (d) => d.date === selectedDate.toISOString().split('T')[0]
                    )?.conversationSummary
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-2xl text-gray-400">💭</span>
              </div>
              <p className="text-gray-500">이 날의 대화 기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
