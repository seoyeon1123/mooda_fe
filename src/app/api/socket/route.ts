import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Chat API server is running' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 백엔드 서버로 프록시
    const serverUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/socket`;
    console.log('🔄 Proxying chat request to server:', serverUrl);

    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
