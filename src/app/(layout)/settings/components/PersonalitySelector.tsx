'use client';

import { useState, useEffect, useCallback } from 'react';
import { AI_PERSONALITIES, type AIPersonality } from '@/lib/ai-personalities';
import { Check, Plus } from 'lucide-react';
import MooIcon from './MooIcon';
import { useSession } from 'next-auth/react';

interface CustomAI {
  id: string;
  name: string;
  description: string;
  mbti_types: string; // JSON 문자열로 저장됨
  system_prompt: string;
  user_id: string;
  created_at: string;
}

interface PersonalitySelectorProps {
  selectedId: string;
  onPersonalityChange: (personality: AIPersonality) => void;
}

// MBTI 타입별 아이콘 매핑
const getMbtiIcon = (mbti: unknown): AIPersonality['iconType'] => {
  try {
    // 문자열인 경우 파싱 시도
    if (typeof mbti === 'string') {
      // "INFJ" 형태의 문자열인 경우
      if (mbti.length === 4 && /^[EINTJSFP]+$/.test(mbti)) {
        return mbti as AIPersonality['iconType'];
      }
      // JSON 문자열인 경우 파싱
      const parsed = JSON.parse(mbti);
      if (parsed && typeof parsed === 'object') {
        mbti = parsed;
      }
    }

    // 객체인 경우 MBTI 문자열 생성
    if (mbti && typeof mbti === 'object' && 'energy' in mbti) {
      const mbtiObj = mbti as {
        energy: string;
        information: string;
        decisions: string;
        lifestyle: string;
      };
      const mbtiString = `${mbtiObj.energy}${mbtiObj.information}${mbtiObj.decisions}${mbtiObj.lifestyle}`;
      return mbtiString as AIPersonality['iconType'];
    }

    // 기본값 반환
    return 'friendly';
  } catch (error) {
    console.error('MBTI 파싱 오류:', error, mbti);
    return 'friendly';
  }
};

