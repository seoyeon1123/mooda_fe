# AWS EC2에서 백엔드(서버)와 프론트엔드(Next.js) 배포 및 연결 가이드

## 1. 백엔드(서버) 배포 및 실행

1. EC2 인스턴스에 접속
2. 서버 코드 업로드 또는 git clone
3. 환경변수(.env) 설정
   - 예시:
     ```env
     DATABASE_URL="postgresql://[유저명]:[비밀번호]@[RDS엔드포인트]:5432/postgres"
     JWT_SECRET="..."
     REFRESH_TOKEN_SECRET="..."
     PORT=3000
     NODE_ENV=production
     ...
     ```
4. 의존성 설치
   ```bash
   cd server
   npm install
   ```
5. Prisma 설정
   ```bash
   npx prisma generate
   npx prisma db push
   ```
6. 서버 실행 (백그라운드)
   ```bash
   nohup npm start > server.log 2>&1 &
   ```
7. EC2 보안 그룹에서 **3000번 포트** 인바운드 허용

---

## 2. 프론트엔드(Next.js) 배포 및 실행

1. 프론트엔드 코드 업로드 또는 git clone
2. 환경변수(.env.local) 설정
   - 예시:
     ```env
     NEXT_PUBLIC_API_URL=http://[EC2의 퍼블릭 IP]:3000
     PORT=3001
     ```
3. 의존성 설치
   ```bash
   cd mooda_fe
   npm install
   ```
4. 빌드
   ```bash
   npm run build
   ```
5. 실행 (포트 3001)
   ```bash
   npm start
   ```
6. EC2 보안 그룹에서 **3001번 포트** 인바운드 허용

---

## 3. 접속 및 연동 테스트

- 브라우저에서 `http://[EC2 퍼블릭 IP]:3001` 접속 → 프론트엔드 화면 확인
- 프론트엔드에서 회원가입/로그인 등 API 요청 시 백엔드와 정상 통신되는지 확인

---

## 4. (선택) 도메인 연결 및 SSL 적용

- 도메인 연결, HTTPS 적용 등은 필요시 추가 안내

---

## 5. 참고 및 주의사항

- API 주소, 포트, 보안 그룹 설정이 올바른지 꼭 확인
- CORS, 환경변수 오타 등으로 통신이 안 될 수 있으니, 에러 발생 시 메시지 공유
- 서버/프론트엔드 모두 PM2 등으로 백그라운드 실행 권장

---

이 문서는 백엔드와 프론트엔드의 AWS EC2 배포 및 연결 과정을 최신 기준으로 정리한 것입니다. 추가 요청이나 수정이 필요하면 언제든 말씀해 주세요.
