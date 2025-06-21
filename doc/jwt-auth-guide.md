# JWT 기반 인증 시스템 구축 가이드

# JWT 기반 인증 시스템 구축 가이드

이 문서는 Mooda 프로젝트의 JWT(Access Token + Refresh Token) 기반 인증 시스템의 전체적인 흐름과 구현 세부사항을 설명합니다.

## 1. 인증 흐름 개요

본 시스템은 사용자가 안전하고 지속적으로 서비스에 로그인 상태를 유지할 수 있도록 **액세스 토큰(Access Token)**과 **리프레시 토큰(Refresh Token)** 방식을 사용합니다.

- **액세스 토큰 (Access Token)**:

  - **역할**: 실제 API를 호출할 때 사용자의 신원을 증명하는 단기 인증서입니다.
  - **수명**: 1시간 (비교적 짧음)
  - **특징**: 수명이 짧아 탈취되더라도 보안 위협이 적습니다.

- **리프레시 토큰 (Refresh Token)**:

  - **역할**: 만료된 액세스 토큰을 재발급받기 위한 장기 인증서입니다.
  - **수명**: 7일 (비교적 긺)
  - **특징**: 서버 DB에 저장하여 필요시 검증하며, 직접적으로 API 요청에는 사용되지 않습니다.

### 전체 인증 시나리오

```mermaid
sequenceDiagram
    participant Client as 클라이언트 (Next.js)
    participant NextAuth as NextAuth 서버
    participant Backend as 백엔드 (Node.js)
    participant DB as 데이터베이스

    Client->>NextAuth: 1. 카카오 로그인 시도
    NextAuth-->>Client: 카카오 인증 성공

    Note over NextAuth: jwt 콜백 실행
    NextAuth->>Backend: 2. /api/auth/login 호출 (카카오ID, 이메일 등)
    Backend->>DB: 3. 사용자 정보 upsert
    Backend->>Backend: 4. Access/Refresh 토큰 생성
    Backend->>DB: 5. Refresh Token 저장
    Backend-->>NextAuth: 6. Access/Refresh 토큰 반환

    Note over NextAuth: 토큰을 NextAuth 세션에 저장
    NextAuth-->>Client: 7. 로그인 완료 및 세션 생성

    %% --- API 요청 시 ---
    Client->>Backend: 8. API 요청 (with Access Token)
    alt Access Token 유효
        Backend-->>Client: API 응답
    else Access Token 만료
        Note over Client: API 요청 실패 (401 Unauthorized)

        Note over Client,NextAuth: 세션 접근 시 자동 갱신 트리거
        NextAuth->>NextAuth: 9. Access Token 만료 확인
        NextAuth->>Backend: 10. /api/auth/refresh 호출 (with Refresh Token)
        Backend->>DB: 11. DB의 Refresh Token과 비교 검증
        Backend->>Backend: 12. 새로운 Access Token 생성
        Backend-->>NextAuth: 13. 새로운 Access Token 반환

        Note over NextAuth: 세션에 새 Access Token 저장
        NextAuth-->>Client: 14. 갱신된 세션 정보 전달

        Client->>Backend: 15. 실패했던 API 재요청 (with 새 Access Token)
        Backend-->>Client: API 응답
    end
```

## 2. 백엔드 (`/server`) 설정

Node.js/Express로 구현된 백엔드 서버의 주요 설정입니다.

### 2.1. Prisma 스키마 (`schema.prisma`)

`User` 모델에 `refreshToken` 필드를 추가하여, 각 사용자별로 발급된 리프레시 토큰을 저장합니다.

```prisma
// server/prisma/schema.prisma

model User {
  // ... 기존 필드들
  refreshToken String? @map("refresh_token")

  @@map("users")
}
```

> **참고**: 스키마 변경 후에는 반드시 `npx prisma migrate dev --name add_refresh_token` 과 같은 명령어로 데이터베이스에 변경사항을 적용해야 합니다.

### 2.2. 환경 변수 (`.env`)

토큰 서명에 사용할 시크릿 키들을 `server/.env` 파일에 정의합니다.

```env
# server/.env

# 데이터베이스 연결 정보
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mooda?schema=public"

# JWT 서명용 시크릿 키
JWT_SECRET=your-super-secret-jwt-key-for-mooda-project-5a8b3c9d2e
REFRESH_TOKEN_SECRET=your-ultra-secure-refresh-token-secret-for-mooda-app-1f6g7h8i9j
```

