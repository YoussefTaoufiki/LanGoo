import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface WordPair {
  id?: string;
  word: string;
  translation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  context?: string;
  bookId: string;
}

export interface GameScore {
  id?: string;
  userId: string;
  bookId: string;
  gameType: 'matching';
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  timeSpent: number; // in seconds
  completedAt: number;
  mistakes: number;
}

export interface LeaderboardEntry extends GameScore {
  userName: string;
}

class WordGameService {
  private wordPairsCollection = firestore().collection('word_pairs');
  private scoresCollection = firestore().collection('game_scores');

  /**
   * Get word pairs for a game session
   */
  async getWordPairs(bookId: string, difficulty: 'easy' | 'medium' | 'hard', count: number = 10): Promise<WordPair[]> {
    try {
      const snapshot = await this.wordPairsCollection
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .limit(count)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as WordPair));
    } catch (error) {
      console.error('Error getting word pairs:', error);
      throw error;
    }
  }

  /**
   * Add a new word pair
   */
  async addWordPair(wordPair: Omit<WordPair, 'id'>): Promise<WordPair> {
    try {
      const docRef = await this.wordPairsCollection.add(wordPair);
      return {
        id: docRef.id,
        ...wordPair,
      };
    } catch (error) {
      console.error('Error adding word pair:', error);
      throw error;
    }
  }

  /**
   * Save game score
   */
  async saveScore(score: Omit<GameScore, 'id' | 'userId'>): Promise<GameScore> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const scoreData: Omit<GameScore, 'id'> = {
        ...score,
        userId,
      };

      const docRef = await this.scoresCollection.add(scoreData);
      return {
        id: docRef.id,
        ...scoreData,
      };
    } catch (error) {
      console.error('Error saving score:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    try {
      const snapshot = await this.scoresCollection
        .where('bookId', '==', bookId)
        .where('gameType', '==', 'matching')
        .where('difficulty', '==', difficulty)
        .orderBy('score', 'desc')
        .limit(limit)
        .get();

      const scores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as GameScore));

      // Get user names
      const userIds = [...new Set(scores.map(score => score.userId))];
      const userDocs = await Promise.all(
        userIds.map(userId => 
          firestore().collection('users').doc(userId).get()
        )
      );

      const userNames = Object.fromEntries(
        userDocs.map(doc => [doc.id, doc.data()?.displayName || 'Anonymous'])
      );

      return scores.map(score => ({
        ...score,
        userName: userNames[score.userId],
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get user's best score
   */
  async getUserBestScore(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<GameScore | null> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const snapshot = await this.scoresCollection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .where('gameType', '==', 'matching')
        .where('difficulty', '==', difficulty)
        .orderBy('score', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as GameScore;
    } catch (error) {
      console.error('Error getting user best score:', error);
      throw error;
    }
  }

  /**
   * Import word pairs from annotations
   */
  async importFromAnnotations(bookId: string): Promise<number> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Get annotations
      const annotations = await firestore()
        .collection('annotations')
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .get();

      const batch = firestore().batch();
      let count = 0;

      for (const doc of annotations.docs) {
        const annotation = doc.data();
        if (annotation.highlightedText && annotation.note) {
          const wordPairRef = this.wordPairsCollection.doc();
          batch.set(wordPairRef, {
            word: annotation.highlightedText,
            translation: annotation.note,
            difficulty: 'medium', // Default difficulty
            context: annotation.text,
            bookId,
          });
          count++;
        }
      }

      await batch.commit();
      return count;
    } catch (error) {
      console.error('Error importing from annotations:', error);
      throw error;
    }
  }
}

export const wordGameService = new WordGameService(); 