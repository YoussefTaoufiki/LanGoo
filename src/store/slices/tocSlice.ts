import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tocService, TocEntry, TocMetadata } from '../../services/toc';

interface TocState {
  entries: TocEntry[];
  metadata: TocMetadata | null;
  loading: boolean;
  error: string | null;
  selectedEntry: TocEntry | null;
}

const initialState: TocState = {
  entries: [],
  metadata: null,
  loading: false,
  error: null,
  selectedEntry: null,
};

export const generateToc = createAsyncThunk(
  'toc/generateToc',
  async ({ bookId, epubContent }: { bookId: string; epubContent: any }) => {
    const entries = await tocService.generateToc(bookId, epubContent);
    return entries;
  }
);

export const getToc = createAsyncThunk(
  'toc/getToc',
  async (bookId: string) => {
    const entries = await tocService.getToc(bookId);
    return entries;
  }
);

export const getTocMetadata = createAsyncThunk(
  'toc/getTocMetadata',
  async (bookId: string) => {
    const metadata = await tocService.getTocMetadata(bookId);
    return metadata;
  }
);

export const updateTocEntry = createAsyncThunk(
  'toc/updateTocEntry',
  async ({ id, data }: { id: string; data: Partial<TocEntry> }) => {
    await tocService.updateTocEntry(id, data);
    return { id, data };
  }
);

const tocSlice = createSlice({
  name: 'toc',
  initialState,
  reducers: {
    setSelectedEntry: (state, action: PayloadAction<TocEntry | null>) => {
      state.selectedEntry = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate TOC
    builder
      .addCase(generateToc.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateToc.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(generateToc.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate table of contents';
      });

    // Get TOC
    builder
      .addCase(getToc.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getToc.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(getToc.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get table of contents';
      });

    // Get TOC metadata
    builder
      .addCase(getTocMetadata.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTocMetadata.fulfilled, (state, action) => {
        state.loading = false;
        state.metadata = action.payload;
      })
      .addCase(getTocMetadata.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get TOC metadata';
      });

    // Update TOC entry
    builder
      .addCase(updateTocEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTocEntry.fulfilled, (state, action) => {
        state.loading = false;
        const { id, data } = action.payload;
        const index = state.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
          state.entries[index] = { ...state.entries[index], ...data };
        }
      })
      .addCase(updateTocEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update TOC entry';
      });
  },
});

export const { setSelectedEntry, clearError } = tocSlice.actions;
export default tocSlice.reducer; 