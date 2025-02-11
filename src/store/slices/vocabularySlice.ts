import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { VocabularyItem, VocabularyFilter, vocabularyService } from '../../services/vocabularyService';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { RootState } from '../../store';

interface VocabularyState {
    items: VocabularyItem[];
    currentFilter: VocabularyFilter | null;
    loading: boolean;
    error: string | null;
    selectedItem: VocabularyItem | null;
    exportData: string | null;
    hasMore: boolean;
    lastVisible: FirebaseFirestoreTypes.DocumentSnapshot | null;
    loadingMore: boolean;
}

const initialState: VocabularyState = {
    items: [],
    currentFilter: null,
    loading: false,
    error: null,
    selectedItem: null,
    exportData: null,
    hasMore: true,
    lastVisible: null,
    loadingMore: false,
};

export const fetchVocabulary = createAsyncThunk(
    'vocabulary/fetchItems',
    async (filter?: VocabularyFilter) => {
        const result = await vocabularyService.getVocabularyItems(filter);
        return result;
    }
);

export const fetchMoreVocabulary = createAsyncThunk(
    'vocabulary/fetchMore',
    async (filter: VocabularyFilter, { getState }) => {
        const state = getState() as RootState;
        const result = await vocabularyService.getVocabularyItems({
            ...filter,
            lastVisible: state.vocabulary.lastVisible,
        });
        return result;
    }
);

export const addVocabularyItem = createAsyncThunk(
    'vocabulary/addItem',
    async (item: Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newItem = await vocabularyService.addVocabularyItem(item);
        return newItem;
    }
);

export const updateVocabularyItem = createAsyncThunk(
    'vocabulary/updateItem',
    async ({ id, updates }: { id: string; updates: Partial<VocabularyItem> }) => {
        const updatedItem = await vocabularyService.updateVocabularyItem(id, updates);
        return updatedItem;
    }
);

export const deleteVocabularyItem = createAsyncThunk(
    'vocabulary/deleteItem',
    async (id: string) => {
        await vocabularyService.deleteVocabularyItem(id);
        return id;
    }
);

export const playWordAudio = createAsyncThunk(
    'vocabulary/playAudio',
    async ({ word, language }: { word: string; language: string }) => {
        await vocabularyService.playWordAudio(word, language);
    }
);

export const updateMasteryScore = createAsyncThunk(
    'vocabulary/updateMastery',
    async ({ id, score }: { id: string; score: number }) => {
        await vocabularyService.updateMasteryScore(id, score);
        return { id, score };
    }
);

export const toggleFavorite = createAsyncThunk(
    'vocabulary/toggleFavorite',
    async (id: string) => {
        await vocabularyService.toggleFavorite(id);
        return id;
    }
);

export const exportVocabulary = createAsyncThunk(
    'vocabulary/export',
    async (format: 'csv' | 'json') => {
        const data = await vocabularyService.exportVocabulary(format);
        return data;
    }
);

const vocabularySlice = createSlice({
    name: 'vocabulary',
    initialState,
    reducers: {
        setFilter: (state, action: PayloadAction<VocabularyFilter | null>) => {
            state.currentFilter = action.payload;
        },
        selectItem: (state, action: PayloadAction<VocabularyItem | null>) => {
            state.selectedItem = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearExportData: (state) => {
            state.exportData = null;
        },
        resetPagination: (state) => {
            state.hasMore = true;
            state.lastVisible = null;
            state.items = [];
        },
    },
    extraReducers: (builder) => {
        // Fetch vocabulary
        builder
            .addCase(fetchVocabulary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVocabulary.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.lastVisible = action.payload.lastVisible;
                state.hasMore = action.payload.hasMore;
            })
            .addCase(fetchVocabulary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch vocabulary';
            })
            // Add fetch more cases
            .addCase(fetchMoreVocabulary.pending, (state) => {
                state.loadingMore = true;
                state.error = null;
            })
            .addCase(fetchMoreVocabulary.fulfilled, (state, action) => {
                state.loadingMore = false;
                state.items = [...state.items, ...action.payload.items];
                state.lastVisible = action.payload.lastVisible;
                state.hasMore = action.payload.hasMore;
            })
            .addCase(fetchMoreVocabulary.rejected, (state, action) => {
                state.loadingMore = false;
                state.error = action.error.message || 'Failed to fetch more items';
            });

        // Add item
        builder
            .addCase(addVocabularyItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addVocabularyItem.fulfilled, (state, action) => {
                state.loading = false;
                state.items.unshift(action.payload);
            })
            .addCase(addVocabularyItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to add vocabulary item';
            });

        // Update item
        builder
            .addCase(updateVocabularyItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateVocabularyItem.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateVocabularyItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update vocabulary item';
            });

        // Delete item
        builder
            .addCase(deleteVocabularyItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteVocabularyItem.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter(item => item.id !== action.payload);
            })
            .addCase(deleteVocabularyItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete vocabulary item';
            });

        // Update mastery score
        builder
            .addCase(updateMasteryScore.fulfilled, (state, action) => {
                const index = state.items.findIndex(item => item.id === action.payload.id);
                if (index !== -1) {
                    state.items[index].masteryScore = action.payload.score;
                    state.items[index].lastPracticed = Date.now();
                    state.items[index].practiceCount += 1;
                }
            });

        // Toggle favorite
        builder
            .addCase(toggleFavorite.fulfilled, (state, action) => {
                const index = state.items.findIndex(item => item.id === action.payload);
                if (index !== -1) {
                    state.items[index].isFavorite = !state.items[index].isFavorite;
                }
            });

        // Export vocabulary
        builder
            .addCase(exportVocabulary.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.exportData = null;
            })
            .addCase(exportVocabulary.fulfilled, (state, action) => {
                state.loading = false;
                state.exportData = action.payload;
            })
            .addCase(exportVocabulary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to export vocabulary';
            });
    },
});

export const {
    setFilter,
    selectItem,
    clearError,
    clearExportData,
    resetPagination,
} = vocabularySlice.actions;

export default vocabularySlice.reducer; 