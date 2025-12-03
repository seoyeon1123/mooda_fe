"use client";

import { Button } from "@/components/ui/Button";
import { Play, AlertCircle } from "lucide-react";

interface IntroScreenProps {
  onStart: () => void;
  isAtLimit?: boolean;
  currentCount?: number;
}

export default function IntroScreen({ 
  onStart, 
  isAtLimit = false, 
  currentCount = 0 
}: IntroScreenProps) {
  return (
    <div className=" bg-stone-100 flex flex-col justify-between overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-20">
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🤖</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            나만의 moo 만들기
          </h1>
          <p className="text-gray-600 leading-relaxed text-lg">
            MBTI를 기반으로 당신이 원하는
            <br />
            성향의 AI 친구를 만들어보세요
          </p>
        </div>

        {isAtLimit && (
          <div className="w-full mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 mb-1">
                  최대 개수에 도달했습니다
                </p>
                <p className="text-xs text-amber-700">
                  커스텀 Moo는 최대 10개까지 만들 수 있습니다.
                  <br />
                  기존 Moo를 삭제한 후 다시 시도해주세요. (현재: {currentCount}/10)
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-3 mb-3 shadow-sm w-full">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">1</span>
              </div>
              <p className="text-gray-700">원하는 대화 스타일 선택</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">2</span>
              </div>
              <p className="text-gray-700">moo의 성향 4가지 설정</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">3</span>
              </div>
              <p className="text-gray-700">특별한 이름 지어주기</p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mb-2">
          <p>약 2분 정도 소요됩니다</p>
        </div>
      </div>

      <div className="px-6 py-16">
        <Button
          onClick={onStart}
          disabled={isAtLimit}
          className={`w-full h-16 rounded-3xl text-lg font-semibold shadow-lg ${
            isAtLimit
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-700 hover:bg-green-800 text-white'
          }`}
        >
          <Play className="w-5 h-5 mr-2" />
          {isAtLimit ? '최대 개수 도달' : '시작하기'}
        </Button>
      </div>
    </div>
  );
}
