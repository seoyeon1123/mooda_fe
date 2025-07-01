'use client';
import React, { useEffect, useState } from 'react';

interface MooIconProps {
  type: 'friendly' | 'wise' | 'energetic' | 'calm' | 'user' | 'default';
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

    default:
      return null;
  }
}
