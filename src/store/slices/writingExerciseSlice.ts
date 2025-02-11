import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  WritingPrompt,
  WritingSubmission,
  WritingScore,
  writingExerciseService,
} from '../../services/writingExerciseGame';

interface WritingExerciseState {
  currentPrompt: WritingPrompt | null;
  currentContent: string;
  startTime: number | null;
  submission: WritingSubmission | null;
  scores: WritingScore[];
  leaderboard: WritingScore[];
  loading: boolean;
  error: string | null;
}

const initialState: WritingExerciseState = {
  currentPrompt: null,
  currentContent: '',
  startTime: null,
  submission: null,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const generatePrompt = createAsyncThunk(
  'writingExercise/generatePrompt',
  async ({
    bookId,
    difficulty,
    category,
  }: {
    bookId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category?: string;
  }) => {
    const prompt = await writingExerciseService.generatePrompt(
      bookId,
      difficulty,
      category
    );
    return prompt;
  }
);

export const submitWriting = createAsyncThunk(
  'writingExercise/submitWriting',
  async ({
    promptId,
    content,
  }: {
    promptId: string;
    content: string;
  }) => {
    const submission = await writingExerciseService.submitWriting(promptId, content);
    const score = await writingExerciseService.updateScore(submission);
    return { submission, score };
  }
);

export const getLeaderboard = createAsyncThunk(
  'writingExercise/getLeaderboard',
  async ({
    bookId,
    difficulty,
  }: {
    bookId: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    const leaderboard = await writingExerciseService.getLeaderboard(bookId, difficulty);
    return leaderboard;
  }
);

const writingExerciseSlice = createSlice({
  name: 'writingExercise',
  initialState,
  reducers: {
    updateContent: (state, action: PayloadAction<string>) => {
      state.currentContent = action.payload;
    },
    startExercise: (state, action: PayloadAction<WritingPrompt>) => {
      state.currentPrompt = action.payload;
      state.currentContent = '';
      state.startTime = Date.now();
      state.submission = null;
      state.error = null;
    },
    endExercise: (state) => {
      state.currentPrompt = null;
      state.currentContent = '';
      state.startTime = null;
      state.submission = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate prompt
    builder
      .addCase(generatePrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generatePrompt.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPrompt = action.payload;
        state.currentContent = '';
        state.startTime = Date.now();
      })
      .addCase(generatePrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate prompt';
      });

    // Submit writing
    builder
      .addCase(submitWriting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitWriting.fulfilled, (state, action) => {
        state.loading = false;
        state.submission = action.payload.submission;
        state.scores.push(action.payload.score);
      })
      .addCase(submitWriting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit writing';
      });

    // Get leaderboard
    builder
      .addCase(getLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.leaderboard = action.payload;
      })
      .addCase(getLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get leaderboard';
      });
  },
});

export const {
  updateContent,
  startExercise,
  endExercise,
  clearError,
} = writingExerciseSlice.actions;

export default writingExerciseSlice.reducer; 