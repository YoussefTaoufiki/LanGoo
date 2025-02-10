import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WordPair, GameScore, LeaderboardEntry, wordGameService } from '../../services/wordGame';

interface WordGameState {
  wordPairs: WordPair[];
  currentGame: {
    pairs: WordPair[];
    matchedPairs: string[];
    startTime: number;
    mistakes: number;
  } | null;
  scores: GameScore[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: WordGameState = {
  wordPairs: [],
  currentGame: null,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const getWordPairs = createAsyncThunk(
  'wordGame/getWordPairs',
  async ({ bookId, difficulty, count }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard'; count: number }) => {
    const pairs = await wordGameService.getWordPairs(bookId, difficulty, count);
    return pairs;
  }
);

export const addWordPair = createAsyncThunk(
  'wordGame/addWordPair',
  async (wordPair: Omit<WordPair, 'id'>) => {
    const newPair = await wordGameService.addWordPair(wordPair);
    return newPair;
  }
);

export const saveScore = createAsyncThunk(
  'wordGame/saveScore',
  async (score: Omit<GameScore, 'id' | 'userId'>) => {
    const savedScore = await wordGameService.saveScore(score);
    return savedScore;
  }
);

export const getLeaderboard = createAsyncThunk(
  'wordGame/getLeaderboard',
  async ({ bookId, difficulty, limit }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard'; limit?: number }) => {
    const leaderboard = await wordGameService.getLeaderboard(bookId, difficulty, limit);
    return leaderboard;
  }
);

export const importFromAnnotations = createAsyncThunk(
  'wordGame/importFromAnnotations',
  async (bookId: string) => {
    const count = await wordGameService.importFromAnnotations(bookId);
    return count;
  }
);

const wordGameSlice = createSlice({
  name: 'wordGame',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<WordPair[]>) => {
      state.currentGame = {
        pairs: action.payload,
        matchedPairs: [],
        startTime: Date.now(),
        mistakes: 0,
      };
    },
    matchPair: (state, action: PayloadAction<string>) => {
      if (state.currentGame) {
        state.currentGame.matchedPairs.push(action.payload);
      }
    },
    incrementMistakes: (state) => {
      if (state.currentGame) {
        state.currentGame.mistakes++;
      }
    },
    endGame: (state) => {
      state.currentGame = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get word pairs
    builder
      .addCase(getWordPairs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWordPairs.fulfilled, (state, action) => {
        state.loading = false;
        state.wordPairs = action.payload;
      })
      .addCase(getWordPairs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get word pairs';
      });

    // Add word pair
    builder
      .addCase(addWordPair.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWordPair.fulfilled, (state, action) => {
        state.loading = false;
        state.wordPairs.push(action.payload);
      })
      .addCase(addWordPair.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add word pair';
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

    // Import from annotations
    builder
      .addCase(importFromAnnotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importFromAnnotations.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(importFromAnnotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to import from annotations';
      });
  },
});

export const {
  startGame,
  matchPair,
  incrementMistakes,
  endGame,
  clearError,
} = wordGameSlice.actions;

export default wordGameSlice.reducer; 