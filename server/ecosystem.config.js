module.exports = {
  apps: [
    {
      name: 'mooda-backend',
      script: './dist/index.js',
      env: {
        // 주의: 민감정보는 PM2 파일에 하드코딩하지 않고 .env 또는 시스템 환경변수로 관리하세요
        PORT: process.env.PORT || 8080,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        NEXT_PUBLIC_API_URL:
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
      },
    },
  ],
};
