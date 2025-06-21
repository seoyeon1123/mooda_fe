import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getPersonalityById,
  getDefaultPersonality,
} from "@/lib/ai-personalities";

// Google Gemini AI 클라이언트 초기화
// 환경변수에서 API 키를 가져와서 Gemini AI 서비스에 연결
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 메모리 기반 대화 저장소 (실제 프로덕션에서는 Redis/Database 사용 권장)
// 사용자 ID를 키로 하고, 해당 사용자의 대화 기록 배열을 값으로 저장
// 서버 재시작 시 데이터가 사라지는 단점이 있음
const userConversations = new Map<
  string,
  Array<{
    id: number; // 메시지 고유 ID (타임스탬프 기반)
    type: "user" | "ai"; // 메시지 발신자 구분
    content: string; // 메시지 내용
    timestamp: Date; // 메시지 생성 시간
  }>
>();

/**
 * GET 요청 처리 - 서버 상태 확인용
 * 클라이언트에서 서버가 정상 작동하는지 확인할 때 사용
 */
export async function GET() {
  return NextResponse.json({ message: "Chat API server is running" });
}

/**
 * POST 요청 처리 - 메인 API 엔드포인트
 * 모든 채팅 관련 기능을 action 파라미터로 구분하여 처리
 *
 * @param request - 클라이언트에서 보낸 요청 데이터
 * @returns JSON 응답
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // action 타입에 따라 적절한 함수 호출
    switch (action) {
      case "send-message": // AI와 대화하기
        return await handleSendMessage(data);
      case "analyze-emotion": // 감정 분석하기
        return await handleAnalyzeEmotion(data);
      case "get-conversation-history": // 대화 기록 불러오기
        return await getConversationHistory(data);
      default:
        return NextResponse.json({ error: "알 수 없는 액션" }, { status: 400 });
    }
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

/**
 * 사용자 메시지를 받아서 AI 응답을 생성하는 함수
 *
 * 처리 과정:
 * 1. 사용자 메시지를 메모리에 저장
 * 2. 사용자 설정에서 AI 성격 가져오기
 * 3. Gemini AI에 대화 기록과 함께 요청
 * 4. AI 응답을 받아서 메모리에 저장
 * 5. 사용자 메시지와 AI 응답을 함께 반환
 *
 * @param data - { message: 사용자 메시지, userId: 사용자 ID, personalityId?: AI 성격 ID }
 * @returns 사용자 메시지와 AI 응답
 */
