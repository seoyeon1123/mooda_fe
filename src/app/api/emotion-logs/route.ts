import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // 서버로 프록시
    const serverUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/emotion-logs?userId=${userId}&year=${year}&month=${month}`;
    console.log('🔄 Proxying to server:', serverUrl);

    const response = await fetch(serverUrl);
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
