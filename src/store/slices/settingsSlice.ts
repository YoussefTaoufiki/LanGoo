import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { settingsService, ReadingSettings, DEFAULT_SETTINGS } from '../../services/settings';

interface SettingsState {
  settings: Record<string, ReadingSettings>; // bookId -> settings
  globalTheme: 'light' | 'dark' | 'sepia';
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {},
  globalTheme: 'light',
  loading: false,
  error: null,
};

export const getSettings = createAsyncThunk(
  'settings/getSettings',
  async (bookId: string) => {
    const settings = await settingsService.getSettings(bookId);
    return settings;
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async ({ bookId, settings }: { bookId: string; settings: Partial<ReadingSettings> }) => {
    await settingsService.updateSettings(bookId, settings);
    return { bookId, settings };
  }
);

export const resetSettings = createAsyncThunk(
  'settings/resetSettings',
  async (bookId: string) => {
    await settingsService.resetSettings(bookId);
    return bookId;
  }
);

export const getGlobalTheme = createAsyncThunk(
  'settings/getGlobalTheme',
  async () => {
    const theme = await settingsService.getGlobalTheme();
    return theme;
  }
);

export const updateGlobalTheme = createAsyncThunk(
  'settings/updateGlobalTheme',
  async (theme: 'light' | 'dark' | 'sepia') => {
    await settingsService.updateGlobalTheme(theme);
    return theme;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get settings
    builder
      .addCase(getSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings[action.payload.bookId] = action.payload;
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get settings';
      });

    // Update settings
    builder
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        const { bookId, settings } = action.payload;
        if (state.settings[bookId]) {
          state.settings[bookId] = {
            ...state.settings[bookId],
            ...settings,
            lastUpdated: Date.now(),
          };
        }
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update settings';
      });

    // Reset settings
    builder
      .addCase(resetSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.loading = false;
        const bookId = action.payload;
        if (state.settings[bookId]) {
          state.settings[bookId] = {
            ...state.settings[bookId],
            ...DEFAULT_SETTINGS,
            lastUpdated: Date.now(),
          };
        }
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reset settings';
      });

    // Get global theme
    builder
      .addCase(getGlobalTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGlobalTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.globalTheme = action.payload;
      })
      .addCase(getGlobalTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get global theme';
      });

    // Update global theme
    builder
      .addCase(updateGlobalTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGlobalTheme.fulfilled, (state, action) => {
        state.loading = false;
        state.globalTheme = action.payload;
      })
      .addCase(updateGlobalTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update global theme';
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer; 