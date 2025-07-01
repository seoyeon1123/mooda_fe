import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './lib/prisma';
import jwt from 'jsonwebtoken';
import { scheduleDailyEmotionSummary } from './lib/scheduler';
import {
  simpleAnalyzeConversation,
  emotionToSvg,
  emotionToPercentage,
} from './lib/emotion-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Conversation } from '@prisma/client';
import { AI_PERSONALITIES, AIPersonality } from './lib/ai-personalities';

dotenv.config();

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

// AI 성격 관련 함수들
function getPersonalityById(id: string) {
  return AI_PERSONALITIES.find((p: AIPersonality) => p.id === id);
}

function getDefaultPersonality() {
  return AI_PERSONALITIES[0];
}

// CORS 설정
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL || 'https://your-vercel-domain.vercel.app',
        'http://localhost:3000', // 로컬 개발용
      ]
    : true; // 개발 환경에서 모든 origin 허용

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  res.send(
    `Hello from Mooda Server! 🚀 Auto-deploy test successful! Last updated: ${now}`
  );
});

app.post(
  '/api/auth/login',
  async (req: Request, res: Response): Promise<void> => {
    const { kakaoId, email, userName } = req.body;

    if (!kakaoId) {
      res.status(400).json({ error: 'kakaoId is required' });
      return;
    }

    try {
      const userUpserted = await prisma.user.upsert({
        where: { kakaoId: kakaoId.toString() },
        update: { userName, email },
        create: {
          kakaoId: kakaoId.toString(),
          email,
          userName,
        },
      });

      const jwtSecret = process.env.JWT_SECRET;
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
      if (!jwtSecret || !refreshTokenSecret) {
        throw new Error(
          'JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in the environment variables.'
        );
      }

      const accessTokenPayload = { userId: userUpserted.id };
      const accessToken = jwt.sign(accessTokenPayload, jwtSecret, {
        expiresIn: '1h',
      });

      const refreshTokenPayload = { userId: userUpserted.id };
      const refreshToken = jwt.sign(refreshTokenPayload, refreshTokenSecret, {
        expiresIn: '7d',
      });

      // Store the refresh token in the database
      await prisma.user.update({
        where: { id: userUpserted.id },
        data: { refreshToken },
      });

      res.status(200).json({
        userId: userUpserted.id,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login/Register Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

app.post(
  '/api/auth/refresh',
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh Token is required' });
      return;
    }

    try {
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
      if (!refreshTokenSecret) {
        throw new Error('REFRESH_TOKEN_SECRET is not defined');
      }

      const decoded = jwt.verify(refreshToken, refreshTokenSecret) as {
        userId: string;
      };

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
      });

      if (!user || user.refreshToken !== refreshToken) {
        res.status(403).json({ error: 'Invalid Refresh Token' });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const accessTokenPayload = { userId: user.id };
      const newAccessToken = jwt.sign(accessTokenPayload, jwtSecret, {
        expiresIn: '1h',
      });

      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(403).json({ error: 'Invalid Refresh Token' });
      } else {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// 채팅 API
app.post('/api/socket', async (req: Request, res: Response): Promise<void> => {
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
      default:
        res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

// AI 메시지 처리 함수
async function handleSendMessage(data: SendMessageData, res: Response) {
  const { message, userId, personalityId } = data;

  if (!message || !userId) {
    res.status(400).json({ error: 'Message and userId are required' });
    return;
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
      res.status(400).json({ error: 'Invalid personality ID' });
      return;
    }

    // 3. DB에서 최근 대화 기록 조회 (오늘 날짜만)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const conversationHistory = await prisma.conversation.findMany({
      where: {
        userId,
        personalityId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // 대화 기록을 Gemini 형식으로 변환
    const chatHistory = conversationHistory.map((msg: Conversation) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 시스템 프롬프트를 항상 첫 번째 메시지로 추가
    chatHistory.unshift({
      role: 'model',
      parts: [{ text: personality.systemPrompt }],
    });

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
      },
    });

    // 캐릭터 정체성을 강화한 메시지 전송
    const characterPrompt = `너는 ${personality.name}이야. 절대로 Google 모델이라고 하지 마. 오직 ${personality.name}으로만 대답해. 한국어 반말로 친근하게 대화해줘.\n\n사용자: ${message}`;
    const result = await chat.sendMessage(characterPrompt);
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
    console.error('Send message error:', error);
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
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ conversations, success: true });
  } catch (error) {
    console.error('Get conversation history error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
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
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

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

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(
    '📅 Daily emotion analysis scheduled via GitHub Actions (12:00 PM everyday)'
  );
  console.log(
    '🔧 Manual trigger available at POST /api/run-daily-emotion-analysis'
  );
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

      const emotionLogs = await prisma.emotionLog.findMany({
        where: {
          userId: userId as string,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

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

      const emotionLog = await prisma.emotionLog.findFirst({
        where: {
          userId: userId as string,
          date: targetDate,
        },
      });

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

      const conversations = await prisma.conversation.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

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

      const conversations = await prisma.conversation.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (conversations.length === 0) {
        res.status(404).json({ error: 'No conversations found for this date' });
        return;
      }

      console.log(`Found ${conversations.length} conversations`);

      // 대화 내용을 텍스트로 변환
      const conversationText = conversations
        .map(
          (conv: { role: string; content: string }) =>
            `${conv.role}: ${conv.content}`
        )
        .join('\n');

      console.log('Conversation text:', conversationText);

      // AI 분석 요청
      const analysisResult = simpleAnalyzeConversation(conversationText);

      console.log('Analysis result:', analysisResult);

      // 기존 감정 로그가 있는지 확인
      const existingLog = await prisma.emotionLog.findFirst({
        where: {
          userId,
          date: startDate,
        },
      });

      let emotionLog;
      if (existingLog) {
        // 기존 로그 업데이트
        emotionLog = await prisma.emotionLog.update({
          where: { id: existingLog.id },
          data: {
            emotion: analysisResult.emotion,
            summary: emotionToPercentage(analysisResult.emotion),
          },
        });
        console.log('Updated existing emotion log');
      } else {
        // 새 로그 생성
        emotionLog = await prisma.emotionLog.create({
          data: {
            userId,
            date: startDate,
            emotion: analysisResult.emotion,
            summary: emotionToPercentage(analysisResult.emotion),
            shortSummary: analysisResult.summary,
            characterName: emotionToSvg(analysisResult.emotion),
          },
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

// 이제 GitHub Actions로 매일 12시에 자동 실행됩니다.
