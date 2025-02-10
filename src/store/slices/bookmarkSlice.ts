import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Bookmark, bookmarkService } from '../../services/bookmark';

interface BookmarkState {
  bookmarks: Record<string, Bookmark[]>; // bookId -> bookmarks
  loading: boolean;
  error: string | null;
  selectedBookmark: Bookmark | null;
}

const initialState: BookmarkState = {
  bookmarks: {},
  loading: false,
  error: null,
  selectedBookmark: null,
};

// Async thunks
export const fetchBookmarks = createAsyncThunk(
  'bookmark/fetchBookmarks',
  async (bookId: string) => {
    const bookmarks = await bookmarkService.getBookmarks(bookId);
    return { bookId, bookmarks };
  }
);

export const createBookmark = createAsyncThunk(
  'bookmark/createBookmark',
  async (bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newBookmark = await bookmarkService.createBookmark(bookmark);
    return newBookmark;
  }
);

export const updateBookmark = createAsyncThunk(
  'bookmark/updateBookmark',
  async ({ id, data }: { id: string; data: Partial<Bookmark> }) => {
    await bookmarkService.updateBookmark(id, data);
    return { id, data };
  }
);

export const deleteBookmark = createAsyncThunk(
  'bookmark/deleteBookmark',
  async (id: string) => {
    await bookmarkService.deleteBookmark(id);
    return id;
  }
);

const bookmarkSlice = createSlice({
  name: 'bookmark',
  initialState,
  reducers: {
    setSelectedBookmark: (state, action: PayloadAction<Bookmark | null>) => {
      state.selectedBookmark = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bookmarks
      .addCase(fetchBookmarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        const { bookId, bookmarks } = action.payload;
        state.bookmarks[bookId] = bookmarks;
        state.loading = false;
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch bookmarks';
      })

      // Create bookmark
      .addCase(createBookmark.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBookmark.fulfilled, (state, action) => {
        const bookmark = action.payload;
        if (!state.bookmarks[bookmark.bookId]) {
          state.bookmarks[bookmark.bookId] = [];
        }
        state.bookmarks[bookmark.bookId].unshift(bookmark);
        state.loading = false;
      })
      .addCase(createBookmark.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create bookmark';
      })

      // Update bookmark
      .addCase(updateBookmark.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBookmark.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        for (const bookId in state.bookmarks) {
          const index = state.bookmarks[bookId].findIndex(b => b.id === id);
          if (index !== -1) {
            state.bookmarks[bookId][index] = {
              ...state.bookmarks[bookId][index],
              ...data,
              updatedAt: Date.now(),
            };
            break;
          }
        }
        state.loading = false;
      })
      .addCase(updateBookmark.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update bookmark';
      })

      // Delete bookmark
      .addCase(deleteBookmark.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBookmark.fulfilled, (state, action) => {
        const id = action.payload;
        for (const bookId in state.bookmarks) {
          state.bookmarks[bookId] = state.bookmarks[bookId].filter(b => b.id !== id);
        }
        if (state.selectedBookmark?.id === id) {
          state.selectedBookmark = null;
        }
        state.loading = false;
      })
      .addCase(deleteBookmark.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete bookmark';
      });
  },
});

export const { setSelectedBookmark, clearError } = bookmarkSlice.actions;

export default bookmarkSlice.reducer; 