'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  Play,
} from 'lucide-react';
import { generateSystemPrompt } from '@/lib/prompt';
import { getSession } from 'next-auth/react';

interface MBTIType {
  energy: 'I' | 'E' | null;
  information: 'S' | 'N' | null;
  decisions: 'T' | 'F' | null;
  lifestyle: 'J' | 'P' | null;
}

const mbtiDescriptions = {
  energy: {
    I: {
      title: '내향형 (I)',
      description: '조용하고 차분한 대화를 선호하는 moo',
      examples: ['신중함', '깊이 있는 대화'],
      icon: '🧘‍♀️',
      color: 'from-slate-400 to-slate-500',
    },
    E: {
      title: '외향형 (E)',
      description: '활발하고 에너지 넘치는 대화를 하는 moo',
      examples: ['활발함', '적극적'],
      icon: '🎉',
      color: 'from-amber-400 to-orange-500',
    },
  },
  information: {
    S: {
      title: '감각형 (S)',
      description: '구체적이고 실용적인 조언을 주는 moo',
      examples: ['현실적', '구체적'],
      icon: '👩‍💼',
      color: 'from-blue-400 to-cyan-500',
    },
    N: {
      title: '직관형 (N)',
      description: '창의적이고 미래지향적인 아이디어를 제시하는 moo',
      examples: ['창의적', '상상력 풍부'],
      icon: '🎨',
      color: 'from-purple-400 to-pink-500',
    },
  },
  decisions: {
    T: {
      title: '사고형 (T)',
      description: '논리적이고 객관적인 분석을 해주는 moo',
      examples: ['논리적', '분석적'],
      icon: '👨‍🔬',
      color: 'from-indigo-400 to-blue-500',
    },
    F: {
      title: '감정형 (F)',
      description: '공감하고 따뜻하게 위로해주는 moo',
      examples: ['공감적', '따뜻함'],
      icon: '🤗',
      color: 'from-rose-400 to-pink-500',
    },
  },
  lifestyle: {
    J: {
      title: '판단형 (J)',
      description: '체계적이고 계획적인 조언을 주는 moo',
      examples: ['계획적', '체계적'],
      icon: '📋',
      color: 'from-emerald-400 to-green-500',
    },
    P: {
      title: '인식형 (P)',
      description: '유연하고 자유로운 사고를 하는 moo',
      examples: ['유연함', '자유로움'],
      icon: '🎭',
      color: 'from-teal-400 to-cyan-500',
    },
  },
};

const steps = [
  {
    key: 'energy' as keyof MBTIType,
    title: '대화 스타일',
    subtitle: '어떤 스타일로 대화하는 moo를 원하나요?',
    icon: '🔋',
  },
  {
    key: 'information' as keyof MBTIType,
    title: '정보 전달 방식',
    subtitle: '어떤 방식으로 정보를 전달하는 moo를 원하나요?',
    icon: '🧠',
  },
  {
    key: 'decisions' as keyof MBTIType,
    title: '조언 스타일',
    subtitle: '어떤 방식으로 조언하는 moo를 원하나요?',
    icon: '💭',
  },
  {
    key: 'lifestyle' as keyof MBTIType,
    title: '사고 방식',
    subtitle: '어떤 사고 방식을 가진 moo를 원하나요?',
    icon: '🎯',
  },
  {
    key: 'name' as const,
    title: 'moo 이름 정하기',
    subtitle: '새로운 AI 친구에게 특별한 이름을 지어주세요',
    icon: '🏷️',
  },
];

