import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, firebaseAuth } from '../../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

export interface VocabularyWord {
    id: string;
    word: string;
    translation: string;
    phonetic: string;
    language: string;
    examples: string[];
    tags: string[];
    isFavorite: boolean;
    masteryScore: number;
    practiceCount: number;
    lastPracticed: number;
    sourceBook?: string;
    sourceChapter?: string;
    notes?: string;
    createdAt: number;
    updatedAt: number;
    context?: string;
    lastReviewed?: number;
    proficiency?: number;
}

export interface VocabularyFilter {
    language?: string;
    searchQuery?: string;
    favorites?: boolean;
    sortBy?: 'lastReviewed' | 'proficiency' | 'word';
    sortOrder?: 'asc' | 'desc';
}

interface VocabularyState {
    words: VocabularyWord[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    selectedLanguage: string | null;
    selectedItem: VocabularyWord | null;
    currentFilter: VocabularyFilter | null;
    hasMore: boolean;
    lastVisible: any;
    exportData: string | null;
}

const initialState: VocabularyState = {
    words: [],
    loading: false,
    loadingMore: false,
    error: null,
    selectedLanguage: null,
    selectedItem: null,
    currentFilter: null,
    hasMore: true,
    lastVisible: null,
    exportData: null,
};

// Async thunks
export const fetchVocabulary = createAsyncThunk(
    'vocabulary/fetchItems',
    async (filter?: VocabularyFilter) => {
        const user = firebaseAuth.currentUser;
        if (!user) throw new Error('User must be logged in');

        const vocabularyRef = collection(firestore, 'vocabulary');
        let q = query(vocabularyRef, where('userId', '==', user.uid), limit(20));

        if (filter?.language) {
            q = query(q, where('language', '==', filter.language));
        }
        if (filter?.favorites) {
            q = query(q, where('isFavorite', '==', true));
        }
        if (filter?.sortBy) {
            q = query(q, orderBy(filter.sortBy, filter.sortOrder || 'desc'));
        }

        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VocabularyWord[];
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];

        return { items, lastVisible, hasMore: items.length === 20 };
    }
);

export const fetchMoreVocabulary = createAsyncThunk(
    'vocabulary/fetchMore',
    async (filter: VocabularyFilter, { getState }) => {
        const state = getState() as { vocabulary: VocabularyState };
        const { lastVisible } = state.vocabulary;
        
        const user = firebaseAuth.currentUser;
        if (!user) throw new Error('User must be logged in');

        const vocabularyRef = collection(firestore, 'vocabulary');
        let q = query(
            vocabularyRef,
            where('userId', '==', user.uid),
            limit(20)
        );

        if (lastVisible) {
            q = query(q, orderBy('timestamp', 'desc'), where('timestamp', '<', lastVisible.data().timestamp));
        }

        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VocabularyWord[];
        const newLastVisible = snapshot.docs[snapshot.docs.length - 1];

        return { items, lastVisible: newLastVisible, hasMore: items.length === 20 };
    }
);

export const deleteVocabularyItem = createAsyncThunk(
    'vocabulary/deleteItem',
    async (id: string) => {
        await deleteDoc(doc(firestore, 'vocabulary', id));
        return id;
    }
);

export const updateMasteryScore = createAsyncThunk(
    'vocabulary/updateMastery',
    async ({ id, score }: { id: string; score: number }) => {
        const docRef = doc(firestore, 'vocabulary', id);
        await updateDoc(docRef, { masteryScore: score, lastPracticed: Date.now() });
        return { id, score };
    }
);

export const toggleFavorite = createAsyncThunk(
    'vocabulary/toggleFavorite',
    async (id: string) => {
        const docRef = doc(firestore, 'vocabulary', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Document not found');
        
        const currentFavorite = docSnap.data()?.isFavorite || false;
        await updateDoc(docRef, { isFavorite: !currentFavorite });
        return id;
    }
);

export const exportVocabulary = createAsyncThunk(
    'vocabulary/export',
    async (format: 'csv' | 'json') => {
        const user = firebaseAuth.currentUser;
        if (!user) throw new Error('User must be logged in');

        const vocabularyRef = collection(firestore, 'vocabulary');
        const q = query(vocabularyRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VocabularyWord[];

        if (format === 'csv') {
            return items.map(item => 
                `${item.word},${item.translation},${item.context},${item.proficiency}`
            ).join('\n');
        }
        return JSON.stringify(items, null, 2);
    }
);

export const playWordAudio = createAsyncThunk(
    'vocabulary/playWordAudio',
    async ({ word, language }: { word: string; language: string }) => {
        // Here you would typically call your text-to-speech service
        // For now, we'll just return a success status
        return { success: true };
    }
);

const vocabularySlice = createSlice({
    name: 'vocabulary',
    initialState,
    reducers: {
        setFilter: (state, action: PayloadAction<VocabularyFilter | null>) => {
            state.currentFilter = action.payload;
        },
        selectItem: (state, action: PayloadAction<VocabularyWord | null>) => {
            state.selectedItem = action.payload;
        },
        resetPagination: (state) => {
            state.hasMore = true;
            state.lastVisible = null;
            state.words = [];
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVocabulary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVocabulary.fulfilled, (state, action) => {
                state.loading = false;
                state.words = action.payload.items;
                state.lastVisible = action.payload.lastVisible;
                state.hasMore = action.payload.hasMore;
            })
            .addCase(fetchVocabulary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch vocabulary';
            })
            .addCase(fetchMoreVocabulary.pending, (state) => {
                state.loadingMore = true;
            })
            .addCase(fetchMoreVocabulary.fulfilled, (state, action) => {
                state.loadingMore = false;
                state.words = [...state.words, ...action.payload.items];
                state.lastVisible = action.payload.lastVisible;
                state.hasMore = action.payload.hasMore;
            })
            .addCase(fetchMoreVocabulary.rejected, (state, action) => {
                state.loadingMore = false;
                state.error = action.error.message || 'Failed to fetch more items';
            })
            .addCase(deleteVocabularyItem.fulfilled, (state, action) => {
                state.words = state.words.filter(word => word.id !== action.payload);
            })
            .addCase(updateMasteryScore.fulfilled, (state, action) => {
                const word = state.words.find(w => w.id === action.payload.id);
                if (word) {
                    word.masteryScore = action.payload.score;
                    word.lastReviewed = Date.now();
                }
            })
            .addCase(toggleFavorite.fulfilled, (state, action) => {
                const word = state.words.find(w => w.id === action.payload);
                if (word) {
                    word.isFavorite = !word.isFavorite;
                }
            })
            .addCase(exportVocabulary.fulfilled, (state, action) => {
                state.exportData = action.payload;
            })
            .addCase(playWordAudio.fulfilled, (state, action) => {
                // No state changes needed for audio playback
            });
    },
});

export const {
    setFilter,
    selectItem,
    resetPagination,
    clearError,
} = vocabularySlice.actions;

export default vocabularySlice.reducer; 