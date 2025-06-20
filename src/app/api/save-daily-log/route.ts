import { saveDailyLog } from '../../../lib/daily-log';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: '내용이 없습니다.' },
        { status: 400 }
      );
    }

    const result = await saveDailyLog(content);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Unknown error' },
      { status: 500 }
    );
  }
}
