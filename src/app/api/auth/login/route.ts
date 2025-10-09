import { NextRequest, NextResponse } from 'next/server';
import {
  ServerSupabaseService,
  type UserRow,
} from '@/lib/server-supabase-service';
import crypto from 'crypto';

const svc = new ServerSupabaseService();

export async function POST(request: NextRequest) {
  try {
    const { kakaoId, email, userName, image } = (await request.json()) as {
      kakaoId?: string | number;
      email?: string;
      userName?: string;
      image?: string;
    };

    if (!kakaoId) {
      return NextResponse.json(
        { error: 'kakaoId is required' },
        { status: 400 }
      );
    }

    const kakaoIdStr = String(kakaoId);

    let user = await svc.getUserByKakaoId(kakaoIdStr);
    if (!user) {
      user = await svc.createUser({
        id: crypto.randomUUID(),
        kakaoId: kakaoIdStr,
        email,
        userName: userName || '사용자',
        image,
      });
    } else {
      const updates: Partial<UserRow> = {
        email: email ?? user.email,
        user_name: userName ?? user.user_name,
        image: image ?? user.image,
      };
      user = await svc.updateUser(user.id, updates);
    }

    if (!user) {
      return NextResponse.json(
        { error: '사용자 생성/업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        userId: user.id,
        name: user.user_name,
        email: user.email,
        image: user.image,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
