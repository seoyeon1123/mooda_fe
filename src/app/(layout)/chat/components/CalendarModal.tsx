"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { AIPersonality } from "@/lib/ai-personalities";
import { getConversationDates } from "@/lib/chat-service";

interface CalendarModalProps {
  show: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  userId: string;
  currentPersonality: AIPersonality | null;
}

export default function CalendarModal({
  show,
  onClose,
  onDateSelect,
  userId,
  currentPersonality,
}: CalendarModalProps) {
  const [conversationDates, setConversationDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadConversationDates = useCallback(async () => {
    if (!userId || !currentPersonality) return;

    try {
      const dates = await getConversationDates(userId, currentPersonality.id);
      setConversationDates(dates);
    } catch (error) {
      console.error("대화 날짜 목록 불러오기 실패:", error);
    }
  }, [userId, currentPersonality]);
  // 대화가 있는 날짜 목록 불러오기
  useEffect(() => {
    if (show) {
      void loadConversationDates();
    }
  }, [show, loadConversationDates]);

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const isConversationDate = (date: Date) => {
    const dateString = formatDate(date);
    return conversationDates.includes(dateString);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];

    // 이전 달의 마지막 날들
    const prevMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      0
    );
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      days.push(
        <button
          key={`prev-${day}`}
          className="w-6 h-6 text-gray-400 text-xs rounded-full hover:bg-gray-100 disabled:cursor-default"
          disabled
        >
          {day}
        </button>
      );
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isToday = formatDate(date) === formatDate(new Date());
      const hasConversation = isConversationDate(date);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`w-6 h-6 text-xs rounded-full transition-colors ${
            isToday
              ? "bg-green-500 text-white font-semibold hover:bg-green-600"
              : hasConversation
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          title={
            isToday
              ? "오늘 - 기본 채팅으로 돌아가기"
              : hasConversation
              ? `${date.toLocaleDateString()} 대화 보기`
              : `${date.toLocaleDateString()} - 대화 없음`
          }
        >
          {day}
        </button>
      );
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length; // 6주 고정
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <button
          key={`next-${day}`}
          className="w-6 h-6 text-gray-400 text-xs rounded-full hover:bg-gray-100 disabled:cursor-default"
          disabled
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  if (!show) return null;

  return (
    <>
      {/* 배경 오버레이 - 불투명 */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* 모달 컨테이너 */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-fit">
        <div className="p-3">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">대화 기록</h3>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-gray-600" />
            </button>
          </div>

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => changeMonth("prev")}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-900">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </span>
            <button
              onClick={() => changeMonth("next")}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ›
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div
                key={day}
                className="w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

          {/* 범례 */}
          <div className="flex items-center justify-center space-x-3 mt-3 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>오늘 (기본 채팅)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-100 rounded-full"></div>
              <span>대화 있음</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
