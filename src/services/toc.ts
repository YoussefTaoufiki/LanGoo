import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface TocEntry {
  id: string;
  bookId: string;
  title: string;
  level: number;
  index: number;
  cfi: string;
  parent?: string;
  children?: string[];
  pageNumber?: number;
}

export interface TocMetadata {
  id?: string;
  bookId: string;
  userId: string;
  lastUpdated: number;
  totalEntries: number;
  maxDepth: number;
}

class TableOfContentsService {
  private tocCollection = firestore().collection('table_of_contents');
  private tocMetadataCollection = firestore().collection('toc_metadata');

  /**
   * Generate table of contents from EPUB
   */
  async generateToc(bookId: string, epubContent: any): Promise<TocEntry[]> {
    try {
      // TODO: Implement actual EPUB TOC generation
      // This would involve:
      // 1. Parse EPUB's .ncx or .xhtml navigation file
      // 2. Extract TOC structure
      // 3. Generate CFIs for each entry
      // 4. Calculate page numbers if available
      // 5. Build parent-child relationships

      // For now, return mock TOC
      const mockToc: TocEntry[] = [
        {
          id: '1',
          bookId,
          title: 'Chapter 1',
          level: 1,
          index: 0,
          cfi: '/6/4[chap01]!/4',
          children: ['2', '3'],
        },
        {
          id: '2',
          bookId,
          title: 'Section 1.1',
          level: 2,
          index: 1,
          cfi: '/6/4[chap01]!/4/2',
          parent: '1',
        },
        {
          id: '3',
          bookId,
          title: 'Section 1.2',
          level: 2,
          index: 2,
          cfi: '/6/4[chap01]!/4/6',
          parent: '1',
        },
      ];

      await this.saveToc(bookId, mockToc);
      return mockToc;
    } catch (error) {
      console.error('Error generating TOC:', error);
      throw error;
    }
  }

  /**
   * Get table of contents for a book
   */
  async getToc(bookId: string): Promise<TocEntry[]> {
    try {
      const snapshot = await this.tocCollection
        .where('bookId', '==', bookId)
        .orderBy('index')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as TocEntry));
    } catch (error) {
      console.error('Error getting TOC:', error);
      throw error;
    }
  }

  /**
   * Save table of contents
   */
  private async saveToc(bookId: string, entries: TocEntry[]): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const batch = firestore().batch();

      // Delete existing TOC entries
      const existingEntries = await this.tocCollection
        .where('bookId', '==', bookId)
        .get();
      existingEntries.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add new TOC entries
      entries.forEach(entry => {
        const ref = this.tocCollection.doc();
        batch.set(ref, entry);
      });

      // Update metadata
      const metadata: TocMetadata = {
        bookId,
        userId,
        lastUpdated: Date.now(),
        totalEntries: entries.length,
        maxDepth: Math.max(...entries.map(e => e.level)),
      };

      const metadataRef = this.tocMetadataCollection.doc(`${bookId}_${userId}`);
      batch.set(metadataRef, metadata);

      await batch.commit();
    } catch (error) {
      console.error('Error saving TOC:', error);
      throw error;
    }
  }

  /**
   * Get TOC metadata
   */
  async getTocMetadata(bookId: string): Promise<TocMetadata | null> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const doc = await this.tocMetadataCollection
        .doc(`${bookId}_${userId}`)
        .get();

      if (!doc.exists) return null;

      return {
        id: doc.id,
        ...doc.data(),
      } as TocMetadata;
    } catch (error) {
      console.error('Error getting TOC metadata:', error);
      throw error;
    }
  }

  /**
   * Update TOC entry
   */
  async updateTocEntry(id: string, data: Partial<TocEntry>): Promise<void> {
    try {
      await this.tocCollection.doc(id).update(data);
    } catch (error) {
      console.error('Error updating TOC entry:', error);
      throw error;
    }
  }
}

export const tocService = new TableOfContentsService(); 