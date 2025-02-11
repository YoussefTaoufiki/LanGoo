import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Sound from 'react-native-sound';
import { GoogleCloudTTS } from './googleCloudTTS';

export interface SpeakingPrompt {
  id: string;
  text: string;
  translation?: string;
  context?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bookId: string;
  language: string;
  category: 'pronunciation' | 'conversation' | 'reading';
}

export interface SpeakingSubmission {
  id: string;
  promptId: string;
  userId: string;
  userName: string;
  audioUrl: string;
  duration: number;
  pronunciationScore: number;
  fluencyScore: number;
  accuracyScore: number;
  overallScore: number;
  feedback: string[];
  corrections: {
    word: string;
    correctPronunciation: string;
    userPronunciation: string;
    timestamp: number;
  }[];
  timestamp: number;
}

export interface SpeakingScore {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  averageScore: number;
  submissionsCount: number;
  timestamp: number;
}

class SpeakingPracticeService {
  private readonly promptsCollection = firestore().collection('speakingPrompts');
  private readonly submissionsCollection = firestore().collection('speakingSubmissions');
  private readonly scoresCollection = firestore().collection('speakingScores');
  private readonly tts: GoogleCloudTTS;

  constructor() {
    this.tts = new GoogleCloudTTS();
    Sound.setCategory('Playback');
  }

  private readonly DIFFICULTY_CONFIG = {
    easy: {
      maxLength: 50, // characters
      speed: 0.8, // TTS speed
      allowRetries: true,
      includeTranslation: true,
      includeContext: true,
    },
    medium: {
      maxLength: 100,
      speed: 1.0,
      allowRetries: true,
      includeTranslation: true,
      includeContext: false,
    },
    hard: {
      maxLength: 200,
      speed: 1.2,
      allowRetries: false,
      includeTranslation: false,
      includeContext: false,
    },
  };

  async generatePrompt(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    language: string,
    category?: string
  ): Promise<SpeakingPrompt> {
    try {
      let query = this.promptsCollection
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .where('language', '==', language);

      if (category) {
        query = query.where('category', '==', category);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        throw new Error('No speaking prompts available for the selected criteria');
      }

      const prompts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SpeakingPrompt[];

      return prompts[Math.floor(Math.random() * prompts.length)];
    } catch (error) {
      console.error('Error generating speaking prompt:', error);
      throw error;
    }
  }

  async playPrompt(text: string, language: string, speed: number = 1.0): Promise<void> {
    try {
      await this.tts.speak(text, language, { speakingRate: speed });
    } catch (error) {
      console.error('Error playing prompt:', error);
      throw error;
    }
  }

  async submitRecording(
    promptId: string,
    audioUrl: string,
    duration: number
  ): Promise<SpeakingSubmission> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User must be logged in to submit recording');
      }

      // Analyze the recording
      const analysis = await this.analyzeRecording(audioUrl);

      const submission: Omit<SpeakingSubmission, 'id'> = {
        promptId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        audioUrl,
        duration,
        ...analysis,
        timestamp: Date.now(),
      };

      const docRef = await this.submissionsCollection.add(submission);
      return { id: docRef.id, ...submission };
    } catch (error) {
      console.error('Error submitting recording:', error);
      throw error;
    }
  }

  private async analyzeRecording(audioUrl: string): Promise<{
    pronunciationScore: number;
    fluencyScore: number;
    accuracyScore: number;
    overallScore: number;
    feedback: string[];
    corrections: {
      word: string;
      correctPronunciation: string;
      userPronunciation: string;
      timestamp: number;
    }[];
  }> {
    // TODO: Integrate with a speech recognition and analysis API
    // For now, return placeholder analysis
    return {
      pronunciationScore: 85,
      fluencyScore: 80,
      accuracyScore: 90,
      overallScore: 85,
      feedback: [
        'Good pronunciation of most words',
        'Natural speaking pace',
        'Clear enunciation',
        'Consider working on stress patterns',
      ],
      corrections: [
        {
          word: 'example',
          correctPronunciation: 'ɪɡˈzæmpəl',
          userPronunciation: 'ɪkˈsæmpəl',
          timestamp: 1.5,
        },
      ],
    };
  }

  async updateScore(submission: SpeakingSubmission): Promise<SpeakingScore> {
    try {
      const promptDoc = await this.promptsCollection.doc(submission.promptId).get();
      const prompt = promptDoc.data() as SpeakingPrompt;

      // Get user's previous scores
      const userScores = await this.scoresCollection
        .where('userId', '==', submission.userId)
        .where('bookId', '==', prompt.bookId)
        .where('difficulty', '==', prompt.difficulty)
        .get();

      let score: SpeakingScore;
      if (userScores.empty) {
        score = {
          id: this.scoresCollection.doc().id,
          userId: submission.userId,
          userName: submission.userName,
          bookId: prompt.bookId,
          difficulty: prompt.difficulty,
          averageScore: submission.overallScore,
          submissionsCount: 1,
          timestamp: Date.now(),
        };
      } else {
        const existingScore = userScores.docs[0].data() as SpeakingScore;
        const newAverage = (
          (existingScore.averageScore * existingScore.submissionsCount + submission.overallScore) /
          (existingScore.submissionsCount + 1)
        );
        score = {
          ...existingScore,
          averageScore: newAverage,
          submissionsCount: existingScore.submissionsCount + 1,
          timestamp: Date.now(),
        };
      }

      await this.scoresCollection.doc(score.id).set(score);
      return score;
    } catch (error) {
      console.error('Error updating speaking score:', error);
      throw error;
    }
  }

  async getLeaderboard(
    bookId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<SpeakingScore[]> {
    try {
      const snapshot = await this.scoresCollection
        .where('bookId', '==', bookId)
        .where('difficulty', '==', difficulty)
        .orderBy('averageScore', 'desc')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SpeakingScore[];
    } catch (error) {
      console.error('Error getting speaking leaderboard:', error);
      throw error;
    }
  }
}

export const speakingPracticeService = new SpeakingPracticeService(); 