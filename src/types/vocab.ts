import type { Level, PartOfSpeech } from "./common";

export type Example = { en: string; vi: string };
export type KnowledgeState = "unknown" | "learning" | "known";

export type VocabTopic = {
  id: string;
  name: string;
  level: Level | "Mixed";
};

export type VocabEntry = {
  id: string;
  word: string;
  phonetic?: string;
  pos?: PartOfSpeech | string; // part of speech (loại từ)
  meaningVi: string;
  topicId: string;
  level: Level;
  examples?: Array<Example>;
};
