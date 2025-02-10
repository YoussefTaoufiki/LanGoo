import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Annotation {
  id?: string;
  bookId: string;
  userId: string;
  chapterId: string;
  cfi: string;
  createdAt: number;
  updatedAt: number;
  text: string;
  highlightedText: string;
  color: string;
  note?: string;
  tags?: string[];
}

class AnnotationService {
  private collection = firestore().collection('annotations');

  /**
   * Create a new annotation
   */
  async createAnnotation(annotation: Omit<Annotation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Annotation> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const now = Date.now();
      const annotationData: Omit<Annotation, 'id'> = {
        ...annotation,
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.collection.add(annotationData);
      return {
        id: docRef.id,
        ...annotationData,
      };
    } catch (error) {
      console.error('Error creating annotation:', error);
      throw error;
    }
  }

  /**
   * Get all annotations for a book
   */
  async getAnnotations(bookId: string): Promise<Annotation[]> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      } as Annotation));
    } catch (error) {
      console.error('Error getting annotations:', error);
      throw error;
    }
  }

  /**
   * Update an annotation
   */
  async updateAnnotation(id: string, data: Partial<Omit<Annotation, 'id' | 'userId' | 'bookId' | 'createdAt'>>): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const annotation = await this.collection.doc(id).get();
      if (!annotation.exists) throw new Error('Annotation not found');
      if (annotation.data()?.userId !== userId) throw new Error('Not authorized');

      await this.collection.doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw error;
    }
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(id: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const annotation = await this.collection.doc(id).get();
      if (!annotation.exists) throw new Error('Annotation not found');
      if (annotation.data()?.userId !== userId) throw new Error('Not authorized');

      await this.collection.doc(id).delete();
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  }

  /**
   * Get annotations by chapter
   */
  async getAnnotationsByChapter(bookId: string, chapterId: string): Promise<Annotation[]> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .where('chapterId', '==', chapterId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      } as Annotation));
    } catch (error) {
      console.error('Error getting chapter annotations:', error);
      throw error;
    }
  }

  /**
   * Export annotations
   */
  async exportAnnotations(bookId: string): Promise<string> {
    try {
      const annotations = await this.getAnnotations(bookId);
      const exportData = annotations.map(annotation => ({
        text: annotation.highlightedText,
        note: annotation.note,
        tags: annotation.tags,
        createdAt: new Date(annotation.createdAt).toISOString(),
      }));

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting annotations:', error);
      throw error;
    }
  }
}

export const annotationService = new AnnotationService(); 