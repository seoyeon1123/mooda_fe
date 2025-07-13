import prisma from './prisma';

export async function getCustomAIs(userId: string) {
  try {
    console.log('🔍 커스텀 AI 조회 시작:', userId);
    const customAIs = await prisma.customAIPersonality.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
    console.log(`✅ 커스텀 AI ${customAIs.length}개 찾음`);
    return customAIs;
  } catch (error) {
    console.error('커스텀 AI 조회 오류:', error);
    throw error;
  }
}

export async function createCustomAI(data: {
  userId: string;
  name: string;
  description: string;
  mbtiTypes: unknown; // 다양한 형식을 받을 수 있도록 수정
  systemPrompt: string;
}) {
  try {
    console.log('[createCustomAI] 입력 데이터:', {
      userId: data.userId,
      name: data.name,
      mbtiTypes: data.mbtiTypes,
      mbtiTypesType: typeof data.mbtiTypes,
    });

    // mbtiTypes를 JSON 객체로 저장 (Prisma Json 타입)
    let mbtiTypesObj: {
      energy: string;
      information: string;
      decisions: string;
      lifestyle: string;
    };

    if (typeof data.mbtiTypes === 'string') {
      console.log('[createCustomAI] 문자열 파싱 시도:', data.mbtiTypes);
      try {
        mbtiTypesObj = JSON.parse(data.mbtiTypes);
      } catch (parseError) {
        console.error('[createCustomAI] JSON 파싱 실패:', parseError);
        // 파싱 실패 시 기본값
        mbtiTypesObj = {
          energy: 'I',
          information: 'N',
          decisions: 'F',
          lifestyle: 'P',
        };
      }
    } else {
      console.log('[createCustomAI] 객체로 받음:', data.mbtiTypes);
      mbtiTypesObj = data.mbtiTypes as {
        energy: string;
        information: string;
        decisions: string;
        lifestyle: string;
      };
    }

    console.log('[createCustomAI] 최종 mbtiTypesObj:', mbtiTypesObj);

    // JSON 객체를 문자열로 안전하게 저장
    const safeObj = {
      energy: String(mbtiTypesObj.energy || 'I'),
      information: String(mbtiTypesObj.information || 'N'),
      decisions: String(mbtiTypesObj.decisions || 'F'),
      lifestyle: String(mbtiTypesObj.lifestyle || 'P'),
    };

    const mbtiTypesString = JSON.stringify(safeObj);
    console.log('[createCustomAI] 저장할 문자열:', mbtiTypesString);

    const customAI = await prisma.customAIPersonality.create({
      data: {
        id: `custom_${Date.now()}`,
        userId: data.userId,
        name: data.name,
        description: data.description,
        mbtiTypes: mbtiTypesString, // JSON 문자열로 저장
        systemPrompt: data.systemPrompt,
        updatedAt: new Date(),
      },
    });
    return customAI;
  } catch (error) {
    console.error('커스텀 AI 생성 오류:', error);
    throw error;
  }
}
