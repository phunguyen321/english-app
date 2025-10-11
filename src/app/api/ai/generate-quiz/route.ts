import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import {
  AnyQuizQuestion,
  VocabMcqQuestion,
  GrammarMcqQuestion,
  SentenceOrderQuestion,
  QuizType,
  Difficulty,
} from "@/types/quiz";

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
    const body = await req.json();
    const {
      requirements,
      count = 8,
      mixTypes: legacyMixTypes = true,
      allowedTypes: allowedTypesRaw,
      typeRatios: typeRatiosRaw,
    } = body || {};
    if (!requirements || typeof requirements !== "string") {
      return Response.json(
        { success: false, error: "Thiếu trường requirements." },
        { status: 400 }
      );
    }
    // Cho phép tạo nhiều câu hơn (tối đa 50) nhưng vẫn giới hạn để tránh quá tải token
    const safeCount = Math.min(Math.max(Number(count) || 8, 3), 50);
    const ALL_TYPES: QuizType[] = [
      "vocab-mcq",
      "grammar-mcq",
      "sentence-order",
    ];
    let allowedTypes: QuizType[] = Array.isArray(allowedTypesRaw)
      ? (allowedTypesRaw.filter((t: unknown) =>
          ALL_TYPES.includes(t as QuizType)
        ) as QuizType[])
      : ALL_TYPES;
    if (!allowedTypes.length) allowedTypes = ALL_TYPES;
    const mixTypes = allowedTypes.length > 1 && legacyMixTypes;

    // Process ratios (optional). Expect object { type: number }
    const ratios: Partial<Record<QuizType, number>> = {};
    if (typeRatiosRaw && typeof typeRatiosRaw === "object") {
      const rawRatios = typeRatiosRaw as Record<string, unknown>;
      for (const k of Object.keys(rawRatios)) {
        if (allowedTypes.includes(k as QuizType)) {
          const v = Number(rawRatios[k]);
          if (!Number.isNaN(v) && v > 0) ratios[k as QuizType] = v;
        }
      }
    }
    // If no valid ratios provided, default equal distribution
    if (Object.keys(ratios).length === 0) {
      const equal = 1 / allowedTypes.length;
      for (const t of allowedTypes) ratios[t] = equal as number;
    } else {
      // Normalize
      const sum = Object.values(ratios).reduce((a, b) => a + b, 0) || 1;
      for (const k of Object.keys(ratios) as QuizType[])
        ratios[k] = (ratios[k] || 0) / sum;
      // Ensure all allowed types present
      for (const t of allowedTypes) if (!(t in ratios)) ratios[t] = 0;
      // Re-normalize after adding zeros
      const sum2 = Object.values(ratios).reduce((a, b) => a + b, 0) || 1;
      for (const k of Object.keys(ratios) as QuizType[])
        ratios[k] = (ratios[k] || 0) / sum2;
    }

    // Compute target counts (approx) for guidance
    const targetCounts: Record<QuizType, number> = {
      "vocab-mcq": 0,
      "grammar-mcq": 0,
      "sentence-order": 0,
    };
    let allocated = 0;
    for (const t of allowedTypes) {
      const rawCount = Math.floor(safeCount * (ratios[t] || 0));
      targetCounts[t] = rawCount;
      allocated += rawCount;
    }
    // Distribute leftover
    let leftover = safeCount - allocated;
    if (leftover > 0) {
      const order = [...allowedTypes].sort(
        (a, b) => (ratios[b] || 0) - (ratios[a] || 0)
      );
      let idx = 0;
      while (leftover > 0) {
        targetCounts[order[idx % order.length]] += 1;
        leftover--;
        idx++;
      }
    }

    const model = getGeminiModel();
    const systemPrompt = `Output ONLY a JSON array (no markdown). Allowed question types: ${allowedTypes.join(
      ", "
    )}.
Each object: { id, type, difficulty, explanation, ...typeSpecific }.
- type: one of ${allowedTypes.join("|")}
- difficulty: easy|medium|hard (balanced overall)
- explanation: Vietnamese only, <=120 chars, 1 concise line (no English)
MCQ types (vocab-mcq / grammar-mcq): add { prompt, options[4-5], answerIndex } (single correct).
Sentence-order: add { tokens[], answer } with tokens.join(' ') === answer.
- id: unique, short (kebab/alphanum <=18 chars)
- prompts/tokens: English only
- NO extra fields / null / commentary.
Return EXACTLY N items. Start with '[' immediately.`;
    const targetCountsStr = allowedTypes
      .map((t) => `${t}=${targetCounts[t]}`)
      .join(", ");
    const userPrompt = `N=${safeCount}; distributeTypes=${mixTypes}; requirements="${requirements}"; targetCounts(${targetCountsStr}); If N>25 compress explanations. Match target counts as close as possible.`;
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Temperature=0.6; softLimit=${safeCount * 90}` },
      { text: userPrompt },
    ]);
    const raw = result.response.text().trim();

    // Attempt to extract JSON (remove potential code fences)
    const jsonText = raw
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(jsonText);
    } catch (err) {
      console.warn("Failed to parse JSON directly, returning raw.", err);
      return Response.json(
        { success: false, error: "AI trả về định dạng không hợp lệ." },
        { status: 500 }
      );
    }

    const TYPES: QuizType[] = ["vocab-mcq", "grammar-mcq", "sentence-order"];
    const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

    function clampDifficulty(d: unknown): Difficulty {
      return DIFFICULTIES.includes(d as Difficulty)
        ? (d as Difficulty)
        : "medium";
    }

    function isStringArray(arr: unknown): arr is string[] {
      return Array.isArray(arr) && arr.every((x) => typeof x === "string");
    }

    function sanitize(obj: unknown): AnyQuizQuestion | null {
      if (!obj || typeof obj !== "object") return null;
      const o = obj as Record<string, unknown>;
      if (typeof o.id !== "string" || !o.id.trim()) return null;
      if (!TYPES.includes(o.type as QuizType)) return null;
      const base = {
        id: o.id.trim().slice(0, 32),
        type: o.type as QuizType,
        difficulty: clampDifficulty(o.difficulty),
        explanation:
          typeof o.explanation === "string"
            ? o.explanation.trim().slice(0, 200)
            : "",
      } as const;
      switch (base.type) {
        case "vocab-mcq":
        case "grammar-mcq": {
          if (typeof o.prompt !== "string") return null;
          const options = o.options;
          if (!isStringArray(options) || options.length < 2) return null;
          if (typeof o.answerIndex !== "number") return null;
          const answerIndex = o.answerIndex as number;
          if (answerIndex < 0 || answerIndex >= options.length) return null;
          const mcq: VocabMcqQuestion | GrammarMcqQuestion = {
            id: base.id,
            type: base.type,
            difficulty: base.difficulty,
            explanation: base.explanation,
            prompt: o.prompt.trim().slice(0, 260),
            options: options.map((s) => s.trim()).slice(0, 6),
            answerIndex,
          };
          return mcq;
        }
        case "sentence-order": {
          const tokens = o.tokens;
          if (!isStringArray(tokens) || typeof o.answer !== "string")
            return null;
          const joined = tokens.join(" ").trim();
          const answer = o.answer.trim();
          // Soft check: ensure they roughly match ignoring multiple spaces.
          if (joined.replace(/\s+/g, " ") !== answer.replace(/\s+/g, " ")) {
            // still accept (model đôi khi đổi nhẹ) nhưng có thể bỏ qua nếu muốn strict
          }
          const so: SentenceOrderQuestion = {
            id: base.id,
            type: "sentence-order",
            difficulty: base.difficulty,
            explanation: base.explanation,
            tokens: tokens.map((t) => t.trim()).slice(0, 30),
            answer,
          };
          return so;
        }
      }
      return null;
    }

    const valid: AnyQuizQuestion[] = [];
    const seen = new Set<string>();
    if (Array.isArray(rawParsed)) {
      for (const item of rawParsed) {
        const q = sanitize(item);
        if (!q) continue;
        if (seen.has(q.id)) continue;
        if (!allowedTypes.includes(q.type)) continue; // filter unmatched types per selection
        seen.add(q.id);
        valid.push(q);
      }
    }

    if (!valid.length) {
      return Response.json(
        { success: false, error: "Không tạo được câu hỏi hợp lệ." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data: valid });
  } catch (err) {
    console.error("AI quiz generation error", err);
    return Response.json(
      { success: false, error: "Server lỗi hoặc AI không phản hồi." },
      { status: 500 }
    );
  }
}
