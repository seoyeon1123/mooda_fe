# Mooda 서버 설정 가이드

이 문서는 Mooda 프로젝트의 백엔드 서버를 설정하고 실행하는 과정을 안내합니다.

## 1. 기술 스택 (Tech Stack)

서버는 다음과 같은 주요 기술을 사용하여 구축되었습니다.

- **런타임 환경**: Node.js
- **웹 프레임워크**: Express.js
- **프로그래밍 언어**: TypeScript
- **데이터베이스**: PostgreSQL
- **ORM (Object-Relational Mapping)**: Prisma
- **컨테이너화**: Docker (Docker Compose)

### 기술 선택 이유

- **Node.js & Express.js**: 비동기 I/O 처리 능력과 방대한 생태계를 가진 Node.js를 기반으로, 가볍고 유연한 Express.js를 사용하여 빠르게 API 서버를 구축했습니다.
- **TypeScript**: 정적 타입을 지원하여 코드의 안정성과 가독성을 높이고, 개발 단계에서 발생할 수 있는 잠재적 오류를 줄이기 위해 선택했습니다.
- **PostgreSQL**: 오랜 기간 검증된 강력한 오픈소스 관계형 데이터베이스이며, 복잡한 데이터 관계를 안정적으로 관리하기에 적합합니다.
- **Prisma**: TypeScript와 완벽하게 통합되어 타입 안전성을 보장하는 최신 ORM입니다. 직관적인 스키마 정의와 자동 생성되는 클라이언트를 통해 개발 생산성을 크게 향상시킵니다.
- **Docker**: 개발 환경과 실제 배포 환경의 일관성을 유지하고, 복잡한 PostgreSQL 설치 과정 없이 명령어 한 줄로 데이터베이스를 실행하기 위해 사용합니다.

## 2. 서버 설정 절차

다음 단계를 따라 서버 개발 환경을 설정합니다.

### 1단계: Node.js 프로젝트 초기화 및 의존성 설치

1.  **`server` 디렉토리 생성 및 이동**:

    ```bash
    mkdir server
    cd server
    ```

2.  **`package.json` 생성**:

    ```bash
    npm init -y
    ```

    - **이유**: Node.js 프로젝트의 기본 정보를 담는 `package.json` 파일을 생성하여, 프로젝트의 의존성과 스크립트를 관리합니다.

3.  **필요한 패키지 설치**:
    - **프로덕션 의존성**:
      ```bash
      npm install express pg @prisma/client dotenv
      ```
    - **개발 의존성**:
      ```bash
      npm install -D typescript ts-node nodemon @types/node @types/express prisma
      ```
    - **이유**: Express 서버 실행, PostgreSQL 연결(`pg`), Prisma 클라이언트, 환경 변수 관리(`dotenv`) 등 서버 운영에 필수적인 패키지들과, TypeScript 컴파일, 타입 정의, 자동 재시작(`nodemon`) 등 개발 편의성을 위한 패키지들을 설치합니다.

### 2단계: TypeScript 설정

1.  **`tsconfig.json` 파일 생성**:
    ```bash
    npx tsc --init
    ```
    - **이유**: TypeScript 컴파일러의 설정을 관리하는 `tsconfig.json` 파일을 생성합니다. 이 파일을 통해 컴파일 옵션(예: 타겟 ES 버전, 모듈 시스템 등)을 지정할 수 있습니다.

### 3단계: 데이터베이스 설정 (Docker)

1.  **`docker-compose.yml` 파일 작성**:

    - 프로젝트 루트의 `server` 디렉토리에 아래 내용으로 `docker-compose.yml` 파일을 작성했습니다.

    ```yaml
    version: '3.8'
    services:
      postgres:
        image: postgres:13
        restart: always
        environment:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: password
          POSTGRES_DB: mooda
        ports:
          - '5432:5432'
        volumes:
          - postgres_data:/var/lib/postgresql/data

    volumes:
      postgres_data:
    ```

    - **이유**: Docker Compose를 사용하여 PostgreSQL 데이터베이스 서버를 컨테이너로 실행합니다. 이를 통해 모든 개발자가 동일한 버전과 설정의 데이터베이스 환경을 손쉽게 구축할 수 있습니다. `volumes` 설정을 통해 컨테이너가 삭제되어도 데이터는 보존됩니다.

2.  **데이터베이스 컨테이너 실행**:
    ```bash
    docker-compose up -d
    ```
    - **이유**: `-d` 옵션을 사용하여 백그라운드에서 PostgreSQL 컨테이너를 실행합니다.

### 4단계: Prisma 설정

1.  **Prisma 프로젝트 초기화**:

    ```bash
    npx prisma init
    ```

    - **이유**: Prisma 사용을 위한 기본 파일을 생성합니다. `prisma` 디렉토리와 그 안에 `schema.prisma` 파일, 그리고 데이터베이스 URL을 설정하기 위한 `.env` 파일이 만들어집니다.

