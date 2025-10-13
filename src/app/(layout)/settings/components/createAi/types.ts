export interface MBTIType {
  energy: "I" | "E" | null;
  information: "S" | "N" | null;
  decisions: "T" | "F" | null;
  lifestyle: "J" | "P" | null;
}

export interface MBTIOption {
  title: string;
  description: string;
  examples: string[];
  icon: string;
  color: string;
}

export interface Step {
  key: keyof MBTIType;
  title: string;
  subtitle: string;
  icon: string;
}

export interface NameStep {
  key: "name";
  title: string;
  subtitle: string;
  icon: string;
}

export const mbtiDescriptions = {
  energy: {
    I: {
      title: "내향형 (I)",
      description: "조용하고 차분한 대화를 선호하는 moo",
      examples: ["신중함", "깊이 있는 대화"],
      icon: "🧘‍♀️",
      color: "from-slate-400 to-slate-500",
    },
    E: {
      title: "외향형 (E)",
      description: "활발하고 에너지 넘치는 대화를 하는 moo",
      examples: ["활발함", "적극적"],
      icon: "🎉",
      color: "from-amber-400 to-orange-500",
    },
  },
  information: {
    S: {
      title: "감각형 (S)",
      description: "구체적이고 실용적인 조언을 주는 moo",
      examples: ["현실적", "구체적"],
      icon: "👩‍💼",
      color: "from-blue-400 to-cyan-500",
    },
    N: {
      title: "직관형 (N)",
      description: "창의적이고 미래지향적인 아이디어를 제시하는 moo",
      examples: ["창의적", "상상력 풍부"],
      icon: "🎨",
      color: "from-purple-400 to-pink-500",
    },
  },
  decisions: {
    T: {
      title: "사고형 (T)",
      description: "논리적이고 객관적인 분석을 해주는 moo",
      examples: ["논리적", "분석적"],
      icon: "👨‍🔬",
      color: "from-indigo-400 to-blue-500",
    },
    F: {
      title: "감정형 (F)",
      description: "공감하고 따뜻하게 위로해주는 moo",
      examples: ["공감적", "따뜻함"],
      icon: "🤗",
      color: "from-rose-400 to-pink-500",
    },
  },
  lifestyle: {
    J: {
      title: "판단형 (J)",
      description: "체계적이고 계획적인 조언을 주는 moo",
      examples: ["계획적", "체계적"],
      icon: "📋",
      color: "from-emerald-400 to-green-500",
    },
    P: {
      title: "인식형 (P)",
      description: "유연하고 자유로운 사고를 하는 moo",
      examples: ["유연함", "자유로움"],
      icon: "🎭",
      color: "from-teal-400 to-cyan-500",
    },
  },
};

export const steps: Step[] = [
  {
    key: "energy",
    title: "대화 스타일",
    subtitle: "어떤 스타일로 대화하는 moo를 원하나요?",
    icon: "🔋",
  },
  {
    key: "information",
    title: "정보 전달 방식",
    subtitle: "어떤 방식으로 정보를 전달하는 moo를 원하나요?",
    icon: "🧠",
  },
  {
    key: "decisions",
    title: "조언 스타일",
    subtitle: "어떤 방식으로 조언하는 moo를 원하나요?",
    icon: "💭",
  },
  {
    key: "lifestyle",
    title: "사고 방식",
    subtitle: "어떤 사고 방식을 가진 moo를 원하나요?",
    icon: "🎯",
  },
];

export const nameStep: NameStep = {
  key: "name",
  title: "moo 이름 정하기",
  subtitle: "새로운 AI 친구에게 특별한 이름을 지어주세요",
  icon: "🏷️",
};
