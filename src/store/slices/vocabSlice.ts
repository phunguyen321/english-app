import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VocabEntry, VocabTopic } from "@/types/vocab";
import AppAPI from "@/lib/api";

export type VocabState = {
  topics: VocabTopic[];
  entries: VocabEntry[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
  // separate order for vocabulary list view
  listOrder: number[];
  flashcard: {
    start: number;
    end: number;
    index: number;
    order: number[];
    showAnswer: boolean;
  };
  // track user's familiarity with a vocab entry: "unknown" | "learning" | "known"
  knowledge: Record<string, "unknown" | "learning" | "known">;
};

const initialState: VocabState = {
  topics: [],
  entries: [],
  status: "idle",
  listOrder: [],
  flashcard: { start: 0, end: 49, index: 0, order: [], showAnswer: false },
  knowledge: {},
};

export const loadVocab = createAsyncThunk("vocab/load", async () => {
  return await AppAPI.getVocab();
});

const vocabSlice = createSlice({
  name: "vocab",
  initialState,
  reducers: {
    setListOrder(state: VocabState, action: PayloadAction<number[]>) {
      const order = action.payload.filter(
        (i) => i >= 0 && i < state.entries.length
      );
      state.listOrder = order;
    },
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
    setFlashcardOrder(
      state: VocabState,
      action: PayloadAction<{ order: number[]; index?: number }>
    ) {
      const order = action.payload.order.filter(
        (i) => i >= 0 && i < state.entries.length
      );
      // Try to keep the same current entry if index isn't provided
      const currentEntryIdx = state.flashcard.order[state.flashcard.index];
      let nextIndex = 0;
      if (typeof action.payload.index === "number") {
        nextIndex = Math.max(
          0,
          Math.min(action.payload.index, Math.max(0, order.length - 1))
        );
      } else if (order.length) {
        const pos = order.indexOf(currentEntryIdx);
        nextIndex = pos >= 0 ? pos : 0;
      }
      state.flashcard = {
        start: 0,
        end: Math.max(0, order.length - 1),
        index: nextIndex,
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
    shuffleList(state: VocabState) {
      const arr = [...state.listOrder];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      state.listOrder = arr;
    },
    shuffleRemaining(state: VocabState) {
      const idx = Math.max(
        0,
        Math.min(
          state.flashcard.index,
          Math.max(0, state.flashcard.order.length - 1)
        )
      );
      const prefix = state.flashcard.order.slice(0, idx + 1);
      const rest = state.flashcard.order.slice(idx + 1);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      state.flashcard.order = prefix.concat(rest);
      state.flashcard.showAnswer = false;
    },
    // Shuffle the current card and the remaining ones, keeping index the same
    shuffleFromCurrent(state: VocabState) {
      const idx = Math.max(
        0,
        Math.min(
          state.flashcard.index,
          Math.max(0, state.flashcard.order.length - 1)
        )
      );
      const head = state.flashcard.order.slice(0, idx);
      const tail = state.flashcard.order.slice(idx);
      for (let i = tail.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tail[i], tail[j]] = [tail[j], tail[i]];
      }
      state.flashcard.order = head.concat(tail);
      // Keep index pointing to the same position (now a possibly different card)
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
    markKnown(state: VocabState, action: PayloadAction<string>) {
      state.knowledge[action.payload] = "known";
    },
    markLearning(state: VocabState, action: PayloadAction<string>) {
      state.knowledge[action.payload] = "learning";
    },
    markUnknown(state: VocabState, action: PayloadAction<string>) {
      state.knowledge[action.payload] = "unknown";
    },
    loadKnowledge(
      state: VocabState,
      action: PayloadAction<Record<string, "unknown" | "learning" | "known">>
    ) {
      state.knowledge = action.payload || {};
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
          // Initialize knowledge map entries if missing
          for (const e of state.entries) {
            if (!state.knowledge[e.id]) state.knowledge[e.id] = "unknown";
          }
          const end = Math.min(49, Math.max(0, state.entries.length - 1));
          const arr = Array.from({ length: end + 1 }, (_, i) => i);
          state.listOrder = arr; // list view starts in natural order
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
  setListOrder,
  setFlashcardSubset,
  setFlashcardRange,
  setFlashcardOrder,
  shuffleFlashcards,
  shuffleList,
  shuffleRemaining,
  nextCard,
  prevCard,
  toggleAnswer,
  markKnown,
  markLearning,
  markUnknown,
  loadKnowledge,
  shuffleFromCurrent,
} = vocabSlice.actions;
export default vocabSlice.reducer;
