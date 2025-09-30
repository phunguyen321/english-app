import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { GrammarTopic } from "@/types";

type GrammarState = {
  topics: GrammarTopic[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
};

const initialState: GrammarState = { topics: [], status: "idle" };

export const loadGrammar = createAsyncThunk("grammar/load", async () => {
  const res = await fetch("/mock/grammar.json");
  if (!res.ok) throw new Error("Failed to load grammar");
  return (await res.json()) as GrammarTopic[];
});

const grammarSlice = createSlice({
  name: "grammar",
  initialState,
  reducers: {},
  extraReducers: (builder: any) => {
    builder
      .addCase(loadGrammar.pending, (state: GrammarState) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(loadGrammar.fulfilled, (state: GrammarState, action: any) => {
        state.status = "succeeded";
        state.topics = action.payload as GrammarTopic[];
      })
      .addCase(loadGrammar.rejected, (state: GrammarState, action: any) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default grammarSlice.reducer;
