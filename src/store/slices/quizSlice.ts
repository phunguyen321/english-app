import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AnyQuizQuestion } from "@/types";

type QuizState = {
  questions: AnyQuizQuestion[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
  userAnswers: Record<string, number | string | string[]>; // id -> answer
  source?: "static" | "ai"; // nguồn dữ liệu câu hỏi
  result?: {
    correct: number;
    total: number;
    details: Array<{
      id: string;
      correct: boolean;
      explanation: string;
    }>;
  };
};

const initialState: QuizState = {
  questions: [],
  status: "idle",
  userAnswers: {},
};

export const loadQuizzes = createAsyncThunk("quiz/load", async () => {
  const res = await fetch("/mock/quizzes.json");
  if (!res.ok) throw new Error("Failed to load quizzes");
  return (await res.json()) as AnyQuizQuestion[];
});

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setQuestions(
      state,
      action: PayloadAction<{
        questions: AnyQuizQuestion[];
        source?: "static" | "ai";
      }>
    ) {
      state.questions = action.payload.questions;
      state.status = "succeeded";
      state.source = action.payload.source || "static";
      state.userAnswers = {};
      state.result = undefined;
    },
    answerQuestion(
      state,
      action: PayloadAction<{ id: string; answer: number | string | string[] }>
    ) {
      const { id, answer } = action.payload;
      state.userAnswers[id] = answer;
    },
    submit(state: QuizState) {
      let correct = 0;
      const details: Array<{
        id: string;
        correct: boolean;
        explanation: string;
      }> = [];
      for (const q of state.questions) {
        let isCorrect = false;
        if (q.type === "vocab-mcq" || q.type === "grammar-mcq") {
          const a = state.userAnswers[q.id];
          isCorrect = typeof a === "number" && a === q.answerIndex;
        } else if (q.type === "sentence-order") {
          const a = state.userAnswers[q.id];
          const text = Array.isArray(a)
            ? (a as string[]).join(" ")
            : String(a || "");
          isCorrect = text.trim() === q.answer.trim();
        }
        if (isCorrect) correct++;
        details.push({
          id: q.id,
          correct: isCorrect,
          explanation: q.explanation,
        });
      }
      state.result = { correct, total: state.questions.length, details };
    },
    reset(state: QuizState) {
      state.userAnswers = {};
      state.result = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadQuizzes.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(
        loadQuizzes.fulfilled,
        (state, action: PayloadAction<AnyQuizQuestion[]>) => {
          state.status = "succeeded";
          state.questions = action.payload;
          state.source = "static";
        }
      )
      .addCase(loadQuizzes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { answerQuestion, submit, reset, setQuestions } =
  quizSlice.actions;
export default quizSlice.reducer;
