import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getPersonalityById,
  getDefaultPersonality,
} from '@/lib/ai-personalities';
import prisma from '@/lib/prisma';

// Google Gemini AI 클라이언트 초기화
// 환경변수에서 API 키를 가져와서 Gemini AI 서비스에 연결
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface SendMessageData {
  userId: string;
  message: string;
  personalityId?: string;
}

interface AnalyzeEmotionData {
  userId: string;
}

interface GetHistoryData {
  userId: string;
}

interface RequestBody {
  action: 'send-message' | 'analyze-emotion' | 'get-conversation-history';
  data: SendMessageData | AnalyzeEmotionData | GetHistoryData;
}

/**
 * GET 요청 처리 - 서버 상태 확인용
 * 클라이언트에서 서버가 정상 작동하는지 확인할 때 사용
 */
export async function GET() {
  return NextResponse.json({ message: 'Chat API server is running' });
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
    const { action, data }: RequestBody = await request.json();

    // action 타입에 따라 적절한 함수 호출
    switch (action) {
      case 'send-message':
        return await handleSendMessage(data as SendMessageData);
      case 'analyze-emotion':
        return await handleAnalyzeEmotion(data as AnalyzeEmotionData);
      case 'get-conversation-history':
        return await getConversationHistory(data as GetHistoryData);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

/**
 * 사용자 메시지를 받아서 AI 응답을 생성하고 DB에 저장하는 함수
 *
 * 처리 과정:
 * 1. 사용자 메시지를 DB에 저장
 * 2. 사용자 설정에서 AI 성격 가져오기
 * 3. DB에서 최근 대화 기록 조회
 * 4. AI 채팅 세션 시작 및 응답 생성
 * 5. AI 응답 길이 제한
 * 6. AI 응답을 DB에 저장
 * 7. 사용자 메시지와 AI 응답을 함께 반환
 *
 * @param data - { message: 사용자 메시지, userId: 사용자 ID, personalityId?: AI 성격 ID }
 * @returns 사용자 메시지와 AI 응답
 */
async function handleSendMessage(data: SendMessageData) {
  const { message, userId, personalityId } = data;

  if (!message || !userId) {
    return NextResponse.json(
      { error: 'Message and userId are required' },
      { status: 400 }
    );
  }

  try {
    // 1. 사용자 메시지를 DB에 저장
    const userMessage = await prisma.conversation.create({
      data: {
        userId,
        role: 'user',
        content: message,
        personalityId,
      },
    });

    // 2. AI 성격 설정 가져오기
    const personality = personalityId
      ? getPersonalityById(personalityId)
      : getDefaultPersonality();
    if (!personality) {
      return NextResponse.json(
        { error: 'Invalid personality ID' },
        { status: 400 }
      );
    }

    // 3. DB에서 최근 대화 기록 조회
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const conversationHistory = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
    const chatHistory = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 4. AI 채팅 세션 시작 및 응답 생성
    const chat = model.startChat({
      history: chatHistory.slice(0, -1),
      generationConfig: { maxOutputTokens: 150, temperature: 0.8 },
    });
    const systemPrompt = personality.systemPrompt;
    const result = await chat.sendMessage([systemPrompt, message]);
    const response = result.response;
    const aiContent = response.text();

    // 5. AI 응답 길이 제한
    let finalContent = aiContent;
    if (finalContent.length > 150) {
      const slice = finalContent.slice(0, 150);
      const lastPunct = Math.max(
        slice.lastIndexOf('.'),
        slice.lastIndexOf('!'),
        slice.lastIndexOf('?'),
        slice.lastIndexOf('…'),
        slice.lastIndexOf('\n')
      );
      finalContent = lastPunct > 50 ? slice.slice(0, lastPunct + 1) : slice;
    }

    // 6. AI 응답을 DB에 저장
    const aiResponse = await prisma.conversation.create({
      data: {
        userId,
        role: 'ai',
        content: finalContent,
        personalityId,
      },
    });

    // 7. 클라이언트에 결과 반환
    return NextResponse.json({
      userMessage,
      aiResponse,
      success: true,
      personality: {
        id: personality.id,
        name: personality.name,
        icon: personality.iconType,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}

/**
 * 사용자의 오늘 대화 기록을 DB에서 조회하는 함수
 *
 * 클라이언트에서 페이지 로드 시 이전 대화 내용을 불러올 때 사용
 *
 * @param data - { userId: 사용자 ID }
 * @returns 해당 사용자의 모든 대화 기록
 */
async function getConversationHistory(data: GetHistoryData) {
  const { userId } = data;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ conversations, success: true });
  } catch (error) {
    console.error('Get conversation history error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation history' },
      { status: 500 }
    );
  }
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
async function handleAnalyzeEmotion(data: AnalyzeEmotionData) {
  const { userId } = data;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    if (conversations.length === 0) {
      return NextResponse.json(
        { error: 'No conversations to analyze' },
        { status: 400 }
      );
    }

    const conversationText = conversations
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze the user's emotional state from the following conversation and classify it into one of these 6 categories: VeryHappy, Happy, Neutral, Sad, VerySad, Angry.
    
    Respond in the following JSON format:
    {
      "emotion": "Classified emotion (e.g., Happy)",
      "summary": "A short 1-2 sentence summary of today's conversation.",
      "highlight": "One or two memorable lines from the conversation that best represent the emotion."
    }
    
    --- Conversation ---
    ${conversationText}
    --- End ---
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response
      .text()
      .replace(/```json|```/g, '')
      .trim();
    const analysisResult = JSON.parse(jsonString);

    return NextResponse.json({ ...analysisResult, success: true });
  } catch (error) {
    console.error('Analyze emotion error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI analysis response' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to analyze emotion' },
      { status: 500 }
    );
  }
}
