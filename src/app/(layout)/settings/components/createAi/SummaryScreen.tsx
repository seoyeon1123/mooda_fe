"use client";

import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface MBTIType {
  energy: "I" | "E" | null;
  information: "S" | "N" | null;
  decisions: "T" | "F" | null;
  lifestyle: "J" | "P" | null;
}

interface Step {
  key: keyof MBTIType;
  title: string;
  subtitle: string;
  icon: string;
}

interface SummaryScreenProps {
  mbtiTypes: MBTIType;
  mooName: string;
  steps: Step[];
  onBack: () => void;
  onStepSelect: (stepIndex: number) => void;
}

export default function SummaryScreen({
  mbtiTypes,
  mooName,
  steps,
  onBack,
  onStepSelect,
}: SummaryScreenProps) {
  return (
    <div className=" bg-stone-100">
      <div className="sticky top-0 z-10 bg-stone-100/90 backdrop-blur-lg">
        <div className="flex items-center justify-between p-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-green-700 font-semibold text-lg">선택 요약</div>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-6 pb-20">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            지금까지 선택한 내용
          </h2>
          <p className="text-gray-600">수정하고 싶은 항목을 탭해보세요</p>
        </div>

        <div className="space-y-4">
          {steps.slice(0, 4).map((step, index) => {
            const selectedValue = mbtiTypes[step.key as keyof MBTIType];
            const isCompleted = selectedValue !== null;

            return (
              <div
                key={step.key}
                onClick={() => isCompleted && onStepSelect(index)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isCompleted
                    ? "border-green-200 bg-green-50 cursor-pointer hover:bg-green-100"
                    : "border-stone-200 bg-stone-50 cursor-not-allowed opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{step.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">
                        {step.title}
                      </h3>
                      {isCompleted && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    {selectedValue ? (
                      <p className="text-sm text-gray-600">{selectedValue}</p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        아직 선택하지 않음
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            );
          })}

          {/* 이름 단계 */}
          <div
            onClick={() => mooName && onStepSelect(4)}
            className={`p-4 rounded-2xl border-2 transition-all ${
              mooName
                ? "border-green-200 bg-green-50 cursor-pointer hover:bg-green-100"
                : "border-stone-200 bg-stone-50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">🏷️</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">
                    moo 이름 정하기
                  </h3>
                  {mooName && <Check className="w-4 h-4 text-green-600" />}
                </div>
                {mooName ? (
                  <p className="text-sm text-gray-600">{mooName}</p>
                ) : (
                  <p className="text-sm text-gray-400">아직 입력하지 않음</p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