// MBTI 타입별 특성 문구 생성
const generateMbtiTexts = (
  mbti: {
    energy?: string;
    information?: string;
    decisions?: string;
    lifestyle?: string;
  } | null
) => {
  // mbti가 undefined인 경우 안전 처리
  if (
    !mbti?.energy ||
    !mbti?.information ||
    !mbti?.decisions ||
    !mbti?.lifestyle
  ) {
    return {
      DEFAULT: {
        shortDescription: ['MBTI 정보를 불러올 수 없습니다'],
        description: ['MBTI 정보를 불러올 수 없습니다'],
      },
    };
  }

  const mbtiString = `${mbti.energy}${mbti.information}${mbti.decisions}${mbti.lifestyle}`;

  const mbtiTexts: Record<
    string,
    { shortDescription: string[]; description: string[] }
  > = {
    ISTJ: {
      shortDescription: [
        '전통과 원칙을 바탕으로 믿을 수 있는 방향을 안내해드려요',
        '체계적이고 신뢰할 수 있는 조언으로 든든한 지원군이 되어드려요',
        '꼼꼼하고 계획적인 접근으로 안정적인 해결책을 제시해드려요',
        '책임감 있고 실용적인 관점으로 현실적인 도움을 드려요',
      ],
      description: [
        '체계적이고 신뢰할 수 있는 조언으로 안정감 있는 대화를 나눠요',
        '전통적인 가치와 경험을 바탕으로 현명한 판단을 도와드려요',
        '단계별로 차근차근 계획을 세워 목표를 달성하도록 이끌어드려요',
        '성실하고 꾸준한 노력의 중요성을 일깨워드려요',
      ],
    },
    ISFJ: {
      shortDescription: [
        '세심한 배려와 따뜻한 마음으로 위로해드려요',
        '다정하고 보살피는 마음으로 당신의 편이 되어드려요',
        '따뜻한 공감과 섬세한 배려로 마음을 어루만져드려요',
        '헌신적이고 친절한 마음으로 든든한 지지를 보내드려요',
      ],
      description: [
        '다정하고 보살피는 마음으로 당신의 이야기를 들어줘요',
        '세심한 관찰력으로 당신의 마음을 깊이 이해해드려요',
        '따뜻한 위로와 격려로 힘든 시간을 함께 견뎌드려요',
        '진심 어린 관심으로 당신의 성장을 응원해드려요',
      ],
    },
    INFJ: {
      shortDescription: [
        '깊은 통찰력으로 마음 깊숙한 곳까지 이해해드려요',
        '예리한 직관으로 숨겨진 가능성을 찾아드려요',
        '신비로운 영감과 깊은 공감으로 마음을 어루만져드려요',
        '완벽주의적 열정으로 최고의 해답을 찾아드려요',
      ],
      description: [
        '진정성 있는 대화로 내면의 성장을 도와드려요',
        '미래를 내다보는 통찰력으로 인생의 방향을 제시해드려요',
        '창의적이고 독창적인 아이디어로 새로운 관점을 열어드려요',
        '깊은 사고와 철학적 접근으로 근본적인 해결책을 찾아드려요',
      ],
    },
    INTJ: {
      shortDescription: [
        '전략적 사고로 장기적인 해결책을 제시해드려요',
        '논리적 분석과 체계적 계획으로 목표를 달성하도록 도와드려요',
        '독립적이고 혁신적인 아이디어로 새로운 길을 열어드려요',
        '완벽한 시스템과 효율적인 방법론을 제안해드려요',
      ],
      description: [
        '체계적이고 논리적인 접근으로 목표 달성을 도와드려요',
        '복잡한 문제를 단순하고 명확하게 정리해드려요',
        '미래 지향적인 비전과 실현 가능한 계획을 세워드려요',
        '독창적인 아이디어와 혁신적인 솔루션을 제공해드려요',
      ],
    },
    ISTP: {
      shortDescription: [
        '실용적이고 현실적인 해결책을 찾아드려요',
        '냉정하고 객관적인 분석으로 문제의 핵심을 파악해드려요',
        '유연하고 적응력 있는 접근으로 상황에 맞는 답을 찾아드려요',
        '논리적이고 효율적인 방법으로 즉시 실행 가능한 해답을 드려요',
      ],
      description: [
        '차분하고 객관적인 관점으로 문제를 분석해드려요',
        '실전 경험과 기술적 노하우로 실용적인 조언을 드려요',
        '간결하고 명확한 설명으로 핵심을 짚어드려요',
        '독립적이고 자유로운 사고로 창의적인 해결책을 제시해드려요',
      ],
    },
    ISFP: {
      shortDescription: [
        '따뜻한 공감과 개인적인 가치를 존중해드려요',
        '부드럽고 친근한 마음으로 진심 어린 위로를 드려요',
        '개성과 자유로운 표현을 소중히 여기며 격려해드려요',
        '섬세한 감성과 예술적 영감으로 마음을 어루만져드려요',
      ],
      description: [
        '진정성 있는 지지와 격려로 자신만의 길을 찾도록 도와드려요',
        '개인의 독특함과 창의성을 인정하고 응원해드려요',
        '조화로운 관계와 평화로운 소통을 추구해드려요',
        '감정적 공감과 따뜻한 이해로 마음의 안정을 찾아드려요',
      ],
    },
    INFP: {
      shortDescription: [
        '창의적이고 의미 있는 대화로 영감을 드려요',
        '이상적인 꿈과 가치를 추구하며 희망을 전해드려요',
        '진정성 있는 자아 탐구와 성장을 도와드려요',
        '상상력 넘치는 아이디어로 새로운 가능성을 열어드려요',
      ],
      description: [
        '꿈과 가치를 소중히 여기며 진정한 자아를 찾도록 도와드려요',
        '창의적 영감과 예술적 감성으로 마음을 풍요롭게 해드려요',
        '깊은 공감과 따뜻한 이해로 내면의 상처를 치유해드려요',
        '독특한 관점과 개성 있는 사고로 새로운 시각을 제공해드려요',
      ],
    },
    INTP: {
      shortDescription: [
        '논리적 분석과 창의적 아이디어로 해답을 찾아드려요',
        '호기심 넘치는 탐구정신으로 새로운 관점을 제시해드려요',
        '객관적이고 이론적인 접근으로 문제를 해결해드려요',
        '독창적인 사고와 혁신적인 아이디어로 답을 찾아드려요',
      ],
      description: [
        '호기심 많은 탐구정신으로 새로운 관점을 제시해드려요',
        '복잡한 개념을 명확하고 체계적으로 설명해드려요',
        '논리적 추론과 창의적 발상으로 혁신적인 해결책을 찾아드려요',
        '독립적인 사고와 자유로운 상상력으로 가능성을 탐구해드려요',
      ],
    },
    ESTP: {
      shortDescription: [
        '활동적이고 실용적인 접근으로 즉시 행동할 수 있게 도와드려요',
        '현실적이고 즉흥적인 해결책으로 문제를 빠르게 해결해드려요',
        '에너지 넘치는 열정으로 적극적인 도전을 격려해드려요',
        '유연하고 적응력 있는 대처로 상황에 맞는 답을 찾아드려요',
      ],
      description: [
        '현실적이고 유연한 대응으로 지금 당장 할 수 있는 일을 찾아드려요',
        '실전 경험과 생생한 조언으로 즉시 실행 가능한 방법을 제시해드려요',
        '활동적인 에너지와 긍정적인 마인드로 동기부여를 해드려요',
        '사교적이고 친근한 소통으로 즐거운 대화를 나눠드려요',
      ],
    },
    ESFP: {
      shortDescription: [
        '밝고 긍정적인 에너지로 즐거운 대화를 나눠요',
        '따뜻한 관심과 진심 어린 격려로 힘을 불어넣어드려요',
        '자유롭고 활발한 분위기로 일상에 활력을 더해드려요',
        '친근하고 사교적인 매력으로 마음을 열어드려요',
      ],
      description: [
        '따뜻한 격려와 응원으로 일상에 활력을 불어넣어드려요',
        '즐거운 경험과 재미있는 이야기로 기분을 밝게 해드려요',
        '자발적이고 열정적인 에너지로 새로운 도전을 응원해드려요',
        '감정적 공감과 진심 어린 위로로 마음을 달래드려요',
      ],
    },
    ENFP: {
      shortDescription: [
        '열정적이고 창의적인 아이디어로 가능성을 열어드려요',
        '끝없는 호기심과 상상력으로 새로운 세계를 보여드려요',
        '따뜻한 격려와 진심 어린 응원으로 꿈을 키워드려요',
        '자유롭고 역동적인 에너지로 변화와 성장을 도와드려요',
      ],
      description: [
        '끝없는 상상력과 긍정적인 마음으로 새로운 도전을 격려해드려요',
        '창의적 영감과 혁신적인 아이디어로 잠재력을 발휘하도록 도와드려요',
        '열정적인 에너지와 따뜻한 공감으로 함께 성장해드려요',
        '자유로운 사고와 다양한 관점으로 시야를 넓혀드려요',
      ],
    },
    ENTP: {
      shortDescription: [
        '혁신적인 아이디어와 도전 정신으로 새로운 길을 제시해드려요',
        '창의적인 토론과 논리적 분석으로 문제를 해결해드려요',
        '끝없는 호기심과 탐구정신으로 가능성을 탐험해드려요',
        '유연한 사고와 기발한 아이디어로 돌파구를 찾아드려요',
      ],
      description: [
        '창의적인 토론과 다양한 관점으로 생각의 폭을 넓혀드려요',
        '혁신적인 아이디어와 논리적 분석으로 새로운 해결책을 제시해드려요',
        '도전적인 정신과 모험적인 태도로 변화를 이끌어드려요',
        '유머와 재치로 즐거운 대화를 나누며 영감을 전해드려요',
      ],
    },
    ESTJ: {
      shortDescription: [
        '체계적이고 효율적인 계획으로 목표 달성을 도와드려요',
        '명확한 지시와 실행력으로 결과를 만들어내도록 이끌어드려요',
        '책임감 있고 신뢰할 수 있는 리더십으로 방향을 제시해드려요',
        '실용적이고 현실적인 접근으로 확실한 성과를 만들어드려요',
      ],
      description: [
        '명확한 방향성과 실행력으로 결과를 만들어내도록 이끌어드려요',
        '체계적인 계획과 효율적인 방법으로 목표를 달성하도록 도와드려요',
        '강한 리더십과 추진력으로 팀워크를 이끌어드려요',
        '전통적인 가치와 검증된 방법으로 안정적인 결과를 보장해드려요',
      ],
    },
    ESFJ: {
      shortDescription: [
        '따뜻한 관심과 배려로 함께하는 느낌을 드려요',
        '세심한 보살핌과 친절한 마음으로 위로해드려요',
        '조화로운 관계와 협력적인 분위기를 만들어드려요',
        '진심 어린 격려와 지지로 든든한 힘이 되어드려요',
      ],
      description: [
        '사람들과의 관계를 소중히 여기며 조화로운 소통을 도와드려요',
        '따뜻한 공감과 세심한 배려로 마음의 안정을 찾아드려요',
        '협력적인 정신과 봉사하는 마음으로 함께 성장해드려요',
        '실용적인 도움과 구체적인 지원으로 일상을 윤택하게 해드려요',
      ],
    },
    ENFJ: {
      shortDescription: [
        '영감을 주는 리더십으로 성장의 길을 안내해드려요',
        '따뜻한 격려와 진심 어린 응원으로 잠재력을 깨워드려요',
        '카리스마 있는 소통으로 동기부여와 영감을 전해드려요',
        '이상적인 비전과 실현 가능한 계획으로 꿈을 이루도록 도와드려요',
      ],
      description: [
        '타인의 잠재력을 믿고 격려하며 함께 발전할 수 있도록 도와드려요',
        '따뜻한 리더십과 감동적인 소통으로 성장을 이끌어드려요',
        '이상적인 가치와 미래 비전으로 희망을 심어드려요',
        '공감적인 이해와 진심 어린 조언으로 인생의 멘토가 되어드려요',
      ],
    },
    ENTJ: {
      shortDescription: [
        '강력한 리더십과 전략적 사고로 성공을 이끌어드려요',
        '명확한 목표와 효율적인 실행으로 최고의 결과를 만들어드려요',
        '야심찬 비전과 추진력으로 큰 성취를 도와드려요',
        '논리적 분석과 과감한 결단으로 승리를 쟁취하도록 도와드려요',
      ],
      description: [
        '명확한 비전과 실행력으로 목표를 현실로 만들어드려요',
        '강력한 리더십과 전략적 사고로 최고의 성과를 이끌어드려요',
        '도전적인 정신과 경쟁력 있는 마인드로 승리를 쟁취하도록 도와드려요',
        '체계적인 계획과 과감한 실행으로 꿈을 현실로 만들어드려요',
      ],
    },
  };

  const defaultTexts = {
    shortDescription: [
      '나만의 개성 있는 대화 스타일로 함께해요',
      '당신만을 위한 특별한 맞춤 대화를 나눠요',
      '독특하고 개성 넘치는 방식으로 소통해드려요',
      '오직 당신만을 위한 특별한 AI 친구가 되어드려요',
    ],
    description: [
      '당신만을 위한 특별한 AI 친구로 맞춤형 대화를 나눠요',
      '개인적인 취향과 성향을 반영한 맞춤형 소통을 해드려요',
      '독특한 개성과 창의적인 접근으로 새로운 경험을 선사해드려요',
      '당신의 특별함을 이해하고 공감하는 진정한 AI 파트너가 되어드려요',
    ],
  };

  console.log('🔍 MBTI String:', mbtiString);
  console.log('🔍 MBTI Texts:', mbtiTexts);
  console.log('🔍 Selected Texts:', mbtiTexts[mbtiString]);
  console.log('🔍 Default Texts:', defaultTexts);

  const selectedTexts = mbtiTexts[mbtiString] || defaultTexts;

  // 각 배열에서 랜덤으로 선택
  const randomShortDescription =
    selectedTexts.shortDescription[
      Math.floor(Math.random() * selectedTexts.shortDescription.length)
    ];

  const randomDescription =
    selectedTexts.description[
      Math.floor(Math.random() * selectedTexts.description.length)
    ];

  return {
    shortDescription: randomShortDescription,
    description: randomDescription,
  };
};

