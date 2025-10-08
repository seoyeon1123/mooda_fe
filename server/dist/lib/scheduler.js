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
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleDailyEmotionSummary = scheduleDailyEmotionSummary;
exports.testTodayEmotionSummary = testTodayEmotionSummary;
const emotion_service_1 = require("./emotion-service");
const supabase_1 = require("./supabase");
function scheduleDailyEmotionSummary() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. DB에서 모든 사용자 조회
            const { data: users, error } = yield supabase_1.supabase
                .from('users')
                .select('id, user_name');
            if (error) {
                console.error('Error fetching users:', error);
                return;
            }
            if (!users || users.length === 0) {
                console.log('No users found in database');
                return;
            }
            // 2. 어제 날짜 계산 (00:00~23:59)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            console.log(`Processing daily emotion summary for ${yesterday.toDateString()}`);
            // 3. 각 사용자별로 처리
            for (const user of users) {
                try {
                    console.log(`Processing user: ${user.user_name || user.id}`);
                    // 어제 대화 로그 조회
                    const conversations = yield (0, emotion_service_1.getConversations)(user.id, yesterday);
                    if (conversations.length === 0) {
                        console.log(`No conversations found for user ${user.id}`);
                        continue;
                    }
                    // 대화 내용 텍스트 추출
                    const messageTexts = conversations.map((conv) => conv.content);
                    // AI 요약 및 감정 분석
                    const { summary, emotion } = yield (0, emotion_service_1.summarizeAndAnalyzeWithGemini)(messageTexts);
                    // EmotionLog에 저장
                    yield (0, emotion_service_1.upsertEmotionLog)(user.id, yesterday, summary, emotion);
                    console.log(`Daily emotion summary saved for ${user.id}: ${emotion}, ${summary.substring(0, 50)}...`);
                }
                catch (userError) {
                    console.error(`Error processing user ${user.id}:`, userError);
                    // 한 사용자 처리 실패해도 다른 사용자는 계속 처리
                }
            }
        }
        catch (error) {
            console.error('Error in daily emotion summary:', error);
        }
    });
}
// 테스트용: 오늘 날짜로 감정 분석 실행
function testTodayEmotionSummary() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🚀 testTodayEmotionSummary 시작');
            // 1. DB에서 모든 사용자 조회
            const { data: users, error } = yield supabase_1.supabase
                .from('users')
                .select('id, user_name');
            console.log('👥 사용자 조회 결과:', { users, error });
            if (error) {
                console.error('Error fetching users:', error);
                return;
            }
            if (!users || users.length === 0) {
                console.log('No users found in database');
                return;
            }
            // 2. 오늘 날짜 계산
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            console.log(`Processing daily emotion summary for today: ${today.toDateString()}`);
            // 3. 각 사용자별로 처리
            for (const user of users) {
                try {
                    console.log(`🔄 Processing user: ${user.user_name || user.id}`);
                    // 오늘 대화 로그 조회
                    const conversations = yield (0, emotion_service_1.getConversations)(user.id, today);
                    console.log(`💬 Found ${conversations.length} conversations for user ${user.id}`);
                    if (conversations.length === 0) {
                        console.log(`No conversations found for user ${user.id}`);
                        continue;
                    }
                    // 대화 내용 텍스트 추출
                    const messageTexts = conversations.map((conv) => conv.content);
                    // 간단한 감정 분석 (AI 호출 대신)
                    const allText = messageTexts.join(' ');
                    let emotion = 'neutral';
                    if (allText.includes('좋') ||
                        allText.includes('행복') ||
                        allText.includes('기쁘')) {
                        emotion = 'happy';
                    }
                    else if (allText.includes('슬프') ||
                        allText.includes('우울') ||
                        allText.includes('힘들')) {
                        emotion = 'sad';
                    }
                    else if (allText.includes('화') ||
                        allText.includes('짜증') ||
                        allText.includes('화나')) {
                        emotion = 'angry';
                    }
                    const summary = `오늘 ${conversations.length}개의 메시지를 주고받았습니다.`;
                    console.log(`🎯 Analysis result for ${user.id}: emotion=${emotion}, summary=${summary}`);
                    // EmotionLog에 저장
                    console.log(`💾 Saving emotion log for user ${user.id}...`);
                    const saveResult = yield (0, emotion_service_1.upsertEmotionLog)(user.id, today, summary, emotion);
                    console.log(`💾 Save result:`, saveResult);
                    console.log(`✅ Daily emotion summary saved for ${user.id}: ${emotion}, ${summary.substring(0, 50)}...`);
                }
                catch (userError) {
                    console.error(`❌ Error processing user ${user.id}:`, userError);
                    // 한 사용자 처리 실패해도 다른 사용자는 계속 처리
                }
            }
            console.log('🏁 testTodayEmotionSummary 완료');
        }
        catch (error) {
            console.error('❌ Error in daily emotion summary:', error);
        }
    });
}
// GitHub Actions에서 직접 실행할 수 있도록 main 함수 추가
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Starting daily emotion analysis...');
        try {
            yield scheduleDailyEmotionSummary();
            console.log('✅ Daily emotion analysis completed successfully');
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Daily emotion analysis failed:', error);
            process.exit(1);
        }
    });
}
// 파일이 직접 실행될 때만 main 함수 실행
if (require.main === module) {
    main();
}
