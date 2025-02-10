import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ttsService, TTSVoice, TTSConfig } from '../../services/tts';

interface TTSState {
  voices: TTSVoice[];
  selectedVoice: TTSVoice | null;
  config: TTSConfig | null;
  audioPath: string | null;
  loading: boolean;
  error: string | null;
  playing: boolean;
  progress: number;
}

const initialState: TTSState = {
  voices: [],
  selectedVoice: null,
  config: null,
  audioPath: null,
  loading: false,
  error: null,
  playing: false,
  progress: 0,
};

export const listVoices = createAsyncThunk(
  'tts/listVoices',
  async (languageCode?: string) => {
    const voices = await ttsService.listVoices(languageCode);
    return voices;
  }
);

export const synthesizeSpeech = createAsyncThunk(
  'tts/synthesizeSpeech',
  async ({ text, config }: { text: string; config: TTSConfig }) => {
    const audioPath = await ttsService.synthesize(text, config);
    return audioPath;
  }
);

export const cleanCache = createAsyncThunk(
  'tts/cleanCache',
  async () => {
    await ttsService.cleanCache();
  }
);

const ttsSlice = createSlice({
  name: 'tts',
  initialState,
  reducers: {
    setSelectedVoice: (state, action: PayloadAction<TTSVoice | null>) => {
      state.selectedVoice = action.payload;
      if (action.payload) {
        state.config = {
          voice: action.payload,
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1,
            volumeGainDb: 0,
          },
        };
      } else {
        state.config = null;
      }
    },
    updateConfig: (state, action: PayloadAction<Partial<TTSConfig['audioConfig']>>) => {
      if (state.config) {
        state.config.audioConfig = {
          ...state.config.audioConfig,
          ...action.payload,
        };
      }
    },
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.playing = action.payload;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    reset: (state) => {
      state.audioPath = null;
      state.playing = false;
      state.progress = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // List voices
    builder
      .addCase(listVoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listVoices.fulfilled, (state, action) => {
        state.loading = false;
        state.voices = action.payload;
        if (!state.selectedVoice && action.payload.length > 0) {
          state.selectedVoice = action.payload[0];
          state.config = {
            voice: action.payload[0],
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: 0,
              speakingRate: 1,
              volumeGainDb: 0,
            },
          };
        }
      })
      .addCase(listVoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to list voices';
      });

    // Synthesize speech
    builder
      .addCase(synthesizeSpeech.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(synthesizeSpeech.fulfilled, (state, action) => {
        state.loading = false;
        state.audioPath = action.payload;
        state.playing = true;
        state.progress = 0;
      })
      .addCase(synthesizeSpeech.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to synthesize speech';
      });

    // Clean cache
    builder
      .addCase(cleanCache.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cleanCache.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(cleanCache.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to clean cache';
      });
  },
});

export const {
  setSelectedVoice,
  updateConfig,
  setPlaying,
  setProgress,
  clearError,
  reset,
} = ttsSlice.actions;

export default ttsSlice.reducer; 