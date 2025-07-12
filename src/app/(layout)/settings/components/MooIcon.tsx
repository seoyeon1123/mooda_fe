'use client';
import React, { useEffect, useState } from 'react';

interface MooIconProps {
  type:
    | 'friendly'
    | 'wise'
    | 'energetic'
    | 'calm'
    | 'user'
    | 'default'
    | 'INTJ'
    | 'INTP'
    | 'ENTJ'
    | 'ENTP'
    | 'INFJ'
    | 'INFP'
    | 'ENFJ'
    | 'ENFP'
    | 'ISTJ'
    | 'ISFJ'
    | 'ESTJ'
    | 'ESFJ'
    | 'ISTP'
    | 'ISFP'
    | 'ESTP'
    | 'ESFP';
  size?: number;
}

export default function MooIcon({ type, size = 40 }: MooIconProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-gray-200 rounded-full"
      ></div>
    );
  }

  const iconStyles = {
    width: size,
    height: size,
  };

  switch (type) {
    case 'default':
    case 'friendly':
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          {/* 소 얼굴 */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          {/* 귀 */}
          <ellipse
            cx="16"
            cy="16"
            rx="4"
            ry="6"
            fill="#FFB347"
            transform="rotate(-30 16 16)"
          />
          <ellipse
            cx="32"
            cy="16"
            rx="4"
            ry="6"
            fill="#FFB347"
            transform="rotate(30 32 16)"
          />
          {/* 눈 (반짝이는) */}
          <circle cx="19" cy="21" r="2" fill="#2D4A2D" />
          <circle cx="29" cy="21" r="2" fill="#2D4A2D" />
          <circle cx="19.5" cy="20.5" r="0.8" fill="white" />
          <circle cx="29.5" cy="20.5" r="0.8" fill="white" />
          {/* 코 */}
          <ellipse cx="24" cy="26" rx="3" ry="2" fill="#FF8C00" />
          {/* 입 (큰 웃음) */}
          <path
            d="M 18 30 Q 24 35 30 30"
            stroke="#2D4A2D"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* 에너지 번개 */}
          <path
            d="M 35 15 L 32 20 L 35 20 L 32 25"
            stroke="#FFD700"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'wise':
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          {/* 소 얼굴 */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="#8FBC8F"
            stroke="#5F8A5F"
            strokeWidth="2"
          />
          {/* 귀 */}
          <ellipse
            cx="16"
            cy="16"
            rx="4"
            ry="6"
            fill="#7BA05B"
            transform="rotate(-30 16 16)"
          />
          <ellipse
            cx="32"
            cy="16"
            rx="4"
            ry="6"
            fill="#7BA05B"
            transform="rotate(30 32 16)"
          />
          {/* 안경 */}
          <circle
            cx="19"
            cy="21"
            r="4"
            fill="none"
            stroke="#2D4A2D"
            strokeWidth="2"
          />
          <circle
            cx="29"
            cy="21"
            r="4"
            fill="none"
            stroke="#2D4A2D"
            strokeWidth="2"
          />
          <line
            x1="23"
            y1="21"
            x2="25"
            y2="21"
            stroke="#2D4A2D"
            strokeWidth="2"
          />
          {/* 눈 */}
          <circle cx="19" cy="21" r="1.5" fill="#2D4A2D" />
          <circle cx="29" cy="21" r="1.5" fill="#2D4A2D" />
          {/* 코 */}
          <ellipse cx="24" cy="26" rx="3" ry="2" fill="#6B8E6B" />
          {/* 입 (현명한 미소) */}
          <path
            d="M 21 30 Q 24 32 27 30"
            stroke="#2D4A2D"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'energetic':
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          {/* 소 얼굴 - 더 밝고 선명한 색상으로 변경 */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="#718096"
            stroke="#2D3748"
            strokeWidth="2"
          />

          {/* 귀 - 더 밝은 색상 */}
          <ellipse
            cx="16"
            cy="16"
            rx="4"
            ry="6"
            fill="#4A5568"
            transform="rotate(-30 16 16)"
          />
          <ellipse
            cx="32"
            cy="16"
            rx="4"
            ry="6"
            fill="#4A5568"
            transform="rotate(30 32 16)"
          />

          {/* 눈 - 더 밝은 빨간색 */}
          <circle cx="19" cy="21" r="2" fill="#F56565" />
          <circle cx="29" cy="21" r="2" fill="#F56565" />
          <circle cx="19.5" cy="20.5" r="0.5" fill="white" />
          <circle cx="29.5" cy="20.5" r="0.5" fill="white" />

          {/* 코 - 더 밝은 색상 */}
          <ellipse cx="24" cy="26" rx="3" ry="2" fill="#4A5568" />

          {/* 입 - 더 밝은 빨간색 */}
          <path
            d="M 20 30 L 28 30"
            stroke="#F56565"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* 눈썹 - 더 진한 색상으로 대비 */}
          <path
            d="M 16 18 L 22 19"
            stroke="#1A202C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 26 19 L 32 18"
            stroke="#1A202C"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'calm':
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          {/* 소 얼굴 */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="#DDA0DD"
            stroke="#BA55D3"
            strokeWidth="2"
          />
          {/* 귀 */}
          <ellipse
            cx="16"
            cy="16"
            rx="4"
            ry="6"
            fill="#D8BFD8"
            transform="rotate(-30 16 16)"
          />
          <ellipse
            cx="32"
            cy="16"
            rx="4"
            ry="6"
            fill="#D8BFD8"
            transform="rotate(30 32 16)"
          />
          {/* 눈 (평온한) */}
          <path
            d="M 17 21 Q 19 19 21 21"
            stroke="#2D4A2D"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 27 21 Q 29 19 31 21"
            stroke="#2D4A2D"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* 코 */}
          <ellipse cx="24" cy="26" rx="3" ry="2" fill="#DA70D6" />
          {/* 입 (평온한 미소) */}
          <path
            d="M 21 30 Q 24 32 27 30"
            stroke="#2D4A2D"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* 하트 */}
          <path
            d="M 36 18 C 36 16 34 14 32 16 C 30 14 28 16 28 18 C 28 20 32 24 32 24 C 32 24 36 20 36 18 Z"
            fill="#FF69B4"
          />
        </svg>
      );

    case 'user':
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="#E0E0E0"
            stroke="#BDBDBD"
            strokeWidth="2"
          />
          <circle cx="24" cy="20" r="5" fill="#BDBDBD" />
          <path
            d="M 16 36 Q 24 28 32 36"
            stroke="#BDBDBD"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      );

    // MBTI 동물 아이콘들
    case 'INTJ': // 올빼미
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="24"
            r="18"
            fill="#DDA0DD"
            stroke="#BA55D3"
            strokeWidth="2"
          />
          <ellipse cx="18" cy="18" rx="3" ry="5" fill="#BA55D3" />
          <ellipse cx="30" cy="18" rx="3" ry="5" fill="#BA55D3" />
          <circle cx="18" cy="20" r="2" fill="#FFF" />
          <circle cx="30" cy="20" r="2" fill="#FFF" />
          <circle cx="18" cy="20" r="1" fill="#000" />
          <circle cx="30" cy="20" r="1" fill="#000" />
          <path d="M 24 24 L 22 26 L 26 26 Z" fill="#BA55D3" />
          <path
            d="M 20 30 Q 24 32 28 30"
            stroke="#BA55D3"
            strokeWidth="2"
            fill="none"
          />
          <path d="M 12 12 L 16 8 L 18 12" fill="#BA55D3" />
          <path d="M 30 12 L 32 8 L 36 12" fill="#BA55D3" />
        </svg>
      );
    case 'INTP': // 고양이
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="26"
            r="16"
            fill="#8FBC8F"
            stroke="#5F8A5F"
            strokeWidth="2"
          />
          <path d="M 16 14 L 12 8 L 20 12 Z" fill="#5F8A5F" />
          <path d="M 32 14 L 36 8 L 28 12 Z" fill="#5F8A5F" />
          <circle cx="20" cy="22" r="2" fill="#5F8A5F" />
          <circle cx="28" cy="22" r="2" fill="#5F8A5F" />
          <ellipse cx="24" cy="26" rx="2" ry="1" fill="#5F8A5F" />
          <path d="M 24 27 L 24 30" stroke="#5F8A5F" strokeWidth="2" />
          <path
            d="M 20 32 Q 24 34 28 32"
            stroke="#5F8A5F"
            strokeWidth="2"
            fill="none"
          />
          <path d="M 18 28 L 14 30" stroke="#5F8A5F" strokeWidth="1" />
          <path d="M 30 28 L 34 30" stroke="#5F8A5F" strokeWidth="1" />
          <path d="M 18 30 L 14 32" stroke="#5F8A5F" strokeWidth="1" />
          <path d="M 30 30 L 34 32" stroke="#5F8A5F" strokeWidth="1" />
        </svg>
      );
    case 'ENTJ': // 사자
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="24"
            r="18"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <path
            d="M 12 12 Q 8 8 12 6 Q 16 8 14 12 Q 18 10 20 14 Q 16 16 12 12"
            fill="#FFA500"
          />
          <path
            d="M 36 12 Q 40 8 36 6 Q 32 8 34 12 Q 30 10 28 14 Q 32 16 36 12"
            fill="#FFA500"
          />
          <path
            d="M 24 8 Q 20 6 18 10 Q 22 12 24 8 Q 26 12 30 10 Q 28 6 24 8"
            fill="#FFA500"
          />
          <circle cx="20" cy="22" r="2" fill="#FFA500" />
          <circle cx="28" cy="22" r="2" fill="#FFA500" />
          <path d="M 24 26 L 22 28 L 26 28 Z" fill="#FFA500" />
          <path
            d="M 18 32 Q 24 36 30 32"
            stroke="#FFA500"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="16" cy="28" r="1" fill="#FFA500" />
          <circle cx="32" cy="28" r="1" fill="#FFA500" />
        </svg>
      );
    case 'ENTP': // 여우
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="26"
            rx="16"
            ry="14"
            fill="#FF8C00"
            stroke="#FF6347"
            strokeWidth="2"
          />
          <path d="M 16 16 L 12 8 L 20 14 Z" fill="#FF6347" />
          <path d="M 32 16 L 36 8 L 28 14 Z" fill="#FF6347" />
          <circle cx="20" cy="22" r="2" fill="#FF6347" />
          <circle cx="28" cy="22" r="2" fill="#FF6347" />
          <ellipse cx="24" cy="28" rx="3" ry="2" fill="#FF6347" />
          <path
            d="M 18 32 Q 24 34 30 32"
            stroke="#FF6347"
            strokeWidth="2"
            fill="none"
          />
          <ellipse
            cx="24"
            cy="36"
            rx="8"
            ry="4"
            fill="#FFF"
            stroke="#FF6347"
            strokeWidth="1"
          />
          <path d="M 38 20 Q 42 18 40 22 Q 38 24 36 22" fill="#FF6347" />
        </svg>
      );
    case 'INFJ': // 늑대
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="26"
            rx="16"
            ry="14"
            fill="#708090"
            stroke="#2F4F4F"
            strokeWidth="2"
          />
          <path d="M 18 14 L 14 8 L 22 12 Z" fill="#2F4F4F" />
          <path d="M 30 14 L 34 8 L 26 12 Z" fill="#2F4F4F" />
          <circle cx="20" cy="22" r="2" fill="#2F4F4F" />
          <circle cx="28" cy="22" r="2" fill="#2F4F4F" />
          <ellipse cx="24" cy="28" rx="2" ry="3" fill="#2F4F4F" />
          <path d="M 24 31 L 24 34" stroke="#2F4F4F" strokeWidth="2" />
          <path
            d="M 16 34 Q 24 38 32 34"
            stroke="#2F4F4F"
            strokeWidth="2"
            fill="none"
          />
          <path d="M 20 36 L 18 38" stroke="#2F4F4F" strokeWidth="2" />
          <path d="M 24 36 L 24 38" stroke="#2F4F4F" strokeWidth="2" />
          <path d="M 28 36 L 30 38" stroke="#2F4F4F" strokeWidth="2" />
          <circle cx="36" cy="18" r="2" fill="#FFD700" />
        </svg>
      );
    case 'INFP': // 유니콘
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="26"
            r="16"
            fill="#F0E6FF"
            stroke="#DDA0DD"
            strokeWidth="2"
          />
          <path
            d="M 24 8 L 22 16 L 26 16 Z"
            fill="#FFD700"
            stroke="#DDA0DD"
            strokeWidth="1"
          />
          <path d="M 20 12 Q 16 8 12 12 Q 16 14 20 12" fill="#FF69B4" />
          <path d="M 28 12 Q 32 8 36 12 Q 32 14 28 12" fill="#87CEEB" />
          <circle cx="20" cy="22" r="2" fill="#DDA0DD" />
          <circle cx="28" cy="22" r="2" fill="#DDA0DD" />
          <path d="M 24 26 L 22 28 L 26 28 Z" fill="#FFB6C1" />
          <path
            d="M 18 32 Q 24 34 30 32"
            stroke="#DDA0DD"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="16" cy="20" r="1" fill="#FF69B4" />
          <circle cx="32" cy="20" r="1" fill="#87CEEB" />
          <circle cx="24" cy="18" r="1" fill="#FFD700" />
        </svg>
      );
    case 'ENFJ': // 돌고래
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="24"
            rx="18"
            ry="16"
            fill="#87CEEB"
            stroke="#4682B4"
            strokeWidth="2"
          />
          <circle cx="20" cy="20" r="2" fill="#4682B4" />
          <circle cx="28" cy="20" r="2" fill="#4682B4" />
          <ellipse cx="24" cy="26" rx="3" ry="2" fill="#4682B4" />
          <path
            d="M 18 30 Q 24 34 30 30"
            stroke="#4682B4"
            strokeWidth="2"
            fill="none"
          />
          <path d="M 8 18 Q 4 16 6 20 Q 10 22 8 18" fill="#4682B4" />
          <ellipse cx="24" cy="36" rx="12" ry="6" fill="#4682B4" />
          <path d="M 36 28 Q 42 26 40 30 Q 36 32 36 28" fill="#4682B4" />
          <circle cx="38" cy="16" r="3" fill="#87CEEB" />
        </svg>
      );
    case 'ENFP': // 나비
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse cx="24" cy="24" rx="4" ry="16" fill="#4B0082" />
          <ellipse
            cx="16"
            cy="18"
            rx="8"
            ry="6"
            fill="#FF69B4"
            stroke="#4B0082"
            strokeWidth="1"
          />
          <ellipse
            cx="32"
            cy="18"
            rx="8"
            ry="6"
            fill="#87CEEB"
            stroke="#4B0082"
            strokeWidth="1"
          />
          <ellipse
            cx="16"
            cy="30"
            rx="6"
            ry="4"
            fill="#FFD700"
            stroke="#4B0082"
            strokeWidth="1"
          />
          <ellipse
            cx="32"
            cy="30"
            rx="6"
            ry="4"
            fill="#98FB98"
            stroke="#4B0082"
            strokeWidth="1"
          />
          <circle cx="24" cy="16" r="3" fill="#4B0082" />
          <path d="M 22 14 L 20 12" stroke="#4B0082" strokeWidth="2" />
          <path d="M 26 14 L 28 12" stroke="#4B0082" strokeWidth="2" />
          <circle cx="12" cy="16" r="2" fill="#FFF" />
          <circle cx="36" cy="16" r="2" fill="#FFF" />
          <circle cx="12" cy="28" r="1" fill="#FFF" />
          <circle cx="36" cy="28" r="1" fill="#FFF" />
        </svg>
      );
    case 'ISTJ': // 코끼리
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="24"
            r="16"
            fill="#A0A0A0"
            stroke="#808080"
            strokeWidth="2"
          />
          <ellipse cx="18" cy="18" rx="4" ry="6" fill="#808080" />
          <ellipse cx="30" cy="18" rx="4" ry="6" fill="#808080" />
          <circle cx="20" cy="22" r="2" fill="#808080" />
          <circle cx="28" cy="22" r="2" fill="#808080" />
          <path
            d="M 24 32 Q 20 36 16 34 Q 18 38 24 36"
            stroke="#808080"
            strokeWidth="2"
            fill="none"
          />
          <ellipse cx="24" cy="28" rx="2" ry="3" fill="#808080" />
          <path
            d="M 18 32 Q 24 34 30 32"
            stroke="#808080"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="12" cy="24" r="2" fill="#808080" />
          <circle cx="36" cy="24" r="2" fill="#808080" />
        </svg>
      );
    case 'ISFJ': // 곰
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="26"
            r="16"
            fill="#D2B48C"
            stroke="#8B4513"
            strokeWidth="2"
          />
          <circle cx="16" cy="16" r="6" fill="#8B4513" />
          <circle cx="32" cy="16" r="6" fill="#8B4513" />
          <circle cx="20" cy="24" r="2" fill="#8B4513" />
          <circle cx="28" cy="24" r="2" fill="#8B4513" />
          <ellipse cx="24" cy="28" rx="3" ry="2" fill="#8B4513" />
          <path
            d="M 18 32 Q 24 34 30 32"
            stroke="#8B4513"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="16" cy="16" r="2" fill="#FFF" />
          <circle cx="32" cy="16" r="2" fill="#FFF" />
          <circle cx="16" cy="16" r="1" fill="#8B4513" />
          <circle cx="32" cy="16" r="1" fill="#8B4513" />
          <path
            d="M 36 20 C 36 18 34 16 32 18 C 30 16 28 18 28 20 C 28 22 32 26 32 26 C 32 26 36 22 36 20 Z"
            fill="#FF69B4"
          />
        </svg>
      );
    case 'ESTJ': // 독수리
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="24"
            rx="16"
            ry="14"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          <circle cx="20" cy="20" r="2" fill="#654321" />
          <circle cx="28" cy="20" r="2" fill="#654321" />
          <path d="M 24 24 L 20 26 L 28 26 Z" fill="#654321" />
          <path
            d="M 18 30 Q 24 32 30 30"
            stroke="#654321"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 8 16 Q 4 12 8 10 Q 12 12 10 16 Q 14 14 16 18"
            fill="#654321"
          />
          <path
            d="M 40 16 Q 44 12 40 10 Q 36 12 38 16 Q 34 14 32 18"
            fill="#654321"
          />
          <ellipse cx="24" cy="36" rx="10" ry="4" fill="#654321" />
          <path d="M 16 38 L 14 42" stroke="#654321" strokeWidth="2" />
          <path d="M 32 38 L 34 42" stroke="#654321" strokeWidth="2" />
        </svg>
      );
    case 'ESFJ': // 토끼
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="26"
            r="14"
            fill="#FFB6C1"
            stroke="#FF69B4"
            strokeWidth="2"
          />
          <ellipse cx="20" cy="12" rx="3" ry="8" fill="#FF69B4" />
          <ellipse cx="28" cy="12" rx="3" ry="8" fill="#FF69B4" />
          <ellipse cx="20" cy="14" rx="1" ry="4" fill="#FFB6C1" />
          <ellipse cx="28" cy="14" rx="1" ry="4" fill="#FFB6C1" />
          <circle cx="20" cy="22" r="2" fill="#FF69B4" />
          <circle cx="28" cy="22" r="2" fill="#FF69B4" />
          <ellipse cx="24" cy="26" rx="2" ry="1" fill="#FF69B4" />
          <path
            d="M 18 30 Q 24 32 30 30"
            stroke="#FF69B4"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="18" cy="28" r="1" fill="#FF69B4" />
          <circle cx="30" cy="28" r="1" fill="#FF69B4" />
          <circle cx="24" cy="32" r="1" fill="#FF69B4" />
        </svg>
      );
    case 'ISTP': // 호랑이
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="26"
            rx="16"
            ry="14"
            fill="#FFA500"
            stroke="#FF8C00"
            strokeWidth="2"
          />
          <path d="M 18 14 L 14 8 L 22 12 Z" fill="#FF8C00" />
          <path d="M 30 14 L 34 8 L 26 12 Z" fill="#FF8C00" />
          <circle cx="20" cy="22" r="2" fill="#FF8C00" />
          <circle cx="28" cy="22" r="2" fill="#FF8C00" />
          <ellipse cx="24" cy="28" rx="3" ry="2" fill="#FF8C00" />
          <path
            d="M 16 32 Q 24 36 32 32"
            stroke="#FF8C00"
            strokeWidth="2"
            fill="none"
          />
          <path d="M 12 18 L 16 20" stroke="#000" strokeWidth="2" />
          <path d="M 36 18 L 32 20" stroke="#000" strokeWidth="2" />
          <path d="M 12 22 L 16 24" stroke="#000" strokeWidth="2" />
          <path d="M 36 22 L 32 24" stroke="#000" strokeWidth="2" />
          <path d="M 18 16 L 20 18" stroke="#000" strokeWidth="1" />
          <path d="M 30 16 L 28 18" stroke="#000" strokeWidth="1" />
        </svg>
      );
    case 'ISFP': // 사슴
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="26"
            rx="14"
            ry="16"
            fill="#DEB887"
            stroke="#CD853F"
            strokeWidth="2"
          />
          <path
            d="M 18 12 L 14 6 Q 12 8 14 10 L 16 8 L 18 10 Q 16 12 18 12"
            fill="#CD853F"
          />
          <path
            d="M 30 12 L 34 6 Q 36 8 34 10 L 32 8 L 30 10 Q 32 12 30 12"
            fill="#CD853F"
          />
          <circle cx="20" cy="22" r="2" fill="#CD853F" />
          <circle cx="28" cy="22" r="2" fill="#CD853F" />
          <ellipse cx="24" cy="26" rx="2" ry="1" fill="#CD853F" />
          <path
            d="M 18 30 Q 24 32 30 30"
            stroke="#CD853F"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="16" cy="28" r="1" fill="#CD853F" />
          <circle cx="32" cy="28" r="1" fill="#CD853F" />
          <path d="M 38 22 Q 42 20 40 24 Q 38 26 36 24" fill="#98FB98" />
        </svg>
      );
    case 'ESTP': // 치타
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="26"
            rx="16"
            ry="14"
            fill="#DAA520"
            stroke="#B8860B"
            strokeWidth="2"
          />
          <ellipse cx="18" cy="16" rx="3" ry="4" fill="#B8860B" />
          <ellipse cx="30" cy="16" rx="3" ry="4" fill="#B8860B" />
          <circle cx="20" cy="22" r="2" fill="#B8860B" />
          <circle cx="28" cy="22" r="2" fill="#B8860B" />
          <ellipse cx="24" cy="28" rx="3" ry="2" fill="#B8860B" />
          <path
            d="M 16 32 Q 24 36 32 32"
            stroke="#B8860B"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="16" cy="18" r="1" fill="#000" />
          <circle cx="32" cy="18" r="1" fill="#000" />
          <circle cx="12" cy="22" r="1" fill="#000" />
          <circle cx="36" cy="22" r="1" fill="#000" />
          <circle cx="18" cy="26" r="1" fill="#000" />
          <circle cx="30" cy="26" r="1" fill="#000" />
          <path d="M 40 18 L 44 16 L 42 20" fill="#B8860B" />
        </svg>
      );
    case 'ESFP': // 앵무새
      return (
        <svg style={iconStyles} viewBox="0 0 48 48" fill="none">
          <ellipse
            cx="24"
            cy="24"
            rx="16"
            ry="18"
            fill="#FF6347"
            stroke="#DC143C"
            strokeWidth="2"
          />
          <path d="M 20 8 Q 16 6 14 10 Q 18 12 20 8" fill="#FF69B4" />
          <path d="M 28 8 Q 32 6 34 10 Q 30 12 28 8" fill="#87CEEB" />
          <circle cx="20" cy="20" r="2" fill="#DC143C" />
          <circle cx="28" cy="20" r="2" fill="#DC143C" />
          <path d="M 24 24 L 20 26 L 28 26 Z" fill="#FFD700" />
          <path
            d="M 18 30 Q 24 34 30 30"
            stroke="#DC143C"
            strokeWidth="2"
            fill="none"
          />
          <ellipse
            cx="12"
            cy="24"
            rx="4"
            ry="8"
            fill="#98FB98"
            stroke="#DC143C"
            strokeWidth="1"
          />
          <ellipse
            cx="36"
            cy="24"
            rx="4"
            ry="8"
            fill="#FF69B4"
            stroke="#DC143C"
            strokeWidth="1"
          />
          <ellipse
            cx="24"
            cy="38"
            rx="8"
            ry="4"
            fill="#87CEEB"
            stroke="#DC143C"
            strokeWidth="1"
          />
        </svg>
      );

    default:
      return null;
  }
}
