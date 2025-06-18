"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface EmotionData {
  date: string;
  emotion: "happy" | "sad" | "angry" | "anxious" | "calm" | "excited";
  summary: string;
  conversationSummary: string; // 대화 요약 추가
}

const emotionColors = {
  happy: "bg-yellow-200 text-yellow-800",
  sad: "bg-blue-200 text-blue-800",
  angry: "bg-red-200 text-red-800",
  anxious: "bg-purple-200 text-purple-800",
  calm: "bg-green-200 text-green-800",
  excited: "bg-orange-200 text-orange-800",
};

const emotionIcons = {
  happy: "/images/happy.svg",
  sad: "/images/sad.svg",
  angry: "/images/angry.svg",
  anxious: "/images/sad.svg", // 불안은 임시로 sad 아이콘 사용
  calm: "/images/soso.svg", // 평온은 임시로 soso 아이콘 사용
  excited: "/images/veryHappy.svg",
};

const emotionLabels = {
  happy: "행복",
  sad: "슬픔",
  angry: "화남",
  anxious: "불안",
  calm: "평온",
  excited: "신남",
};

export default function CalendarTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 샘플 감정 데이터 (대화 요약 추가)
  const emotionData: EmotionData[] = [
    {
      date: "2025-06-15",
      emotion: "happy",
      summary: "친구들과 즐거운 시간을 보냈어요!",
      conversationSummary:
        "친구들과의 만남, 맛있는 음식, 웃음이 가득한 하루에 대해 이야기했어요.",
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달의 빈 칸들
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getEmotionForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return emotionData.find((data) => data.date === dateString);
  };

  const getSelectedDateEmotion = () => {
    if (!selectedDate) return null;
    const dateString = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return emotionData.find((data) => data.date === dateString);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null); // 월 변경 시 선택 초기화
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(clickedDate);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  const selectedEmotion = getSelectedDateEmotion();

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          <h1 className="text-lg font-semibold text-green-700">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h1>

          <button
            onClick={() => navigateMonth("next")}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto min-h-0 p-4">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-12" />;
            }

            const emotion = getEmotionForDate(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            const isSelected =
              selectedDate &&
              day === selectedDate.getDate() &&
              currentDate.getMonth() === selectedDate.getMonth() &&
              currentDate.getFullYear() === selectedDate.getFullYear();

            return (
              <button
                key={`day-${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}-${index}`}
                onClick={() => handleDateClick(day)}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-sm transition-all duration-200 ${
                  isToday ? "ring-2 ring-green-400" : ""
                } ${isSelected ? "ring-2 ring-green-600 bg-green-50" : ""} ${
                  emotion
                    ? `${emotionColors[emotion.emotion]} hover:scale-105`
                    : "hover:bg-stone-100"
                }`}
              >
                <span className={`${emotion ? "text-xs" : ""}`}>{day}</span>
                {emotion && (
                  <Image
                    src={emotionIcons[emotion.emotion]}
                    alt={emotionLabels[emotion.emotion]}
                    width={16}
                    height={16}
                    className="mt-1"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Detail */}
        {selectedDate && selectedEmotion && (
          <div className="mt-6 p-4 bg-white/60 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-700">
                {selectedDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 감정 정보 */}
              <div className="flex items-center space-x-3">
                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    emotionColors[selectedEmotion.emotion]
                  }`}
                >
                  <Image
                    src={emotionIcons[selectedEmotion.emotion]}
                    alt={emotionLabels[selectedEmotion.emotion]}
                    width={24}
                    height={24}
                  />
                  <span className="text-sm font-medium">
                    {emotionLabels[selectedEmotion.emotion]}
                  </span>
                </div>
              </div>

              {/* 감정 요약 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  오늘의 감정
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedEmotion.summary}
                </p>
              </div>

              {/* 대화 요약 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  moo와 나눈 대화
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedEmotion.conversationSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 날짜 선택 안내 (감정 데이터가 없는 경우) */}
        {selectedDate && !selectedEmotion && (
          <div className="mt-6 p-4 bg-white/60 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-green-700">
                {selectedDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500">
              이 날짜에는 감정 기록이 없습니다.
            </p>
          </div>
        )}

        {/* 기본 안내 메시지 */}
        {!selectedDate && (
          <div className="mt-6 p-4 bg-white/60 rounded-xl text-center">
            <p className="text-sm text-gray-500">
              날짜를 클릭해서 그날의 감정과 대화 내용을 확인해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
