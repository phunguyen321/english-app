import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

type Role = "user" | "model";
interface ChatMessage {
  role: Role;
  content: string;
}

// Light in-memory rate limit to avoid abuse
let calls: number[] = [];
function rateLimited() {
  const now = Date.now();
  calls = calls.filter((t) => now - t < 5 * 60_000);
  if (calls.length >= 60) return true;
  calls.push(now);
  return false;
}

export async function POST(req: NextRequest) {
  if (rateLimited()) {
    return Response.json(
      {
        success: false,
        error: "Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
      },
      { status: 429 }
    );
  }
  try {
    const body = await req.json().catch(() => null);
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
      : [];
    const modelName: string = body?.model || "gemini-2.5-flash";

    if (!messages.length) {
      return Response.json(
        { success: false, error: "Thiếu lịch sử hội thoại (messages)." },
        { status: 400 }
      );
    }

    // Separate last user message for sendMessage; prior messages become history
    const last = messages[messages.length - 1];
    if (last.role !== "user") {
      return Response.json(
        {
          success: false,
          error: "Tin nhắn cuối phải là của người dùng (user).",
        },
        { status: 400 }
      );
    }

    // Build and normalize history so it begins with a 'user' role
    // - Drop any leading 'model' messages (e.g., UI welcome text)
    // - Skip consecutive same-role messages to keep alternation stable
    const rawHistory = messages.slice(0, -1).map((m) => ({
      role: m.role as Role,
      parts: [{ text: m.content.slice(0, 4000) }],
    }));
    const normalized: { role: Role; parts: { text: string }[] }[] = [];
    for (const item of rawHistory) {
      if (!normalized.length) {
        if (item.role !== "user") continue; // ensure first is user
        normalized.push(item);
      } else {
        const prev = normalized[normalized.length - 1];
        if (prev.role === item.role) continue; // skip duplicates of same role
        normalized.push(item);
      }
    }
    // Optional: cap history length to last ~10 turns
    const MAX_TURNS = 10;
    const history =
      normalized.length > MAX_TURNS * 2
        ? normalized.slice(-MAX_TURNS * 2)
        : normalized;

    let model: ReturnType<typeof getGeminiModel>;
    try {
      model = getGeminiModel(modelName);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Không thể khởi tạo Gemini client (thiếu API key?).";
      return Response.json(
        {
          success: false,
          error:
            msg +
            "\nHãy đặt biến môi trường GEMINI_API_KEY hoặc GOOGLE_API_KEY trên server (và deploy lại).",
        },
        { status: 500 }
      );
    }

    // Use chat session with history and send the last user message
    // Note: We keep it simple (no streaming) for broad compatibility.
    // If you want streaming, switch to streamGenerateContent or the responses API.
    type ChatSession = {
      sendMessage: (
        text: string
      ) => Promise<{ response: { text: () => string } }>;
    };
    const startChat = (
      model as unknown as {
        startChat?: (opts: {
          history: Array<{ role: Role; parts: { text: string }[] }>;
        }) => ChatSession | undefined;
      }
    ).startChat;
    const chat: ChatSession | null = startChat
      ? startChat({ history }) ?? null
      : null;

    let text = "";
    if (chat && typeof chat.sendMessage === "function") {
      const res = await chat.sendMessage(last.content);
      text = res.response.text();
    } else {
      // Fallback: single-turn with full contents
      const contents = [
        ...history,
        { role: "user", parts: [{ text: last.content }] },
      ];
      // Ensure first content is user
      while (contents.length && contents[0].role !== "user") contents.shift();
      const res = await model.generateContent({ contents });
      text = res.response.text();
    }

    return Response.json({ success: true, data: { text } });
  } catch (err) {
    console.error("AI chat error", err);
    const msg =
      err instanceof Error ? err.message : "Server lỗi hoặc AI không phản hồi.";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
