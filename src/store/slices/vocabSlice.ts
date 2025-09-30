import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VocabEntry, VocabTopic } from "@/types";

export type VocabState = {
  topics: VocabTopic[];
  entries: VocabEntry[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
  flashcard: {
    start: number;
    end: number;
    index: number;
    order: number[];
    showAnswer: boolean;
  };
};

const initialState: VocabState = {
  topics: [],
  entries: [],
  status: "idle",
  flashcard: { start: 0, end: 49, index: 0, order: [], showAnswer: false },
};

export const loadVocab = createAsyncThunk("vocab/load", async () => {
  const res = await fetch("/mock/vocab.json");
  if (!res.ok) throw new Error("Failed to load vocab");
  return (await res.json()) as { topics: VocabTopic[]; entries: VocabEntry[] };
});

const vocabSlice = createSlice({
  name: "vocab",
  initialState,
  reducers: {
    setFlashcardSubset(state: VocabState, action: PayloadAction<number[]>) {
      const order = action.payload.filter(
        (i) => i >= 0 && i < state.entries.length
      );
      state.flashcard = {
        start: 0,
        end: Math.max(0, order.length - 1),
        index: 0,
        order,
        showAnswer: false,
      };
    },
    setFlashcardRange(
      state: VocabState,
      action: PayloadAction<{ start: number; end: number }>
    ) {
      const { start, end } = action.payload;
      state.flashcard.start = Math.max(
        0,
        Math.min(start, state.entries.length - 1)
      );
      state.flashcard.end = Math.max(
        state.flashcard.start,
        Math.min(end, state.entries.length - 1)
      );
      const arr = Array.from(
        { length: state.flashcard.end - state.flashcard.start + 1 },
        (_, i) => i + state.flashcard.start
      );
      state.flashcard.order = arr;
      state.flashcard.index = 0;
      state.flashcard.showAnswer = false;
    },
    shuffleFlashcards(state: VocabState) {
      for (let i = state.flashcard.order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.flashcard.order[i], state.flashcard.order[j]] = [
          state.flashcard.order[j],
          state.flashcard.order[i],
        ];
      }
      state.flashcard.index = 0;
      state.flashcard.showAnswer = false;
    },
    nextCard(state: VocabState) {
      state.flashcard.index =
        (state.flashcard.index + 1) % state.flashcard.order.length;
      state.flashcard.showAnswer = false;
    },
    prevCard(state: VocabState) {
      state.flashcard.index =
        (state.flashcard.index - 1 + state.flashcard.order.length) %
        state.flashcard.order.length;
      state.flashcard.showAnswer = false;
    },
    toggleAnswer(state: VocabState) {
      state.flashcard.showAnswer = !state.flashcard.showAnswer;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadVocab.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(
        loadVocab.fulfilled,
        (
          state,
          action: PayloadAction<{ topics: VocabTopic[]; entries: VocabEntry[] }>
        ) => {
          state.status = "succeeded";
          state.topics = action.payload.topics;
          state.entries = action.payload.entries;
          const end = Math.min(49, Math.max(0, state.entries.length - 1));
          const arr = Array.from({ length: end + 1 }, (_, i) => i);
          state.flashcard = {
            start: 0,
            end,
            index: 0,
            order: arr,
            showAnswer: false,
          };
        }
      )
      .addCase(loadVocab.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message;
      });
  },
});

export const {
  setFlashcardSubset,
  setFlashcardRange,
  shuffleFlashcards,
  nextCard,
  prevCard,
  toggleAnswer,
} = vocabSlice.actions;
export default vocabSlice.reducer;
