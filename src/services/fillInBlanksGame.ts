import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface FillInBlanksPuzzle {
  id?: string;
  sentence: string;
  blankedWords: string[];
  options: string[];
  context?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bookId: string;
}

export interface FillInBlanksScore {
  id?: string;
  userId: string;
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSeconds: number;
  correctAnswers: number;
  totalQuestions: number;
  timestamp: number;
}

class FillInBlanksGameService {
  private fillInBlanksCollection = firestore().collection('fillInBlanksPuzzles');
  private scoresCollection = firestore().collection('fillInBlanksScores');

  private readonly DIFFICULTY_CONFIG = {
    easy: {
      blankPercentage: 0.2,
      optionsPerBlank: 3,
      contextProvided: true,
    },
    medium: {
      blankPercentage: 0.3,
      optionsPerBlank: 4,
      contextProvided: true,
    },
    hard: {
      blankPercentage: 0.4,
      optionsPerBlank: 5,
      contextProvided: false,
    },
  };

  async generatePuzzle(bookId: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<FillInBlanksPuzzle> {
    try {
      // Get sentences from book annotations
      const annotations = await firestore()
        .collection('annotations')
        .where('bookId', '==', bookId)
        .get();

      const sentences = annotations.docs
        .map(doc => doc.data())
        .filter(annotation => {
          const wordCount = annotation.text.split(/\s+/).length;
          return wordCount >= 5 && wordCount <= 15; // Reasonable sentence length
        });

      if (sentences.length === 0) {
        throw new Error('No suitable sentences found for the game');
      }

      // Select a random sentence
      const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
      const words = randomSentence.text.split(/\s+/);
      
      // Determine number of blanks based on difficulty
      const config = this.DIFFICULTY_CONFIG[difficulty];
      const numBlanks = Math.max(1, Math.floor(words.length * config.blankPercentage));
      
      // Select random words to blank out
      const blankIndices = this.getRandomIndices(words.length, numBlanks);
      const blankedWords = blankIndices.map(index => words[index]);
      
      // Create options for each blank
      const options = this.generateOptions(blankedWords, sentences, config.optionsPerBlank);
      
      // Create the puzzle sentence with blanks
      const puzzleSentence = words.map((word: string, index: number) => 
        blankIndices.includes(index) ? '___' : word
      ).join(' ');

      const puzzle: FillInBlanksPuzzle = {
        sentence: puzzleSentence,
        blankedWords,
        options,
        context: config.contextProvided ? randomSentence.context : undefined,
        difficulty,
        bookId,
      };

      // Store the puzzle
      const docRef = await this.fillInBlanksCollection.add(puzzle);
      return { ...puzzle, id: docRef.id };
    } catch (error) {
      console.error('Error generating fill in blanks puzzle:', error);
      throw error;
    }
  }

  private getRandomIndices(max: number, count: number): number[] {
    const indices = Array.from({ length: max }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, count);
  }

  private generateOptions(correctWords: string[], sentences: any[], optionsPerBlank: number): string[] {
    const allWords = sentences
      .map(sentence => sentence.text.split(/\s+/))
      .flat()
      .filter((word: string) => !correctWords.includes(word));
    
    const options = [...new Set(allWords)]; // Remove duplicates
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    // For each blank, include the correct word and random options
    return correctWords.map(correctWord => {
      const wrongOptions = shuffledOptions
        .filter(word => word !== correctWord)
        .slice(0, optionsPerBlank - 1);
      
      return [correctWord, ...wrongOptions].sort(() => Math.random() - 0.5);
    }).flat();
  }

  async checkAnswer(puzzleId: string, answers: string[]): Promise<boolean[]> {
    try {
      const puzzleDoc = await this.fillInBlanksCollection.doc(puzzleId).get();
      if (!puzzleDoc.exists) {
        throw new Error('Puzzle not found');
      }

      const puzzle = puzzleDoc.data() as FillInBlanksPuzzle;
      return answers.map((answer, index) => answer === puzzle.blankedWords[index]);
    } catch (error) {
      console.error('Error checking answers:', error);
      throw error;
    }
  }

  async saveScore(scoreData: Omit<FillInBlanksScore, 'id' | 'userId'>): Promise<FillInBlanksScore> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const score: Omit<FillInBlanksScore, 'id'> = {
        ...scoreData,
        userId,
      };

      const docRef = await this.scoresCollection.add(score);
      return { ...score, id: docRef.id };
    } catch (error) {
      console.error('Error saving fill in blanks score:', error);
      throw error;
    }
  }

  async getLeaderboard(bookId: string, difficulty: 'easy' | 'medium' | 'hard', limit = 10): Promise<FillInBlanksScore[]> {
    try {
      const snapshot = await this.scoresCollection
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .orderBy('correctAnswers', 'desc')
        .orderBy('timeSeconds', 'asc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FillInBlanksScore));
    } catch (error) {
      console.error('Error getting fill in blanks leaderboard:', error);
      throw error;
    }
  }
}

export const fillInBlanksGameService = new FillInBlanksGameService(); 