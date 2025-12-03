"use client";

import { useState, useEffect } from "react";
import { generateSystemPrompt } from "@/lib/prompt";
import { getSession } from "next-auth/react";
import { XIcon } from "lucide-react";

import IntroScreen from "@/app/(layout)/settings/components/createAi/IntroScreen";
import SummaryScreen from "@/app/(layout)/settings/components/createAi/SummaryScreen";
import Header from "@/app/(layout)/settings/components/createAi/Header";
import StepIndicator from "@/app/(layout)/settings/components/createAi/StepIndicator";
import MBTISelectionStep from "@/app/(layout)/settings/components/createAi/MBTISelectionStep";
import NameInputStep from "@/app/(layout)/settings/components/createAi/NameInputStep";
import ActionButton from "@/app/(layout)/settings/components/createAi/ActionButton";

import {
  MBTIType,
  mbtiDescriptions,
  steps,
  nameStep,
} from "@/app/(layout)/settings/components/createAi/types";

interface CreateAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateAIModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAIModalProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [mbtiTypes, setMbtiTypes] = useState<MBTIType>({
    energy: null,
    information: null,
    decisions: null,
    lifestyle: null,
  });
  const [mooName, setMooName] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [customAICount, setCustomAICount] = useState(0);
  const [isAtLimit, setIsAtLimit] = useState(false);

  // 커스텀 AI 개수 확인
  useEffect(() => {
    const checkCustomAICount = async () => {
      if (!isOpen) return;
      
      try {
        const session = await getSession();
        if (!session?.user?.id) return;

        const response = await fetch(`/api/custom-ai?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 0;
          setCustomAICount(count);
          setIsAtLimit(count >= 10);
        }
      } catch (error) {
        console.error('커스텀 AI 개수 확인 실패:', error);
      }
    };

    if (isOpen) {
      checkCustomAICount();
    }
  }, [isOpen]);

  const handleTypeSelect = (
    category: keyof MBTIType,
    value: "I" | "E" | "S" | "N" | "T" | "F" | "J" | "P"
  ) => {
    setMbtiTypes((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep === 0) {
      // 첫 번째 단계에서 이전 버튼을 누르면 인트로 화면으로 돌아가기
      setShowIntro(true);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !mbtiTypes.energy ||
      !mbtiTypes.information ||
      !mbtiTypes.decisions ||
      !mbtiTypes.lifestyle ||
      !mooName
    ) {
      alert("모든 항목을 선택하고 moo 이름을 입력해주세요.");
      return;
    }

    try {
      const session = await getSession();
      if (!session?.user?.id) {
        alert("로그인이 필요합니다.");
        return;
      }

      const mbti = `${mbtiTypes.energy}${mbtiTypes.information}${mbtiTypes.decisions}${mbtiTypes.lifestyle}`;
      const systemPrompt = generateSystemPrompt(mbti, mooName);

      const response = await fetch("/api/custom-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          name: mooName,
          description: `${mbti} 성향의 AI 친구`,
          mbtiTypes: {
            energy: mbtiTypes.energy,
            information: mbtiTypes.information,
            decisions: mbtiTypes.decisions,
            lifestyle: mbtiTypes.lifestyle,
          },
          systemPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.message) {
          alert(errorData.message);
          return;
        }
        throw new Error("moo 생성에 실패했습니다.");
      }

      alert("moo가 성공적으로 생성되었습니다!");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("moo 생성 에러:", error);
      alert("moo 생성 중 오류가 발생했습니다.");
    }
  };

  const handleClose = () => {
    // 상태 초기화
    setShowIntro(true);
    setCurrentStep(0);
    setMbtiTypes({
      energy: null,
      information: null,
      decisions: null,
      lifestyle: null,
    });
    setMooName("");
    setShowSummary(false);
    onClose();
  };

  const currentStepData = currentStep < 4 ? steps[currentStep] : nameStep;
  const currentCategory = currentStep < 4 ? steps[currentStep]?.key : null;
  const currentOptions = currentCategory
    ? mbtiDescriptions[currentCategory]
    : {};
  const isCurrentStepComplete =
    currentStep < 4
      ? currentCategory
        ? mbtiTypes[currentCategory] !== null
        : false
      : mooName.length > 0;

  const selectedMBTI = `${mbtiTypes.energy || "❓"}${
    mbtiTypes.information || "❓"
  }${mbtiTypes.decisions || "❓"}${mbtiTypes.lifestyle || "❓"}`;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            새로운 Moo 만들기
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* 인트로 화면 */}
          {showIntro ? (
            <IntroScreen 
              onStart={() => {
                if (isAtLimit) {
                  alert('커스텀 Moo는 최대 10개까지 만들 수 있습니다.\n기존 Moo를 삭제한 후 다시 시도해주세요.');
                  return;
                }
                setShowIntro(false);
              }}
              isAtLimit={isAtLimit}
              currentCount={customAICount}
            />
          ) : showSummary ? (
            /* 요약 보기 모달 */
            <SummaryScreen
              mbtiTypes={mbtiTypes}
              mooName={mooName}
              steps={steps}
              onBack={() => setShowSummary(false)}
              onStepSelect={(stepIndex) => {
                setCurrentStep(stepIndex);
                setShowSummary(false);
              }}
            />
          ) : (
            /* 메인 단계별 진행 화면 */
            <div className="bg-stone-100 flex flex-col justify-between overflow-hidden">
              <div>
                <Header
                  currentStep={currentStep}
                  totalSteps={5}
                  onPrev={handlePrev}
                  onShowSummary={() => setShowSummary(true)}
                />

                <StepIndicator
                  currentStep={currentStep}
                  totalSteps={5}
                  completedCount={
                    Object.values(mbtiTypes).filter(Boolean).length
                  }
                  selectedMBTI={selectedMBTI}
                  mooName={mooName}
                />

                <div className="px-6 py-4 overflow-y-auto">
                  {/* Step Header */}
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">{currentStepData.icon}</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {currentStepData.title}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {currentStepData.subtitle}
                    </p>
                  </div>

                  {/* 이름 입력 단계 */}
                  {currentStep === 4 ? (
                    <NameInputStep
                      mooName={mooName}
                      onNameChange={setMooName}
                    />
                  ) : currentCategory ? (
                    /* MBTI 선택 단계 */
                    <MBTISelectionStep
                      options={currentOptions}
                      selectedValue={mbtiTypes[currentCategory]}
                      onSelect={(value) =>
                        handleTypeSelect(currentCategory, value)
                      }
                    />
                  ) : null}
                </div>

                <ActionButton
                  currentStep={currentStep}
                  isStepComplete={isCurrentStepComplete}
                  mooName={mooName}
                  onNext={handleNext}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
