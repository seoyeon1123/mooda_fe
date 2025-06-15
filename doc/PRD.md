# AI 대화 기반 감정 분석 서비스 PRD

## 📝 프로젝트 개요

사용자는 하루 동안 AI와 자유롭게 대화를 나누며, AI는 대화 내용을 기반으로 감정을 분석하고 요약합니다.  
결과는 달력 형태로 제공되며, 날짜별 감정 상태를 아이콘과 색상으로 시각화합니다.  
MVP는 **카카오 로그인, 대화 기록, 감정 분석, 감정 달력 표시**를 목표로 합니다.

---

## 🛤 유저 플로우

1. 사용자는 카카오 로그인으로 서비스에 접속합니다.
2. 하루 동안 AI와 자유롭게 대화를 나눕니다.
3. 대화 내용은 Supabase에 저장됩니다.
4. 하루 종료 시 AI(OpenAI API)가 감정을 분석하고 요약합니다.
5. 분석 결과는 Supabase에 저장됩니다.
6. 사용자는 달력을 통해 날짜별 감정 상태(아이콘 + 색상)를 확인합니다.
7. 달력의 날짜를 클릭하면 해당 날의 요약과 주요 대화를 확인할 수 있습니다.

---

## ⭐ 핵심 기능

### ✅ 카카오 로그인

- Supabase OAuth를 통해 카카오 로그인 지원
- 사용자 ID 및 데이터 Postgres DB와 연동

### ✅ 대화 기록

- 하루 단위로 사용자별 대화 내용을 Supabase에 저장

### ✅ 감정 분석

- OpenAI API를 통해 하루 단위 대화를 분석
- 감정 분류 및 주요 사건 요약
- 감정 카테고리 및 매핑  
  | 감정 | 아이콘 파일명 | 색상 | 표정 컨셉 |
  |--------|-------------------|--------|------------------------------|
  | 매우 기쁨 | VeryHappyIcon.svg | #10B981 (초록색) | 웃는 눈, 큰 웃음, 볼터짐 |
  | 기쁨 | HappyIcon.svg | #84CC16 (라임색) | 일반적인 웃는 표정 |
  | 무감정 | NeutralIcon.svg | #9CA3AF (회색) | 일직선 입 |
  | 약간 슬픔 | SlightlySadIcon.svg | #F97316 (주황색) | 약간 찌푸린 표정 |
  | 슬픔 | SadIcon.svg | #3B82F6 (파란색) | 슬픈 표정과 눈물 |
  | 매우 슬픔 | VerySadIcon.svg | #EF4444 (빨간색) | 화난/매우 슬픈 표정과 눈물 |

- 아이콘 파일 경로: `public/images/{아이콘 파일명}`

### ✅ 감정 달력

- `react-calendar` 기반 달력 컴포넌트
- 날짜별 감정 아이콘과 색상 표시
- 날짜 클릭 시:
  - 감정 요약 표시
  - 주요 대화 하이라이트 표시

---

## 💾 데이터베이스 설계 (Supabase)

### users

| 컬럼       | 타입      | 설명      |
| ---------- | --------- | --------- |
| id         | uuid      | 사용자 ID |
| email      | text      | 이메일    |
| kakao_id   | text      | 카카오 ID |
| created_at | timestamp | 생성 일시 |

### conversations

| 컬럼       | 타입      | 설명      |
| ---------- | --------- | --------- |
| id         | uuid      | 대화 ID   |
| user_id    | uuid      | 사용자 ID |
| content    | text      | 대화 내용 |
| created_at | timestamp | 생성 일시 |

### emotion_logs

| 컬럼       | 타입      | 설명                     |
| ---------- | --------- | ------------------------ |
| id         | uuid      | 감정 로그 ID             |
| user_id    | uuid      | 사용자 ID                |
| date       | date      | 분석 날짜                |
| summary    | text      | 요약 내용                |
| emotion    | text      | 감정 종류 (VeryHappy 등) |
| created_at | timestamp | 생성 일시                |

---

## ⚙ 기술 스택

| 영역     | 기술                                             |
| -------- | ------------------------------------------------ |
| Frontend | Next.js 14 (App Router), TailwindCSS, Shadcn/UI  |
| 상태관리 | Zustand                                          |
| 달력     | react-calendar                                   |
| AI 분석  | OpenAI API                                       |
| DB/인증  | Supabase (Postgres, Edge Functions, Kakao OAuth) |
| 배포     | Vercel                                           |
| 아이콘   | public/images/\*.svg (6종 감정 아이콘)           |

---

## ⚡ MVP 기능

- 카카오 로그인
- 하루 단위 대화 저장
- OpenAI API 기반 감정 분석 및 요약
- 감정 달력 표시 (아이콘 + 색상)
- 날짜 클릭 시 감정 요약, 주요 대화 표시

---

## 🚀 MVP 이후 개선 사항

- 감정 주간/월간 트렌드 리포트
- Edge Function 예약 실행 (하루 끝나면 자동 분석)
- 감정 트렌드 차트 시각화
- 오늘 감정 결과 푸시 알림
- 음성 입력(STT) 기능

---

## 📂 아이콘 파일

- `public/images/VeryHappyIcon.svg`
- `public/images/HappyIcon.svg`
- `public/images/NeutralIcon.svg`
- `public/images/SlightlySadIcon.svg`
- `public/images/SadIcon.svg`
- `public/images/VerySadIcon.svg`
