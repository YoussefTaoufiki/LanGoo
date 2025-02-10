import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WordSearchPuzzle, WordSearchScore, wordSearchGameService } from '../../services/wordSearchGame';

interface WordSearchState {
  currentPuzzle: WordSearchPuzzle | null;
  foundWords: string[];
  startTime: number | null;
  scores: WordSearchScore[];
  leaderboard: WordSearchScore[];
  loading: boolean;
  error: string | null;
}

const initialState: WordSearchState = {
  currentPuzzle: null,
  foundWords: [],
  startTime: null,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const generatePuzzle = createAsyncThunk(
  'wordSearch/generatePuzzle',
  async ({ bookId, difficulty, wordCount }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard'; wordCount: number }) => {
    const puzzle = await wordSearchGameService.generatePuzzle(bookId, difficulty, wordCount);
    return puzzle;
  }
);

export const saveScore = createAsyncThunk(
  'wordSearch/saveScore',
  async (score: Omit<WordSearchScore, 'id' | 'userId'>) => {
    const savedScore = await wordSearchGameService.saveScore(score);
    return savedScore;
  }
);

export const getLeaderboard = createAsyncThunk(
  'wordSearch/getLeaderboard',
  async ({ bookId, difficulty, limit }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard'; limit?: number }) => {
    const leaderboard = await wordSearchGameService.getLeaderboard(bookId, difficulty, limit);
    return leaderboard;
  }
);

const wordSearchSlice = createSlice({
  name: 'wordSearch',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<WordSearchPuzzle>) => {
      state.currentPuzzle = action.payload;
      state.foundWords = [];
      state.startTime = Date.now();
      state.error = null;
    },
    findWord: (state, action: PayloadAction<string>) => {
      if (state.currentPuzzle && !state.foundWords.includes(action.payload)) {
        state.foundWords.push(action.payload);
      }
    },
    endGame: (state) => {
      state.currentPuzzle = null;
      state.startTime = null;
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
        state.foundWords = [];
        state.startTime = Date.now();
      })
      .addCase(generatePuzzle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate puzzle';
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
  findWord,
  endGame,
  clearError,
} = wordSearchSlice.actions;

export default wordSearchSlice.reducer; 