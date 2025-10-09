import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { ServerSupabaseService } from '@/lib/server-supabase-service';

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
    if (!userId)
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    const svc = new ServerSupabaseService();
    const user = await svc.getUserById(userId);
    if (!user)
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({
      ...user,
      selectedPersonalityId: user.selected_personality_id || 'MUNI',
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const svc = new ServerSupabaseService();
    const created = await svc.createUser({
      id: session.user.id as string,
      kakaoId: (session.user as any).kakaoId || (session.user.id as string),
      userName: session.user.name || '사용자',
      email: session.user.email || undefined,
      image: session.user.image || undefined,
    });
    return NextResponse.json(created, { status: created ? 201 : 500 });
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { selectedPersonalityId } = body;

    const svc = new ServerSupabaseService();
    const updatedUser = await svc.updateUser(
      session.user.id as string,
      {
        selected_personality_id: selectedPersonalityId,
      } as any
    );
    if (!updatedUser)
      return NextResponse.json({ error: 'update failed' }, { status: 500 });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
