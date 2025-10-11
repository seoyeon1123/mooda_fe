import { NextResponse } from 'next/server';
import { ServerSupabaseService } from '@/lib/server-supabase-service';

export async function GET(
  _req: Request,
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
  try {
    const { userId, personalityId, dateString } = await params;
    const target = new Date(dateString);
    target.setHours(0, 0, 0, 0);

    const svc = new ServerSupabaseService();
    const conversations = await svc.getConversationsByDate(
      userId,
      personalityId,
      target
    );
    return NextResponse.json({ conversations, success: true });
  } catch (e) {
    console.error('get conversations by date error:', e);
    return NextResponse.json(
      { conversations: [], success: false, error: 'internal' },
      { status: 500 }
    );
  }
}
