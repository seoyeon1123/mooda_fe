import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { ServerSupabaseService } from '@/lib/server-supabase-service';
import crypto from 'crypto';

// 일기 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다.' },
        { status: 400 }
      );
    }

    const svc = new ServerSupabaseService();
    const entries = await svc.getDiaryEntries(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('일기 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 일기 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, date, emotion, title, content } = body;

    if (!userId || !date || !emotion || !title || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const svc = new ServerSupabaseService();
    const entry = await svc.createDiaryEntry({
      id: crypto.randomUUID(),
      userId,
      date: new Date(date),
      emotion,
      title,
      content,
    });

    if (!entry) {
      return NextResponse.json(
        { error: '일기 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('일기 생성 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