export default function CreateAIPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [mbtiTypes, setMbtiTypes] = useState<MBTIType>({
    energy: null,
    information: null,
    decisions: null,
    lifestyle: null,
  });
  const [mooName, setMooName] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const handleTypeSelect = (
    category: keyof MBTIType,
    value: 'I' | 'E' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
  ) => {
    setMbtiTypes((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
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
      alert('모든 항목을 선택하고 moo 이름을 입력해주세요.');
      return;
    }

    try {
      const session = await getSession();
      if (!session?.user?.id) {
        alert('로그인이 필요합니다.');
        return;
      }

      const mbti = `${mbtiTypes.energy}${mbtiTypes.information}${mbtiTypes.decisions}${mbtiTypes.lifestyle}`;
      const systemPrompt = generateSystemPrompt(mbti, mooName);

      const response = await fetch('/api/custom-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error('moo 생성에 실패했습니다.');
      }

      alert('moo가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('moo 생성 에러:', error);
      alert('moo 생성 중 오류가 발생했습니다.');
    }
  };

  const currentStepData = steps[currentStep];
  const currentCategory = currentStepData?.key as keyof MBTIType;
  const currentOptions = currentCategory
    ? mbtiDescriptions[currentCategory]
    : {};
  const isCurrentStepComplete = currentCategory
    ? mbtiTypes[currentCategory] !== null
    : false;

  const selectedMBTI = `${mbtiTypes.energy || '❓'}${
    mbtiTypes.information || '❓'
  }${mbtiTypes.decisions || '❓'}${mbtiTypes.lifestyle || '❓'}`;

  // 인트로 화면
  if (showIntro) {
    return (
      <div className="h-[100dvh] bg-stone-100 flex flex-col justify-between overflow-hidden">
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
                  <span className="text-green-600 font-semibold text-sm">
                    1
                  </span>
                </div>
                <p className="text-gray-700">원하는 대화 스타일 선택</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">
                    2
                  </span>
                </div>
                <p className="text-gray-700">moo의 성향 4가지 설정</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">
                    3
                  </span>
                </div>
                <p className="text-gray-700">특별한 이름 지어주기</p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mb-2">
            <p>약 2분 정도 소요됩니다</p>
          </div>
        </div>

        <div className="px-6 pb-24">
          <Button
            onClick={() => setShowIntro(false)}
            className="w-full h-16 rounded-3xl text-lg font-semibold bg-green-700 hover:bg-green-800 text-white shadow-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            시작하기
          </Button>
        </div>
      </div>
    );
  }

  // 요약 보기 모달
  if (showSummary) {
    return (
      <div className="min-h-screen bg-stone-100">
        <div className="sticky top-0 z-10 bg-stone-100/90 backdrop-blur-lg">
          <div className="flex items-center justify-between p-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSummary(false)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-green-700 font-semibold text-lg">
              선택 요약
            </div>
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
              const selectedOption = selectedValue
                ? (
                    mbtiDescriptions[step.key as keyof MBTIType] as Record<
                      string,
                      {
                        title: string;
                        description: string;
                        examples: string[];
                        icon: string;
                        color: string;
                      }
                    >
                  )[selectedValue]
                : null;

              return (
                <div
                  key={step.key}
                  onClick={() => {
                    setCurrentStep(index);
                    setShowSummary(false);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isCompleted
                      ? 'border-green-200 bg-green-50'
                      : 'border-stone-200 bg-white'
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
                      {selectedOption ? (
                        <p className="text-sm text-gray-600">
                          {selectedOption.title}
                        </p>
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
              onClick={() => {
                setCurrentStep(4);
                setShowSummary(false);
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                mooName
                  ? 'border-green-200 bg-green-50'
                  : 'border-stone-200 bg-white'
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

  // 메인 단계별 진행 화면
  return (
    <div className="h-[100dvh] bg-stone-100 flex flex-col justify-between overflow-hidden">
      <div>
        <div className="sticky top-0 z-10 bg-stone-100/90 backdrop-blur-lg">
          <div className="flex items-center justify-between p-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-green-700 font-semibold text-lg">
              {currentStep + 1}/5 단계
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSummary(true)}
              className="rounded-full"
            >
              <Eye className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 개선된 단계 인디케이터 */}
        <div className="px-6 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-center gap-2 mb-3">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-6 rounded-full transition-all duration-300 ${
                    index <= currentStep ? 'bg-green-600' : 'bg-stone-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">
                {currentStep < 4
                  ? `${Object.values(mbtiTypes).filter(Boolean).length}/4 완료`
                  : mooName
                  ? '5/5 완료'
                  : '4/5 완료'}
              </div>
              <div className="text-sm text-gray-600">
                {currentStep < 4 ? (
                  <>
                    선택한 타입:{' '}
                    <span className="font-medium text-green-600">
                      {selectedMBTI}
                    </span>
                  </>
                ) : (
                  <>
                    moo의 타입:{' '}
                    <span className="font-medium text-green-600">
                      {selectedMBTI}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          {/* Step Header */}
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">{currentStepData.icon}</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 text-sm">{currentStepData.subtitle}</p>
          </div>

          {/* 이름 입력 단계 */}
          {currentStep === 4 ? (
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <Input
                type="text"
                value={mooName}
                onChange={(e) => setMooName(e.target.value)}
                placeholder="moo의 이름을 입력해주세요"
                className="border-0 focus:border-2 focus:border-green-600 rounded-2xl h-16 text-lg bg-stone-50 text-center focus:bg-white transition-all"
              />
            </div>
          ) : (
            /* MBTI 선택 단계 */
            <div className="space-y-2 mb-2">
              {Object.entries(currentOptions).map(([key, data]) => {
                const option = data as {
                  title: string;
                  description: string;
                  examples: string[];
                  icon: string;
                  color: string;
                };
                return (
                  <div
                    key={key}
                    onClick={() =>
                      handleTypeSelect(
                        currentCategory,
                        key as 'I' | 'E' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
                      )
                    }
                    className={`relative py-3 px-3 rounded-2xl border-2 transition-all duration-300 active:scale-95 cursor-pointer ${
                      mbtiTypes[currentCategory] === key
                        ? 'border-green-600 bg-green-50 shadow-lg'
                        : 'border-stone-200 bg-white hover:border-green-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-lg shadow-md flex-shrink-0`}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-base mb-1">
                          {option.title}
                        </h4>
                        <p className="text-gray-600 text-xs mb-2 leading-relaxed">
                          {option.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {option.examples.map(
                            (example: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-stone-100 text-gray-600 text-xs rounded-full"
                              >
                                {example}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-24 bg-stone-100/90 backdrop-blur-lg">
        <Button
          onClick={currentStep === 4 ? handleSubmit : handleNext}
          disabled={!isCurrentStepComplete}
          className={`w-full h-16 rounded-3xl text-lg font-semibold transition-all duration-300 ${
            isCurrentStepComplete
              ? 'bg-green-700 hover:bg-green-800 text-white shadow-lg'
              : 'bg-stone-300 text-stone-500'
          }`}
        >
          {currentStep === 4 ? (
            isCurrentStepComplete ? (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {mooName} 만들기
              </>
            ) : (
              'moo 이름을 입력해주세요'
            )
          ) : isCurrentStepComplete ? (
            <>
              다음 단계
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            '선택지를 골라주세요'
          )}
        </Button>
      </div>
    </div>
  );
}
