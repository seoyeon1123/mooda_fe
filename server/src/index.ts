import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cron from 'node-cron';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { SupabaseService } from './lib/supabase-service.js';
import { scheduleDailyEmotionSummary } from './lib/scheduler';
import {
  simpleAnalyzeConversation,
  emotionToSvg,
  emotionToPercentage,
} from './lib/emotion-service';
import { AI_PERSONALITIES, AIPersonality } from './lib/ai-personalities';

dotenv.config();

// Supabase 서비스 초기화
const supabaseService = new SupabaseService();

// 타입 정의

const app: Express = express();
const port = process.env.PORT || 8080;

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 타입 정의
interface SendMessageData {
  message: string;
  userId: string;
  personalityId?: string;
}

interface AnalyzeEmotionData {
  userId: string;
}

interface GetHistoryData {
  userId: string;
}

interface GetHistoryByDateData {
  userId: string;
  personalityId: string;
  date: string;
}

interface GetConversationDatesData {
  userId: string;
  personalityId: string;
}

// AI 성격 관련 함수들
function getDefaultPersonality() {
  return AI_PERSONALITIES[0];
}

// CORS 설정
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://mooda.vercel.app'],
    credentials: true,
  })
);

// JSON 파서 설정
app.use(express.json());

// 인증 미들웨어
const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.body?.data?.userId;

    if (!userId) {
      res.status(401).json({ error: '인증이 필요합니다' });
      return;
    }

    // 사용자 존재 여부 확인
    const user = await supabaseService.getUserById(userId);

    if (!user) {
      // 사용자가 없으면 카카오 ID로 다시 확인
      const kakaoUser = await supabaseService.getUserByKakaoId(userId);

      if (!kakaoUser) {
        res.status(401).json({ error: '유효하지 않은 사용자입니다' });
        return;
      }

      // 요청의 userId를 실제 DB의 userId로 변경
      req.body.data.userId = kakaoUser.id;
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다' });
  }
};

