import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to ensure API key exists and we only create one instance.
let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  // Support common env var names
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  if (!key) {
    throw new Error(
      "Thiếu API key cho Gemini. Hãy đặt GEMINI_API_KEY hoặc GOOGLE_API_KEY trong biến môi trường (Vercel Project Settings → Environment Variables)."
    );
  }
  if (!_client) {
    // Support both constructor signatures across library versions.
    // Prefer object form; if types/runtime don't support it, fall back to string.
    try {
      // @ts-expect-error: Some versions type the constructor as (apiKey: string)
      _client = new GoogleGenerativeAI({ apiKey: key });
    } catch {
      _client = new GoogleGenerativeAI(key);
    }
  }
  return _client;
}

export function getGeminiModel(model: string = "gemini-2.5-flash") {
  const client = getClient();
  return client.getGenerativeModel({ model });
}
