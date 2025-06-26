import { NextRequest, NextResponse } from "next/server";

interface SendMessageData {
  userId: string;
  message: string;
  personalityId?: string;
}

interface AnalyzeEmotionData {
  userId: string;
}

interface GetHistoryData {
  userId: string;
}

interface RequestBody {
  action: "send-message" | "analyze-emotion" | "get-conversation-history";
  data: SendMessageData | AnalyzeEmotionData | GetHistoryData;
}

/**
 * GET 요청 처리 - 서버 상태 확인용
 */
export async function GET() {
  return NextResponse.json({ message: "Chat API server is running" });
}

/**
 * POST 요청 처리 - 서버 API로 요청을 전달
 */
export async function POST(request: NextRequest) {
  try {
    const { action, data }: RequestBody = await request.json();

    // 서버 API 엔드포인트로 요청 전달
    switch (action) {
      case "send-message":
        return await forwardToServer("/api/chat/send-message", "POST", data);
      case "analyze-emotion":
        return await forwardToServer("/api/chat/analyze-emotion", "POST", data);
      case "get-conversation-history":
        return await forwardToServer(`/api/chat/history/${data.userId}`, "GET");
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}

/**
 * 서버 API로 요청을 전달하는 함수
 */
async function forwardToServer(
  endpoint: string,
  method: string,
  data?: SendMessageData | AnalyzeEmotionData
): Promise<NextResponse> {
  try {
    const serverUrl = process.env.SERVER_URL || "http://localhost:8080";
    const url = `${serverUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || "Server error" },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Forward to server error:", error);
    return NextResponse.json(
      { error: "Failed to connect to server" },
      { status: 500 }
    );
  }
}
