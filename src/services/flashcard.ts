import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Flashcard {
  id?: string;
  userId: string;
  bookId: string;
  front: string;
  back: string;
  context?: string;
  tags?: string[];
  createdAt: number;
  lastReviewed?: number;
  nextReview?: number;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface FlashcardDeck {
  id?: string;
  userId: string;
  bookId: string;
  name: string;
  description?: string;
  cardCount: number;
  createdAt: number;
  lastStudied?: number;
}

class FlashcardService {
  private cardsCollection = firestore().collection('flashcards');
  private decksCollection = firestore().collection('flashcard_decks');

  // SuperMemo 2 algorithm parameters
  private readonly MIN_EASE_FACTOR = 1.3;
  private readonly INITIAL_EASE_FACTOR = 2.5;
  private readonly INITIAL_INTERVAL = 1; // 1 day

  /**
   * Create a new deck
   */
  async createDeck(deck: Omit<FlashcardDeck, 'id' | 'userId' | 'cardCount' | 'createdAt'>): Promise<FlashcardDeck> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const deckData: Omit<FlashcardDeck, 'id'> = {
        ...deck,
        userId,
        cardCount: 0,
        createdAt: Date.now(),
      };

      const docRef = await this.decksCollection.add(deckData);
      return {
        id: docRef.id,
        ...deckData,
      };
    } catch (error) {
      console.error('Error creating deck:', error);
      throw error;
    }
  }

  /**
   * Add a card to a deck
   */
  async addCard(deckId: string, card: Omit<Flashcard, 'id' | 'userId' | 'createdAt' | 'interval' | 'easeFactor' | 'repetitions'>): Promise<Flashcard> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const cardData: Omit<Flashcard, 'id'> = {
        ...card,
        userId,
        createdAt: Date.now(),
        interval: this.INITIAL_INTERVAL,
        easeFactor: this.INITIAL_EASE_FACTOR,
        repetitions: 0,
      };

      const batch = firestore().batch();

      // Add card
      const cardRef = this.cardsCollection.doc();
      batch.set(cardRef, cardData);

      // Update deck card count
      const deckRef = this.decksCollection.doc(deckId);
      batch.update(deckRef, {
        cardCount: firestore.FieldValue.increment(1),
      });

      await batch.commit();

      return {
        id: cardRef.id,
        ...cardData,
      };
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  }

  /**
   * Get cards due for review
   */
  async getDueCards(deckId: string): Promise<Flashcard[]> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const now = Date.now();
      const snapshot = await this.cardsCollection
        .where('userId', '==', userId)
        .where('deckId', '==', deckId)
        .where('nextReview', '<=', now)
        .orderBy('nextReview')
        .limit(20)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Flashcard));
    } catch (error) {
      console.error('Error getting due cards:', error);
      throw error;
    }
  }

  /**
   * Update card review using SuperMemo 2 algorithm
   */
  async updateCardReview(cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const card = await this.cardsCollection.doc(cardId).get();
      if (!card.exists) throw new Error('Card not found');
      if (card.data()?.userId !== userId) throw new Error('Not authorized');

      const cardData = card.data() as Flashcard;
      const { interval, easeFactor, repetitions } = this.calculateNextReview(
        cardData.interval,
        cardData.easeFactor,
        cardData.repetitions,
        quality
      );

      await this.cardsCollection.doc(cardId).update({
        interval,
        easeFactor,
        repetitions,
        lastReviewed: Date.now(),
        nextReview: Date.now() + interval * 24 * 60 * 60 * 1000, // Convert days to milliseconds
      });
    } catch (error) {
      console.error('Error updating card review:', error);
      throw error;
    }
  }

  /**
   * Calculate next review interval using SuperMemo 2 algorithm
   */
  private calculateNextReview(
    oldInterval: number,
    oldEaseFactor: number,
    repetitions: number,
    quality: 0 | 1 | 2 | 3 | 4 | 5
  ): { interval: number; easeFactor: number; repetitions: number } {
    let interval: number;
    let easeFactor = oldEaseFactor;

    // Update ease factor
    easeFactor = oldEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < this.MIN_EASE_FACTOR) easeFactor = this.MIN_EASE_FACTOR;

    // Calculate interval
    if (quality < 3) {
      // If response was wrong, start over
      interval = this.INITIAL_INTERVAL;
      repetitions = 0;
    } else {
      repetitions++;
      if (repetitions === 1) {
        interval = this.INITIAL_INTERVAL;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(oldInterval * easeFactor);
      }
    }

    return { interval, easeFactor, repetitions };
  }
}

export const flashcardService = new FlashcardService(); 