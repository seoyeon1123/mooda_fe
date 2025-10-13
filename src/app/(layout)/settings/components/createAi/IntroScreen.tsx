"use client";

import { Button } from "@/components/ui/Button";
import { Play } from "lucide-react";

interface IntroScreenProps {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
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
          className="w-full h-16 rounded-3xl text-lg font-semibold bg-green-700 hover:bg-green-800 text-white shadow-lg"
        >
          <Play className="w-5 h-5 mr-2" />
          시작하기
        </Button>
      </div>
    </div>
  );
}