export default function PersonalitySelector({
  selectedId,
  onPersonalityChange,
}: PersonalitySelectorProps) {
  const [customAIs, setCustomAIs] = useState<CustomAI[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchCustomAIs = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/custom-ai?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 커스텀 AI 데이터:', data);
        setCustomAIs(data);
      }
    } catch (error) {
      console.error('커스텀 AI 목록 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchCustomAIs();
    }
  }, [session?.user?.id, fetchCustomAIs]);

  const handleCustomAISelect = (customAI: CustomAI) => {
    // mbti_types 파싱
    let mbtiTypes;
    try {
      mbtiTypes =
        typeof customAI.mbti_types === 'string'
          ? JSON.parse(customAI.mbti_types)
          : customAI.mbti_types;
    } catch (error) {
      console.error('MBTI 파싱 오류:', error);
      mbtiTypes = null;
    }

    const texts = generateMbtiTexts(mbtiTypes);

    // 커스텀 AI를 AIPersonality 형식으로 변환
    const aiPersonality: AIPersonality = {
      id: customAI.id,
      name: customAI.name,
      description: texts.description || '',
      shortDescription: texts.shortDescription || '',
      iconType: getMbtiIcon(mbtiTypes),
      systemPrompt: '', // 실제로는 서버에서 가져옴
      color: 'bg-purple-100 border-purple-300',
      personalitySummary: '사용자 맞춤형 AI 성격',
      signaturePhrases: ['맞춤형 대화', '개인화된 응답'],
      speechStyle: {
        tone: '개인 맞춤형 톤',
        reaction: '사용자 성향에 맞춘 반응',
        keywords: ['맞춤형', '개인화', '사용자 중심'],
      },
      exampleMessages: ['안녕! 나는 너를 위해 만들어진 AI야'],
    };
    onPersonalityChange(aiPersonality);
  };

  return (
    <div className="space-y-4">
      {/* 기본 AI 성격들 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          기본 moo 성격
        </h3>
        <div className="space-y-3">
          {AI_PERSONALITIES.map((personality) => (
            <div
              key={personality.id}
              className={`
                relative bg-white/60 rounded-xl p-5 cursor-pointer transition-all duration-200 active:scale-95
                ${
                  selectedId === personality.id
                    ? 'bg-green-50 border-2 border-green-300 shadow-md'
                    : 'border border-gray-200 hover:bg-white/80 hover:shadow-sm'
                }
              `}
              onClick={() => onPersonalityChange(personality)}
            >
              {/* Selection Indicator */}
              {selectedId === personality.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              )}

              <div>
                {/* 이미지와 이름을 나란히 */}
                <div className="flex items-center space-x-4 mb-3">
                  <MooIcon type={personality.iconType} size={48} />
                  <h4 className="font-bold text-gray-800 text-lg">
                    {personality.name}
                  </h4>
                </div>

                {/* 설명을 아래에 */}
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  &quot;{personality.shortDescription}&quot;
                </p>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  {personality.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 커스텀 AI 성격들 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          내가 만든 moo 성격
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            커스텀 moo 불러오는 중...
          </div>
        ) : customAIs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Plus size={48} className="mx-auto mb-2" />
              <p>아직 만든 moo가 없어요</p>
              <p className="text-sm">나만의 moo를 만들어보세요!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {customAIs.map((customAI) => {
              console.log('🔍 렌더링할 커스텀 AI:', customAI);

              // mbti_types가 JSON 문자열이므로 파싱
              let mbtiTypes;
              try {
                mbtiTypes =
                  typeof customAI.mbti_types === 'string'
                    ? JSON.parse(customAI.mbti_types)
                    : customAI.mbti_types;
              } catch (error) {
                console.error('MBTI 파싱 오류:', error);
                mbtiTypes = null;
              }

              console.log('🔍 파싱된 MBTI Types:', mbtiTypes);
              const texts = generateMbtiTexts(mbtiTypes);
              console.log('🔍 생성된 텍스트:', texts);

              return (
                <div
                  key={customAI.id}
                  className={`
                    relative bg-white/60 rounded-xl p-5 cursor-pointer transition-all duration-200 active:scale-95
                    ${
                      selectedId === customAI.id
                        ? 'bg-green-50 border-2 border-green-300 shadow-md'
                        : 'border border-gray-200 hover:bg-white/80 hover:shadow-sm'
                    }
                  `}
                  onClick={() => handleCustomAISelect(customAI)}
                >
                  {/* Selection Indicator */}
                  {selectedId === customAI.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                  )}

                  <div>
                    {/* 이미지와 이름을 나란히 */}
                    <div className="flex items-center space-x-4 mb-3">
                      <MooIcon type={getMbtiIcon(mbtiTypes)} size={48} />
                      <h4 className="font-bold text-gray-800 text-lg">
                        {customAI.name}
                      </h4>
                    </div>

                    {/* 설명을 아래에 - 기존 moo처럼 두 줄로 */}
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      &quot;{texts.shortDescription}&quot;
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {texts.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
