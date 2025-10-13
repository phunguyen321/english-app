import api from "./axios";
import type { VocabEntry, VocabTopic } from "@/types/vocab";
import type { GrammarTopic } from "@/types/grammar";
import type { AnyQuizQuestion } from "@/types/quiz";
import type { ChatMessage } from "@/types/chat";

export const AppAPI = {
  // Mock data loaders
  getVocab: async () => {
    const res = await api.get<{ topics: VocabTopic[]; entries: VocabEntry[] }>(
      "/mock/vocab.json"
    );
    return res.data;
  },
  getGrammar: async () => {
    const res = await api.get<GrammarTopic[]>("/mock/grammar.json");
    return res.data;
  },
  getQuizzes: async () => {
    const res = await api.get<AnyQuizQuestion[]>("/mock/quizzes.json");
    return res.data;
  },
  getIrregularVerbs: async () => {
    const res = await api.get<
      Array<{
        base: string;
        past: string;
        pp: string;
        meaning?: string;
        phonetic?: string;
      }>
    >("/mock/irregular-verbs.json");
    return res.data;
  },

  // AI endpoints
  chat: async (messages: ChatMessage[]) => {
    const res = await api.post<{
      success: boolean;
      error?: string;
      data: { text: string };
    }>("/api/ai/chat", { messages });
    return res.data;
  },
  generateQuiz: async (payload: {
    requirements: string;
    count?: number;
    mixTypes?: boolean;
    allowedTypes?: string[];
    typeRatios?: Record<string, number>;
  }) => {
    const res = await api.post<{
      success: boolean;
      error?: string;
      data: AnyQuizQuestion[];
    }>("/api/ai/generate-quiz", payload);
    return res.data;
  },
};

export default AppAPI;