> **보안 주의**: `.env` 파일은 절대 Git에 포함시키면 안 됩니다. `.gitignore`에 `server/.env`가 포함되어 있는지 확인하세요.

### 2.3. 로그인 API (`/api/auth/login`)

사용자가 카카오 로그인을 통해 인증되면, NextAuth 서버는 이 엔드포인트를 호출하여 사용자를 우리 시스템에 등록/로그인시키고 토큰을 발급받습니다.

- **경로**: `POST /api/auth/login`
- **요청 본문**: `{ kakaoId, email, userName }`
- **주요 로직**:
  1. `prisma.user.upsert`를 사용하여 사용자가 존재하면 정보를 업데이트하고, 없으면 새로 생성합니다.
  2. `jsonwebtoken` 라이브러리와 각각의 시크릿 키를 사용하여 **액세스 토큰(유효기간 1시간)**과 **리프레시 토큰(유효기간 7일)**을 생성합니다.
  3. 생성된 리프레시 토큰을 해당 사용자의 DB 레코드에 업데이트합니다.
  4. 두 토큰을 모두 JSON 형태로 클라이언트(NextAuth 서버)에게 반환합니다.

```typescript
// server/src/index.ts

app.post('/api/auth/login', async (req, res) => {
  // ... 사용자 정보 upsert 로직 ...

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: '7d',
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.status(200).json({ accessToken, refreshToken });
});
```

### 2.4. 토큰 재발급 API (`/api/auth/refresh`)

액세스 토큰이 만료되었을 때, 클라이언트(NextAuth 서버)가 이 엔드포인트를 호출하여 새로운 액세스 토큰을 발급받습니다.

- **경로**: `POST /api/auth/refresh`
- **요청 본문**: `{ refreshToken }`
- **주요 로직**:
  1. 요청으로 받은 `refreshToken`의 유효성을 검증합니다.
  2. 토큰에서 `userId`를 추출하여 DB에서 해당 사용자를 찾습니다.
  3. 요청받은 토큰이 DB에 저장된 토큰과 일치하는지 비교하여 탈취 여부를 확인합니다.
  4. 모든 검증을 통과하면, 새로운 **액세스 토큰(유효기간 1시간)**만 생성하여 반환합니다.

```typescript
// server/src/index.ts

app.post('/api/auth/refresh', async (req, res) => {
  // ... 리프레시 토큰 검증 로직 ...

  const newAccessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

  res.status(200).json({ accessToken: newAccessToken });
});
```

---

## 3. 프론트엔드 (`/src`) 설정

Next.js 프론트엔드에서는 `NextAuth.js` 라이브러리를 통해 인증 상태를 관리하고, 백엔드와 통신하여 받은 JWT를 세션에 통합합니다.

### 3.1. NextAuth 타입 확장 (`next-auth.d.ts`)

NextAuth의 기본 `Session`과 `JWT` 타입에 우리가 사용할 `accessToken`, `refreshToken` 등의 커스텀 필드를 추가하기 위해 타입 정의 파일을 수정합니다.

```typescript
// src/lib/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string; // 토큰 갱신 실패 등의 에러 상태
    user: {
      kakaoId?: string | number;
      // ... 기타 user 필드
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number; // 액세스 토큰 만료 시간
    error?: string;
    // ... 기타 jwt 필드
  }
}
```

### 3.2. NextAuth 콜백 설정 (`[...nextauth]/route.ts`)

`src/app/api/auth/[...nextauth]/route.ts` 파일의 콜백 함수들은 NextAuth 인증 흐름의 핵심입니다.

#### `jwt` 콜백

이 콜백은 JWT가 생성되거나 업데이트될 때마다 실행됩니다. 토큰의 유효성을 검사하고 만료 시 재발급하는 로직이 여기에 포함됩니다.

- **초기 로그인 시**:

  1. `user`와 `account` 객체가 존재할 경우, 초기 로그인으로 간주합니다.
  2. 백엔드의 `/api/auth/login`을 호출하여 `accessToken`과 `refreshToken`을 받아옵니다.
  3. 두 토큰과 액세스 토큰의 만료 시간(`accessTokenExpires`)을 NextAuth의 `token` 객체에 저장하여 반환합니다.

- **세션 접근 시**:

  1. `token` 객체에 저장된 `accessTokenExpires` 값을 현재 시간과 비교합니다.
  2. 토큰이 만료되지 않았으면, 기존 `token`을 그대로 반환합니다.
  3. 토큰이 만료되었으면, `refreshAccessToken` 함수를 호출하여 토큰 재발급을 시도합니다.

