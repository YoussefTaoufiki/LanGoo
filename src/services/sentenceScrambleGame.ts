import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface SentenceScramblePuzzle {
  id?: string;
  originalSentence: string;
  scrambledWords: string[];
  translation?: string;
  context?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bookId: string;
}

export interface SentenceScrambleScore {
  id?: string;
  userId: string;
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSeconds: number;
  mistakeCount: number;
  timestamp: number;
}

class SentenceScrambleGameService {
  private sentenceScrambleCollection = firestore().collection('sentenceScramblePuzzles');
  private scoresCollection = firestore().collection('sentenceScrambleScores');

  private readonly DIFFICULTY_CONFIG = {
    easy: {
      minWords: 3,
      maxWords: 5,
      allowPunctuation: false,
    },
    medium: {
      minWords: 5,
      maxWords: 8,
      allowPunctuation: true,
    },
    hard: {
      minWords: 8,
      maxWords: 12,
      allowPunctuation: true,
    },
  };

  async generatePuzzle(bookId: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<SentenceScramblePuzzle> {
    try {
      // Get a random sentence from the book's annotations or highlights
      const annotations = await firestore()
        .collection('annotations')
        .where('bookId', '==', bookId)
        .get();

      const sentences = annotations.docs
        .map(doc => doc.data())
        .filter(annotation => {
          const wordCount = annotation.text.split(/\s+/).length;
          const config = this.DIFFICULTY_CONFIG[difficulty];
          return wordCount >= config.minWords && wordCount <= config.maxWords;
        });

      if (sentences.length === 0) {
        throw new Error('No suitable sentences found for the selected difficulty level');
      }

      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
      const originalSentence = randomSentence.text;
      const translation = randomSentence.translation;
      const context = randomSentence.context;

      // Scramble the sentence
      const scrambledWords = this.scrambleSentence(originalSentence, difficulty);

      const puzzle: SentenceScramblePuzzle = {
        originalSentence,
        scrambledWords,
        translation,
        context,
        difficulty,
        bookId,
      };

      // Store the puzzle
      const docRef = await this.sentenceScrambleCollection.add(puzzle);
      return { ...puzzle, id: docRef.id };
    } catch (error) {
      console.error('Error generating sentence scramble puzzle:', error);
      throw error;
    }
  }

  private scrambleSentence(sentence: string, difficulty: 'easy' | 'medium' | 'hard'): string[] {
    const config = this.DIFFICULTY_CONFIG[difficulty];
    let words = sentence.split(/\s+/);

    // Handle punctuation based on difficulty
    if (!config.allowPunctuation) {
      words = words.map(word => word.replace(/[.,!?;]$/, ''));
    }

    // Fisher-Yates shuffle algorithm
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    return words;
  }

  async checkSolution(puzzleId: string, solution: string[]): Promise<boolean> {
    try {
      const puzzleDoc = await this.sentenceScrambleCollection.doc(puzzleId).get();
      if (!puzzleDoc.exists) {
        throw new Error('Puzzle not found');
      }

      const puzzle = puzzleDoc.data() as SentenceScramblePuzzle;
      const normalizedSolution = solution.join(' ').toLowerCase().trim();
      const normalizedOriginal = puzzle.originalSentence.toLowerCase().trim();

      return normalizedSolution === normalizedOriginal;
    } catch (error) {
      console.error('Error checking solution:', error);
      throw error;
    }
  }

  async saveScore(scoreData: Omit<SentenceScrambleScore, 'id' | 'userId'>): Promise<SentenceScrambleScore> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const score: Omit<SentenceScrambleScore, 'id'> = {
        ...scoreData,
        userId,
      };

      const docRef = await this.scoresCollection.add(score);
      return { ...score, id: docRef.id };
    } catch (error) {
      console.error('Error saving sentence scramble score:', error);
      throw error;
    }
  }

  async getLeaderboard(bookId: string, difficulty: 'easy' | 'medium' | 'hard', limit = 10): Promise<SentenceScrambleScore[]> {
    try {
      const snapshot = await this.scoresCollection
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .orderBy('timeSeconds', 'asc')
        .orderBy('mistakeCount', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SentenceScrambleScore));
    } catch (error) {
      console.error('Error getting sentence scramble leaderboard:', error);
      throw error;
    }
  }

  async getHint(puzzleId: string): Promise<string> {
    try {
      const puzzleDoc = await this.sentenceScrambleCollection.doc(puzzleId).get();
      if (!puzzleDoc.exists) {
        throw new Error('Puzzle not found');
      }

      const puzzle = puzzleDoc.data() as SentenceScramblePuzzle;
      
      // Return context or translation as hint
      if (puzzle.context) {
        return `Context: ${puzzle.context}`;
      } else if (puzzle.translation) {
        return `Translation: ${puzzle.translation}`;
      } else {
        return 'No hint available for this puzzle';
      }
    } catch (error) {
      console.error('Error getting hint:', error);
      throw error;
    }
  }
}

export const sentenceScrambleGameService = new SentenceScrambleGameService(); 