# 🤖 AI 채팅 기능 구현 완벽 가이드

## 📋 프로젝트 개요

**감정 관리 앱 "mooda"**에서 사용자와 AI가 1:1로 대화하며 감정을 공유하고 공감받을 수 있는 채팅 기능을 구현했습니다.

---

## 🛠 기술 스택

### Frontend

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **React Hooks** (useState, useEffect, useRef)

### Backend

- **Next.js API Routes**
- **Google Gemini AI** (gemini-1.5-flash 모델)
- **@google/generative-ai** SDK

### 데이터 관리

- **메모리 기반 저장소** (Map 객체)
- **사용자별 대화 기록 관리**

---

## 🏗 아키텍처 설계

### 1. API 구조

```
/api/socket/route.ts
├── GET: 서버 상태 확인
├── POST: 메시지 처리
    ├── send-message: AI와 대화
    ├── analyze-emotion: 감정 분석
    └── get-conversation-history: 대화 기록 조회
```

### 2. 데이터 플로우

```
사용자 메시지 → API Route → Gemini AI → 응답 생성 → 클라이언트 업데이트
```

---

## 💻 핵심 코드 분석

### 1. API Route 구현 (`src/app/api/socket/route.ts`)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 메모리 저장소
const userConversations = new Map<
  string,
  Array<{
    id: number;
    type: "user" | "ai";
    content: string;
    timestamp: Date;
  }>
>();
```

**주요 특징:**

- **Gemini 1.5 Flash 모델** 사용 (빠르고 효율적)
- **메모리 기반 저장소**로 실시간 대화 관리
- **사용자별 고유 ID**로 대화 분리

### 2. AI 응답 생성 로직

```typescript
const chat = model.startChat({
  history: chatHistory.slice(0, -1),
  generationConfig: {
    maxOutputTokens: 100, // 짧은 응답
    temperature: 0.8, // 친근한 톤
  },
});

const systemPrompt =
  "당신은 친근한 친구입니다. 사용자의 이야기에 2줄 이내로 짧고 따뜻하게 공감해주세요...";
```

**최적화 포인트:**

- **토큰 제한**: 100개로 짧고 간결한 응답
- **시스템 프롬프트**: 친구처럼 공감하는 톤 설정
- **응답 길이 제한**: 100자 초과 시 자동 자르기

### 3. 클라이언트 구현 (`src/app/(layout)/chat/page.tsx`)

```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [userId] = useState(`user_${Date.now()}`);

// 매일 12시 자동 새로고침
useEffect(() => {
  const checkMidnight = () => {
    const now = new Date();
    const currentMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (currentMidnight.getTime() !== lastMidnight.getTime()) {
      window.location.reload();
    }
  };

  const interval = setInterval(checkMidnight, 60000);
  return () => clearInterval(interval);
}, [lastMidnight]);
```

---

## 🎯 핵심 기능 구현

### 1. **자동 채팅방 입장**

- 페이지 로드 시 자동으로 대화 기록 불러오기
- 사용자별 고유 ID 생성 및 관리

### 2. **매일 12시 자동 새로고침**

- 1분마다 자정 체크
- 날짜 변경 시 페이지 새로고침 (데이터 유지)

### 3. **친근한 AI 응답**

- 2줄 이내 짧은 응답
- 공감과 위로 중심의 대화
- 이모지 활용으로 친근감 증대

### 4. **실시간 대화 관리**

- 메시지 전송/수신 상태 관리
- 로딩 애니메이션 (AI 타이핑 효과)
- 자동 스크롤 (새 메시지 시)

---

## 🔧 환경 설정

### 1. 패키지 설치

```bash
npm install @google/generative-ai
```

### 2. 환경변수 설정 (`.env.local`)

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Gemini API 키 발급

1. https://makersuite.google.com/app/apikey 접속
2. Google 계정 로그인
3. "Create API Key" 클릭
4. API 키 복사하여 `.env.local`에 설정

---

## 🎨 UI/UX 특징

### 1. **직관적인 채팅 인터페이스**

- 사용자 메시지: 파란색 (우측 정렬)
- AI 메시지: 흰색 (좌측 정렬)
- 시간 표시 및 스크롤 자동화

### 2. **로딩 상태 표시**

```typescript
{
  isLoading && (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span className="text-sm text-gray-500">AI가 응답을 작성 중...</span>
        </div>
      </div>
    </div>
  );
}
```

### 3. **반응형 디자인**

- 모바일/데스크톱 최적화
- TailwindCSS로 일관된 스타일링

---

## 🚀 성능 최적화

### 1. **API 응답 최적화**

- 토큰 수 제한으로 빠른 응답
- 메모리 기반 저장으로 즉시 접근

### 2. **사용자 경험 개선**

- 자동 스크롤로 최신 메시지 표시
- 로딩 상태로 피드백 제공
- 키보드 Enter 키 지원

### 3. **에러 처리**

- API 오류 시 사용자 친화적 메시지
- 네트워크 오류 대응

---

## 🔮 향후 개선 방향

### 1. **데이터 영속성**

- 현재: 메모리 기반 (서버 재시작 시 데이터 손실)
- 개선: Supabase/PostgreSQL 연동

### 2. **실시간 통신**

- 현재: REST API 방식
- 개선: WebSocket/Socket.io 구현

### 3. **감정 분석 연동**

- 캘린더 페이지와 감정 데이터 연동
- 일일 감정 요약 자동 생성

### 4. **사용자 인증**

- 카카오 로그인 연동
- 개인별 대화 기록 관리

---

## 🎯 기술적 성과

### ✅ 구현 완료

- [x] AI 채팅 기능
- [x] 친근한 응답 스타일
- [x] 자동 새로고침
- [x] 반응형 UI
- [x] 에러 처리

### 🎯 사용자 경험

- **빠른 응답**: 100 토큰 제한으로 즉시 응답
- **친근한 대화**: 2줄 이내 공감 중심 응답
- **직관적 UI**: 카카오톡 스타일 채팅 인터페이스
- **안정성**: 에러 처리 및 로딩 상태 관리

---

## 💡 개발 시 주의사항

### 1. **API 키 보안**

- `.env.local` 파일을 `.gitignore`에 포함
- 절대 코드에 API 키 하드코딩 금지

### 2. **메모리 관리**

- 현재 메모리 기반이므로 서버 재시작 시 데이터 손실
- 프로덕션에서는 데이터베이스 사용 권장

### 3. **API 할당량**

- Gemini 무료 할당량: 월 15회
- 사용량 모니터링 필요

---

## 📝 구현 과정 요약

### 1단계: 기본 설정

- Next.js 프로젝트 설정
- TypeScript 및 TailwindCSS 구성
- 필요한 패키지 설치

### 2단계: API 구현

- Gemini AI SDK 연동
- 메시지 처리 로직 구현
- 에러 처리 및 응답 최적화

### 3단계: 클라이언트 구현

- 채팅 UI 컴포넌트 개발
- 상태 관리 및 자동 새로고침
- 반응형 디자인 적용

### 4단계: 최적화

- AI 응답 스타일 조정
- 성능 최적화
- 사용자 경험 개선

---

이 구현으로 사용자는 AI 친구와 자연스럽게 대화하며 감정을 공유하고 공감받을 수 있는 완전한 채팅 경험을 제공받을 수 있습니다! 🎉
