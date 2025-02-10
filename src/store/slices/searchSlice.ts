import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { searchService, SearchResult, SearchHistory } from '../../services/search';

interface SearchState {
  results: SearchResult[];
  history: SearchHistory[];
  loading: boolean;
  error: string | null;
  query: string;
}

const initialState: SearchState = {
  results: [],
  history: [],
  loading: false,
  error: null,
  query: '',
};

export const searchInBook = createAsyncThunk(
  'search/searchInBook',
  async ({ bookId, query }: { bookId: string; query: string }) => {
    const results = await searchService.searchInBook(bookId, query);
    return results;
  }
);

export const getSearchHistory = createAsyncThunk(
  'search/getSearchHistory',
  async (bookId: string) => {
    const history = await searchService.getSearchHistory(bookId);
    return history;
  }
);

export const clearSearchHistory = createAsyncThunk(
  'search/clearSearchHistory',
  async (bookId: string) => {
    await searchService.clearSearchHistory(bookId);
    return bookId;
  }
);

export const deleteSearchHistory = createAsyncThunk(
  'search/deleteSearchHistory',
  async (id: string) => {
    await searchService.deleteSearchHistory(id);
    return id;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.query = '';
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Search in book
    builder
      .addCase(searchInBook.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchInBook.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(searchInBook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search';
      });

    // Get search history
    builder
      .addCase(getSearchHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSearchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(getSearchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get search history';
      });

    // Clear search history
    builder
      .addCase(clearSearchHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearSearchHistory.fulfilled, (state) => {
        state.loading = false;
        state.history = [];
      })
      .addCase(clearSearchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to clear search history';
      });

    // Delete search history entry
    builder
      .addCase(deleteSearchHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSearchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = state.history.filter(item => item.id !== action.payload);
      })
      .addCase(deleteSearchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete search history';
      });
  },
});

export const { setQuery, clearResults, clearError } = searchSlice.actions;
export default searchSlice.reducer; 