import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { ServerSupabaseService } from "@/lib/server-supabase-service";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const userId = body.userId || session.user.id;

    const svc = new ServerSupabaseService();

    // 삭제하기 전에 해당 AI가 사용자의 것인지 확인
    const customAI = await svc.getCustomAIPersonalityById(id, userId);

    if (!customAI) {
      return NextResponse.json(
        { error: "AI를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 실행
    const deleted = await svc.deleteCustomAIPersonality(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "삭제되었습니다." });
  } catch (error) {
    console.error("DELETE custom-ai error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