```typescript
// src/app/api/auth/[...nextauth]/route.ts

async jwt({ token, user, account }) {
  // 초기 로그인
  if (user && account) {
    // ... 백엔드 로그인 API 호출 및 토큰 저장 로직 ...
    return initialToken;
  }

  // 액세스 토큰이 아직 유효한 경우
  if (Date.now() < token.accessTokenExpires) {
    return token;
  }

  // 액세스 토큰이 만료된 경우, 리프레시 토큰으로 재발급
  return refreshAccessToken(token);
},
```

#### `refreshAccessToken` 헬퍼 함수

`jwt` 콜백 내에서 사용되는 함수로, 백엔드의 재발급 API와 실제로 통신하는 역할을 합니다.

- **주요 로직**:
  1. 기존 `token` 객체에서 `refreshToken`을 꺼내 백엔드 `/api/auth/refresh` API로 전송합니다.
  2. 성공적으로 새로운 `accessToken`을 받으면, 기존 `token` 객체에 새 액세스 토큰과 새로운 만료 시간을 업데이트하여 반환합니다.
  3. 실패 시, `error` 필드에 `'RefreshAccessTokenError'`를 기록하여 반환합니다.

#### `session` 콜백

`useSession` 훅이나 `getSession` 함수를 통해 클라이언트에서 세션 정보를 조회할 때마다 실행됩니다.

- **주요 로직**:
  1. `jwt` 콜백에서 처리된 최종 `token` 객체를 받습니다.
  2. `token` 객체에 있는 `accessToken`, `refreshToken`, `error` 등의 정보를 클라이언트에서 사용할 수 있도록 `session` 객체에 복사하여 전달합니다.

```typescript
// src/app/api/auth/[...nextauth]/route.ts

async session({ session, token }) {
  session.accessToken = token.accessToken;
  session.refreshToken = token.refreshToken;
  session.error = token.error;
  // ... 기타 사용자 정보 ...

  return session;
},
```

이 설정을 통해 클라이언트 컴포넌트에서는 `useSession` 훅을 사용하는 것만으로 항상 유효한 `accessToken`을 얻을 수 있으며, 토큰 갱신과 같은 복잡한 과정은 NextAuth가 백그라운드에서 자동으로 처리해줍니다.

이 문서는 Mooda 프로젝트의 JWT(Access Token + Refresh Token) 기반 인증 시스템의 전체적인 흐름과 구현 세부사항을 설명합니다.

## 1. 인증 흐름 개요

본 시스템은 사용자가 안전하고 지속적으로 서비스에 로그인 상태를 유지할 수 있도록 **액세스 토큰(Access Token)**과 **리프레시 토큰(Refresh Token)** 방식을 사용합니다.

- **액세스 토큰 (Access Token)**:

  - **역할**: 실제 API를 호출할 때 사용자의 신원을 증명하는 단기 인증서입니다.
  - **수명**: 1시간 (비교적 짧음)
  - **특징**: 수명이 짧아 탈취되더라도 보안 위협이 적습니다.

- **리프레시 토큰 (Refresh Token)**:

  - **역할**: 만료된 액세스 토큰을 재발급받기 위한 장기 인증서입니다.
  - **수명**: 7일 (비교적 긺)
  - **특징**: 서버 DB에 저장하여 필요시 검증하며, 직접적으로 API 요청에는 사용되지 않습니다.

### 전체 인증 시나리오

```mermaid
sequenceDiagram
    participant Client as 클라이언트 (Next.js)
    participant NextAuth as NextAuth 서버
    participant Backend as 백엔드 (Node.js)
    participant DB as 데이터베이스

    Client->>NextAuth: 1. 카카오 로그인 시도
    NextAuth-->>Client: 카카오 인증 성공

    Note over NextAuth: jwt 콜백 실행
    NextAuth->>Backend: 2. /api/auth/login 호출 (카카오ID, 이메일 등)
    Backend->>DB: 3. 사용자 정보 upsert
    Backend->>Backend: 4. Access/Refresh 토큰 생성
    Backend->>DB: 5. Refresh Token 저장
    Backend-->>NextAuth: 6. Access/Refresh 토큰 반환

    Note over NextAuth: 토큰을 NextAuth 세션에 저장
    NextAuth-->>Client: 7. 로그인 완료 및 세션 생성

    %% --- API 요청 시 ---
    Client->>Backend: 8. API 요청 (with Access Token)
    alt Access Token 유효
        Backend-->>Client: API 응답
    else Access Token 만료
        Note over Client: API 요청 실패 (401 Unauthorized)

        Note over Client,NextAuth: 세션 접근 시 자동 갱신 트리거
        NextAuth->>NextAuth: 9. Access Token 만료 확인
        NextAuth->>Backend: 10. /api/auth/refresh 호출 (with Refresh Token)
        Backend->>DB: 11. DB의 Refresh Token과 비교 검증
        Backend->>Backend: 12. 새로운 Access Token 생성
        Backend-->>NextAuth: 13. 새로운 Access Token 반환

        Note over NextAuth: 세션에 새 Access Token 저장
        NextAuth-->>Client: 14. 갱신된 세션 정보 전달

        Client->>Backend: 15. 실패했던 API 재요청 (with 새 Access Token)
        Backend-->>Client: API 응답
    end
```

