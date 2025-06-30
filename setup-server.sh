#!/bin/bash

# Mooda 서버 설정 스크립트
echo "🚀 Mooda 서버 설정을 시작합니다..."

# 시스템 업데이트
echo "📦 시스템 업데이트 중..."
sudo yum update -y

# Node.js 설치
echo "📦 Node.js 설치 중..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# Git 설치
echo "📦 Git 설치 중..."
sudo yum install git -y

# 프로젝트 클론
echo "📥 프로젝트 클론 중..."
cd /home/ec2-user
git clone https://github.com/seoyeon1123/mooda_fe.git
cd mooda_fe

# 서버 의존성 설치
echo "📦 서버 의존성 설치 중..."
cd server
npm install

# Prisma 설치 및 설정
echo "🔧 Prisma 설정 중..."
npx prisma generate

# 환경 변수 파일 생성
echo "⚙️ 환경 변수 설정 중..."
cat > .env << EOF
# Database (RDS 엔드포인트로 업데이트 필요)
DATABASE_URL="postgresql://lsy0909096:Lee355400!@[RDS_ENDPOINT]:5432/postgres"

# JWT
JWT_SECRET="mooda-jwt-secret-key-2024-super-secure"
REFRESH_TOKEN_SECRET="mooda-refresh-token-secret-2024"

# Server
PORT=3000
NODE_ENV=production

# NextAuth
NEXTAUTH_URL="http://[EC2_PUBLIC_IP]:3000"
NEXTAUTH_SECRET="mooda-nextauth-secret-2024"

# Kakao OAuth
KAKAO_CLIENT_ID="e6210555262d6a2cf68f87fa8bb93309"
KAKAO_CLIENT_SECRET="qYAYTM3x9qTL4Bs2wcWyMVH4omUddhAH"
EOF

echo "✅ 서버 설정이 완료되었습니다!"
echo "📝 다음 단계:"
echo "1. RDS 엔드포인트를 .env 파일에 업데이트"
echo "2. EC2 퍼블릭 IP를 .env 파일에 업데이트"
echo "3. 'npx prisma db push' 실행"
echo "4. 'npm start'로 서버 시작" 