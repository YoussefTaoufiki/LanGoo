import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Bookmark {
  id?: string;
  bookId: string;
  userId: string;
  chapterId: string;
  cfi: string; // EPUB CFI for precise location
  createdAt: number;
  updatedAt: number;
  title: string;
  text: string;
  note?: string;
  color?: string;
}

class BookmarkService {
  private collection = firestore().collection('bookmarks');

  /**
   * Create a new bookmark
   */
  async createBookmark(bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const now = Date.now();
      const bookmarkData: Omit<Bookmark, 'id'> = {
        ...bookmark,
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.collection.add(bookmarkData);
      return {
        id: docRef.id,
        ...bookmarkData,
      };
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }
  }

  /**
   * Get all bookmarks for a book
   */
  async getBookmarks(bookId: string): Promise<Bookmark[]> {
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
      } as Bookmark));
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      throw error;
    }
  }

  /**
   * Update a bookmark
   */
  async updateBookmark(id: string, data: Partial<Omit<Bookmark, 'id' | 'userId' | 'bookId' | 'createdAt'>>): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const bookmark = await this.collection.doc(id).get();
      if (!bookmark.exists) throw new Error('Bookmark not found');
      if (bookmark.data()?.userId !== userId) throw new Error('Not authorized');

      await this.collection.doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(id: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const bookmark = await this.collection.doc(id).get();
      if (!bookmark.exists) throw new Error('Bookmark not found');
      if (bookmark.data()?.userId !== userId) throw new Error('Not authorized');

      await this.collection.doc(id).delete();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  /**
   * Get bookmark by CFI
   */
  async getBookmarkByCFI(bookId: string, cfi: string): Promise<Bookmark | null> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .where('cfi', '==', cfi)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Bookmark;
    } catch (error) {
      console.error('Error getting bookmark by CFI:', error);
      throw error;
    }
  }

  /**
   * Sync bookmarks with cloud
   */
  async syncBookmarks(bookId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // TODO: Implement sync logic with conflict resolution
      // This would involve:
      // 1. Getting local bookmarks
      // 2. Getting cloud bookmarks
      // 3. Merging them with conflict resolution
      // 4. Updating both local and cloud storage
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
      throw error;
    }
  }
}

export const bookmarkService = new BookmarkService(); 