## 2. 백엔드 (`/server`) 설정

Node.js/Express로 구현된 백엔드 서버의 주요 설정입니다.

### 2.1. Prisma 스키마 (`schema.prisma`)

`User` 모델에 `refreshToken` 필드를 추가하여, 각 사용자별로 발급된 리프레시 토큰을 저장합니다.

```prisma
// server/prisma/schema.prisma

model User {
  // ... 기존 필드들
  refreshToken String? @map("refresh_token")

  @@map("users")
}
```

> **참고**: 스키마 변경 후에는 반드시 `npx prisma migrate dev --name add_refresh_token` 과 같은 명령어로 데이터베이스에 변경사항을 적용해야 합니다.

### 2.2. 환경 변수 (`.env`)

토큰 서명에 사용할 시크릿 키들을 `server/.env` 파일에 정의합니다.

```env
# server/.env

# 데이터베이스 연결 정보
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mooda?schema=public"

# JWT 서명용 시크릿 키
JWT_SECRET=your-super-secret-jwt-key-for-mooda-project-5a8b3c9d2e
REFRESH_TOKEN_SECRET=your-ultra-secure-refresh-token-secret-for-mooda-app-1f6g7h8i9j
```

> **보안 주의**: `.env` 파일은 절대 Git에 포함시키면 안 됩니다. `.gitignore`에 `server/.env`가 포함되어 있는지 확인하세요.

### 2.3. 로그인 API (`/api/auth/login`)

사용자가 카카오 로그인을 통해 인증되면, NextAuth 서버는 이 엔드포인트를 호출하여 사용자를 우리 시스템에 등록/로그인시키고 토큰을 발급받습니다.

- **경로**: `POST /api/auth/login`
- **요청 본문**: `{ kakaoId, email, userName }`
- **주요 로직**:
  1. `prisma.user.upsert`를 사용하여 사용자가 존재하면 정보를 업데이트하고, 없으면 새로 생성합니다.
  2. `jsonwebtoken` 라이브러리와 각각의 시크릿 키를 사용하여 **액세스 토큰(유효기간 1시간)**과 **리프레시 토큰(유효기간 7일)**을 생성합니다.
  3. 생성된 리프레시 토큰을 해당 사용자의 DB 레코드에 업데이트합니다.
  4. 두 토큰을 모두 JSON 형태로 클라이언트(NextAuth 서버)에게 반환합니다.

```typescript
// server/src/index.ts

app.post('/api/auth/login', async (req, res) => {
  // ... 사용자 정보 upsert 로직 ...

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: '7d',
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.status(200).json({ accessToken, refreshToken });
});
```

### 2.4. 토큰 재발급 API (`/api/auth/refresh`)

액세스 토큰이 만료되었을 때, 클라이언트(NextAuth 서버)가 이 엔드포인트를 호출하여 새로운 액세스 토큰을 발급받습니다.

- **경로**: `POST /api/auth/refresh`
- **요청 본문**: `{ refreshToken }`
- **주요 로직**:
  1. 요청으로 받은 `refreshToken`의 유효성을 검증합니다.
  2. 토큰에서 `userId`를 추출하여 DB에서 해당 사용자를 찾습니다.
  3. 요청받은 토큰이 DB에 저장된 토큰과 일치하는지 비교하여 탈취 여부를 확인합니다.
  4. 모든 검증을 통과하면, 새로운 **액세스 토큰(유효기간 1시간)**만 생성하여 반환합니다.

```typescript
// server/src/index.ts

app.post('/api/auth/refresh', async (req, res) => {
  // ... 리프레시 토큰 검증 로직 ...

  const newAccessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

  res.status(200).json({ accessToken: newAccessToken });
});
```

