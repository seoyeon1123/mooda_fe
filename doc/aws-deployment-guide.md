# AWS EC2 백엔드 서버 배포 완료 가이드

## 🎉 배포 완료 현황

### ✅ 완료된 작업

1. **AWS 인프라 설정**

   - VPC 생성: `mooda-vcp` (vpc-0760b05f1287259f2)
   - 서브넷 생성: `mooda-public-subnet-1a`, `mooda-public-subnet-1b`
   - 인터넷 게이트웨이 연결
   - 라우팅 테이블 설정: `mooda-public-rt`

2. **RDS PostgreSQL 데이터베이스**

   - 인스턴스: `mooda-db` (db.t4g.micro)
   - 엔드포인트: `mooda-db.ctuasauea1z7.ap-northeast-2.rds.amazonaws.com:5432`
   - 퍼블릭 액세스: 활성화
   - 보안 그룹: `mooda-rds-sg`

3. **EC2 인스턴스**

   - 인스턴스 ID: `i-0bc539b9aefa0c95d`
   - 퍼블릭 IP: `15.165.246.12`
   - 보안 그룹: `mooda-server-sg`
   - 인스턴스 유형: `t2.micro`

4. **백엔드 서버 배포**

   - Node.js 18 설치
   - Git 클론: `https://github.com/seoyeon1123/mooda_fe.git`
   - Prisma 데이터베이스 연결 성공
   - 서버 실행: 포트 3000

## 🔧 서버 접속 및 관리

### Windows에서 서버 접속

```bash
ssh -i "C:\Users\lsy_0\.ssh\mooda-key-pair.pem" ec2-user@15.165.246.12
```

### macOS에서 서버 접속

```bash
# 키 파일을 ~/.ssh 폴더로 복사 (필요시)
scp mooda-key-pair.pem ~/.ssh/

# 키 파일 권한 설정
chmod 400 ~/.ssh/mooda-key-pair.pem

# 서버 접속
ssh -i ~/.ssh/mooda-key-pair.pem ec2-user@15.165.246.12
```

### 서버 상태 확인

```bash
# 프로세스 확인
ps aux | grep node

# 포트 확인
netstat -tlnp | grep 3000

# 로그 확인
tail -f server.log
```

### 서버 시작/중지

```bash
# 서버 시작 (백그라운드)
nohup npm start > server.log 2>&1 &

# 서버 중지
kill [프로세스ID]
```

## 🌐 API 엔드포인트

### 기본 URL

- **로컬**: `http://localhost:3000`
- **외부**: `http://15.165.246.12:3000`

### 사용 가능한 API

1. **루트 엔드포인트**

   - `GET /` - 서버 상태 확인

2. **인증 API**

   - `POST /api/auth/login` - 카카오 로그인
   - `POST /api/auth/refresh` - 토큰 갱신

3. **감정 로그 API**

   - `GET /api/emotion-logs` - 월별 감정 로그 조회
   - `GET /api/emotion-logs/:date` - 특정 날짜 감정 로그

4. **대화 분석 API**

   - `POST /api/test-emotion-analysis` - 감정 분석 테스트
   - `POST /api/run-daily-emotion-analysis` - 일일 감정 분석 실행

## 🔐 환경 변수 설정

### 서버 환경 변수 (.env)

```env

JWT_SECRET="dfsfhsdgusdgdjskfsldgus30428dsgsl!dsfs0gusold"
REFRESH_TOKEN_SECRET="sdfsdgsgsdugosidgjodsighosdighsgihosdigusdoilgudsoigho1233r2s"

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

KAKAO_CLIENT_ID=e6210555262d6a2cf68f87fa8bb93309
KAKAO_CLIENT_SECRET=2POtzHVxffUir2u1pd4ZNPlBAnoFSj2P



# Database
DATABASE_URL="postgresql://lsy0909096:Lee355400!@mooda-db.ctuasauea1z7.ap-northeast-2.rds.amazonaws.com:5432/postgres"


# Server
PORT=3000
NODE_ENV=production



```

## 🚀 다음 단계

### 1. 프론트엔드 배포

- Vercel 또는 Netlify에 프론트엔드 배포
- 환경 변수 설정 (백엔드 API URL)

### 2. 도메인 설정

- 도메인 구매 및 연결
- SSL 인증서 설정

### 3. 모니터링 설정

- CloudWatch 로그 설정
- 알림 설정

### 4. 백업 설정

- RDS 자동 백업 설정
- 스냅샷 정책 설정

## 📊 현재 상태

### 서버 상태

- ✅ 백엔드 서버 실행 중
- ✅ 데이터베이스 연결 정상
- ✅ API 엔드포인트 작동
- ✅ 외부 접속 가능

### 보안 설정

- ✅ RDS 보안 그룹 설정 완료
- ✅ EC2 보안 그룹 설정 완료
- ✅ VPC 네트워크 설정 완료

## 🔍 문제 해결

### 서버 연결 문제

```bash
# 서버 상태 확인
curl http://localhost:3000/

# 프로세스 확인
ps aux | grep node

# 포트 확인
netstat -tlnp | grep 3000
```

### 데이터베이스 연결 문제

```bash
# Prisma 연결 테스트
npx prisma db push

# 직접 연결 테스트
psql -h mooda-db.ctuasauea1z7.ap-northeast-2.rds.amazonaws.com -p 5432 -U lsy0909096 -d postgres
```

## 🖥️ 맥북에서 서버 테스트 가이드

### 1단계: 키 파일 준비

```bash
# 키 파일을 다운로드 폴더에서 ~/.ssh로 복사
cp ~/Downloads/mooda-key-pair.pem ~/.ssh/

# 키 파일 권한 설정 (중요!)
chmod 400 ~/.ssh/mooda-key-pair.pem
```

### 2단계: 서버 접속

```bash
# SSH로 서버 접속
ssh -i ~/.ssh/mooda-key-pair.pem ec2-user@15.165.246.12
```

### 3단계: 서버 상태 확인

```bash
# 프로세스 확인
ps aux | grep node

# 포트 확인
netstat -tlnp | grep 3000

# 서버 로그 확인
tail -f server.log
```

### 4단계: API 테스트 (서버 내부에서)

```bash
# 루트 엔드포인트 테스트
curl http://localhost:3000/

# 인증 API 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"kakaoId": "123456", "email": "test@example.com", "userName": "Test User"}'

# 감정 로그 API 테스트
curl "http://localhost:3000/api/emotion-logs?userId=test-user&year=2024&month=6"
```

### 5단계: 외부 접속 테스트 (맥북에서)

```bash
# 외부에서 서버 접속 테스트
curl http://15.165.246.12:3000/

# 외부에서 API 테스트
curl -X POST http://15.165.246.12:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"kakaoId": "123456", "email": "test@example.com", "userName": "Test User"}'
```

### 6단계: 브라우저 테스트

맥북 브라우저에서:

- `http://15.165.246.12:3000` 접속
- "Hello from Mooda Server!" 메시지 확인

### 7단계: 서버 관리

```bash
# 서버 재시작 (필요시)
kill [프로세스ID]
nohup npm start > server.log 2>&1 &

# 환경 변수 수정 (필요시)
nano .env

# 코드 업데이트 (필요시)
git pull origin main
npm install
npx prisma generate
```

### 8단계: 로그 모니터링

```bash
# 실시간 로그 확인
tail -f server.log

# 최근 로그 확인
tail -100 server.log

# 에러 로그만 확인
grep "ERROR" server.log
```

---

**배포 완료일**: 2025년 6월 27일
**서버 URL**: http://15.165.246.12:3000
**관리자**: lsy_0