async function handleSendMessage(data: {
  message: string;
  userId: string;
  personalityId?: string;
}) {
  const { message, userId, personalityId } = data;
  const timestamp = new Date();

  try {
    // 1단계: 사용자 메시지를 메모리 저장소에 저장
    const userMessage = {
      id: Date.now(), // 현재 시간을 ID로 사용
      type: "user" as const, // 사용자 메시지임을 명시
      content: message, // 실제 메시지 내용
      timestamp, // 메시지 생성 시간
    };

    // 사용자가 처음 대화를 시작하는 경우 빈 배열 생성
    if (!userConversations.has(userId)) {
      userConversations.set(userId, []);
    }
    // 사용자의 대화 기록에 새 메시지 추가
    userConversations.get(userId)!.push(userMessage);

    // 2단계: AI 성격 설정 가져오기
    const personality = personalityId
      ? getPersonalityById(personalityId) || getDefaultPersonality()
      : getDefaultPersonality();

    // 3단계: Gemini AI 모델 초기화 및 대화 기록 준비
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const conversation = userConversations.get(userId)!;
    // Gemini AI 형식에 맞게 대화 기록 변환
    const chatHistory = conversation.map((msg) => ({
      role: msg.type === "user" ? "user" : "model", // user는 사용자, model은 AI
      parts: [{ text: msg.content }], // Gemini AI의 메시지 형식
    }));

    // 4단계: AI 채팅 세션 시작 및 설정
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // 마지막 사용자 메시지는 제외 (새로 보낼 예정)
      generationConfig: {
        maxOutputTokens: 150, // AI 응답을 150 토큰으로 제한
        temperature: 0.8, // 0.8로 설정하여 친근하고 자연스러운 톤 유지
      },
    });

    // 5단계: 선택된 AI 성격의 시스템 프롬프트 사용
    const systemPrompt = personality.systemPrompt;

    // 6단계: AI에게 메시지 전송 및 응답 받기
    // 시스템 프롬프트를 첫 번째 메시지로, 사용자 메시지를 두 번째로 전송
    const result = await chat.sendMessage([systemPrompt, message]);
    const response = await result.response;
    const aiContent = response.text();

    // 7단계: AI 응답 길이 제한 (150글자 이내에서 문장 단위로 자르기)
    let finalContent = aiContent;
    if (finalContent.length > 150) {
      // 150자 이내에서 마지막 문장부호(마침표, 느낌표, 물음표, …, 줄바꿈) 위치 찾기
      const slice = finalContent.slice(0, 150);
      const lastPunct = Math.max(
        slice.lastIndexOf("."),
        slice.lastIndexOf("!"),
        slice.lastIndexOf("?"),
        slice.lastIndexOf("…"),
        slice.lastIndexOf("\n")
      );
      if (lastPunct > 50) {
        // 문장부호가 50자 이후에 있으면 그 위치까지 자름
        finalContent = slice.slice(0, lastPunct + 1);
      } else {
        // 문장부호가 없거나 너무 앞에 있으면 그냥 150자에서 자름
        finalContent = slice;
      }
    }

    // 8단계: AI 응답을 메모리 저장소에 저장
    const aiResponse = {
      id: Date.now() + 1, // 사용자 메시지보다 1 큰 ID
      type: "ai" as const, // AI 응답임을 명시
      content: finalContent, // 길이 제한된 AI 응답
      timestamp: new Date(), // 응답 생성 시간
    };

    // 사용자의 대화 기록에 AI 응답 추가
    userConversations.get(userId)!.push(aiResponse);

    // 9단계: 사용자 메시지와 AI 응답을 함께 반환
    return NextResponse.json({
      userMessage, // 저장된 사용자 메시지
      aiResponse, // 새로 생성된 AI 응답
      success: true, // 성공 상태
      personality: {
        // 현재 사용 중인 AI 성격 정보
        id: personality.id,
        name: personality.name,
        icon: personality.iconType,
      },
    });
  } catch (error) {
    console.error("AI 응답 생성 오류:", error);
    return NextResponse.json(
      {
        error: "AI 응답을 생성할 수 없습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * 사용자의 대화 기록을 조회하는 함수
 *
 * 클라이언트에서 페이지 로드 시 이전 대화 내용을 불러올 때 사용
 *
 * @param data - { userId: 사용자 ID }
 * @returns 해당 사용자의 모든 대화 기록
 */
async function getConversationHistory(data: { userId: string }) {
  const { userId } = data;
  // 사용자 ID로 대화 기록 조회, 없으면 빈 배열 반환
  const conversations = userConversations.get(userId) || [];

  return NextResponse.json({
    conversations, // 대화 기록 배열
    success: true, // 성공 상태
  });
}

/**
 * 사용자의 오늘 대화를 분석하여 감정 상태를 분류하는 함수
 *
 * 처리 과정:
 * 1. 사용자의 오늘 대화만 필터링
 * 2. Gemini AI에게 감정 분석 요청
 * 3. 6가지 감정 중 하나로 분류하여 반환
 *
 * @param data - { userId: 사용자 ID }
 * @returns 감정 분석 결과 (감정, 요약, 하이라이트)
 */
async function handleAnalyzeEmotion(data: { userId: string }) {
  const { userId } = data;

  try {
    // 1단계: 사용자의 전체 대화 기록 가져오기
    const conversations = userConversations.get(userId) || [];

    // 대화가 없으면 에러 반환
    if (conversations.length === 0) {
      return NextResponse.json(
        {
          error: "분석할 대화가 없습니다.",
        },
        { status: 400 }
      );
    }

    // 2단계: 오늘 날짜의 대화만 필터링
    const today = new Date().toDateString();
    const todayConversations = conversations.filter(
      (msg) => msg.timestamp.toDateString() === today
    );

    // 3단계: 대화 내용을 텍스트로 변환
    const conversationText = todayConversations
      .map((msg) => `${msg.type}: ${msg.content}`) // "user: 안녕하세요", "ai: 안녕!" 형태로 변환
      .join("\n"); // 줄바꿈으로 구분

    // 4단계: Gemini AI 모델 초기화
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 5단계: 감정 분석을 위한 프롬프트 생성
    const prompt = `다음 대화를 분석하고 사용자의 감정 상태를 6가지 중 하나로 분류해주세요:
    1. VeryHappy (매우 기쁨) 2. Happy (기쁨) 3. Neutral (무감정)
    4. SlightlySad (약간 슬픔) 5. Sad (슬픔) 6. VerySad (매우 슬픔)
    응답 형식: {"emotion": "감정카테고리", "summary": "요약", "highlights": ["포인트1", "포인트2"]}
    대화 내용:
${conversationText}`;

    // 6단계: AI에게 감정 분석 요청
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisResult = JSON.parse(response.text()); // JSON 형태로 파싱

    // 7단계: 분석 결과 반환
    return NextResponse.json({
      date: today, // 분석 날짜
      ...analysisResult, // 감정, 요약, 하이라이트
      success: true, // 성공 상태
    });
  } catch (error) {
    console.error("감정 분석 오류:", error);
    return NextResponse.json(
      {
        error: "감정 분석을 수행할 수 없습니다.",
      },
      { status: 500 }
    );
  }
}
