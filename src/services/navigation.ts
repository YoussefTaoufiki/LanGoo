import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Chapter {
  id: string;
  title: string;
  href: string;
  level: number;
  index: number;
  parent?: string;
  children?: string[];
  startPage?: number;
  endPage?: number;
}

export interface ReadingProgress {
  id?: string;
  bookId: string;
  userId: string;
  currentChapter: string;
  currentCfi: string;
  currentPage: number;
  totalPages: number;
  progress: number; // 0-1
  lastRead: number;
}

export interface PageInfo {
  currentPage: number;
  totalPages: number;
  chapterId: string;
  cfi: string;
}

class NavigationService {
  private chaptersCollection = firestore().collection('chapters');
  private progressCollection = firestore().collection('reading_progress');

  /**
   * Get all chapters for a book
   */
  async getChapters(bookId: string): Promise<Chapter[]> {
    try {
      const snapshot = await this.chaptersCollection
        .where('bookId', '==', bookId)
        .orderBy('index')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Chapter));
    } catch (error) {
      console.error('Error getting chapters:', error);
      throw error;
    }
  }

  /**
   * Save chapters for a book
   */
  async saveChapters(bookId: string, chapters: Omit<Chapter, 'id'>[]): Promise<void> {
    try {
      const batch = firestore().batch();
      
      chapters.forEach((chapter) => {
        const ref = this.chaptersCollection.doc();
        batch.set(ref, {
          ...chapter,
          bookId,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error saving chapters:', error);
      throw error;
    }
  }

  /**
   * Get reading progress
   */
  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const doc = await this.progressCollection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .limit(1)
        .get();

      if (doc.empty) return null;

      const data = doc.docs[0].data() as Omit<ReadingProgress, 'id'>;
      return {
        ...data,
        id: doc.docs[0].id,
      };
    } catch (error) {
      console.error('Error getting reading progress:', error);
      throw error;
    }
  }

  /**
   * Update reading progress
   */
  async updateReadingProgress(bookId: string, data: Partial<Omit<ReadingProgress, 'id' | 'userId' | 'bookId'>>): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const snapshot = await this.progressCollection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .limit(1)
        .get();

      const now = Date.now();
      
      if (snapshot.empty) {
        // Create new progress
        await this.progressCollection.add({
          userId,
          bookId,
          ...data,
          lastRead: now,
        });
      } else {
        // Update existing progress
        await snapshot.docs[0].ref.update({
          ...data,
          lastRead: now,
        });
      }
    } catch (error) {
      console.error('Error updating reading progress:', error);
      throw error;
    }
  }

  /**
   * Get chapter by CFI
   */
  async getChapterByCfi(bookId: string, cfi: string): Promise<Chapter | null> {
    try {
      // TODO: Implement CFI parsing and chapter lookup
      // This would involve:
      // 1. Parse the CFI to get chapter information
      // 2. Query the chapters collection
      // 3. Return the matching chapter
      return null;
    } catch (error) {
      console.error('Error getting chapter by CFI:', error);
      throw error;
    }
  }

  /**
   * Get page info from CFI
   */
  async getPageInfo(bookId: string, cfi: string): Promise<PageInfo | null> {
    try {
      const chapter = await this.getChapterByCfi(bookId, cfi);
      if (!chapter) return null;

      // Get reading progress to get total pages
      const progress = await this.getReadingProgress(bookId);
      if (!progress) return null;

      // Calculate current page based on chapter and CFI
      // This is a simplified calculation - in reality, you'd need to parse the CFI
      // and calculate the exact page based on the EPUB's content
      const chapterProgress = this.calculateChapterProgress(cfi, chapter);
      const chapterPages = (chapter.endPage || 0) - (chapter.startPage || 0);
      const currentPage = Math.round((chapter.startPage || 0) + (chapterPages * chapterProgress));

      return {
        currentPage,
        totalPages: progress.totalPages,
        chapterId: chapter.id,
        cfi,
      };
    } catch (error) {
      console.error('Error getting page info:', error);
      throw error;
    }
  }

  /**
   * Jump to page
   */
  async jumpToPage(bookId: string, pageNumber: number): Promise<{ cfi: string; chapter: Chapter } | null> {
    try {
      // Get all chapters to find the one containing the target page
      const chapters = await this.getChapters(bookId);
      const targetChapter = chapters.find(
        chapter => (chapter.startPage || 0) <= pageNumber && (chapter.endPage || 0) >= pageNumber
      );

      if (!targetChapter) return null;

      // Calculate the CFI based on the page number within the chapter
      // This is a simplified calculation - in reality, you'd need to generate
      // a proper CFI based on the EPUB's content
      const chapterPages = (targetChapter.endPage || 0) - (targetChapter.startPage || 0);
      const pageOffset = pageNumber - (targetChapter.startPage || 0);
      const progress = pageOffset / chapterPages;
      const cfi = this.generateCfiFromProgress(targetChapter, progress);

      return {
        cfi,
        chapter: targetChapter,
      };
    } catch (error) {
      console.error('Error jumping to page:', error);
      throw error;
    }
  }

  /**
   * Calculate chapter progress from CFI
   */
  private calculateChapterProgress(cfi: string, chapter: Chapter): number {
    // TODO: Implement proper CFI parsing and progress calculation
    // This is a placeholder implementation
    // You would need to:
    // 1. Parse the CFI to get the position within the chapter
    // 2. Calculate the progress based on the total chapter content
    return 0.5; // Default to middle of chapter
  }

  /**
   * Generate CFI from progress
   */
  private generateCfiFromProgress(chapter: Chapter, progress: number): string {
    // TODO: Implement proper CFI generation
    // This is a placeholder implementation
    // You would need to:
    // 1. Parse the chapter's content
    // 2. Generate a valid CFI for the target position
    return `epubcfi(${chapter.href}#point=${progress})`; // Simplified CFI format
  }
}

export const navigationService = new NavigationService(); 