import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Annotation, annotationService } from '../../services/annotation';

interface AnnotationState {
  annotations: Record<string, Annotation[]>; // bookId -> annotations
  loading: boolean;
  error: string | null;
  selectedAnnotation: Annotation | null;
}

const initialState: AnnotationState = {
  annotations: {},
  loading: false,
  error: null,
  selectedAnnotation: null,
};

// Async thunks
export const fetchAnnotations = createAsyncThunk(
  'annotation/fetchAnnotations',
  async (bookId: string) => {
    const annotations = await annotationService.getAnnotations(bookId);
    return { bookId, annotations };
  }
);

export const createAnnotation = createAsyncThunk(
  'annotation/createAnnotation',
  async (annotation: Omit<Annotation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newAnnotation = await annotationService.createAnnotation(annotation);
    return newAnnotation;
  }
);

export const updateAnnotation = createAsyncThunk(
  'annotation/updateAnnotation',
  async ({ id, data }: { id: string; data: Partial<Annotation> }) => {
    await annotationService.updateAnnotation(id, data);
    return { id, data };
  }
);

export const deleteAnnotation = createAsyncThunk(
  'annotation/deleteAnnotation',
  async (id: string) => {
    await annotationService.deleteAnnotation(id);
    return id;
  }
);

export const exportAnnotations = createAsyncThunk(
  'annotation/exportAnnotations',
  async (bookId: string) => {
    const exportData = await annotationService.exportAnnotations(bookId);
    return exportData;
  }
);

const annotationSlice = createSlice({
  name: 'annotation',
  initialState,
  reducers: {
    setSelectedAnnotation: (state, action: PayloadAction<Annotation | null>) => {
      state.selectedAnnotation = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch annotations
      .addCase(fetchAnnotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnotations.fulfilled, (state, action) => {
        const { bookId, annotations } = action.payload;
        state.annotations[bookId] = annotations;
        state.loading = false;
      })
      .addCase(fetchAnnotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch annotations';
      })

      // Create annotation
      .addCase(createAnnotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAnnotation.fulfilled, (state, action) => {
        const annotation = action.payload;
        if (!state.annotations[annotation.bookId]) {
          state.annotations[annotation.bookId] = [];
        }
        state.annotations[annotation.bookId].unshift(annotation);
        state.loading = false;
      })
      .addCase(createAnnotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create annotation';
      })

      // Update annotation
      .addCase(updateAnnotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAnnotation.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        for (const bookId in state.annotations) {
          const index = state.annotations[bookId].findIndex(a => a.id === id);
          if (index !== -1) {
            state.annotations[bookId][index] = {
              ...state.annotations[bookId][index],
              ...data,
              updatedAt: Date.now(),
            };
            break;
          }
        }
        state.loading = false;
      })
      .addCase(updateAnnotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update annotation';
      })

      // Delete annotation
      .addCase(deleteAnnotation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAnnotation.fulfilled, (state, action) => {
        const id = action.payload;
        for (const bookId in state.annotations) {
          state.annotations[bookId] = state.annotations[bookId].filter(a => a.id !== id);
        }
        if (state.selectedAnnotation?.id === id) {
          state.selectedAnnotation = null;
        }
        state.loading = false;
      })
      .addCase(deleteAnnotation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete annotation';
      });
  },
});

export const { setSelectedAnnotation, clearError } = annotationSlice.actions;

export default annotationSlice.reducer; 