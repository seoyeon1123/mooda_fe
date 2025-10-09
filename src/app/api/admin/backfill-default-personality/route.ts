import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const headerToken = request.headers.get('x-admin-secret') || undefined;
    const expected = process.env.ADMIN_SECRET;
    if (expected && headerToken !== expected) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('users')
      .update({ selected_personality_id: 'calm' })
      .is('selected_personality_id', null)
      .select('id');

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: data?.length ?? 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
