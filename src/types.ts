export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type VocabTopic = {
  id: string;
  name: string;
  level: Level | "Mixed";
};

// Chuẩn rút gọn: n (noun), v (verb), adj, adv, pron (pronoun),
// det (determiner/article), num (number), prep (preposition),
// conj (conjunction), interj (interjection), phrase, pv (phrasal verb)
export type PartOfSpeech =
  | "n"
  | "v"
  | "adj"
  | "adv"
  | "pron"
  | "det"
  | "num"
  | "prep"
  | "conj"
  | "interj"
  | "phrase"
  | "pv";

export type VocabEntry = {
  id: string;
  word: string;
  phonetic?: string;
  pos?: PartOfSpeech | string; // part of speech (loại từ)
  meaningVi: string;
  topicId: string;
  level: Level;
  examples?: Array<{ en: string; vi: string }>;
};

export type GrammarTopic = {
  id: string;
  title: string;
  category: string; // e.g., Tenses, Modals, Structure
  brief: string;
  points: Array<{
    rule: string;
    example: { en: string; vi: string };
  }>;
};

export type QuizType = "vocab-mcq" | "grammar-mcq" | "sentence-order";
export type Difficulty = "easy" | "medium" | "hard";

export type QuizQuestionBase = {
  id: string;
  type: QuizType;
  difficulty: Difficulty;
  explanation: string;
};

export type VocabMcqQuestion = QuizQuestionBase & {
  type: "vocab-mcq";
  prompt: string; // word or meaning
  options: string[];
  answerIndex: number;
};

export type GrammarMcqQuestion = QuizQuestionBase & {
  type: "grammar-mcq";
  prompt: string;
  options: string[];
  answerIndex: number;
};

export type SentenceOrderQuestion = QuizQuestionBase & {
  type: "sentence-order";
  tokens: string[];
  answer: string; // full sentence
};

export type AnyQuizQuestion =
  | VocabMcqQuestion
  | GrammarMcqQuestion
  | SentenceOrderQuestion;
