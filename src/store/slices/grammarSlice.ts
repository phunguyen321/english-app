import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GrammarTopic } from "@/types/grammar";
import AppAPI from "@/lib/api";

type GrammarState = {
  topics: GrammarTopic[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
};

const initialState: GrammarState = { topics: [], status: "idle" };

export const loadGrammar = createAsyncThunk("grammar/load", async () => {
  return await AppAPI.getGrammar();
});

const grammarSlice = createSlice({
  name: "grammar",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadGrammar.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(
        loadGrammar.fulfilled,
        (state, action: PayloadAction<GrammarTopic[]>) => {
          state.status = "succeeded";
          state.topics = action.payload;
        }
      )
      .addCase(loadGrammar.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default grammarSlice.reducer;