// 채팅 API에 인증 미들웨어 적용
app.post(
  '/api/socket',
  authenticateUser,
  async (req: Request, res: Response): Promise<void> => {
    const { action, data } = req.body;

    try {
      switch (action) {
        case 'send-message':
          await handleSendMessage(data as SendMessageData, res);
          break;
        case 'analyze-emotion':
          await handleAnalyzeEmotion(data as AnalyzeEmotionData, res);
          break;
        case 'get-conversation-history':
          await getConversationHistory(data as GetHistoryData, res);
          break;
        case 'get-conversation-history-by-date':
          await getConversationHistoryByDate(data as GetHistoryByDateData, res);
          break;
        case 'get-conversation-dates':
          await getConversationDates(data as GetConversationDatesData, res);
          break;
        default:
          res.status(400).json({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'An internal server error occurred' });
    }
  }
);

// 사용자 정보 조회 API
app.get('/api/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    console.log('[GET /api/user] 요청:', { userId });

    if (!userId) {
      res.status(400).json({ error: 'userId가 필요합니다.' });
      return;
    }

    const user = await supabaseService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    console.log('[GET /api/user] 응답:', user);
    // 클라이언트가 기대하는 필드명으로 변환
    const response = {
      ...user,
      selectedPersonalityId: user.selected_personality_id || 'MUNI',
    };
    res.json(response);
  } catch (error) {
    console.error('[GET /api/user] 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 정보 업데이트 API
app.put('/api/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, selectedPersonalityId } = req.body;
    console.log('[PUT /api/user] 요청:', { userId, selectedPersonalityId });

    if (!userId) {
      res.status(400).json({ error: 'userId가 필요합니다.' });
      return;
    }

    const existingUser = await supabaseService.getUserById(userId);

    if (!existingUser) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const updatedUser = await supabaseService.updateUser(userId, {
      selected_personality_id: selectedPersonalityId,
    });

    if (!updatedUser) {
      res.status(500).json({ error: '사용자 정보 업데이트에 실패했습니다.' });
      return;
    }

    console.log('[PUT /api/user] 응답:', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('[PUT /api/user] 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// AI 메시지 처리 함수
async function handleSendMessage(data: SendMessageData, res: Response) {
  const { message, userId, personalityId } = data;

  if (!message || !userId) {
    res.status(400).json({ error: 'Message and userId are required' });
    return;
  }

  console.log('🚀 handleSendMessage 시작:', { message, userId, personalityId });

  console.log('🔑 API 키 길이:', process.env.GEMINI_API_KEY?.length);

  try {
    // 1. 사용자 메시지를 DB에 저장
    console.log('💾 사용자 메시지 DB 저장 시작...');
    // 사용자 메시지 저장
    const userMessage = await supabaseService.createConversation({
      id: crypto.randomUUID(),
      userId,
      role: 'user',
      content: message,
      personalityId: personalityId || undefined,
    });

    if (!userMessage) {
      console.error('❌ 사용자 메시지 저장 실패');
      res.status(500).json({ error: '메시지 저장에 실패했습니다.' });
      return;
    }

    console.log('✅ 사용자 메시지 저장 완료:', userMessage.id);

    // 2. AI 성격 설정 가져오기
    let personality;
    if (personalityId) {
      console.log('🔍 AI 성격 검색 시작:', personalityId);
      // 먼저 기본 AI 목록에서 찾기
      personality = AI_PERSONALITIES.find(
        (p: AIPersonality) => p.id === personalityId
      );

      // 기본 AI에 없다면 커스텀 AI에서 찾기
      if (!personality) {
        console.log('🔍 기본 AI에서 찾지 못함, 커스텀 AI 확인 중...');
        try {
          const customAI = await supabaseService.getCustomAIPersonalityById(
            personalityId,
            userId
          );

          if (customAI) {
            console.log('✅ 커스텀 AI 찾음:', customAI.name);
            const mbtiTypes =
              typeof customAI.mbti_types === 'string'
                ? JSON.parse(customAI.mbti_types)
                : customAI.mbti_types;

            personality = {
              id: customAI.id,
              name: customAI.name,
              systemPrompt: customAI.system_prompt,
              iconType: `${mbtiTypes.energy}${mbtiTypes.information}${mbtiTypes.decisions}${mbtiTypes.lifestyle}`,
            };
          } else {
            console.log('⚠️ 커스텀 AI를 찾을 수 없음:', personalityId);
            res.status(400).json({ error: 'Invalid personality ID' });
            return;
          }
        } catch (error) {
          console.error('❌ 커스텀 AI 조회 오류:', error);
          res.status(500).json({ error: 'Failed to fetch custom AI' });
          return;
        }
      }
    }

    if (!personality) {
      console.log('⚠️ AI 성격을 찾을 수 없음, 기본값 사용');
      personality = getDefaultPersonality();
    }

    console.log('🎭 성격 설정:', personality.name);
    console.log('📝 시스템 프롬프트:', personality.systemPrompt);

    // 3. DB에서 최근 대화 기록 조회 (오늘 날짜만)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🤖 Gemini AI 모델 초기화 중...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const conversationHistory = await supabaseService.getConversationsByDate(
      userId,
      personalityId || null,
      today
    );
    console.log('📚 대화 기록 개수:', conversationHistory.length);

    // 대화 기록을 Gemini 형식으로 변환
    const chatHistory = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Gemini API 요구사항: 첫 번째 메시지는 반드시 'user' 역할이어야 함
    // 시스템 프롬프트를 사용자 메시지에 포함시킴
    console.log('💬 채팅 세션 시작...');
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
      },
    });

    // 시스템 프롬프트와 사용자 메시지를 결합
    const characterPrompt = `${personality.systemPrompt}\n\n사용자: ${message}`;
    console.log('📤 AI에게 메시지 전송 중...');

    const result = await chat.sendMessage(characterPrompt);
    const response = result.response;
    const aiContent = response.text();
    console.log('📥 AI 응답 받음:', aiContent.substring(0, 50) + '...');

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
    console.log('💾 AI 응답 DB 저장 중...');
    // AI 응답 저장
    const aiResponse = await supabaseService.createConversation({
      id: crypto.randomUUID(),
      userId,
      role: 'ai',
      content: finalContent,
      personalityId: personalityId || undefined,
    });

    if (!aiResponse) {
      console.error('❌ AI 응답 저장 실패');
      res.status(500).json({ error: 'AI 응답 저장에 실패했습니다.' });
      return;
    }

    console.log('✅ AI 응답 저장 완료:', aiResponse.id);

    // 7. 클라이언트에 결과 반환
    console.log('📤 클라이언트에 응답 전송');
    res.json({
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
    console.error('❌ Send message error 상세:', error);
    console.error('❌ Error type:', typeof error);
    console.error(
      '❌ Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      '❌ Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
}

// 대화 기록 조회 함수
async function getConversationHistory(data: GetHistoryData, res: Response) {
  const { userId } = data;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const conversations = await supabaseService.getConversationsByDate(
      userId,
      null,
      today
    );
    res.json({ conversations, success: true });
  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
}

// 날짜별 대화 기록 조회 함수
async function getConversationHistoryByDate(
  data: GetHistoryByDateData,
  res: Response
) {
  const { userId, personalityId, date } = data;

  if (!userId || !personalityId || !date) {
    res
      .status(400)
      .json({ error: 'userId, personalityId, and date are required' });
    return;
  }

  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conversations = await supabaseService.getConversationsByDate(
      userId,
      personalityId,
      startOfDay
    );

    res.json({ conversations, success: true });
  } catch (error) {
    console.error('Get conversation history by date error:', error);
    res
      .status(500)
      .json({ error: 'Failed to retrieve conversation history by date' });
  }
}

// 대화가 있는 날짜 목록 조회 함수
async function getConversationDates(
  data: GetConversationDatesData,
  res: Response
) {
  const { userId, personalityId } = data;

  if (!userId || !personalityId) {
    res.status(400).json({ error: 'userId and personalityId are required' });
    return;
  }

  try {
    const conversations = await supabaseService.getConversationDates(
      userId,
      personalityId
    );

    // 날짜별로 그룹화하여 중복 제거
    const dateSet = new Set<string>();
    conversations.forEach((conv: { created_at: string }) => {
      const dateString = conv.created_at.split('T')[0];
      dateSet.add(dateString);
    });

    const dates = Array.from(dateSet).sort();
    res.json({ dates, success: true });
  } catch (error) {
    console.error('Get conversation dates error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation dates' });
  }
}

// 감정 분석 함수
async function handleAnalyzeEmotion(data: AnalyzeEmotionData, res: Response) {
  const { userId } = data;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const conversations = await supabaseService.getConversationsByDate(
      userId,
      null,
      today
    );

    if (conversations.length === 0) {
      res.status(400).json({ error: 'No conversations to analyze' });
      return;
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

    res.json({ ...analysisResult, success: true });
  } catch (error) {
    console.error('Analyze emotion error:', error);
    if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'Failed to parse AI analysis response' });
    } else {
      res.status(500).json({ error: 'Failed to analyze emotion' });
    }
  }
}

app.listen(port, async () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);

  // 데이터베이스 연결 테스트
  try {
    const users = await supabaseService.getUsers();
    console.log('📊 현재 등록된 사용자 수:', users.length);
  } catch (error) {
    console.error('❌ 데이터베이스 연결 오류:', error);
  }

  // 매일 자정(00:00)에 일일 감정 분석 실행
  cron.schedule(
    '0 0 * * *',
    async () => {
      console.log('🕛 자정 - 일일 감정 분석 시작...');
      try {
        await scheduleDailyEmotionSummary();
        console.log('✅ 일일 감정 분석 완료');
      } catch (error) {
        console.error('❌ 일일 감정 분석 실패:', error);
      }
    },
    {
      timezone: 'Asia/Seoul',
    }
  );

  console.log('📅 일일 감정 분석 스케줄러 설정 완료 (매일 자정 실행)');
  console.log('🔧 수동 실행 가능: POST /api/run-daily-emotion-analysis');
});

