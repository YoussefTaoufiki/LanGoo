import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { GoogleCloudTTS } from './googleCloudTTS';

export interface TranslationPair {
  id: string;
  originalText: string;
  correctTranslation: string;
  context?: string;
  sourceLang: string;
  targetLang: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bookId: string;
}

export interface TranslationScore {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  difficulty: string;
  timeSeconds: number;
  correctTranslations: number;
  totalAttempts: number;
  timestamp: number;
}

export interface TranslationResult {
  isCorrect: boolean;
  feedback: string;
  similarity?: number;
}

class TranslationPracticeService {
  private tts: GoogleCloudTTS;

  constructor() {
    this.tts = new GoogleCloudTTS();
  }

  async generatePractice(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationPair> {
    try {
      const pairsRef = firestore().collection('translationPairs');
      const query = pairsRef
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .where('sourceLang', '==', sourceLang)
        .where('targetLang', '==', targetLang);

      const snapshot = await query.get();

      if (snapshot.empty) {
        throw new Error('No translation pairs available for the selected criteria');
      }

      const pairs = snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      } as TranslationPair));

      // Randomly select a pair
      const randomIndex = Math.floor(Math.random() * pairs.length);
      return pairs[randomIndex];
    } catch (error) {
      console.error('Error generating translation practice:', error);
      throw new Error('Failed to generate translation practice');
    }
  }

  async checkTranslation(
    pairId: string,
    userTranslation: string
  ): Promise<TranslationResult> {
    try {
      const pairDoc = await firestore()
        .collection('translationPairs')
        .doc(pairId)
        .get();

      if (!pairDoc.exists) {
        throw new Error('Translation pair not found');
      }

      const pair = pairDoc.data() as TranslationPair;
      const similarity = this.calculateSimilarity(
        pair.correctTranslation.toLowerCase(),
        userTranslation.toLowerCase()
      );

      let isCorrect = false;
      let feedback = '';

      if (similarity >= 0.9) {
        isCorrect = true;
        feedback = 'Perfect translation! Well done!';
      } else if (similarity >= 0.8) {
        isCorrect = true;
        feedback = 'Good translation! There might be small improvements possible.';
      } else if (similarity >= 0.6) {
        feedback = 'Close, but there are some differences. Try again!';
      } else {
        feedback = 'The translation needs more work. Try again!';
      }

      return { isCorrect, feedback, similarity };
    } catch (error) {
      console.error('Error checking translation:', error);
      throw new Error('Failed to check translation');
    }
  }

  async playAudio(text: string, lang: string): Promise<void> {
    try {
      await this.tts.speak(text, lang);
    } catch (error) {
      console.error('Error playing audio:', error);
      throw new Error('Failed to play audio');
    }
  }

  async saveScore(score: Omit<TranslationScore, 'id' | 'userId' | 'userName'>): Promise<TranslationScore> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const scoreData: TranslationScore = {
        id: firestore().collection('translationScores').doc().id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        ...score,
      };

      await firestore().collection('translationScores').doc(scoreData.id).set(scoreData);
      return scoreData;
    } catch (error) {
      console.error('Error saving score:', error);
      throw new Error('Failed to save score');
    }
  }

  async getLeaderboard(
    bookId: string,
    difficulty: string
  ): Promise<TranslationScore[]> {
    try {
      const scoresRef = firestore().collection('translationScores');
      const query = scoresRef
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .orderBy('correctTranslations', 'desc')
        .orderBy('timeSeconds', 'asc')
        .limit(10);

      const snapshot = await query.get();
      return snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      } as TranslationScore));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw new Error('Failed to get leaderboard');
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - matrix[len1][len2] / maxLen;
  }
}

export const translationPracticeService = new TranslationPracticeService(); 