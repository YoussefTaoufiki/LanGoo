import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FillInBlanksPuzzle, FillInBlanksScore, fillInBlanksGameService } from '../../services/fillInBlanksGame';

interface FillInBlanksState {
  currentPuzzle: FillInBlanksPuzzle | null;
  answers: string[];
  startTime: number | null;
  correctAnswers: number;
  scores: FillInBlanksScore[];
  leaderboard: FillInBlanksScore[];
  loading: boolean;
  error: string | null;
}

const initialState: FillInBlanksState = {
  currentPuzzle: null,
  answers: [],
  startTime: null,
  correctAnswers: 0,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const generatePuzzle = createAsyncThunk(
  'fillInBlanks/generatePuzzle',
  async ({ bookId, difficulty }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard' }) => {
    const puzzle = await fillInBlanksGameService.generatePuzzle(bookId, difficulty);
    return puzzle;
  }
);

export const checkAnswer = createAsyncThunk(
  'fillInBlanks/checkAnswer',
  async ({ puzzleId, answers }: { puzzleId: string; answers: string[] }) => {
    const results = await fillInBlanksGameService.checkAnswer(puzzleId, answers);
    return results;
  }
);

export const saveScore = createAsyncThunk(
  'fillInBlanks/saveScore',
  async (score: Omit<FillInBlanksScore, 'id' | 'userId'>) => {
    const savedScore = await fillInBlanksGameService.saveScore(score);
    return savedScore;
  }
);

export const getLeaderboard = createAsyncThunk(
  'fillInBlanks/getLeaderboard',
  async ({ bookId, difficulty, limit }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard'; limit?: number }) => {
    const leaderboard = await fillInBlanksGameService.getLeaderboard(bookId, difficulty, limit);
    return leaderboard;
  }
);

const fillInBlanksSlice = createSlice({
  name: 'fillInBlanks',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<FillInBlanksPuzzle>) => {
      state.currentPuzzle = action.payload;
      state.answers = Array(action.payload.blankedWords.length).fill('');
      state.startTime = Date.now();
      state.correctAnswers = 0;
      state.error = null;
    },
    updateAnswer: (state, action: PayloadAction<{ index: number; answer: string }>) => {
      const { index, answer } = action.payload;
      if (state.answers[index] !== undefined) {
        state.answers[index] = answer;
      }
    },
    endGame: (state) => {
      state.currentPuzzle = null;
      state.answers = [];
      state.startTime = null;
      state.correctAnswers = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate puzzle
    builder
      .addCase(generatePuzzle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generatePuzzle.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPuzzle = action.payload;
        state.answers = Array(action.payload.blankedWords.length).fill('');
        state.startTime = Date.now();
        state.correctAnswers = 0;
      })
      .addCase(generatePuzzle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate puzzle';
      });

    // Check answer
    builder
      .addCase(checkAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAnswer.fulfilled, (state, action) => {
        state.loading = false;
        state.correctAnswers = action.payload.filter(Boolean).length;
      })
      .addCase(checkAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check answer';
      });

    // Save score
    builder
      .addCase(saveScore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveScore.fulfilled, (state, action) => {
        state.loading = false;
        state.scores.push(action.payload);
      })
      .addCase(saveScore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save score';
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
  startGame,
  updateAnswer,
  endGame,
  clearError,
} = fillInBlanksSlice.actions;

export default fillInBlanksSlice.reducer; 