2.  **`.env` 파일 수정**:

    - `docker-compose.yml`에 설정한 값에 맞춰 `DATABASE_URL`을 수정합니다.

    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/mooda?schema=public"
    ```

    - **이유**: Prisma가 연결할 데이터베이스의 주소, 계정 정보 등을 환경 변수로 관리하여 보안을 유지하고 설정을 유연하게 만듭니다.

3.  **`schema.prisma` 파일 수정**:

    - 데이터베이스 모델(User, Conversation, EmotionLog)을 정의했습니다.
    - generator client의 `output` 경로를 `../generated/prisma`로 지정했습니다.
    - **이유**: 애플리케이션에서 사용할 데이터의 구조를 정의합니다. Prisma는 이 스키마를 바탕으로 타입 안전적인 클라이언트를 생성합니다. 클라이언트 생성 위치를 변경하여 프로젝트 구조를 정리했습니다.

4.  **데이터베이스 마이그레이션**:

    ```bash
    npx prisma migrate dev --name init
    ```

    - **이유**: `schema.prisma` 파일에 정의된 모델을 바탕으로 실제 데이터베이스에 테이블을 생성(마이그레이션)합니다. `migrate dev` 명령어는 개발 중에 사용하며, SQL 마이그레이션 파일을 생성하고 데이터베이스에 적용합니다.

5.  **Prisma 클라이언트 생성**:
    ```bash
    npx prisma generate
    ```
    - **이유**: 스키마가 변경될 때마다 이 명령어를 실행하여 타입 안전적인 Prisma 클라이언트를 최신 상태로 업데이트합니다. `migrate dev` 실행 시 자동으로 함께 실행되기도 합니다.

### 5단계: Express 서버 코드 작성 및 API 구현

서버의 진입점(entry point) 역할을 하는 `src/index.ts` 파일을 생성하고, 재사용 가능한 Prisma 클라이언트 모듈을 생성하여 API를 구현했습니다.

1.  **재사용 가능한 Prisma 클라이언트 생성 (`src/lib/prisma.ts`)**

    - 매 요청마다 `new PrismaClient()`를 호출하는 것은 비효율적이므로, 애플리케이션 전역에서 단 하나의 클라이언트 인스턴스를 사용하도록 모듈을 생성했습니다.

    ```typescript
    // server/src/lib/prisma.ts
    import { PrismaClient } from '../../generated/prisma';

    const prisma = new PrismaClient();

    export default prisma;
    ```

    - **이유**: 데이터베이스 커넥션 풀을 효율적으로 관리하고, 불필요한 인스턴스 생성을 막아 서버의 성능을 최적화합니다. `schema.prisma`에서 `output` 경로를 커스텀했기 때문에, 해당 경로에서 `PrismaClient`를 import 했습니다.

2.  **로그인/회원가입 API 구현 (`src/index.ts`)**

    - 카카오 로그인 후 프론트엔드에서 호출할 `/api/auth/login` 엔드포인트를 구현했습니다.
    - 초기에는 `prisma.user.create`를 사용했으나, 이미 가입된 사용자가 다시 로그인할 경우 `Unique constraint failed` 오류가 발생하는 문제가 있었습니다.
    - 이 문제를 해결하기 위해 `prisma.user.upsert`를 사용하여 안정성과 효율성을 모두 개선했습니다.

    ```typescript
    // server/src/index.ts
    import express from 'express';
    import cors from 'cors';
    import prisma from './lib/prisma';

    const app = express();
    app.use(cors());
    app.use(express.json());

    const PORT = process.env.PORT || 8080;

    // 사용자 로그인 또는 신규 등록 처리
    app.post('/api/auth/login', async (req, res) => {
      const { kakaoId, email, userName } = req.body;

      if (!kakaoId) {
        return res.status(400).json({ error: 'kakaoId is required' });
      }

      try {
        const user = await prisma.user.upsert({
          where: { kakaoId: kakaoId.toString() }, // 검색 조건
          update: { name: userName, email }, // 사용자가 존재할 경우 업데이트 할 정보
          create: {
            // 사용자가 존재하지 않을 경우 생성할 정보
            kakaoId: kakaoId.toString(),
            email,
            name: userName,
          },
        });
        res.status(200).json(user);
      } catch (error) {
        console.error('Login/Register Error:', error);
        res.status(500).json({ error: 'Database error' });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
    ```

    - **`upsert` 로직 설명**:
      - `where`: `kakaoId`를 기준으로 사용자가 DB에 존재하는지 검색합니다.
      - `update`: 사용자가 존재하면 `name`과 `email` 정보를 최신 값으로 업데이트합니다. (카카오 프로필 정보가 변경되었을 경우를 대비)
      - `create`: 사용자가 존재하지 않으면, 전달받은 `kakaoId`, `email`, `name` 정보로 새로운 사용자를 생성합니다.
      - 이를 통해 **로그인과 회원가입 로직이 하나의 API 엔드포인트에서 원자적(atomic)으로 처리**됩니다.

## 3. 서버 실행 방법

1.  **데이터베이스 서버 실행**:

    - `server` 디렉토리에서 다음 명령어를 실행하여 PostgreSQL 컨테이너를 시작합니다. (이미 실행 중이면 건너뜁니다.)

    ```bash
    docker-compose up -d
    ```

2.  **API 서버 실행**:
    - `server` 디렉토리에서 다음 명령어를 실행하여 Node.js 서버를 개발 모드로 시작합니다.
    ```bash
    npm run dev
    ```
    - `nodemon`이 코드 변경을 감지하여 서버를 자동으로 재시작해줍니다.
