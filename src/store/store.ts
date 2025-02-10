import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import authReducer from './slices/authSlice';
import fileReducer from './slices/fileSlice';
import bookmarkReducer from './slices/bookmarkSlice';
import annotationReducer from './slices/annotationSlice';
import navigationReducer from './slices/navigationSlice';
import searchReducer from './slices/searchSlice';
import tocReducer from './slices/tocSlice';
import settingsReducer from './slices/settingsSlice';
import ttsReducer from './slices/ttsSlice';
import flashcardReducer from './slices/flashcardSlice';
import wordGameReducer from './slices/wordGameSlice';
import wordSearchReducer from './slices/wordSearchSlice';
import sentenceScrambleReducer from './slices/sentenceScrambleSlice';

// Import reducers here as they are created
// import authReducer from './slices/authSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'file', 'bookmark', 'annotation', 'navigation', 'search', 'toc', 'settings', 'tts', 'flashcard', 'wordGame', 'wordSearch', 'sentenceScramble'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  file: fileReducer,
  bookmark: bookmarkReducer,
  annotation: annotationReducer,
  navigation: navigationReducer,
  search: searchReducer,
  toc: tocReducer,
  settings: settingsReducer,
  tts: ttsReducer,
  flashcard: flashcardReducer,
  wordGame: wordGameReducer,
  wordSearch: wordSearchReducer,
  sentenceScramble: sentenceScrambleReducer,
  // Add more reducers here as they are created
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 