import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface SearchResult {
  id: string;
  bookId: string;
  chapterId: string;
  cfi: string;
  text: string;
  snippet: string;
  matchStart: number;
  matchEnd: number;
  createdAt: number;
}

export interface SearchHistory {
  id?: string;
  userId: string;
  query: string;
  bookId: string;
  timestamp: number;
}

class SearchService {
  private searchCollection = firestore().collection('search_results');
  private historyCollection = firestore().collection('search_history');

  /**
   * Search within a book
   */
  async searchInBook(bookId: string, query: string): Promise<SearchResult[]> {
    try {
      // TODO: Implement actual EPUB content search
      // This would involve:
      // 1. Loading the EPUB content
      // 2. Parsing the content
      // 3. Performing text search
      // 4. Generating CFIs for matches
      // 5. Creating snippets with context

      // For now, return mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          bookId,
          chapterId: 'chapter1',
          cfi: '/6/4[chap01]!/4/2/1:10',
          text: query,
          snippet: `...text before ${query} text after...`,
          matchStart: 10,
          matchEnd: 10 + query.length,
          createdAt: Date.now(),
        },
      ];

      // Save search history
      await this.saveSearchHistory(bookId, query);

      return mockResults;
    } catch (error) {
      console.error('Error searching in book:', error);
      throw error;
    }
  }

  /**
   * Get search history for a book
   */
  async getSearchHistory(bookId: string): Promise<SearchHistory[]> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const snapshot = await this.historyCollection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as SearchHistory));
    } catch (error) {
      console.error('Error getting search history:', error);
      throw error;
    }
  }

  /**
   * Save search history
   */
  private async saveSearchHistory(bookId: string, query: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await this.historyCollection.add({
        userId,
        bookId,
        query,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error saving search history:', error);
      throw error;
    }
  }

  /**
   * Clear search history for a book
   */
  async clearSearchHistory(bookId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const snapshot = await this.historyCollection
        .where('userId', '==', userId)
        .where('bookId', '==', bookId)
        .get();

      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  }

  /**
   * Delete a search history entry
   */
  async deleteSearchHistory(id: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const doc = await this.historyCollection.doc(id).get();
      if (!doc.exists) throw new Error('Search history not found');
      if (doc.data()?.userId !== userId) throw new Error('Not authorized');

      await this.historyCollection.doc(id).delete();
    } catch (error) {
      console.error('Error deleting search history:', error);
      throw error;
    }
  }
}

export const searchService = new SearchService(); 