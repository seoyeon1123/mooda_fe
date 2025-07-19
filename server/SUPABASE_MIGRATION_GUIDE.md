# Supabase 마이그레이션 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. 프로젝트 생성 후 **Settings > API**에서 다음 정보 확인:
   - Project URL
   - anon public key

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 **SQL Editor** 열기
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행
3. 또는 **Table Editor**에서 수동으로 테이블 생성

## 3. 환경변수 설정

`.env` 파일에 다음 정보 추가:

```env
# Supabase 연결 정보
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# 기존 PostgreSQL (마이그레이션용)
DATABASE_URL="postgresql://username:password@localhost:5432/mooda"
```

## 4. 데이터 마이그레이션 실행

```bash
# 마이그레이션 스크립트 실행
npm run migrate-to-supabase
```

또는

```bash
# TypeScript 직접 실행
npx ts-node src/scripts/migrate-to-supabase.ts
```

## 5. 마이그레이션 확인

1. Supabase 대시보드에서 **Table Editor** 확인
2. 각 테이블에 데이터가 정상적으로 복사되었는지 확인
3. 관계(Foreign Key)가 올바르게 설정되었는지 확인

## 6. 애플리케이션 코드 수정

### 기존 Prisma 사용 부분을 Supabase로 교체

```typescript
// 기존 (Prisma)
import prisma from '../lib/prisma';
const users = await prisma.user.findMany();

// 변경 후 (Supabase)
import { SupabaseService } from '../lib/supabase-service';
const supabaseService = new SupabaseService();
const users = await supabaseService.getUsers();
```

### 주요 변경 파일들

1. `src/index.ts` - API 라우트들
2. `src/lib/emotion-service.ts` - 감정 분석 서비스
3. `src/lib/ai-personalities.ts` - AI 성격 관리

## 7. 테스트

1. 서버 재시작
2. 각 API 엔드포인트 테스트
3. 데이터 CRUD 작업 확인

## 8. 문제 해결

### 일반적인 문제들

1. **RLS (Row Level Security) 오류**

   - Supabase 대시보드에서 RLS 정책 확인
   - 필요시 RLS 비활성화 (개발 단계에서만)

2. **타입 오류**

   - `src/lib/supabase.ts`의 타입 정의 확인
   - 필드명 매핑 확인 (camelCase ↔ snake_case)

3. **연결 오류**
   - 환경변수 확인
   - Supabase 프로젝트 상태 확인

## 9. 완전 전환

모든 기능이 정상 동작하는 것을 확인한 후:

1. Prisma 관련 코드 제거
2. `package.json`에서 Prisma 의존성 제거
3. `prisma/` 폴더 삭제
4. 환경변수에서 `DATABASE_URL` 제거

## 10. 배포

1. 새로운 환경변수 설정
2. 서버 재배포
3. 프로덕션 환경에서 테스트

---

## 주의사항

- 마이그레이션 전 반드시 데이터 백업
- 프로덕션 환경에서는 점진적 전환 권장
- RLS 정책은 보안 요구사항에 맞게 조정
