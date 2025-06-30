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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const scheduler_1 = require("./lib/scheduler");
const emotion_service_1 = require("./lib/emotion-service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// CORS 설정
app.use((0, cors_1.default)({
    origin: true, // 개발 환경에서 모든 origin 허용
    credentials: true,
}));
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Hello from Mooda Server!');
});
app.post('/api/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { kakaoId, email, userName } = req.body;
    if (!kakaoId) {
        res.status(400).json({ error: 'kakaoId is required' });
        return;
    }
    try {
        const userUpserted = yield prisma_1.default.user.upsert({
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
            throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in the environment variables.');
        }
        const accessTokenPayload = { userId: userUpserted.id };
        const accessToken = jsonwebtoken_1.default.sign(accessTokenPayload, jwtSecret, {
            expiresIn: '1h',
        });
        const refreshTokenPayload = { userId: userUpserted.id };
        const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, refreshTokenSecret, {
            expiresIn: '7d',
        });
        // Store the refresh token in the database
        yield prisma_1.default.user.update({
            where: { id: userUpserted.id },
            data: { refreshToken },
        });
        res.status(200).json({
            userId: userUpserted.id,
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        console.error('Login/Register Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/auth/refresh', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const decoded = jsonwebtoken_1.default.verify(refreshToken, refreshTokenSecret);
        const user = yield prisma_1.default.user.findUnique({
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
        const newAccessToken = jsonwebtoken_1.default.sign(accessTokenPayload, jwtSecret, {
            expiresIn: '1h',
        });
        res.status(200).json({ accessToken: newAccessToken });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(403).json({ error: 'Invalid Refresh Token' });
        }
        else {
            console.error('Refresh token error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    console.log('📅 Daily emotion analysis scheduled via GitHub Actions (12:00 PM everyday)');
    console.log('🔧 Manual trigger available at POST /api/run-daily-emotion-analysis');
});
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
// 이제 GitHub Actions로 매일 12시에 자동 실행됩니다.
