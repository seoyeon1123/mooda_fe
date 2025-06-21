import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  EmotionData,
  emotionColors,
  emotionIcons,
  emotionLabels,
  monthNames,
} from '@/lib/calendar-types';
import { loadEmotionData } from '@/lib/emotion-service';

interface EmotionCalendarProps {
  userId: string;
}

export default function EmotionCalendar({ userId }: EmotionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);

  useEffect(() => {
    const fetchEmotionData = async () => {
      const data = await loadEmotionData(userId);
      if (data) {
        setEmotionData((prev) => [...prev, data]);
      }
    };
    fetchEmotionData();
  }, [userId]);

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
                  src={emotionIcons[emotion.emotion]}
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
          <h3 className="text-lg font-semibold mb-2">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일의 감정
          </h3>
          {emotionData.find(
            (d) => d.date === selectedDate.toISOString().split('T')[0]
          ) ? (
            <div>
              <p className="text-gray-600">
                {
                  emotionData.find(
                    (d) => d.date === selectedDate.toISOString().split('T')[0]
                  )?.summary
                }
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {
                  emotionData.find(
                    (d) => d.date === selectedDate.toISOString().split('T')[0]
                  )?.conversationSummary
                }
              </p>
            </div>
          ) : (
            <p className="text-gray-500">이 날의 대화 기록이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
