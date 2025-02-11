import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TranslationPair, TranslationScore, translationPracticeService } from '../../services/translationPractice';

interface TranslationState {
  currentPair: TranslationPair | null;
  userTranslation: string;
  feedback: string | null;
  startTime: number | null;
  correctTranslations: number;
  totalAttempts: number;
  scores: TranslationScore[];
  leaderboard: TranslationScore[];
  loading: boolean;
  error: string | null;
}

const initialState: TranslationState = {
  currentPair: null,
  userTranslation: '',
  feedback: null,
  startTime: null,
  correctTranslations: 0,
  totalAttempts: 0,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const generatePractice = createAsyncThunk(
  'translation/generatePractice',
  async ({
    bookId,
    difficulty,
    sourceLang,
    targetLang,
  }: {
    bookId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    sourceLang: string;
    targetLang: string;
  }) => {
    const pair = await translationPracticeService.generatePractice(
      bookId,
      difficulty,
      sourceLang,
      targetLang
    );
    return pair;
  }
);

export const checkTranslation = createAsyncThunk(
  'translation/checkTranslation',
  async ({
    pairId,
    userTranslation,
  }: {
    pairId: string;
    userTranslation: string;
  }) => {
    const result = await translationPracticeService.checkTranslation(
      pairId,
      userTranslation
    );
    return result;
  }
);

export const playAudio = createAsyncThunk(
  'translation/playAudio',
  async ({ text, lang }: { text: string; lang: string }) => {
    await translationPracticeService.playAudio(text, lang);
  }
);

export const saveScore = createAsyncThunk(
  'translation/saveScore',
  async (score: Omit<TranslationScore, 'id' | 'userId' | 'userName'>) => {
    await translationPracticeService.saveScore(score);
    return {
      ...score,
      id: '', // Will be set by Firebase
      userId: '', // Will be set by the service
      userName: '', // Will be set by the service
    } as TranslationScore;
  }
);

export const getLeaderboard = createAsyncThunk(
  'translation/getLeaderboard',
  async ({ bookId, difficulty }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard' }) => {
    const leaderboard = await translationPracticeService.getLeaderboard(bookId, difficulty);
    return leaderboard;
  }
);

const translationSlice = createSlice({
  name: 'translation',
  initialState,
  reducers: {
    updateUserTranslation: (state, action: PayloadAction<string>) => {
      state.userTranslation = action.payload;
    },
    clearFeedback: (state) => {
      state.feedback = null;
    },
    endPractice: (state) => {
      state.currentPair = null;
      state.userTranslation = '';
      state.feedback = null;
      state.startTime = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate practice
    builder
      .addCase(generatePractice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generatePractice.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPair = action.payload;
        state.userTranslation = '';
        state.feedback = null;
        state.startTime = Date.now();
      })
      .addCase(generatePractice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate practice';
      });

    // Check translation
    builder
      .addCase(checkTranslation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkTranslation.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = action.payload.feedback;
        if (action.payload.isCorrect) {
          state.correctTranslations++;
        }
        state.totalAttempts++;
      })
      .addCase(checkTranslation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check translation';
      });

    // Play audio
    builder
      .addCase(playAudio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(playAudio.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(playAudio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to play audio';
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
  updateUserTranslation,
  clearFeedback,
  endPractice,
  clearError,
} = translationSlice.actions;

export default translationSlice.reducer; 