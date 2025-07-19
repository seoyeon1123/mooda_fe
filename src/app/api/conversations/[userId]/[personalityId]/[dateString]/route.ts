import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      userId: string;
      personalityId: string;
      dateString: string;
    }>;
  }
) {
  const { userId, dateString } = await params;

  // 백엔드 서버의 userId+date API로 프록시
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${userId}/${dateString}`;

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ conversations: [] }, { status: 500 });
  }
}
