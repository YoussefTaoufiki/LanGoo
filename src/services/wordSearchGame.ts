import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { WordPair, wordGameService } from './wordGame';

export interface WordSearchPuzzle {
  id?: string;
  grid: string[][];
  words: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  size: number;
  bookId: string;
}

export interface WordSearchScore {
  id?: string;
  userId: string;
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSeconds: number;
  wordsFound: number;
  totalWords: number;
  timestamp: number;
}

class WordSearchGameService {
  private wordSearchScoresCollection = firestore().collection('wordSearchScores');

  private readonly PUZZLE_SIZES = {
    easy: 8,
    medium: 12,
    hard: 15,
  };

  private readonly DIRECTIONS = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
  ];

  async generatePuzzle(bookId: string, difficulty: 'easy' | 'medium' | 'hard', wordCount: number): Promise<WordSearchPuzzle> {
    const size = this.PUZZLE_SIZES[difficulty];
    const wordPairs = await wordGameService.getWordPairs(bookId, difficulty, wordCount);
    const words = wordPairs.map(pair => pair.word);
    
    // Initialize empty grid
    const grid = Array(size).fill(null).map(() => Array(size).fill(''));
    
    // Place words in grid
    const placedWords = [];
    for (const word of words) {
      if (this.placeWord(grid, word.toUpperCase())) {
        placedWords.push(word);
      }
      if (placedWords.length === wordCount) break;
    }

    // Fill empty spaces with random letters
    this.fillEmptySpaces(grid);

    return {
      grid,
      words: placedWords,
      difficulty,
      size,
      bookId,
    };
  }

  private placeWord(grid: string[][], word: string): boolean {
    const size = grid.length;
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const direction = this.DIRECTIONS[Math.floor(Math.random() * this.DIRECTIONS.length)];
      const [dx, dy] = direction;
      
      // Random starting position
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);

      // Check if word fits at this position and direction
      if (this.canPlaceWord(grid, word, x, y, dx, dy)) {
        // Place the word
        for (let i = 0; i < word.length; i++) {
          grid[x + dx * i][y + dy * i] = word[i];
        }
        return true;
      }

      attempts++;
    }

    return false;
  }

  private canPlaceWord(grid: string[][], word: string, startX: number, startY: number, dx: number, dy: number): boolean {
    const size = grid.length;

    // Check if word fits within grid bounds
    if (
      startX + dx * (word.length - 1) >= size ||
      startX + dx * (word.length - 1) < 0 ||
      startY + dy * (word.length - 1) >= size ||
      startY + dy * (word.length - 1) < 0
    ) {
      return false;
    }

    // Check if path is clear or has matching letters
    for (let i = 0; i < word.length; i++) {
      const cell = grid[startX + dx * i][startY + dy * i];
      if (cell !== '' && cell !== word[i]) {
        return false;
      }
    }

    return true;
  }

  private fillEmptySpaces(grid: string[][]) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] === '') {
          grid[i][j] = letters.charAt(Math.floor(Math.random() * letters.length));
        }
      }
    }
  }

  async saveScore(scoreData: Omit<WordSearchScore, 'id' | 'userId'>): Promise<WordSearchScore> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const score: Omit<WordSearchScore, 'id'> = {
        ...scoreData,
        userId,
      };

      const docRef = await this.wordSearchScoresCollection.add(score);
      return { ...score, id: docRef.id };
    } catch (error) {
      console.error('Error saving word search score:', error);
      throw error;
    }
  }

  async getLeaderboard(bookId: string, difficulty: 'easy' | 'medium' | 'hard', limit = 10): Promise<WordSearchScore[]> {
    try {
      const snapshot = await this.wordSearchScoresCollection
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .orderBy('timeSeconds', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WordSearchScore));
    } catch (error) {
      console.error('Error getting word search leaderboard:', error);
      throw error;
    }
  }
}

export const wordSearchGameService = new WordSearchGameService(); 