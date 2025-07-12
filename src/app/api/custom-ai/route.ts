import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

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

    // 백엔드 서버로 프록시
    const serverUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/custom-ai`;
    console.log('🔄 Proxying GET request to server:', serverUrl);

    const response = await fetch(serverUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const data = await response.json();
    console.log('📨 Server response:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
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

    const body = await request.json();
    console.log('📝 Request body:', body);

    // 백엔드 서버로 프록시
    const serverUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/custom-ai`;
    console.log('🔄 Proxying POST request to server:', serverUrl);

    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    console.log('📡 Backend response status:', response.status);

    const data = await response.json();
    console.log('📨 Backend response data:', data);

    if (!response.ok) {
      console.log('❌ Backend returned error:', response.status, data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
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
