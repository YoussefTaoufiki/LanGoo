import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { flashcardService, Flashcard, FlashcardDeck } from '../../services/flashcard';

interface FlashcardState {
  decks: Record<string, FlashcardDeck>;
  cards: Record<string, Flashcard[]>;
  dueCards: Record<string, Flashcard[]>;
  currentCard: Flashcard | null;
  loading: boolean;
  error: string | null;
}

const initialState: FlashcardState = {
  decks: {},
  cards: {},
  dueCards: {},
  currentCard: null,
  loading: false,
  error: null,
};

export const createDeck = createAsyncThunk(
  'flashcard/createDeck',
  async (deck: Omit<FlashcardDeck, 'id' | 'userId' | 'cardCount' | 'createdAt'>) => {
    const newDeck = await flashcardService.createDeck(deck);
    return newDeck;
  }
);

export const addCard = createAsyncThunk(
  'flashcard/addCard',
  async ({ deckId, card }: { 
    deckId: string; 
    card: Omit<Flashcard, 'id' | 'userId' | 'createdAt' | 'interval' | 'easeFactor' | 'repetitions'> 
  }) => {
    const newCard = await flashcardService.addCard(deckId, card);
    return { deckId, card: newCard };
  }
);

export const getDueCards = createAsyncThunk(
  'flashcard/getDueCards',
  async (deckId: string) => {
    const cards = await flashcardService.getDueCards(deckId);
    return { deckId, cards };
  }
);

export const updateCardReview = createAsyncThunk(
  'flashcard/updateCardReview',
  async ({ cardId, quality }: { cardId: string; quality: 0 | 1 | 2 | 3 | 4 | 5 }) => {
    await flashcardService.updateCardReview(cardId, quality);
    return { cardId, quality };
  }
);

const flashcardSlice = createSlice({
  name: 'flashcard',
  initialState,
  reducers: {
    setCurrentCard: (state, action: PayloadAction<Flashcard | null>) => {
      state.currentCard = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create deck
    builder
      .addCase(createDeck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDeck.fulfilled, (state, action) => {
        state.loading = false;
        state.decks[action.payload.id!] = action.payload;
      })
      .addCase(createDeck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create deck';
      });

    // Add card
    builder
      .addCase(addCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCard.fulfilled, (state, action) => {
        state.loading = false;
        const { deckId, card } = action.payload;
        if (!state.cards[deckId]) {
          state.cards[deckId] = [];
        }
        state.cards[deckId].push(card);
        if (state.decks[deckId]) {
          state.decks[deckId].cardCount++;
        }
      })
      .addCase(addCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add card';
      });

    // Get due cards
    builder
      .addCase(getDueCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDueCards.fulfilled, (state, action) => {
        state.loading = false;
        const { deckId, cards } = action.payload;
        state.dueCards[deckId] = cards;
        if (cards.length > 0 && !state.currentCard) {
          state.currentCard = cards[0];
        }
      })
      .addCase(getDueCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to get due cards';
      });

    // Update card review
    builder
      .addCase(updateCardReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCardReview.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the reviewed card from dueCards
        for (const deckId in state.dueCards) {
          state.dueCards[deckId] = state.dueCards[deckId].filter(
            card => card.id !== action.payload.cardId
          );
        }
        // Set next card as current if available
        if (state.currentCard?.id === action.payload.cardId) {
          const currentDeckCards = state.dueCards[state.currentCard.bookId] || [];
          state.currentCard = currentDeckCards.length > 0 ? currentDeckCards[0] : null;
        }
      })
      .addCase(updateCardReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update card review';
      });
  },
});

export const { setCurrentCard, clearError } = flashcardSlice.actions;
export default flashcardSlice.reducer; 