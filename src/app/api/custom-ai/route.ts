import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { ServerSupabaseService } from '@/lib/server-supabase-service';
import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const svc = new ServerSupabaseService();
    const userId = session.user.id as string;
    const list = await svc.getCustomAIPersonalitiesByUserId(userId);
    return NextResponse.json(list);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/custom-ai called');

    const session = await getServerSession(authOptions);
    console.log('🔍 Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      accessToken: session?.accessToken
        ? `${session.accessToken.substring(0, 10)}...`
        : 'none',
      userId: session?.user?.id,
    });

    if (!session?.accessToken) {
      console.log('❌ No access token found');
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      userId: string;
      name: string;
      description: string;
      mbtiTypes: string;
      systemPrompt: string;
    };
    const svc = new ServerSupabaseService();
    const created = await svc.createCustomAIPersonality({
      id: crypto.randomUUID(),
      userId: body.userId,
      name: body.name,
      description: body.description,
      mbtiTypes: body.mbtiTypes,
      systemPrompt: body.systemPrompt,
    });
    if (!created) {
      return NextResponse.json({ error: 'create failed' }, { status: 500 });
    }
    return NextResponse.json(created);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
