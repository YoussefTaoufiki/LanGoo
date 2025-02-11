import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  SpeakingPrompt,
  SpeakingSubmission,
  SpeakingScore,
  speakingPracticeService,
} from '../../services/speakingPracticeGame';

interface SpeakingPracticeState {
  currentPrompt: SpeakingPrompt | null;
  isRecording: boolean;
  recordingDuration: number;
  audioUrl: string | null;
  submission: SpeakingSubmission | null;
  scores: SpeakingScore[];
  leaderboard: SpeakingScore[];
  loading: boolean;
  error: string | null;
}

const initialState: SpeakingPracticeState = {
  currentPrompt: null,
  isRecording: false,
  recordingDuration: 0,
  audioUrl: null,
  submission: null,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const generatePrompt = createAsyncThunk(
  'speakingPractice/generatePrompt',
  async ({
    bookId,
    difficulty,
    language,
    category,
  }: {
    bookId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: string;
    category?: string;
  }) => {
    const prompt = await speakingPracticeService.generatePrompt(
      bookId,
      difficulty,
      language,
      category
    );
    return prompt;
  }
);

export const playPrompt = createAsyncThunk(
  'speakingPractice/playPrompt',
  async ({
    text,
    language,
    speed,
  }: {
    text: string;
    language: string;
    speed?: number;
  }) => {
    await speakingPracticeService.playPrompt(text, language, speed);
  }
);

export const submitRecording = createAsyncThunk(
  'speakingPractice/submitRecording',
  async ({
    promptId,
    audioUrl,
    duration,
  }: {
    promptId: string;
    audioUrl: string;
    duration: number;
  }) => {
    const submission = await speakingPracticeService.submitRecording(
      promptId,
      audioUrl,
      duration
    );
    const score = await speakingPracticeService.updateScore(submission);
    return { submission, score };
  }
);

export const getLeaderboard = createAsyncThunk(
  'speakingPractice/getLeaderboard',
  async ({
    bookId,
    difficulty,
  }: {
    bookId: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    const leaderboard = await speakingPracticeService.getLeaderboard(
      bookId,
      difficulty
    );
    return leaderboard;
  }
);

const speakingPracticeSlice = createSlice({
  name: 'speakingPractice',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
      state.recordingDuration = 0;
      state.audioUrl = null;
      state.error = null;
    },
    stopRecording: (state, action: PayloadAction<{ audioUrl: string; duration: number }>) => {
      state.isRecording = false;
      state.audioUrl = action.payload.audioUrl;
      state.recordingDuration = action.payload.duration;
    },
    updateRecordingDuration: (state, action: PayloadAction<number>) => {
      state.recordingDuration = action.payload;
    },
    clearRecording: (state) => {
      state.audioUrl = null;
      state.recordingDuration = 0;
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
        state.audioUrl = null;
        state.recordingDuration = 0;
      })
      .addCase(generatePrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate prompt';
      });

    // Play prompt
    builder
      .addCase(playPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(playPrompt.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(playPrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to play prompt';
      });

    // Submit recording
    builder
      .addCase(submitRecording.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitRecording.fulfilled, (state, action) => {
        state.loading = false;
        state.submission = action.payload.submission;
        state.scores.push(action.payload.score);
      })
      .addCase(submitRecording.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit recording';
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
  startRecording,
  stopRecording,
  updateRecordingDuration,
  clearRecording,
  clearError,
} = speakingPracticeSlice.actions;

export default speakingPracticeSlice.reducer; 