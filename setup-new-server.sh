#!/bin/bash

echo "🚀 Mooda 서버 Default VPC 마이그레이션 설정 시작..."

# Node.js 18 설치
echo "📦 Node.js 18 설치 중..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Git 설치
sudo yum install -y git

# PM2 전역 설치
sudo npm install -g pm2

# 프로젝트 클론 (실제 레포지토리로 수정 필요)
echo "📂 프로젝트 클론 중..."
git clone https://github.com/your-username/moooooooo_da.git mooda_fe
cd mooda_fe/server

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 환경변수 설정
echo "🔐 환경변수 설정 중..."
cat > .env << EOF
# Database
DATABASE_URL="postgresql://username:password@new-rds-endpoint:5432/mooda?schema=public"

# JWT Secrets
JWT_SECRET="your-jwt-secret"
REFRESH_TOKEN_SECRET="your-refresh-secret"

# AI API
GEMINI_API_KEY="your-gemini-key"

# Environment
NODE_ENV=production
FRONTEND_URL=https://your-vercel-domain.vercel.app
PORT=3000
EOF

echo "⚠️  .env 파일이 생성되었습니다. 실제 값으로 수정해주세요!"

# TypeScript 컴파일
echo "🔨 TypeScript 컴파일 중..."
npm run build

# PM2로 서버 시작
echo "🚀 서버 시작 중..."
pm2 start dist/index.js --name mooda-server
pm2 save
pm2 startup

echo "✅ 설정 완료! 다음 단계:"
echo "1. .env 파일의 DATABASE_URL 및 기타 값들 수정"
echo "2. 데이터베이스 마이그레이션: npm run prisma:migrate"
echo "3. 서버 재시작: pm2 restart mooda-server" 