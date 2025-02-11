import { configureStore } from '@reduxjs/toolkit';
import focusReducer from './slices/focusSlice';
import multipleChoiceReducer from './slices/multipleChoiceSlice';
import vocabularyReducer from './slices/vocabularySlice';

export const store = configureStore({
  reducer: {
    focus: focusReducer,
    multipleChoice: multipleChoiceReducer,
    vocabulary: vocabularyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 