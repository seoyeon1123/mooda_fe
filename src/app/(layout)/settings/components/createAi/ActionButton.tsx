"use client";

import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";

interface ActionButtonProps {
  currentStep: number;
  isStepComplete: boolean;
  mooName: string;
  onNext: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ActionButton({
  currentStep,
  isStepComplete,
  mooName,
  onNext,
  onSubmit,
}: ActionButtonProps) {
  const isLastStep = currentStep === 4;

  return (
    <div className="px-6 pt-4 pb-10 bg-stone-100/90 backdrop-blur-lg">
      <Button
        onClick={isLastStep ? onSubmit : onNext}
        disabled={!isStepComplete}
        className={`w-full h-16 rounded-3xl text-lg font-semibold transition-all duration-300 ${
          isStepComplete
            ? "bg-green-700 hover:bg-green-800 text-white shadow-lg "
            : "bg-stone-300 text-stone-500"
        }`}
      >
        {isLastStep ? (
          isStepComplete ? (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              {mooName} 만들기
            </>
          ) : (
            "moo 이름을 입력해주세요"
          )
        ) : isStepComplete ? (
          <>
            다음 단계
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        ) : (
          "선택지를 골라주세요"
        )}
      </Button>
    </div>
  );
}
