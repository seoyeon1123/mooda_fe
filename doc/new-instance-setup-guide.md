# 🚀 새 EC2 인스턴스 생성 가이드

## 📋 1단계: 새 키 페어 생성

### AWS 콘솔 접속

1. [AWS EC2 콘솔](https://console.aws.amazon.com/ec2/) 접속
2. 좌측 메뉴 → **"네트워크 및 보안"** → **"키 페어"**

### 새 키 페어 생성

1. **"키 페어 생성"** 버튼 클릭
2. **키 페어 이름**: `mooda-key-new`
3. **키 페어 유형**: `RSA`
4. **프라이빗 키 파일 형식**: `.pem`
5. **"키 페어 생성"** 클릭
6. **자동으로 다운로드됨** → `mooda-key-new.pem` 파일 저장

## 🖥️ 2단계: 새 EC2 인스턴스 생성

### 인스턴스 시작

1. EC2 대시보드 → **"인스턴스 시작"** 클릭

### 기본 설정

- **이름**: `mooda-server-new`
- **AMI**: `Amazon Linux 2023 AMI (HVM)`
- **인스턴스 유형**: `t2.micro` (프리티어)
- **키 페어**: `mooda-key-new` ⭐ (방금 생성한 키)

### 네트워크 설정

- **VPC**: `mooda-vcp` (기존과 동일)
- **서브넷**: `mooda-public-subnet-1a` (기존과 동일)
- **퍼블릭 IP 자동 할당**: **활성화**

### 보안 그룹 설정

새 보안 그룹 생성:

- **보안 그룹 이름**: `mooda-server-new-sg`
- **설명**: `Mooda Server New Security Group`

**인바운드 규칙**:

```
SSH (22)    | 내 IP        | SSH 접속용
HTTP (80)   | 0.0.0.0/0    | HTTP 접속용
HTTPS (443) | 0.0.0.0/0    | HTTPS 접속용
사용자 정의 TCP (3000) | 0.0.0.0/0 | Node.js 서버용
```

### 스토리지 설정

- **크기**: `8 GiB` (기본값)
- **볼륨 유형**: `gp3`

## 🔧 3단계: 서버 설정

### SSH 접속

```bash
# 키 파일 설정
mkdir -p ~/.ssh
cp ~/Downloads/mooda-key-new.pem ~/.ssh/
chmod 400 ~/.ssh/mooda-key-new.pem

# 새 인스턴스 접속 (새 IP 주소 사용)
ssh -i ~/.ssh/mooda-key-new.pem ec2-user@[새인스턴스IP]
```

### Node.js 설치

```bash
# Node.js 18 설치
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Git 설치
sudo yum update -y
sudo yum install -y git

# 버전 확인
node --version
npm --version
git --version
```

### 코드 클론 및 설정

```bash
# GitHub에서 코드 클론
git clone https://github.com/seoyeon1123/mooda_fe.git
cd mooda_fe/server

# 패키지 설치
npm install

# Prisma 설치
npm install -g prisma
```

### 환경 변수 설정

```bash
# .env 파일 생성
nano .env
```

**.env 내용**:

```env
# Database (기존과 동일)
DATABASE_URL="postgresql://lsy0909096:Lee355400!@mooda-db.ctuasauea1z7.ap-northeast-2.rds.amazonaws.com:5432/postgres"

# JWT (기존과 동일)
JWT_SECRET="mooda-jwt-secret-key-2024-super-secure"
REFRESH_TOKEN_SECRET="mooda-refresh-token-secret-2024"

# Server
PORT=3000
NODE_ENV=production

# NextAuth (새 IP로 수정 필요)
NEXTAUTH_URL="http://[새인스턴스IP]:3000"
NEXTAUTH_SECRET="mooda-nextauth-secret-2024"

# Kakao OAuth (기존과 동일)
KAKAO_CLIENT_ID="e6210555262d6a2cf68f87fa8bb93309"
KAKAO_CLIENT_SECRET="qYAYTM3x9qTL4Bs2wcWyMVH4omUddhAH"
```

### 데이터베이스 연결

```bash
# Prisma 생성
npx prisma generate

# 데이터베이스 동기화 (기존 데이터 유지)
npx prisma db push
```

### 서버 시작

```bash
# 서버 시작 (백그라운드)
nohup npm start > server.log 2>&1 &

# 상태 확인
curl http://localhost:3000/
```

## ✅ 4단계: 자동 시작 설정 (PM2)

```bash
# PM2 설치
npm install -g pm2

# PM2로 서버 시작
pm2 start npm --name "mooda-server" -- start
# 부팅 시 자동 시작
pm2 startup
pm2 save

# PM2 상태 확인
pm2 status
```

## 🎯 5단계: 기존 인스턴스 정리

새 인스턴스가 정상 작동하면:

1. **기존 인스턴스 중지**: `i-0bc539b9aefa0c95d`
2. **보안 그룹 정리**: 불필요한 보안 그룹 삭제
3. **탄력적 IP 해제**: 기존 IP 해제 (비용 절약)

## 📊 예상 시간

- **키 페어 생성**: 2분
- **인스턴스 생성**: 5분
- **서버 설정**: 10분
- **총 소요 시간**: 약 15-20분

## 💡 장점

- ✅ **새 키 파일로 확실한 접속**
- ✅ **기존 데이터 완전 보존** (RDS 사용)
- ✅ **PM2로 자동 재시작 설정**
- ✅ **깔끔한 환경**

---

**중요**: 새 인스턴스의 **퍼블릭 IP**가 바뀌므로 프론트엔드 설정도 업데이트해야 합니다!
