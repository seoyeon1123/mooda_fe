-- Users 테이블
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  kakao_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_name VARCHAR(255) NOT NULL,
  image TEXT,
  refresh_token TEXT,
  selected_personality_id VARCHAR(255) DEFAULT 'MUNI'
);

-- Conversations 테이블
CREATE TABLE conversations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role VARCHAR(50) NOT NULL,
  personality_id VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Custom AI Personalities 테이블
CREATE TABLE custom_ai_personalities (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  mbti_types VARCHAR(255) NOT NULL,
  system_prompt TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Emotion Logs 테이블
CREATE TABLE emotion_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  emotion VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  character_name VARCHAR(255),
  short_summary TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- 인덱스 생성
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_personality_id ON conversations(personality_id);
CREATE INDEX idx_custom_ai_personalities_user_id ON custom_ai_personalities(user_id);
CREATE INDEX idx_emotion_logs_user_id ON emotion_logs(user_id);
CREATE INDEX idx_emotion_logs_date ON emotion_logs(date);

-- RLS (Row Level Security) 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_ai_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정 (예시 - 실제 요구사항에 맞게 수정 필요)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view own custom AIs" ON custom_ai_personalities
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own custom AIs" ON custom_ai_personalities
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own custom AIs" ON custom_ai_personalities
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own emotion logs" ON emotion_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own emotion logs" ON emotion_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own emotion logs" ON emotion_logs
  FOR UPDATE USING (auth.uid()::text = user_id); 