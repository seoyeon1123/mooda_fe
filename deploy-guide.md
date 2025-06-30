# AWS Default VPC 새 배포 가이드

## 🎯 목표

AWS Default VPC를 사용하여 과금을 방지하면서 Mooda 서버를 새로 배포합니다.

## 📋 배포 단계

### 1단계: AWS 콘솔 접속

1. [AWS 콘솔](https://console.aws.amazon.com/) 접속
2. 리전: `ap-northeast-2` (서울) 확인

### 2단계: Default VPC 확인

1. **VPC 콘솔** 접속
2. **Default VPC** 존재 확인
3. Default VPC ID 기록

### 3단계: EC2 인스턴스 생성

1. **EC2 콘솔** → **인스턴스 시작**
2. 설정:
   - **이름**: `mooda-server`
   - **AMI**: Amazon Linux 2023 (무료 티어)
   - **인스턴스 유형**: `t2.micro` (무료 티어)
   - **키 페어**: 새로 생성 (`mooda-key-pair`)
   - **네트워킹**: **Default VPC** 선택
   - **보안 그룹**: 새로 생성
     - SSH (포트 22): 내 IP에서
     - HTTP (포트 3000): 모든 곳에서

### 4단계: RDS 데이터베이스 생성

1. **RDS 콘솔** → **데이터베이스 생성**
2. 설정:
   - **엔진**: PostgreSQL
   - **템플릿**: 개발/테스트
   - **DB 인스턴스 식별자**: `mooda-db`
   - **마스터 사용자 이름**: `lsy0909096`
   - **마스터 암호**: `Lee355400!`
   - **인스턴스 크기**: `db.t4g.micro`
   - **스토리지**: 20GB
   - **네트워킹**: **Default VPC** 선택
   - **퍼블릭 액세스**: 예
   - **보안 그룹**: 새로 생성 (포트 5432 허용)

### 5단계: 서버 설정

새 EC2 인스턴스에 SSH 접속:

```bash
# 키 파일 권한 설정 (Windows)
icacls mooda-key-pair.pem /inheritance:r
icacls mooda-key-pair.pem /grant:r "%USERNAME%":"(R)"

# SSH 접속
ssh -i mooda-key-pair.pem ec2-user@[EC2_PUBLIC_IP]
```

### 6단계: 서버 환경 설정

EC2 인스턴스 내부에서:

```bash
# 시스템 업데이트
sudo yum update -y

# Node.js 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# Git 설치
sudo yum install git -y

# 프로젝트 클론
cd /home/ec2-user
git clone https://github.com/seoyeon1123/mooda_fe.git
cd mooda_fe

# 서버 의존성 설치
cd server
npm install

# Prisma 설정
npx prisma generate
```

### 7단계: 환경 변수 설정

```bash
# .env 파일 생성
nano .env
```

환경 변수 내용:

```env
# Database (RDS 엔드포인트로 업데이트)
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
```

### 8단계: 데이터베이스 연결 및 서버 시작

```bash
# 데이터베이스 스키마 적용
npx prisma db push

# 서버 시작 (백그라운드)
nohup npm start > server.log 2>&1 &

# 서버 상태 확인
tail -f server.log
```

### 9단계: 테스트

```bash
# 서버 상태 확인
curl http://localhost:3000/

# 외부에서 접속 테스트
curl http://[EC2_PUBLIC_IP]:3000/
```

## 💰 비용 최적화

### Default VPC 사용 시 장점

- **NAT Gateway 비용 없음**: ~$45/월 절약
- **VPC 엔드포인트 비용 없음**: ~$7/월 절약
- **데이터 전송 비용 절약**: ~$10-20/월 절약
- **총 절약**: 월 $60-70

### 무료 티어 활용

- **EC2**: t2.micro (월 750시간 무료)
- **RDS**: db.t4g.micro (월 750시간 무료)
- **데이터 전송**: 월 15GB 무료

## 🔧 문제 해결

### 서버 연결 문제

```bash
# 프로세스 확인
ps aux | grep node

# 포트 확인
netstat -tlnp | grep 3000

# 로그 확인
tail -100 server.log
```

### 데이터베이스 연결 문제

```bash
# Prisma 연결 테스트
npx prisma db push

# 직접 연결 테스트
psql -h [RDS_ENDPOINT] -p 5432 -U lsy0909096 -d postgres
```

## 📊 모니터링

### CloudWatch 설정

1. **CloudWatch 콘솔** 접속
2. **로그 그룹** 생성: `/aws/ec2/mooda-server`
3. **메트릭** 설정: CPU, 메모리, 네트워크

### 알림 설정

1. **SNS 토픽** 생성
2. **CloudWatch 알람** 설정
3. **이메일 알림** 구성

---

**예상 배포 시간**: 1-2시간  
**월 예상 비용**: $0-5 (무료 티어 활용 시)  
**과금 방지**: Default VPC 사용으로 월 $60-70 절약
