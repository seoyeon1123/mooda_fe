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
exports.scheduleDailyEmotionSummary = scheduleDailyEmotionSummary;
const emotion_service_1 = require("./emotion-service");
const prisma_1 = __importDefault(require("./prisma"));
function scheduleDailyEmotionSummary() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. DB에서 모든 사용자 조회
            const users = yield prisma_1.default.user.findMany({
                select: { id: true, userName: true },
            });
            if (users.length === 0) {
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
                    console.log(`Processing user: ${user.userName || user.id}`);
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
