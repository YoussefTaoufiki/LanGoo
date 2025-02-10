import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Chapter, ReadingProgress, navigationService } from '../../services/navigation';

interface NavigationState {
  chapters: Record<string, Chapter[]>; // bookId -> chapters
  progress: Record<string, ReadingProgress>; // bookId -> progress
  loading: boolean;
  error: string | null;
  currentChapter: Chapter | null;
}

const initialState: NavigationState = {
  chapters: {},
  progress: {},
  loading: false,
  error: null,
  currentChapter: null,
};

// Async thunks
export const fetchChapters = createAsyncThunk(
  'navigation/fetchChapters',
  async (bookId: string) => {
    const chapters = await navigationService.getChapters(bookId);
    return { bookId, chapters };
  }
);

export const saveChapters = createAsyncThunk(
  'navigation/saveChapters',
  async ({ bookId, chapters }: { bookId: string; chapters: Omit<Chapter, 'id'>[] }) => {
    await navigationService.saveChapters(bookId, chapters);
    return { bookId, chapters };
  }
);

export const fetchReadingProgress = createAsyncThunk(
  'navigation/fetchReadingProgress',
  async (bookId: string) => {
    const progress = await navigationService.getReadingProgress(bookId);
    return { bookId, progress };
  }
);

export const updateReadingProgress = createAsyncThunk(
  'navigation/updateReadingProgress',
  async ({ bookId, data }: { bookId: string; data: Partial<Omit<ReadingProgress, 'id' | 'userId' | 'bookId'>> }) => {
    await navigationService.updateReadingProgress(bookId, data);
    return { bookId, data };
  }
);

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setCurrentChapter: (state, action: PayloadAction<Chapter | null>) => {
      state.currentChapter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chapters
      .addCase(fetchChapters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChapters.fulfilled, (state, action) => {
        const { bookId, chapters } = action.payload;
        state.chapters[bookId] = chapters;
        state.loading = false;
      })
      .addCase(fetchChapters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch chapters';
      })

      // Save chapters
      .addCase(saveChapters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveChapters.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(saveChapters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save chapters';
      })

      // Fetch reading progress
      .addCase(fetchReadingProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReadingProgress.fulfilled, (state, action) => {
        const { bookId, progress } = action.payload;
        if (progress) {
          state.progress[bookId] = progress;
        }
        state.loading = false;
      })
      .addCase(fetchReadingProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch reading progress';
      })

      // Update reading progress
      .addCase(updateReadingProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReadingProgress.fulfilled, (state, action) => {
        const { bookId, data } = action.payload;
        if (state.progress[bookId]) {
          state.progress[bookId] = {
            ...state.progress[bookId],
            ...data,
            lastRead: Date.now(),
          };
        }
        state.loading = false;
      })
      .addCase(updateReadingProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update reading progress';
      });
  },
});

export const { setCurrentChapter, clearError } = navigationSlice.actions;

export default navigationSlice.reducer; 