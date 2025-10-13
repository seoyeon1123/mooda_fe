import type { EmotionData } from "./calendar-types";

// summary 필드에서 한국어 감정을 추출하고 EmotionData 타입으로 매핑
export const extractEmotionFromSummary = (
  summary: string
): EmotionData["emotion"] => {
  // summary에서 첫 번째 단어 추출 (예: "Happy 85%" -> "Happy", "평온 81%" -> "평온")
  const emotionText = summary.split(" ")[0];

  const mappings: Record<string, EmotionData["emotion"]> = {
    // 영어 감정
    VeryHappy: "excited",
    Happy: "happy",
    Neutral: "calm",
    SlightlySad: "anxious",
    Sad: "sad",
    VerySad: "angry",
    Angry: "angry",
    // 한국어 감정
    행복: "happy",
    매우행복: "excited",
    평온: "calm",
    슬픔: "sad",
    매우슬픔: "angry",
    화남: "angry",
    화: "angry",
    우울: "sad",
    기쁨: "happy",
    좋음: "happy",
  };
  return mappings[emotionText] || "calm";
};

// API에서 받아오는 감정 카테고리를 EmotionData 타입으로 매핑 (기존 함수 유지)
export const mapEmotionToType = (emotion: string): EmotionData["emotion"] => {
  const mappings: Record<string, EmotionData["emotion"]> = {
    VeryHappy: "excited",
    Happy: "happy",
    Neutral: "calm",
    SlightlySad: "anxious",
    Sad: "sad",
    VerySad: "angry",
    Angry: "angry",
  };
  return mappings[emotion] || "calm";
};

// API 감정 결과를 svg 파일명으로 매핑
export const emotionToSvg = (emotion: string): string => {
  const map: Record<string, string> = {
    VeryHappy: "veryHappy.svg",
    Happy: "happy.svg",
    Neutral: "soso.svg",
    SlightlySad: "sad.svg",
    Sad: "sad.svg",
    VerySad: "verySad.svg",
    Angry: "angry.svg",
    excited: "veryHappy.svg", // 내부 emotion 타입도 대응
    happy: "happy.svg",
    calm: "soso.svg",
    anxious: "sad.svg",
    sad: "sad.svg",
    angry: "angry.svg",
  };
  return `/images/emotion/${map[emotion] || "soso.svg"}`;
};

// 감정 데이터 불러오기
export const loadEmotionData = async (
  userId: string
): Promise<EmotionData | null> => {
  try {
    const response = await fetch("/api/socket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "analyze-emotion",
        data: { userId },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // highlights가 배열인지 확인하고 안전하게 처리
        let conversationSummary = "";
        if (Array.isArray(result.highlights)) {
          conversationSummary = result.highlights.join("\n");
        } else if (typeof result.highlights === "string") {
          conversationSummary = result.highlights;
        } else if (result.highlight) {
          // highlight (단수형) 필드가 있는 경우
          conversationSummary = result.highlight;
        }

        return {
          date: result.date,
          emotion: mapEmotionToType(result.emotion),
          summary: result.summary,
          short_summary: conversationSummary,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("감정 데이터 로드 오류:", error);
    return null;
  }
};

export async function summarizeAndAnalyzeWithGemini(
  messages: string[]
): Promise<{ summary: string; emotion: string }> {
  const prompt = `
아래는 사용자의 하루 대화 내용입니다.
이 대화를 요약하고, 오늘의 기분을 한 단어(예: excited, happy, calm, anxious, sad, angry)로 평가해줘.

대화:
${messages.join("\n")}

[출력 예시]
요약: ...
감정: ...
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const summaryMatch = text.match(/요약:\s*(.+)/);
  const emotionMatch = text.match(/감정:\s*(\w+)/);

  return {
    summary: summaryMatch ? summaryMatch[1] : "",
    emotion: emotionMatch ? emotionMatch[1] : "Neutral",
  };
}

// 월별 감정 데이터 불러오기 (캘린더용)
export const loadMonthlyEmotionData = async (
  userId: string,
  year: number,
  month: number
): Promise<EmotionData[]> => {
  try {
    const url = `/api/emotion-logs?userId=${userId}&year=${year}&month=${month}`;
    console.log("🌐 API 호출:", url);

    const response = await fetch(url);

    console.log("📡 API 응답 상태:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log("📋 API 응답 데이터:", result);

      if (result.emotionLogs) {
        const mappedData = result.emotionLogs.map(
          (log: {
            date: string;
            emotion: string;
            summary: string;
            short_summary: string;
            character_name?: string | null;
            characterName?: string | null;
          }) => ({
            date: log.date,
            emotion: extractEmotionFromSummary(log.summary),
            summary: log.summary,
            short_summary: log.short_summary || log.summary,
            characterName: log.character_name ?? log.characterName ?? null,
          })
        );

        console.log("🎯 매핑된 데이터:", mappedData);
        return mappedData;
      }
    } else {
      console.error("❌ API 오류:", response.status, await response.text());
    }
    return [];
  } catch (error) {
    console.error("월별 감정 데이터 로드 오류:", error);
    return [];
  }
};
