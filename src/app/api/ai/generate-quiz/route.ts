import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { AnyQuizQuestion } from "@/types";

// Simple in-memory rate limit
let calls: number[] = [];
function rateLimited() {
  const now = Date.now();
  calls = calls.filter((t) => now - t < 5 * 60_000);
  if (calls.length >= 25) return true; // tighter for heavier generations
  calls.push(now);
  return false;
}

/*
Expected body: {
  requirements: string; // mô tả yêu cầu / chủ đề / level mong muốn (vi hoặc en)
  count?: number; // số câu hỏi mong muốn (mặc định 8)
  mixTypes?: boolean; // trộn nhiều loại câu hỏi
}

We instruct Gemini to output JSON strictly matching AnyQuizQuestion[].
*/

export async function POST(req: NextRequest) {
  if (rateLimited()) {
    return Response.json(
      { success: false, error: "Quá nhiều yêu cầu. Thử lại sau ít phút." },
      { status: 429 }
    );
  }

  try {
    const { requirements, count = 8, mixTypes = true } = await req.json();
    if (!requirements || typeof requirements !== "string") {
      return Response.json(
        { success: false, error: "Thiếu trường requirements." },
        { status: 400 }
      );
    }
    // Cho phép tạo nhiều câu hơn (tối đa 50) nhưng vẫn giới hạn để tránh quá tải token
    const safeCount = Math.min(Math.max(Number(count) || 8, 3), 50);

    const model = getGeminiModel();
    const systemPrompt = `You are an assistant that generates English learning quiz data.
STRICT OUTPUT RULES (read carefully):
1. OUTPUT ONLY a raw JSON array (no markdown fences, no comments, no trailing text).
2. Each element must match one of these TypeScript shapes:
   type QuizQuestionBase = { id: string; type: "vocab-mcq" | "grammar-mcq" | "sentence-order"; difficulty: "easy" | "medium" | "hard"; explanation: string };
   type VocabMcqQuestion = QuizQuestionBase & { type: "vocab-mcq"; prompt: string; options: string[]; answerIndex: number };
   type GrammarMcqQuestion = QuizQuestionBase & { type: "grammar-mcq"; prompt: string; options: string[]; answerIndex: number };
   type SentenceOrderQuestion = QuizQuestionBase & { type: "sentence-order"; tokens: string[]; answer: string };
3. FIELD REQUIREMENTS:
   - id: short unique (kebab-case or alphanum, <=18 chars, no spaces).
   - difficulty: balanced distribution overall.
   - For MCQ (vocab-mcq / grammar-mcq): options length 4 or 5; exactly ONE correct; answerIndex valid.
   - For sentence-order: tokens array when joined by single spaces EXACTLY equals answer.
   - explanation: MUST be in VIETNAMESE ONLY (không dùng tiếng Anh), 1 câu ngắn gọn (<=160 ký tự), giải thích vì sao đáp án đúng (nêu mẹo/ngữ pháp/nghĩa). Không lặp lại toàn bộ câu hỏi nguyên văn trừ khi cần minh họa ngắn.
4. PROMPT / TOKENS: luôn bằng tiếng Anh (ngoại trừ explanation bằng tiếng Việt).
5. Không được thêm trường thừa, không null, không comment.
6. Không dùng ký tự xuống dòng trong explanation trừ khi thật cần (ưu tiên một câu).
7. Nếu yêu cầu đề cập trình độ (A1..C2) hãy điều chỉnh độ khó phù hợp.
8. Tuyệt đối KHÔNG xuất bất kỳ text nào ngoài JSON array.

Ví dụ (rút gọn – không lặp lại trong kết quả thật):
[
  {"id":"vocab-1","type":"vocab-mcq","difficulty":"easy","prompt":"Word meaning: 'travel'","options":["du lịch","ăn","ngủ","hát"],"answerIndex":0,"explanation":"'Travel' nghĩa là đi du lịch; các lựa chọn khác không đúng ngữ nghĩa."}
]

HÃY TRẢ VỀ CHỈ JSON ARRAY HỢP LỆ. NHỚ: explanation phải 100% tiếng Việt.`;

    const userPrompt = `Generate ${safeCount} quiz questions. Mix types = ${mixTypes}. Requirements: ${requirements}\nIf number of questions > 25 keep explanations ultra concise (still Vietnamese).`;
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);
    const raw = result.response.text().trim();

    // Attempt to extract JSON (remove potential code fences)
    const jsonText = raw
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
    let parsed: AnyQuizQuestion[];
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.warn("Failed to parse JSON directly, returning raw.", raw);
      return Response.json(
        { success: false, error: "AI trả về định dạng không hợp lệ." },
        { status: 500 }
      );
    }

    // Basic validation & cleanup
    const valid: AnyQuizQuestion[] = [];
    const seen = new Set<string>();
    for (const q of parsed) {
      if (!q || typeof q !== "object") continue;
      if (!q.id || seen.has(q.id)) continue;
      seen.add(q.id);
      if (
        !q.type ||
        !["vocab-mcq", "grammar-mcq", "sentence-order"].includes(q.type)
      )
        continue;
      if (!q.difficulty) q.difficulty = "medium" as any;
      if (q.type === "vocab-mcq" || q.type === "grammar-mcq") {
        if (!Array.isArray((q as any).options) || (q as any).options.length < 2)
          continue;
        if (typeof (q as any).answerIndex !== "number") continue;
      } else if (q.type === "sentence-order") {
        if (
          !Array.isArray((q as any).tokens) ||
          typeof (q as any).answer !== "string"
        )
          continue;
      }
      if (typeof q.explanation !== "string") q.explanation = "" as any;
      valid.push(q as AnyQuizQuestion);
    }

    if (!valid.length) {
      return Response.json(
        { success: false, error: "Không tạo được câu hỏi hợp lệ." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data: valid });
  } catch (err: any) {
    console.error("AI quiz generation error", err);
    return Response.json(
      { success: false, error: "Server lỗi hoặc AI không phản hồi." },
      { status: 500 }
    );
  }
}
