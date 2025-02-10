import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface ReadingSettings {
  id?: string;
  userId: string;
  bookId: string;
  fontSize: number;
  fontFamily: string;
  lineSpacing: number;
  margin: number;
  theme: 'light' | 'dark' | 'sepia';
  lastUpdated: number;
}

export const DEFAULT_SETTINGS: Omit<ReadingSettings, 'id' | 'userId' | 'bookId' | 'lastUpdated'> = {
  fontSize: 16,
  fontFamily: 'System',
  lineSpacing: 1.5,
  margin: 16,
  theme: 'light',
};

export const AVAILABLE_FONTS = [
  'System',
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
  'Verdana',
  'Courier New',
];

export const FONT_SIZE_RANGE = {
  min: 12,
  max: 32,
  step: 2,
};

export const LINE_SPACING_RANGE = {
  min: 1.0,
  max: 3.0,
  step: 0.25,
};

export const MARGIN_RANGE = {
  min: 8,
  max: 32,
  step: 4,
};

class SettingsService {
  private settingsCollection = firestore().collection('reading_settings');

  /**
   * Get reading settings for a book
   */
  async getSettings(bookId: string): Promise<ReadingSettings> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const doc = await this.settingsCollection
        .doc(`${bookId}_${userId}`)
        .get();

      if (!doc.exists) {
        // Return default settings if none exist
        return {
          userId,
          bookId,
          ...DEFAULT_SETTINGS,
          lastUpdated: Date.now(),
        };
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as ReadingSettings;
    } catch (error) {
      console.error('Error getting reading settings:', error);
      throw error;
    }
  }

  /**
   * Update reading settings
   */
  async updateSettings(
    bookId: string,
    settings: Partial<Omit<ReadingSettings, 'id' | 'userId' | 'bookId' | 'lastUpdated'>>
  ): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const docRef = this.settingsCollection.doc(`${bookId}_${userId}`);
      const doc = await docRef.get();

      if (!doc.exists) {
        // Create new settings
        await docRef.set({
          userId,
          bookId,
          ...DEFAULT_SETTINGS,
          ...settings,
          lastUpdated: Date.now(),
        });
      } else {
        // Update existing settings
        await docRef.update({
          ...settings,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error updating reading settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to default
   */
  async resetSettings(bookId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await this.settingsCollection
        .doc(`${bookId}_${userId}`)
        .set({
          userId,
          bookId,
          ...DEFAULT_SETTINGS,
          lastUpdated: Date.now(),
        });
    } catch (error) {
      console.error('Error resetting reading settings:', error);
      throw error;
    }
  }

  /**
   * Get global theme preference
   */
  async getGlobalTheme(): Promise<'light' | 'dark' | 'sepia'> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const doc = await this.settingsCollection
        .doc(`global_${userId}`)
        .get();

      if (!doc.exists) return 'light';
      return doc.data()?.theme || 'light';
    } catch (error) {
      console.error('Error getting global theme:', error);
      throw error;
    }
  }

  /**
   * Update global theme preference
   */
  async updateGlobalTheme(theme: 'light' | 'dark' | 'sepia'): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await this.settingsCollection
        .doc(`global_${userId}`)
        .set({
          userId,
          theme,
          lastUpdated: Date.now(),
        }, { merge: true });
    } catch (error) {
      console.error('Error updating global theme:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService(); 