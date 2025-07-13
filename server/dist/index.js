"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const scheduler_1 = require("./lib/scheduler");
const emotion_service_1 = require("./lib/emotion-service");
const generative_ai_1 = require("@google/generative-ai");
const ai_personalities_1 = require("./lib/ai-personalities");
const crypto_1 = __importDefault(require("crypto"));
// 커스텀 AI 서비스 가져오기
const custom_ai_service_1 = require("./lib/custom-ai-service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// Gemini AI 초기화
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// AI 성격 관련 함수들
function getDefaultPersonality() {
    return ai_personalities_1.AI_PERSONALITIES[0];
}
// CORS 설정
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'https://mooda.vercel.app'],
    credentials: true,
}));
// JSON 파서 설정
app.use(express_1.default.json());
// Health check 엔드포인트
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 사용자 정보 조회 API
app.get('/api/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        console.log('[GET /api/user] 요청:', { userId });
        if (!userId) {
            return res.status(400).json({ error: 'userId가 필요합니다.' });
        }
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                customAIPersonalities: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        console.log('[GET /api/user] 응답:', user);
        return res.json(user);
    }
    catch (error) {
        console.error('[GET /api/user] 오류:', error);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}));
// 사용자 정보 업데이트 API
app.put('/api/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, selectedPersonalityId } = req.body;
        console.log('[PUT /api/user] 요청:', { userId, selectedPersonalityId });
        if (!userId) {
            return res.status(400).json({ error: 'userId가 필요합니다.' });
        }
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                customAIPersonalities: true,
            },
        });
        if (!existingUser) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        // selectedPersonalityId 유효성 검증
        if (selectedPersonalityId) {
            const isDefaultAI = ai_personalities_1.AI_PERSONALITIES.some((ai) => ai.id === selectedPersonalityId);
            const isCustomAI = existingUser.customAIPersonalities.some((ai) => ai.id === selectedPersonalityId);
            if (!isDefaultAI && !isCustomAI) {
                return res.status(400).json({ error: '유효하지 않은 AI 성격입니다.' });
            }
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: userId },
            data: { selectedPersonalityId },
            include: {
                customAIPersonalities: true,
            },
        });
        console.log('[PUT /api/user] 응답:', updatedUser);
        return res.json(updatedUser);
    }
    catch (error) {
        console.error('[PUT /api/user] 오류:', error);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}));
