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
