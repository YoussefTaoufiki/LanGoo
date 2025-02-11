import { firestore, firebaseAuth } from '../firebase';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface MultipleChoiceScore {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correctAnswers: number;
  totalQuestions: number;
  totalAttempts: number;
  timeTaken: number;
  timestamp: number;
}

class MultipleChoiceGameService {
  private readonly questionsCollection: CollectionReference;
  private readonly submissionsCollection: CollectionReference;
  private readonly scoresCollection: CollectionReference;

  constructor() {
    this.questionsCollection = collection(firestore, 'multipleChoiceQuestions');
    this.submissionsCollection = collection(firestore, 'multipleChoiceSubmissions');
    this.scoresCollection = collection(firestore, 'multipleChoiceScores');
  }

  private readonly DIFFICULTY_CONFIG = {
    easy: {
      optionsCount: 3,
      timeLimit: 30, // seconds per question
      includeContext: true,
      categories: ['vocabulary'],
    },
    medium: {
      optionsCount: 4,
      timeLimit: 45,
      includeContext: true,
      categories: ['vocabulary', 'grammar'],
    },
    hard: {
      optionsCount: 4,
      timeLimit: 60,
      includeContext: false,
      categories: ['vocabulary', 'grammar', 'comprehension'],
    },
  };

  async generateQuestions(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    count: number = 10
  ): Promise<MultipleChoiceQuestion[]> {
    const snapshot = await getDocs(
      query(
        this.questionsCollection,
        where('bookId', '==', bookId),
        where('difficulty', '==', difficulty)
      )
    );

    const questions = snapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as MultipleChoiceQuestion[];

    // Shuffle and limit to requested count
    return questions
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
  }

  async checkAnswer(questionId: string, answer: string): Promise<{ isCorrect: boolean; explanation: string }> {
    const questionDoc = await getDocs(
      query(
        this.questionsCollection,
        where('id', '==', questionId)
      )
    );
    const question = questionDoc.docs[0].data() as MultipleChoiceQuestion;

    return {
      isCorrect: question.correctAnswer === answer,
      explanation: question.explanation,
    };
  }

  async submitScore(score: Omit<MultipleChoiceScore, 'id' | 'userId' | 'userName'>): Promise<MultipleChoiceScore> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('User must be logged in to submit score');
    }

    const scoreData: Omit<MultipleChoiceScore, 'id'> = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      ...score
    };

    const docRef = await addDoc(this.scoresCollection, scoreData);
    return { ...scoreData, id: docRef.id };
  }

  async getLeaderboard(bookId: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<MultipleChoiceScore[]> {
    const snapshot = await getDocs(
      query(
        this.scoresCollection,
        where('bookId', '==', bookId),
        where('difficulty', '==', difficulty),
        orderBy('correctAnswers', 'desc'),
        orderBy('timeTaken', 'asc'),
        limit(10)
      )
    );

    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as MultipleChoiceScore[];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const multipleChoiceGameService = new MultipleChoiceGameService(); 