// 인증 미들웨어
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.userId;
        if (!userId) {
            res.status(401).json({ error: '인증이 필요합니다' });
            return;
        }
        // 사용자 존재 여부 확인
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            // 사용자가 없으면 카카오 ID로 다시 확인
            const kakaoUser = yield prisma_1.default.user.findFirst({
                where: { kakaoId: userId },
            });
            if (!kakaoUser) {
                res.status(401).json({ error: '유효하지 않은 사용자입니다' });
                return;
            }
            // 요청의 userId를 실제 DB의 userId로 변경
            req.body.data.userId = kakaoUser.id;
        }
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다' });
    }
});
// 채팅 API에 인증 미들웨어 적용
app.post('/api/socket', authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { action, data } = req.body;
    try {
        switch (action) {
            case 'send-message':
                yield handleSendMessage(data, res);
                break;
            case 'analyze-emotion':
                yield handleAnalyzeEmotion(data, res);
                break;
            case 'get-conversation-history':
                yield getConversationHistory(data, res);
                break;
            default:
                res.status(400).json({ error: 'Unknown action' });
        }
    }
    catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'An internal server error occurred' });
    }
}));
// AI 메시지 처리 함수
function handleSendMessage(data, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { message, userId, personalityId } = data;
        if (!message || !userId) {
            res.status(400).json({ error: 'Message and userId are required' });
            return;
        }
        console.log('🚀 handleSendMessage 시작:', { message, userId, personalityId });
        console.log('🔑 GEMINI_API_KEY 존재 여부:', !!process.env.GEMINI_API_KEY);
        console.log('🔑 API 키 길이:', (_a = process.env.GEMINI_API_KEY) === null || _a === void 0 ? void 0 : _a.length);
        try {
            // 1. 사용자 메시지를 DB에 저장
            console.log('💾 사용자 메시지 DB 저장 시작...');
            // 사용자 메시지 저장
            const userMessage = yield prisma_1.default.conversation.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    userId,
                    role: 'user',
                    content: message,
                    personalityId,
                },
            });
            console.log('✅ 사용자 메시지 저장 완료:', userMessage.id);
            // 2. AI 성격 설정 가져오기
            let personality;
            if (personalityId) {
                console.log('🔍 AI 성격 검색 시작:', personalityId);
                // 먼저 기본 AI 목록에서 찾기
                personality = ai_personalities_1.AI_PERSONALITIES.find((p) => p.id === personalityId);
                // 기본 AI에 없다면 커스텀 AI에서 찾기
                if (!personality) {
                    console.log('🔍 기본 AI에서 찾지 못함, 커스텀 AI 확인 중...');
                    try {
                        const customAI = yield prisma_1.default.customAIPersonality.findFirst({
                            where: {
                                id: personalityId,
                                userId: userId,
                                isActive: true,
                            },
                        });
                        if (customAI) {
                            console.log('✅ 커스텀 AI 찾음:', customAI.name);
                            const mbtiTypes = typeof customAI.mbtiTypes === 'string'
                                ? JSON.parse(customAI.mbtiTypes)
                                : customAI.mbtiTypes;
                            personality = {
                                id: customAI.id,
                                name: customAI.name,
                                systemPrompt: customAI.systemPrompt,
                                iconType: `${mbtiTypes.energy}${mbtiTypes.information}${mbtiTypes.decisions}${mbtiTypes.lifestyle}`,
                            };
                        }
                        else {
                            console.log('⚠️ 커스텀 AI를 찾을 수 없음:', personalityId);
                            res.status(400).json({ error: 'Invalid personality ID' });
                            return;
                        }
                    }
                    catch (error) {
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
            const conversationHistory = yield prisma_1.default.conversation.findMany({
                where: {
                    userId,
                    personalityId,
                    createdAt: { gte: today },
                },
                orderBy: { createdAt: 'asc' },
                take: 20,
            });
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
            const result = yield chat.sendMessage(characterPrompt);
            const response = result.response;
            const aiContent = response.text();
            console.log('📥 AI 응답 받음:', aiContent.substring(0, 50) + '...');
            // 5. AI 응답 길이 제한
            let finalContent = aiContent;
            if (finalContent.length > 150) {
                const slice = finalContent.slice(0, 150);
                const lastPunct = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'), slice.lastIndexOf('…'), slice.lastIndexOf('\n'));
                finalContent = lastPunct > 50 ? slice.slice(0, lastPunct + 1) : slice;
            }
            // 6. AI 응답을 DB에 저장
            console.log('💾 AI 응답 DB 저장 중...');
            // AI 응답 저장
            const aiResponse = yield prisma_1.default.conversation.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    userId,
                    role: 'ai',
                    content: finalContent,
                    personalityId,
                },
            });
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
        }
        catch (error) {
            console.error('❌ Send message error 상세:', error);
            console.error('❌ Error type:', typeof error);
            console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
            res.status(500).json({ error: 'Failed to generate AI response' });
        }
    });
}
// 대화 기록 조회 함수
function getConversationHistory(data, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = data;
        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        try {
            const conversations = yield prisma_1.default.conversation.findMany({
                where: {
                    userId,
                    createdAt: { gte: today },
                },
                orderBy: { createdAt: 'asc' },
            });
            res.json({ conversations, success: true });
        }
        catch (error) {
            console.error('Get conversation history error:', error);
            res.status(500).json({ error: 'Failed to retrieve conversation history' });
        }
    });
}
// 감정 분석 함수
function handleAnalyzeEmotion(data, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = data;
        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        try {
            const conversations = yield prisma_1.default.conversation.findMany({
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
            const result = yield model.generateContent(prompt);
            const response = result.response;
            const jsonString = response
                .text()
                .replace(/```json|```/g, '')
                .trim();
            const analysisResult = JSON.parse(jsonString);
            res.json(Object.assign(Object.assign({}, analysisResult), { success: true }));
        }
        catch (error) {
            console.error('Analyze emotion error:', error);
            if (error instanceof SyntaxError) {
                res.status(500).json({ error: 'Failed to parse AI analysis response' });
            }
            else {
                res.status(500).json({ error: 'Failed to analyze emotion' });
            }
        }
    });
}
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    // 데이터베이스 연결 테스트
    try {
        const users = yield prisma_1.default.user.findMany();
        console.log('📊 현재 등록된 사용자 수:', users.length);
    }
    catch (error) {
        console.error('❌ 데이터베이스 연결 오류:', error);
    }
    console.log('📅 Daily emotion analysis scheduled via GitHub Actions (12:00 PM everyday)');
    console.log('🔧 Manual trigger available at POST /api/run-daily-emotion-analysis');
}));
// EmotionLog 조회 API
app.get('/api/emotion-logs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, year, month } = req.query;
        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }
        // 해당 월의 시작과 끝 날짜 계산
        const targetYear = year
            ? parseInt(year)
            : new Date().getFullYear();
        const targetMonth = month
            ? parseInt(month) - 1
            : new Date().getMonth(); // month는 0부터 시작
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
        const emotionLogs = yield prisma_1.default.emotionLog.findMany({
            where: {
                userId: userId,
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
    }
    catch (error) {
        console.error('Error fetching emotion logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 특정 날짜의 EmotionLog 상세 조회
app.get('/api/emotion-logs/:date', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date } = req.params;
        const { userId } = req.query;
        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const emotionLog = yield prisma_1.default.emotionLog.findFirst({
            where: {
                userId: userId,
                date: targetDate,
            },
        });
        if (!emotionLog) {
            res.status(404).json({ error: 'EmotionLog not found for this date' });
            return;
        }
        res.status(200).json({ emotionLog });
    }
    catch (error) {
        console.error('Error fetching emotion log detail:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 실제 대화 기록 조회 (디버깅용)
app.get('/api/conversations/:userId/:date', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, date } = req.params;
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        const conversations = yield prisma_1.default.conversation.findMany({
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
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 실제 대화 분석해서 감정 로그 생성 (테스트용)
app.post('/api/test-emotion-analysis', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, date } = req.body;
        console.log(`Starting emotion analysis for user ${userId} on date ${date}`);
        // 해당 날짜의 대화 기록 조회
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        const conversations = yield prisma_1.default.conversation.findMany({
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
            .map((conv) => `${conv.role}: ${conv.content}`)
            .join('\n');
        console.log('Conversation text:', conversationText);
        // AI 분석 요청
        const analysisResult = (0, emotion_service_1.simpleAnalyzeConversation)(conversationText);
        console.log('Analysis result:', analysisResult);
        // 기존 감정 로그가 있는지 확인
        const existingLog = yield prisma_1.default.emotionLog.findFirst({
            where: {
                userId,
                date: startDate,
            },
        });
        let emotionLog;
        if (existingLog) {
            // 기존 로그 업데이트
            emotionLog = yield prisma_1.default.emotionLog.update({
                where: { id: existingLog.id },
                data: {
                    emotion: analysisResult.emotion,
                    summary: (0, emotion_service_1.emotionToPercentage)(analysisResult.emotion),
                },
            });
            console.log('Updated existing emotion log');
        }
        else {
            // 새 로그 생성
            emotionLog = yield prisma_1.default.emotionLog.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    userId,
                    date: startDate,
                    emotion: analysisResult.emotion,
                    summary: (0, emotion_service_1.emotionToPercentage)(analysisResult.emotion),
                    shortSummary: analysisResult.summary,
                    characterName: (0, emotion_service_1.emotionToSvg)(analysisResult.emotion),
                },
            });
            console.log('Created new emotion log');
        }
        res.status(200).json({
            success: true,
            emotionLog,
            conversationsAnalyzed: conversations.length,
        });
    }
    catch (error) {
        console.error('Error in test emotion analysis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// 스케줄러 수동 실행 API (테스트용)
app.post('/api/run-daily-emotion-analysis', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔧 Manual daily emotion analysis triggered');
        yield (0, scheduler_1.scheduleDailyEmotionSummary)();
        res.status(200).json({
            success: true,
            message: 'Daily emotion analysis completed successfully',
        });
    }
    catch (error) {
        console.error('Manual daily emotion analysis failed:', error);
        res.status(500).json({
            success: false,
            error: 'Daily emotion analysis failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}));
// 커스텀 AI API 엔드포인트
app.get('/api/custom-ai', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query;
        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }
        console.log('🔍 커스텀 AI 조회 요청:', userId);
        const customAIs = yield (0, custom_ai_service_1.getCustomAIs)(userId);
        res.json(customAIs);
    }
    catch (error) {
        console.error('커스텀 AI 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
}));
app.post('/api/custom-ai', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, name, description, mbtiTypes, systemPrompt } = req.body;
        if (!userId || !name || !description || !mbtiTypes || !systemPrompt) {
            res.status(400).json({ error: '필수 필드가 누락되었습니다' });
            return;
        }
        const customAI = yield (0, custom_ai_service_1.createCustomAI)({
            userId,
            name,
            description,
            mbtiTypes,
            systemPrompt,
        });
        res.json(customAI);
    }
    catch (error) {
        console.error('커스텀 AI 생성 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
}));
// 사용자 정보 업데이트 API
app.put('/api/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, selectedPersonalityId } = req.body;
        console.log('사용자 정보 업데이트 요청:', {
            userId,
            selectedPersonalityId,
        });
        if (!userId) {
            res.status(400).json({ error: 'userId가 필요합니다.' });
            return;
        }
        // 사용자 존재 여부 확인
        const existingUser = yield prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }
        // selectedPersonalityId 유효성 검증
        if (selectedPersonalityId) {
            // 기본 AI 확인
            const isDefaultAI = ai_personalities_1.AI_PERSONALITIES.some((ai) => ai.id === selectedPersonalityId);
            if (!isDefaultAI) {
                // 커스텀 AI 확인
                const customAI = yield prisma_1.default.customAIPersonality.findFirst({
                    where: {
                        id: selectedPersonalityId,
                        userId: userId,
                        isActive: true,
                    },
                });
                if (!customAI) {
                    res.status(400).json({ error: '유효하지 않은 AI 성격입니다.' });
                    return;
                }
            }
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: userId },
            data: { selectedPersonalityId },
            select: {
                id: true,
                userName: true,
                email: true,
                image: true,
                selectedPersonalityId: true,
            },
        });
        console.log('사용자 정보 업데이트 완료:', updatedUser);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('사용자 정보 업데이트 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}));
// 사용자 정보 조회 API
app.get('/api/user', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        console.log('사용자 정보 조회 요청:', userId);
        if (!userId) {
            res.status(400).json({ error: 'userId가 필요합니다.' });
            return;
        }
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userName: true,
                email: true,
                image: true,
                selectedPersonalityId: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }
        console.log('사용자 정보 조회 완료:', user);
        res.json(user);
    }
    catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}));
// 로그인 API 엔드포인트
app.post('/api/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { kakaoId, email, userName, image } = req.body;
        if (!kakaoId) {
            res.status(400).json({ error: 'kakaoId is required' });
            return;
        }
        // 기존 사용자 찾기 또는 새로운 사용자 생성
        let user = yield prisma_1.default.user.findFirst({
            where: { kakaoId: kakaoId },
        });
        if (!user) {
            // 새로운 사용자 생성
            user = yield prisma_1.default.user.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    kakaoId,
                    email,
                    userName,
                    image,
                },
            });
        }
        else {
            // 기존 사용자 정보 업데이트
            user = yield prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    email,
                    userName,
                    image,
                },
            });
        }
        res.json({
            userId: user.id,
            name: user.userName,
            email: user.email,
            image: user.image,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
    }
}));
// 이제 GitHub Actions로 매일 12시에 자동 실행됩니다.