---

## 3. 프론트엔드 (`/src`) 설정

Next.js 프론트엔드에서는 `NextAuth.js` 라이브러리를 통해 인증 상태를 관리하고, 백엔드와 통신하여 받은 JWT를 세션에 통합합니다.

### 3.1. NextAuth 타입 확장 (`next-auth.d.ts`)

NextAuth의 기본 `Session`과 `JWT` 타입에 우리가 사용할 `accessToken`, `refreshToken` 등의 커스텀 필드를 추가하기 위해 타입 정의 파일을 수정합니다.

```typescript
// src/lib/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string; // 토큰 갱신 실패 등의 에러 상태
    user: {
      kakaoId?: string | number;
      // ... 기타 user 필드
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number; // 액세스 토큰 만료 시간
    error?: string;
    // ... 기타 jwt 필드
  }
}
```

### 3.2. NextAuth 콜백 설정 (`[...nextauth]/route.ts`)

`src/app/api/auth/[...nextauth]/route.ts` 파일의 콜백 함수들은 NextAuth 인증 흐름의 핵심입니다.

#### `jwt` 콜백

이 콜백은 JWT가 생성되거나 업데이트될 때마다 실행됩니다. 토큰의 유효성을 검사하고 만료 시 재발급하는 로직이 여기에 포함됩니다.

- **초기 로그인 시**:

  1. `user`와 `account` 객체가 존재할 경우, 초기 로그인으로 간주합니다.
  2. 백엔드의 `/api/auth/login`을 호출하여 `accessToken`과 `refreshToken`을 받아옵니다.
  3. 두 토큰과 액세스 토큰의 만료 시간(`accessTokenExpires`)을 NextAuth의 `token` 객체에 저장하여 반환합니다.

- **세션 접근 시**:

  1. `token` 객체에 저장된 `accessTokenExpires` 값을 현재 시간과 비교합니다.
  2. 토큰이 만료되지 않았으면, 기존 `token`을 그대로 반환합니다.
  3. 토큰이 만료되었으면, `refreshAccessToken` 함수를 호출하여 토큰 재발급을 시도합니다.

```typescript
// src/app/api/auth/[...nextauth]/route.ts

async jwt({ token, user, account }) {
  // 초기 로그인
  if (user && account) {
    // ... 백엔드 로그인 API 호출 및 토큰 저장 로직 ...
    return initialToken;
  }

  // 액세스 토큰이 아직 유효한 경우
  if (Date.now() < token.accessTokenExpires) {
    return token;
  }

  // 액세스 토큰이 만료된 경우, 리프레시 토큰으로 재발급
  return refreshAccessToken(token);
},
```

#### `refreshAccessToken` 헬퍼 함수

`jwt` 콜백 내에서 사용되는 함수로, 백엔드의 재발급 API와 실제로 통신하는 역할을 합니다.

- **주요 로직**:
  1. 기존 `token` 객체에서 `refreshToken`을 꺼내 백엔드 `/api/auth/refresh` API로 전송합니다.
  2. 성공적으로 새로운 `accessToken`을 받으면, 기존 `token` 객체에 새 액세스 토큰과 새로운 만료 시간을 업데이트하여 반환합니다.
  3. 실패 시, `error` 필드에 `'RefreshAccessTokenError'`를 기록하여 반환합니다.

#### `session` 콜백

`useSession` 훅이나 `getSession` 함수를 통해 클라이언트에서 세션 정보를 조회할 때마다 실행됩니다.

- **주요 로직**:
  1. `jwt` 콜백에서 처리된 최종 `token` 객체를 받습니다.
  2. `token` 객체에 있는 `accessToken`, `refreshToken`, `error` 등의 정보를 클라이언트에서 사용할 수 있도록 `session` 객체에 복사하여 전달합니다.

```typescript
// src/app/api/auth/[...nextauth]/route.ts

async session({ session, token }) {
  session.accessToken = token.accessToken;
  session.refreshToken = token.refreshToken;
  session.error = token.error;
  // ... 기타 사용자 정보 ...

  return session;
},
```

이 설정을 통해 클라이언트 컴포넌트에서는 `useSession` 훅을 사용하는 것만으로 항상 유효한 `accessToken`을 얻을 수 있으며, 토큰 갱신과 같은 복잡한 과정은 NextAuth가 백그라운드에서 자동으로 처리해줍니다.
