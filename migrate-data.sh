#!/bin/bash

echo "🔄 데이터 마이그레이션 시작..."

# 현재 서버에서 데이터 추출
echo "📤 기존 데이터 추출 중..."
OLD_SERVER_IP="13.124.154.89"
NEW_SERVER_IP="NEW_SERVER_IP_HERE"  # 새 서버 IP로 변경 필요

# 기존 서버에서 데이터베이스 덤프 생성
ssh -i ~/Downloads/mooda-key-new.pem ec2-user@$OLD_SERVER_IP << 'EOF'
cd mooda_fe/server
# Prisma를 사용한 데이터 추출
npx prisma db pull
npx prisma generate
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportData() {
  try {
    const users = await prisma.user.findMany();
    const conversations = await prisma.conversation.findMany();
    const emotionLogs = await prisma.emotionLog.findMany();
    
    const data = {
      users,
      conversations,
      emotionLogs,
      exportDate: new Date().toISOString()
    };
    
    fs.writeFileSync('/tmp/mooda_data_export.json', JSON.stringify(data, null, 2));
    console.log('✅ 데이터 추출 완료: /tmp/mooda_data_export.json');
  } catch (error) {
    console.error('❌ 데이터 추출 실패:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

exportData();
"
EOF

# 데이터 파일 다운로드
echo "📥 데이터 파일 다운로드 중..."
scp -i ~/Downloads/mooda-key-new.pem ec2-user@$OLD_SERVER_IP:/tmp/mooda_data_export.json ./mooda_data_export.json

# 새 서버로 데이터 업로드
echo "📤 새 서버로 데이터 업로드 중..."
scp -i ~/Downloads/mooda-key-new.pem ./mooda_data_export.json ec2-user@$NEW_SERVER_IP:/tmp/

# 새 서버에서 데이터 가져오기
ssh -i ~/Downloads/mooda-key-new.pem ec2-user@$NEW_SERVER_IP << 'EOF'
cd mooda_fe/server
# 데이터베이스 초기화
npx prisma migrate reset --force
npx prisma db push

# 데이터 가져오기
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function importData() {
  try {
    const data = JSON.parse(fs.readFileSync('/tmp/mooda_data_export.json', 'utf8'));
    
    console.log('📊 가져올 데이터:', {
      users: data.users.length,
      conversations: data.conversations.length,
      emotionLogs: data.emotionLogs.length
    });
    
    // 사용자 데이터 가져오기
    for (const user of data.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          kakaoId: user.kakaoId,
          email: user.email,
          userName: user.userName,
          refreshToken: user.refreshToken,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    
    // 대화 데이터 가져오기
    for (const conversation of data.conversations) {
      await prisma.conversation.create({
        data: {
          id: conversation.id,
          userId: conversation.userId,
          role: conversation.role,
          content: conversation.content,
          personalityId: conversation.personalityId,
          createdAt: new Date(conversation.createdAt),
          updatedAt: new Date(conversation.updatedAt)
        }
      });
    }
    
    // 감정 로그 데이터 가져오기
    for (const log of data.emotionLogs) {
      await prisma.emotionLog.create({
        data: {
          id: log.id,
          userId: log.userId,
          userName: log.userName,
          date: new Date(log.date),
          emotion: log.emotion,
          summary: log.summary,
          shortSummary: log.shortSummary,
          characterName: log.characterName,
          createdAt: new Date(log.createdAt),
          updatedAt: new Date(log.updatedAt)
        }
      });
    }
    
    console.log('✅ 모든 데이터 가져오기 완료!');
  } catch (error) {
    console.error('❌ 데이터 가져오기 실패:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

importData();
"

# 서버 재시작
pm2 restart mooda-server
EOF

echo "✅ 데이터 마이그레이션 완료!"
echo "🔍 새 서버에서 데이터 확인해보세요." 