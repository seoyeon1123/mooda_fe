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
exports.formatDateForDB = formatDateForDB;
exports.getConversations = getConversations;
exports.saveEmotionLog = saveEmotionLog;
exports.upsertEmotionLog = upsertEmotionLog;
exports.summarizeAndAnalyzeWithGemini = summarizeAndAnalyzeWithGemini;
exports.simpleAnalyzeConversation = simpleAnalyzeConversation;
const supabase_1 = require("./supabase");
const crypto_1 = __importDefault(require("crypto"));
// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDateForDB(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getConversations(userId, date) {
    return __awaiter(this, void 0, void 0, function* () {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const { data, error } = yield supabase_1.supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
        return data || [];
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
        return supabase_1.supabase.from('emotion_logs').insert({
            id: crypto_1.default.randomUUID(),
            user_id: userId,
            date: date.toISOString(),
            emotion,
            summary: (0, exports.emotionToPercentage)(emotion),
            short_summary: summary,
            character_name: (0, exports.emotionToSvg)(emotion),
        });
    });
}
function upsertEmotionLog(userId, date, summary, emotion) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateStr = formatDateForDB(date);
        console.log('🔍 upsertEmotionLog 호출:', {
            userId,
            dateStr,
            summary,
            emotion,
        });
        // 기존 EmotionLog 확인
        const { data: existing, error } = yield supabase_1.supabase
            .from('emotion_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('date', dateStr);
        console.log('🔍 기존 로그 확인 결과:', { existing, error });
        if (error) {
            console.error('Error checking existing emotion log:', error);
            return null;
        }
        if (existing && existing.length > 0) {
            console.log('📝 기존 로그 업데이트 중...');
            // 업데이트
            const result = yield supabase_1.supabase
                .from('emotion_logs')
                .update({
                summary: (0, exports.emotionToPercentage)(emotion), // 감정 퍼센트
                emotion,
                short_summary: summary, // 실제 요약 내용
                character_name: (0, exports.emotionToSvg)(emotion), // 이미지 경로
            })
                .eq('id', existing[0].id)
                .select();
            console.log('📝 업데이트 결과:', result);
            return result;
        }
        else {
            console.log('✨ 새 로그 생성 중...');
            // 생성
            const newLog = {
                id: crypto_1.default.randomUUID(),
                user_id: userId,
                date: dateStr,
                emotion,
                summary: (0, exports.emotionToPercentage)(emotion), // 감정 퍼센트
                short_summary: summary, // 실제 요약 내용
                character_name: (0, exports.emotionToSvg)(emotion), // 이미지 경로
            };
            console.log('✨ 생성할 데이터:', newLog);
            const result = yield supabase_1.supabase.from('emotion_logs').insert(newLog).select();
            console.log('✨ 생성 결과:', result);
            return result;
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
            const response = yield fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
    console.log('🔍 Fallback 분석 시작...');
    // 감정 키워드 점수 계산
    const emotionKeywords = {
        VeryHappy: [
            '완전',
            '너무 좋',
            '최고',
            '대박',
            '신나',
            '환상적',
            '완벽',
            '행복한 시간',
        ],
        Happy: [
            '좋',
            '기쁘',
            '행복',
            '즐겁',
            '만족',
            '웃',
            '기분 좋',
            '다행',
            '맛있',
        ],
        Neutral: ['그냥', '보통', '평범', '괜찮', '무난', '음'],
        Sad: ['슬프', '우울', '힘들', '아프', '속상', '실망', '걱정'],
        VerySad: ['너무 슬프', '절망', '포기', '죽고 싶', '최악'],
        Angry: ['짜증', '화나', '빡치', '싫어', '답답', '스트레스', '열받', '미치'],
    };
    // 각 감정별 점수 계산
    const scores = {};
    let maxScore = 0;
    let dominantEmotion = 'Neutral';
    const matchedKeywords = [];
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        let score = 0;
        for (const keyword of keywords) {
            if (conversationText.includes(keyword)) {
                score += 1;
                matchedKeywords.push(keyword);
            }
        }
        scores[emotion] = score;
        if (score > maxScore) {
            maxScore = score;
            dominantEmotion = emotion;
        }
    }
    console.log('📊 감정 점수:', scores);
    console.log('🎯 매칭된 키워드:', matchedKeywords);
    // 대화 내용에서 주요 문장 추출
    const lines = conversationText.split('\n');
    const userMessages = lines
        .filter((line) => line.startsWith('user:'))
        .map((line) => line.replace('user:', '').trim());
    const lastUserMessage = userMessages[userMessages.length - 1] || '';
    const summary = lastUserMessage || '하루 일상을 보낸 평범한 날';
    console.log('✅ 분석 완료 - 감정:', dominantEmotion, '(점수:', maxScore, '), 요약:', summary);
    return {
        summary,
        emotion: dominantEmotion,
        highlight: matchedKeywords.join(', '),
    };
}
