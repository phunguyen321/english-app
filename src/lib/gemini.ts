import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to ensure API key exists and we only create one instance.
let _modelFactory: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  console.log("Using Gemini API key:", key);
  if (!key) {
    throw new Error(
      "Missing GEMINI_API_KEY (hoặc GOOGLE_GEMINI_API_KEY) trong biến môi trường."
    );
  }
  if (!_modelFactory) {
    _modelFactory = new GoogleGenerativeAI(key);
  }
  return _modelFactory;
}

export function getGeminiModel(model: string = "gemini-2.5-flash") {
  const client = getClient();
  return client.getGenerativeModel({ model });
}
