import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileMetadata } from '../../services/file';

interface FileState {
  uploadedFiles: Record<string, FileMetadata>;
  currentUpload: {
    progress: number;
    fileName: string;
  } | null;
  error: string | null;
}

const initialState: FileState = {
  uploadedFiles: {},
  currentUpload: null,
  error: null,
};

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setUploadProgress: (
      state,
      action: PayloadAction<{ fileName: string; progress: number }>
    ) => {
      state.currentUpload = {
        fileName: action.payload.fileName,
        progress: action.payload.progress,
      };
    },
    
    addUploadedFile: (
      state,
      action: PayloadAction<{ id: string; metadata: FileMetadata }>
    ) => {
      state.uploadedFiles[action.payload.id] = action.payload.metadata;
      state.currentUpload = null;
    },
    
    removeUploadedFile: (state, action: PayloadAction<string>) => {
      delete state.uploadedFiles[action.payload];
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearUpload: (state) => {
      state.currentUpload = null;
      state.error = null;
    },
  },
});

export const {
  setUploadProgress,
  addUploadedFile,
  removeUploadedFile,
  setError,
  clearUpload,
} = fileSlice.actions;

export default fileSlice.reducer; 