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
exports.emotionToPercentage = exports.emotionToSvg = void 0;
exports.getConversations = getConversations;
exports.saveEmotionLog = saveEmotionLog;
exports.upsertEmotionLog = upsertEmotionLog;
exports.summarizeAndAnalyzeWithGemini = summarizeAndAnalyzeWithGemini;
exports.simpleAnalyzeConversation = simpleAnalyzeConversation;
const prisma_1 = __importDefault(require("./prisma"));
function getConversations(userId, date) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return prisma_1.default.conversation.findMany({
            where: {
                userId,
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    });
}
// Gemini 감정 결과를 svg 파일명으로 매핑
const emotionToSvg = (emotion) => {
    const map = {
        VeryHappy: '/images/emotion/veryHappy.svg',
        Happy: '/images/emotion/happy.svg',
        Neutral: '/images/emotion/soso.svg',
        SlightlySad: '/images/emotion/sad.svg',
        Sad: '/images/emotion/sad.svg',
        VerySad: '/images/emotion/verySad.svg',
        Angry: '/images/emotion/angry.svg',
        excited: '/images/emotion/veryHappy.svg',
        happy: '/images/emotion/happy.svg',
        calm: '/images/emotion/soso.svg',
        anxious: '/images/emotion/sad.svg',
        sad: '/images/emotion/sad.svg',
        angry: '/images/emotion/verySad.svg',
    };
    return map[emotion] || '/images/emotion/soso.svg';
};
exports.emotionToSvg = emotionToSvg;
// 감정을 퍼센트로 변환
const emotionToPercentage = (emotion) => {
    const emotionNames = {
        VeryHappy: '매우 행복',
        Happy: '행복',
        Neutral: '평온',
        Sad: '슬픔',
        VerySad: '매우 슬픔',
        Angry: '화남',
        excited: '흥분',
        happy: '행복',
        calm: '평온',
        anxious: '불안',
        sad: '슬픔',
        angry: '화남',
    };
    // 80-95% 사이의 랜덤 퍼센트 생성
    const percentage = Math.floor(Math.random() * 16) + 80; // 80-95
    const emotionName = emotionNames[emotion] || '평온';
    return `${emotionName} ${percentage}%`;
};
exports.emotionToPercentage = emotionToPercentage;
function saveEmotionLog(userId, date, summary, emotion) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.emotionLog.create({
            data: {
                id: crypto.randomUUID(),
                userId,
                date,
                emotion,
                summary: (0, exports.emotionToPercentage)(emotion),
                shortSummary: summary,
                characterName: (0, exports.emotionToSvg)(emotion),
            },
        });
    });
}
function upsertEmotionLog(userId, date, summary, emotion) {
    return __awaiter(this, void 0, void 0, function* () {
        // 기존 EmotionLog 확인
        const existing = yield prisma_1.default.emotionLog.findFirst({
            where: {
                userId,
                date,
            },
        });
        if (existing) {
            // 업데이트
            return prisma_1.default.emotionLog.update({
                where: { id: existing.id },
                data: {
                    summary: (0, exports.emotionToPercentage)(emotion), // 감정 퍼센트
                    emotion,
                    shortSummary: summary, // 실제 요약 내용
                    characterName: (0, exports.emotionToSvg)(emotion), // 이미지 경로
                },
            });
        }
        else {
            // 생성
            return prisma_1.default.emotionLog.create({
                data: {
                    id: crypto.randomUUID(),
                    userId,
                    date,
                    emotion,
                    summary: (0, exports.emotionToPercentage)(emotion), // 감정 퍼센트
                    shortSummary: summary, // 실제 요약 내용
                    characterName: (0, exports.emotionToSvg)(emotion), // 이미지 경로
                },
            });
        }
    });
}
function summarizeAndAnalyzeWithGemini(messages) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        const prompt = `
당신은 친근한 일기 작성 도우미입니다. 사용자의 하루를 자연스럽고 따뜻하게 요약해주세요.

사용자의 하루 이야기:
${messages.join('\n')}

요약 가이드라인:
1. 마치 친구가 일기를 써주는 것처럼 친근하고 자연스럽게 작성
2. 사용자의 실제 활동과 감정에 집중 (AI, 대화, 추천 등 언급 금지)
3. 일상적인 말투로 편안하게 표현
4. 사용자 입장에서 "나는 오늘..." 식으로 생각하며 작성

좋은 요약 예시:
- "오늘은 저녁 메뉴를 고민하다가 결국 고등어회가 땡겨서 먹고 싶어했어요 😊"
- "회사 일로 좀 피곤했지만 그래도 하루를 무사히 보냈네요"
- "친구들과 만나서 수다 떨며 즐거운 시간 보낸 기분 좋은 하루였어요"
- "비 오는 날씨 때문에 기분이 조금 우울했지만 집에서 편안히 쉬었어요"

다음 JSON 형식으로 응답해주세요:
{
  "summary": "친근하고 자연스러운 하루 요약 (이모지 포함 가능, 1-2문장)",
  "emotion": "VeryHappy, Happy, Neutral, Sad, VerySad, Angry 중 하나",
  "highlight": "오늘 가장 기억에 남는 감정이나 일"
}

감정 분류:
- VeryHappy: 정말 기쁘고 신나는 날 🎉
- Happy: 기분 좋고 만족스러운 날 😊  
- Neutral: 평범하고 무난한 일상 😐
- Sad: 조금 슬프거나 아쉬운 날 😢
- VerySad: 많이 힘들거나 우울한 날 😭
- Angry: 짜증나거나 화가 난 날 😠
`;
        try {
            console.log('🔍 Gemini API 호출 시작...');
            console.log('📝 대화 메시지 수:', messages.length);
            console.log('🔑 API Key 앞 10자:', ((_a = process.env.GEMINI_API_KEY) === null || _a === void 0 ? void 0 : _a.substring(0, 10)) + '...');
            const response = yield fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });
            console.log('📡 API 응답 상태:', response.status);
            if (!response.ok) {
                const errorText = yield response.text();
                console.error('❌ API 오류 응답:', errorText);
                throw new Error(`API 호출 실패: ${response.status} - ${errorText}`);
            }
            const data = yield response.json();
            console.log('📋 API 응답 데이터:', JSON.stringify(data, null, 2));
            const text = (_g = (_f = (_e = (_d = (_c = (_b = data.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text) !== null && _g !== void 0 ? _g : '';
            console.log('🔤 추출된 텍스트:', text);
            // JSON 파싱
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                console.log('✅ 파싱된 결과:', result);
                return {
                    summary: result.summary || '하루 일상을 보낸 평범한 날',
                    emotion: result.emotion || 'Neutral',
                    highlight: result.highlight || '',
                };
            }
            // JSON 파싱 실패 시 fallback
            console.log('⚠️ JSON 파싱 실패, fallback 시도...');
            const summaryMatch = text.match(/요약[:\s]*(.+)/);
            const emotionMatch = text.match(/감정[:\s]*(\w+)/);
            return {
                summary: summaryMatch ? summaryMatch[1] : '하루 일상을 보낸 평범한 날',
                emotion: emotionMatch ? emotionMatch[1] : 'Neutral',
                highlight: '',
            };
        }
        catch (error) {
            console.error('❌ Gemini API 호출 실패:', error);
            console.log('🔄 간단한 분석으로 fallback...');
            // API 호출 실패 시 간단한 분석으로 fallback
            return simpleAnalyzeConversation(messages.join('\n'));
        }
    });
}
// 개선된 간단한 감정 분석 함수
function simpleAnalyzeConversation(conversationText) {
    var _a;
    console.log('🔍 Fallback 분석 시작...');
    const lowerText = conversationText.toLowerCase();
    let emotion = 'Neutral';
    let emotionScore = 0;
    // 감정 키워드 점수 계산
    const emotionKeywords = {
        VeryHappy: ['완전', '너무좋', '최고', '대박', '신나', '환상적', '완벽'],
        Happy: ['좋', '기쁘', '행복', '즐거', '만족', '웃', '기분좋', '다행'],
        Neutral: ['그냥', '보통', '평범', '괜찮', '무난'],
        Sad: ['슬프', '우울', '힘들', '아프', '속상', '실망', '걱정'],
        VerySad: ['너무슬', '절망', '포기', '죽고싶', '최악'],
        Angry: ['짜증', '화', '빡', '싫', '답답', '스트레스', '열받', '미치'],
    };
    // 각 감정별 점수 계산
    const scores = {};
    for (const [emotionType, keywords] of Object.entries(emotionKeywords)) {
        scores[emotionType] = 0;
        keywords.forEach((keyword) => {
            const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
            scores[emotionType] += matches;
        });
    }
    // 가장 높은 점수의 감정 선택
    const maxEmotion = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    if (scores[maxEmotion] > 0) {
        emotion = maxEmotion;
        emotionScore = scores[maxEmotion];
    }
    // 대화 내용 정리
    const messages = conversationText
        .split('\n')
        .filter((line) => line.trim().length > 0);
    const userMessages = messages.filter((line) => !line.toLowerCase().includes('ai') &&
        !line.toLowerCase().includes('assistant'));
    // 스마트 요약 생성
    let summary = '';
    let highlight = '';
    if (lowerText.includes('비') &&
        (lowerText.includes('기분') || lowerText.includes('우울'))) {
        summary = '비 오는 날씨로 인해 우울한 기분을 느낀 하루';
        highlight = '비 때문에 기분이 안 좋음';
    }
    else if (lowerText.includes('회사') ||
        lowerText.includes('업무') ||
        lowerText.includes('일')) {
        if (emotion === 'Angry' || emotion === 'Sad') {
            summary = '회사 업무로 인한 스트레스와 피로감을 느낀 하루';
            highlight = '업무 스트레스';
        }
        else {
            summary = '회사 일상과 업무에 대한 대화를 나눈 하루';
            highlight = '일상적인 업무 대화';
        }
    }
    else if (lowerText.includes('친구') || lowerText.includes('가족')) {
        summary = '주변 사람들과의 관계에 대해 이야기한 하루';
        highlight = '인간관계 대화';
    }
    else if (lowerText.includes('음식') || lowerText.includes('먹')) {
        summary = '음식과 식사에 관한 대화를 나눈 하루';
        highlight = '음식 관련 대화';
    }
    else {
        // 일반적인 요약
        const meaningfulMessages = userMessages
            .slice(0, 3)
            .join(' ')
            .substring(0, 80);
        summary =
            meaningfulMessages + (meaningfulMessages.length >= 80 ? '...' : '');
        highlight = ((_a = userMessages[0]) === null || _a === void 0 ? void 0 : _a.substring(0, 30)) || '일상 대화';
    }
    console.log(`✅ 분석 완료 - 감정: ${emotion} (점수: ${emotionScore}), 요약: ${summary.substring(0, 30)}...`);
    return {
        summary: summary || '다양한 주제로 대화를 나눈 하루',
        emotion,
        highlight: highlight || '일상 대화',
    };
}
