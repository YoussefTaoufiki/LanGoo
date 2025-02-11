import { firestore, firebaseAuth } from '../firebase';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { 
  DocumentData, 
  QueryDocumentSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  orderBy,
  limit,
  CollectionReference,
  DocumentReference,
  Query
} from 'firebase/firestore';

export interface WritingPrompt {
  id: string;
  prompt: string;
  context?: string;
  suggestedLength?: number;
  keywords?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  bookId: string;
  category: 'creative' | 'descriptive' | 'narrative' | 'argumentative';
}

export interface WritingSubmission {
  id: string;
  promptId: string;
  userId: string;
  userName: string;
  content: string;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  overallScore: number;
  feedback: string[];
  corrections: {
    original: string;
    suggestion: string;
    type: 'grammar' | 'spelling' | 'style';
    explanation: string;
  }[];
  timestamp: number;
}

export interface WritingScore {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  averageScore: number;
  submissionsCount: number;
  timestamp: number;
}

class WritingExerciseService {
  private readonly promptsCollection: CollectionReference<WritingPrompt>;
  private readonly submissionsCollection: CollectionReference<WritingSubmission>;
  private readonly scoresCollection: CollectionReference<WritingScore>;

  constructor() {
    this.promptsCollection = collection(firestore, 'writingPrompts') as CollectionReference<WritingPrompt>;
    this.submissionsCollection = collection(firestore, 'writingSubmissions') as CollectionReference<WritingSubmission>;
    this.scoresCollection = collection(firestore, 'writingScores') as CollectionReference<WritingScore>;
  }

  private readonly DIFFICULTY_CONFIG = {
    easy: {
      minWords: 50,
      maxWords: 100,
      timeLimit: 15,
      requireKeywords: true,
      grammarComplexity: 'basic',
    },
    medium: {
      minWords: 100,
      maxWords: 200,
      timeLimit: 25,
      requireKeywords: true,
      grammarComplexity: 'intermediate',
    },
    hard: {
      minWords: 200,
      maxWords: 400,
      timeLimit: 40,
      requireKeywords: true,
      grammarComplexity: 'advanced',
    },
  } as const;

  async generatePrompt(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    category?: string
  ): Promise<WritingPrompt> {
    try {
      const baseQuery = query(
        this.promptsCollection,
        where('bookId', '==', bookId),
        where('difficulty', '==', difficulty),
        ...(category ? [where('category', '==', category)] : [])
      );

      const snapshot = await getDocs(baseQuery);

      if (snapshot.empty) {
        throw new Error('No writing prompts available for the selected criteria');
      }

      const prompts = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      return prompts[Math.floor(Math.random() * prompts.length)];
    } catch (error) {
      console.error('Error generating writing prompt:', error);
      throw error;
    }
  }

  async submitWriting(
    promptId: string,
    content: string
  ): Promise<WritingSubmission> {
    try {
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to submit writing');
      }

      const analysis = await this.analyzeWriting(content);

      const submission: Omit<WritingSubmission, 'id'> = {
        promptId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        content,
        ...analysis,
        timestamp: Date.now(),
      };

      const docRef = await addDoc(this.submissionsCollection, submission);
      return { id: docRef.id, ...submission };
    } catch (error) {
      console.error('Error submitting writing:', error);
      throw error;
    }
  }

  private async analyzeWriting(content: string): Promise<{
    grammarScore: number;
    vocabularyScore: number;
    coherenceScore: number;
    overallScore: number;
    feedback: string[];
    corrections: {
      original: string;
      suggestion: string;
      type: 'grammar' | 'spelling' | 'style';
      explanation: string;
    }[];
  }> {
    // TODO: Integrate with a grammar checking API
    return {
      grammarScore: 85,
      vocabularyScore: 80,
      coherenceScore: 90,
      overallScore: 85,
      feedback: [
        'Good use of vocabulary',
        'Clear paragraph structure',
        'Consider varying sentence length for better flow',
      ],
      corrections: [
        {
          original: 'their',
          suggestion: 'there',
          type: 'grammar',
          explanation: 'Use "there" for location, "their" for possession',
        },
      ],
    };
  }

  async updateScore(submission: WritingSubmission): Promise<WritingScore> {
    try {
      const promptDocRef = doc(this.promptsCollection, submission.promptId);
      const promptDoc = await getDoc(promptDocRef);
      const prompt = promptDoc.data();

      if (!prompt) {
        throw new Error('Prompt not found');
      }

      const userScoresQuery = query(
        this.scoresCollection,
        where('userId', '==', submission.userId),
        where('bookId', '==', prompt.bookId),
        where('difficulty', '==', prompt.difficulty)
      );

      const userScoresSnapshot = await getDocs(userScoresQuery);

      let score: WritingScore;
      if (userScoresSnapshot.empty) {
        const newScore: Omit<WritingScore, 'id'> = {
          userId: submission.userId,
          userName: submission.userName,
          bookId: prompt.bookId,
          difficulty: prompt.difficulty,
          averageScore: submission.overallScore,
          submissionsCount: 1,
          timestamp: Date.now(),
        };

        const docRef = await addDoc(this.scoresCollection, newScore);
        score = { ...newScore, id: docRef.id };
      } else {
        const existingScore = userScoresSnapshot.docs[0].data();
        const newAverage = (
          (existingScore.averageScore * existingScore.submissionsCount + submission.overallScore) /
          (existingScore.submissionsCount + 1)
        );

        const updatedScore: Omit<WritingScore, 'id'> = {
          userId: existingScore.userId,
          userName: existingScore.userName,
          bookId: existingScore.bookId,
          difficulty: existingScore.difficulty,
          averageScore: newAverage,
          submissionsCount: existingScore.submissionsCount + 1,
          timestamp: Date.now(),
        };

        const scoreId = userScoresSnapshot.docs[0].id;
        score = { ...updatedScore, id: scoreId };
        await setDoc(doc(this.scoresCollection, scoreId), updatedScore);
      }

      return score;
    } catch (error) {
      console.error('Error updating writing score:', error);
      throw error;
    }
  }

  async getLeaderboard(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<WritingScore[]> {
    try {
      const leaderboardQuery = query(
        this.scoresCollection,
        where('bookId', '==', bookId),
        where('difficulty', '==', difficulty),
        orderBy('averageScore', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(leaderboardQuery);

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
    } catch (error) {
      console.error('Error getting writing leaderboard:', error);
      throw error;
    }
  }

  async submitScore(score: Omit<WritingScore, 'id' | 'userId' | 'userName'>) {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User must be logged in to submit score');
    }

    // ... rest of the method ...
  }
}

export const writingExerciseService = new WritingExerciseService();

const mapExerciseDoc = (doc: QueryDocumentSnapshot<DocumentData>): WritingPrompt => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
  } as WritingPrompt;
};

const mapSubmissionDoc = (doc: QueryDocumentSnapshot<DocumentData>): WritingSubmission => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
  } as WritingSubmission;
}; 