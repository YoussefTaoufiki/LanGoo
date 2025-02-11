import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MultipleChoiceQuestion, MultipleChoiceScore, multipleChoiceGameService } from '../../services/multipleChoiceGame';

interface MultipleChoiceState {
  questions: MultipleChoiceQuestion[];
  currentQuestionIndex: number;
  answers: (string | null)[];
  startTime: number | null;
  correctAnswers: number;
  scores: MultipleChoiceScore[];
  leaderboard: MultipleChoiceScore[];
  loading: boolean;
  error: string | null;
}

const initialState: MultipleChoiceState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  startTime: null,
  correctAnswers: 0,
  scores: [],
  leaderboard: [],
  loading: false,
  error: null,
};

export const generateQuestions = createAsyncThunk(
  'multipleChoice/generateQuestions',
  async ({
    bookId,
    difficulty,
    count,
  }: {
    bookId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    count?: number;
  }) => {
    const questions = await multipleChoiceGameService.generateQuestions(
      bookId,
      difficulty,
      count
    );
    return questions;
  }
);

export const checkAnswer = createAsyncThunk(
  'multipleChoice/checkAnswer',
  async ({
    questionId,
    answer,
  }: {
    questionId: string;
    answer: string;
  }) => {
    const result = await multipleChoiceGameService.checkAnswer(questionId, answer);
    return result;
  }
);

export const saveScore = createAsyncThunk(
  'multipleChoice/saveScore',
  async (score: Omit<MultipleChoiceScore, 'id' | 'userId' | 'userName'>) => {
    const savedScore = await multipleChoiceGameService.submitScore(score);
    return savedScore;
  }
);

export const getLeaderboard = createAsyncThunk(
  'multipleChoice/getLeaderboard',
  async ({ bookId, difficulty }: { bookId: string; difficulty: 'easy' | 'medium' | 'hard' }) => {
    const leaderboard = await multipleChoiceGameService.getLeaderboard(bookId, difficulty);
    return leaderboard;
  }
);

const multipleChoiceSlice = createSlice({
  name: 'multipleChoice',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<MultipleChoiceQuestion[]>) => {
      state.questions = action.payload;
      state.currentQuestionIndex = 0;
      state.answers = new Array(action.payload.length).fill(null);
      state.startTime = Date.now();
      state.correctAnswers = 0;
      state.error = null;
    },
    setAnswer: (state, action: PayloadAction<{ index: number; answer: string }>) => {
      const { index, answer } = action.payload;
      if (state.answers[index] === undefined) return;
      state.answers[index] = answer;
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
      }
    },
    endGame: (state) => {
      state.questions = [];
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.startTime = null;
      state.correctAnswers = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate questions
    builder
      .addCase(generateQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload;
        state.answers = new Array(action.payload.length).fill(null);
        state.startTime = Date.now();
        state.correctAnswers = 0;
      })
      .addCase(generateQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate questions';
      });

    // Check answer
    builder
      .addCase(checkAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAnswer.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isCorrect) {
          state.correctAnswers++;
        }
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
  setAnswer,
  nextQuestion,
  previousQuestion,
  endGame,
  clearError,
} = multipleChoiceSlice.actions;

export default multipleChoiceSlice.reducer; 