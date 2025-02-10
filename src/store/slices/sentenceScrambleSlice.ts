import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SentenceScramblePuzzle, SentenceScrambleScore, sentenceScrambleGameService } from '../../services/sentenceScrambleGame';

interface SentenceScrambleState {
  currentPuzzle: SentenceScramblePuzzle | null;
  currentArrangement: string[];
  startTime: number | null;
  mistakeCount: number;
  hint: string | null;
  scores: SentenceScrambleScore[];
  leaderboard: SentenceScrambleScore[];
  loading: boolean;
  error: string | null;
}

const initialState: SentenceScrambleState = {
  currentPuzzle: null,
  currentArrangement: [],
  startTime: null,
  mistakeCount: 0,
  hint: null,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const generatePuzzle = createAsyncThunk(
  'sentenceScramble/generatePuzzle',
  async ({ bookId, difficulty }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard' }) => {
    const puzzle = await sentenceScrambleGameService.generatePuzzle(bookId, difficulty);
    return puzzle;
  }
);

export const checkSolution = createAsyncThunk(
  'sentenceScramble/checkSolution',
  async ({ puzzleId, solution }: { puzzleId: string; solution: string[] }) => {
    const isCorrect = await sentenceScrambleGameService.checkSolution(puzzleId, solution);
    return isCorrect;
  }
);

export const getHint = createAsyncThunk(
  'sentenceScramble/getHint',
  async (puzzleId: string) => {
    const hint = await sentenceScrambleGameService.getHint(puzzleId);
    return hint;
  }
);

export const saveScore = createAsyncThunk(
  'sentenceScramble/saveScore',
  async (score: Omit<SentenceScrambleScore, 'id' | 'userId'>) => {
    const savedScore = await sentenceScrambleGameService.saveScore(score);
    return savedScore;
  }
);

export const getLeaderboard = createAsyncThunk(
  'sentenceScramble/getLeaderboard',
  async ({ bookId, difficulty, limit }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard'; limit?: number }) => {
    const leaderboard = await sentenceScrambleGameService.getLeaderboard(bookId, difficulty, limit);
    return leaderboard;
  }
);

const sentenceScrambleSlice = createSlice({
  name: 'sentenceScramble',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<SentenceScramblePuzzle>) => {
      state.currentPuzzle = action.payload;
      state.currentArrangement = [...action.payload.scrambledWords];
      state.startTime = Date.now();
      state.mistakeCount = 0;
      state.hint = null;
      state.error = null;
    },
    updateArrangement: (state, action: PayloadAction<string[]>) => {
      state.currentArrangement = action.payload;
    },
    incrementMistakes: (state) => {
      state.mistakeCount++;
    },
    endGame: (state) => {
      state.currentPuzzle = null;
      state.currentArrangement = [];
      state.startTime = null;
      state.hint = null;
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
        state.currentArrangement = [...action.payload.scrambledWords];
        state.startTime = Date.now();
        state.mistakeCount = 0;
        state.hint = null;
      })
      .addCase(generatePuzzle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate puzzle';
      });

    // Check solution
    builder
      .addCase(checkSolution.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkSolution.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(checkSolution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check solution';
      });

    // Get hint
    builder
      .addCase(getHint.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHint.fulfilled, (state, action) => {
        state.loading = false;
        state.hint = action.payload;
      })
      .addCase(getHint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get hint';
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
  updateArrangement,
  incrementMistakes,
  endGame,
  clearError,
} = sentenceScrambleSlice.actions;

export default sentenceScrambleSlice.reducer; 