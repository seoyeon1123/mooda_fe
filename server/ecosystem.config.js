module.exports = {
  apps: [
    {
      name: 'my-server',
      script: './dist/index.js',
      env: {
        SUPABASE_URL: 'https://hjfbrmwefnixckwovaia.supabase.co',
        SUPABASE_ANON_KEY:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZmJybXdlZm5peGNrd292YWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODg3NDIsImV4cCI6MjA2Nzg2NDc0Mn0.0txtnzErI7GnIWegOWDgXEQp57NUe9cky0Nb-cpenpc',
        SUPABASE_SERVICE_ROLE_KEY:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZmJybXdlZm5peGNrd292YWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODg3NDIsImV4cCI6MjA2Nzg2NDc0Mn0.0txtnzErI7GnIWegOWDgXEQp57NUe9cky0Nb-cpenpc',
        OBSIDIAN_VAULT_PATH: '/Users/iseoyeon/Documents/Obsidian Vault',
        NEXTAUTH_URL: 'http://localhost:3000',
        KAKAO_CLIENT_ID: 'e6210555262d6a2cf68f87fa8bb93309',
        KAKAO_CLIENT_SECRET: '2POtzHVxffUir2u1pd4ZNPlBAnoFSj2P',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        NEXTAUTH_SECRET:
          'AEnH88uOQYHgKwbUXbjXvyVHkNRx5sPTX1Juts5oguCN93vDntmFz0wNOsIn6PY8wSfaR05HVcPCe4JuTC2FA==',
        NEXT_PUBLIC_API_URL: 'http://localhost:8080',
      },
    },
  ],
};
