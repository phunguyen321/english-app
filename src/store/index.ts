import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import vocabReducer from "./slices/vocabSlice";
import grammarReducer from "./slices/grammarSlice";
import quizReducer from "./slices/quizSlice";

export const store = configureStore({
  reducer: {
    vocab: vocabReducer,
    grammar: grammarReducer,
    quiz: quizReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