// EmotionLog 조회 API
app.get(
  '/api/emotion-logs',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, year, month } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      // 해당 월의 시작과 끝 날짜 계산
      const targetYear = year
        ? parseInt(year as string)
        : new Date().getFullYear();
      const targetMonth = month
        ? parseInt(month as string) - 1
        : new Date().getMonth(); // month는 0부터 시작

      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const emotionLogs = await supabaseService.getEmotionLogs(
        userId as string,
        startDate,
        endDate
      );

      res.status(200).json({ emotionLogs });
    } catch (error) {
      console.error('Error fetching emotion logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 특정 날짜의 EmotionLog 상세 조회
app.get(
  '/api/emotion-logs/:date',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      const { userId } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const emotionLog = await supabaseService.getEmotionLogByDate(
        userId as string,
        targetDate
      );

      if (!emotionLog) {
        res.status(404).json({ error: 'EmotionLog not found for this date' });
        return;
      }

      res.status(200).json({ emotionLog });
    } catch (error) {
      console.error('Error fetching emotion log detail:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 실제 대화 기록 조회 (디버깅용)
app.get(
  '/api/conversations/:userId/:date',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, date } = req.params;

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const conversations = await supabaseService.getConversationsByDate(
        userId,
        null,
        startDate
      );

      res.status(200).json({ conversations, count: conversations.length });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 날짜별 대화 기록 조회 (userId + personalityId + date)
app.get(
  '/api/conversations/:userId/:personalityId/:date',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, personalityId, date } = req.params;

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const conversations = await supabaseService.getConversationsByDate(
        userId,
        personalityId,
        startDate
      );

      res.status(200).json({ conversations, count: conversations.length });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 실제 대화 분석해서 감정 로그 생성 (테스트용)
app.post(
  '/api/test-emotion-analysis',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, date } = req.body;

      console.log(
        `Starting emotion analysis for user ${userId} on date ${date}`
      );

      // 해당 날짜의 대화 기록 조회
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const conversations = await supabaseService.getConversationsByDate(
        userId,
        null,
        startDate
      );

      if (conversations.length === 0) {
        res.status(404).json({ error: 'No conversations found for this date' });
        return;
      }

      console.log(`Found ${conversations.length} conversations`);

      // 대화 내용을 텍스트로 변환
      const conversationText = conversations
        .map((conv) => `${conv.role}: ${conv.content}`)
        .join('\n');

      console.log('Conversation text:', conversationText);

      // AI 분석 요청
      const analysisResult = simpleAnalyzeConversation(conversationText);

      console.log('Analysis result:', analysisResult);

      // 기존 감정 로그가 있는지 확인
      const existingLog = await supabaseService.getEmotionLogByDate(
        userId,
        startDate
      );

      let emotionLog;
      if (existingLog) {
        // 기존 로그 업데이트
        emotionLog = await supabaseService.updateEmotionLog(existingLog.id, {
          emotion: analysisResult.emotion,
          summary: emotionToPercentage(analysisResult.emotion),
        });
        console.log('Updated existing emotion log');
      } else {
        // 새 로그 생성
        emotionLog = await supabaseService.createEmotionLog({
          id: crypto.randomUUID(),
          userId,
          date: startDate,
          emotion: analysisResult.emotion,
          summary: emotionToPercentage(analysisResult.emotion),
          shortSummary: analysisResult.summary,
          characterName: emotionToSvg(analysisResult.emotion),
        });
        console.log('Created new emotion log');
      }

      res.status(200).json({
        success: true,
        emotionLog,
        conversationsAnalyzed: conversations.length,
      });
    } catch (error) {
      console.error('Error in test emotion analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 스케줄러 수동 실행 API (테스트용)
app.post(
  '/api/run-daily-emotion-analysis',
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔧 Manual daily emotion analysis triggered');
      await scheduleDailyEmotionSummary();
      res.status(200).json({
        success: true,
        message: 'Daily emotion analysis completed successfully',
      });
    } catch (error) {
      console.error('Manual daily emotion analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Daily emotion analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// 커스텀 AI API 엔드포인트
app.get(
  '/api/custom-ai',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.query;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      console.log('🔍 커스텀 AI 조회 요청:', userId);
      const customAIs = await supabaseService.getCustomAIPersonalitiesByUserId(
        userId as string
      );
      res.json(customAIs);
    } catch (error) {
      console.error('커스텀 AI 조회 오류:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
);

app.post(
  '/api/custom-ai',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, name, description, mbtiTypes, systemPrompt } = req.body;

      console.log('[커스텀 AI 생성] 받은 데이터:', {
        userId,
        name,
        description,
        mbtiTypes,
        mbtiTypesType: typeof mbtiTypes,
        systemPrompt: systemPrompt?.substring(0, 100) + '...',
      });

      if (!userId || !name || !description || !mbtiTypes || !systemPrompt) {
        res.status(400).json({ error: '필수 필드가 누락되었습니다' });
        return;
      }

      const customAI = await supabaseService.createCustomAIPersonality({
        id: crypto.randomUUID(),
        userId,
        name,
        mbtiTypes,
        systemPrompt,
        description,
      });

      res.json(customAI);
    } catch (error) {
      console.error('커스텀 AI 생성 오류:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }
);

// 로그인 API 엔드포인트
app.post(
  '/api/auth/login',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { kakaoId, email, userName, image } = req.body;

      if (!kakaoId) {
        res.status(400).json({ error: 'kakaoId is required' });
        return;
      }

      // 기존 사용자 찾기 또는 새로운 사용자 생성
      let user = await supabaseService.getUserByKakaoId(kakaoId);

      if (!user) {
        // 새로운 사용자 생성
        user = await supabaseService.createUser({
          id: crypto.randomUUID(),
          kakaoId,
          email,
          userName: userName,
          image,
        });
      } else {
        // 기존 사용자 정보 업데이트
        user = await supabaseService.updateUser(user.id, {
          email,
          user_name: userName,
          image,
        });
      }

      if (!user) {
        res.status(500).json({ error: '사용자 생성/업데이트에 실패했습니다.' });
        return;
      }

      res.json({
        userId: user.id,
        name: user.user_name,
        email: user.email,
        image: user.image,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
    }
  }
);

// 이제 GitHub Actions로 매일 12시에 자동 실행됩니다.
