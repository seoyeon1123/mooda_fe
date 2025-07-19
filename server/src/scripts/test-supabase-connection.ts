import { supabase } from '../lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseConnection() {
  console.log('🔗 Supabase 연결 테스트 시작...');

  try {
    // 1. 테스트용 사용자 데이터
    const testUser = {
      id: 'test-user-123',
      kakao_id: 'test-kakao-123',
      user_name: '테스트 사용자',
      email: 'test@example.com',
      image: 'https://example.com/image.jpg',
    };

    // 2. 사용자 생성 테스트
    console.log('📝 테스트 사용자 생성 중...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.error('❌ 사용자 생성 실패:', userError);
      return;
    }

    console.log('✅ 사용자 생성 성공:', userData);

    // 3. 테스트 대화 데이터
    const testConversation = {
      id: 'test-conversation-123',
      user_id: testUser.id,
      content: '안녕하세요! 테스트 메시지입니다.',
      role: 'user',
      personality_id: 'MUNI',
    };

    // 4. 대화 생성 테스트
    console.log('💬 테스트 대화 생성 중...');
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert(testConversation)
      .select()
      .single();

    if (convError) {
      console.error('❌ 대화 생성 실패:', convError);
      return;
    }

    console.log('✅ 대화 생성 성공:', convData);

    // 5. 데이터 조회 테스트
    console.log('🔍 데이터 조회 테스트 중...');
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.id);

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError);
      return;
    }

    console.log('✅ 데이터 조회 성공:', users);

    // 6. 테스트 데이터 정리
    console.log('🧹 테스트 데이터 정리 중...');
    await supabase.from('conversations').delete().eq('id', testConversation.id);
    await supabase.from('users').delete().eq('id', testUser.id);

    console.log(
      '🎉 Supabase 연결 테스트 완료! 모든 기능이 정상적으로 작동합니다.'
    );
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
testSupabaseConnection();
