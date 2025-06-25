import {
  getEmotionLogs,
  upsertEmotionLog,
  summarizeAndAnalyzeWithGemini,
} from './emotion-service';
import prisma from './prisma';

export async function scheduleDailyEmotionSummary() {
  try {
    // 1. DB에서 모든 사용자 조회
    const users = await prisma.user.findMany({
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

    console.log(
      `Processing daily emotion summary for ${yesterday.toDateString()}`
    );

    // 3. 각 사용자별로 처리
    for (const user of users) {
      try {
        console.log(`Processing user: ${user.userName || user.id}`);

        // 어제 대화 로그 조회
        const conversations = await getEmotionLogs(user.id, yesterday);

        if (conversations.length === 0) {
          console.log(`No conversations found for user ${user.id}`);
          continue;
        }

        // 대화 내용 텍스트 추출
        const messageTexts = conversations.map((conv) => conv.content);

        // AI 요약 및 감정 분석
        const { summary, emotion } = await summarizeAndAnalyzeWithGemini(
          messageTexts
        );

        // EmotionLog에 저장
        await upsertEmotionLog(user.id, yesterday, summary, emotion);

        console.log(
          `Daily emotion summary saved for ${
            user.id
          }: ${emotion}, ${summary.substring(0, 50)}...`
        );
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        // 한 사용자 처리 실패해도 다른 사용자는 계속 처리
      }
    }
  } catch (error) {
    console.error('Error in daily emotion summary:', error);
  }
}
