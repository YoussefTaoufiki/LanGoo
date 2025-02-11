import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { GoogleCloudTTS } from './googleCloudTTS';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfoState } from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';

// Enable offline persistence
firestore().settings({
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    persistence: true,
});

// Cache keys
const CACHE_KEYS = {
    VOCABULARY_ITEMS: 'vocabulary_items_cache',
    LAST_SYNC: 'vocabulary_last_sync',
};

export interface VocabularyItem {
    id: string;
    word: string;
    translation: string;
    phonetic: string;
    language: string;
    examples: string[];
    tags: string[];
    isFavorite: boolean;
    masteryScore: number;
    practiceCount: number;
    lastPracticed: number;
    sourceBook?: string;
    sourceChapter?: string;
    notes?: string;
    createdAt: number;
    updatedAt: number;
}

export interface VocabularyFilter {
    searchTerm?: string;
    language?: string;
    favorite?: boolean;
    needsPractice?: boolean;
    sourceBook?: string;
    tags?: string[];
    masteryScoreBelow?: number;
    masteryScoreAbove?: number;
    itemId?: string;
    pageSize?: number;
    lastVisible?: FirebaseFirestoreTypes.DocumentSnapshot;
}

export interface PaginatedVocabularyResult {
    items: VocabularyItem[];
    lastVisible: FirebaseFirestoreTypes.DocumentSnapshot | null;
    hasMore: boolean;
}

class VocabularyService {
    private tts: GoogleCloudTTS;
    private readonly DEFAULT_PAGE_SIZE = 20;
    private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.tts = new GoogleCloudTTS();
        this.setupOfflineSync();
    }

    private async setupOfflineSync() {
        // Subscribe to network changes
        NetInfo.addEventListener((state: NetInfoState) => {
            if (state.isConnected) {
                this.syncOfflineChanges();
            }
        });
    }

    private async syncOfflineChanges() {
        try {
            const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
            const lastSyncTime = lastSync ? parseInt(lastSync) : 0;
            
            if (Date.now() - lastSyncTime < this.SYNC_INTERVAL) {
                return;
            }

            // Sync local changes with server
            const batch = firestore().batch();
            const pendingChanges = await AsyncStorage.getItem('pending_changes');
            
            if (pendingChanges) {
                const changes = JSON.parse(pendingChanges);
                for (const change of changes) {
                    const ref = firestore().collection('vocabulary').doc(change.id);
                    batch.update(ref, change.data);
                }
                await batch.commit();
                await AsyncStorage.removeItem('pending_changes');
            }

            await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
        } catch (error) {
            console.error('Error syncing offline changes:', error);
        }
    }

    private async cacheItems(items: VocabularyItem[]) {
        try {
            await AsyncStorage.setItem(CACHE_KEYS.VOCABULARY_ITEMS, JSON.stringify(items));
        } catch (error) {
            console.error('Error caching items:', error);
        }
    }

    private async getCachedItems(): Promise<VocabularyItem[]> {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEYS.VOCABULARY_ITEMS);
            return cached ? JSON.parse(cached) : [];
        } catch (error) {
            console.error('Error getting cached items:', error);
            return [];
        }
    }

    async getVocabularyItems(filter?: VocabularyFilter): Promise<PaginatedVocabularyResult> {
        try {
            const networkState = await NetInfo.fetch();
            
            if (!networkState.isConnected) {
                const cachedItems = await this.getCachedItems();
                return {
                    items: this.applyFilters(cachedItems, filter),
                    lastVisible: null,
                    hasMore: false,
                };
            }

            let q: FirebaseFirestoreTypes.Query = firestore().collection('vocabulary')
                .orderBy('updatedAt', 'desc');

            if (filter) {
                if (filter.favorite) {
                    q = q.where('isFavorite', '==', true);
                }
                if (filter.language) {
                    q = q.where('language', '==', filter.language);
                }
                if (filter.sourceBook) {
                    q = q.where('sourceBook', '==', filter.sourceBook);
                }
                if (filter.needsPractice) {
                    q = q.where('masteryScore', '<', 70);
                }
                if (filter.masteryScoreBelow) {
                    q = q.where('masteryScore', '<', filter.masteryScoreBelow);
                }
                if (filter.masteryScoreAbove) {
                    q = q.where('masteryScore', '>', filter.masteryScoreAbove);
                }
                if (filter.itemId) {
                    q = q.where('id', '==', filter.itemId);
                }

                if (filter.lastVisible) {
                    q = q.startAfter(filter.lastVisible);
                }
            }

            const pageSize = filter?.pageSize || this.DEFAULT_PAGE_SIZE;
            q = q.limit(pageSize + 1);

            const querySnapshot = await q.get();
            const hasMore = querySnapshot.docs.length > pageSize;
            const docs = hasMore ? querySnapshot.docs.slice(0, -1) : querySnapshot.docs;
            
            let items = docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
                id: doc.id,
                ...doc.data()
            })) as VocabularyItem[];

            if (filter) {
                if (filter.searchTerm) {
                    const searchLower = filter.searchTerm.toLowerCase();
                    items = items.filter(item =>
                        item.word.toLowerCase().includes(searchLower) ||
                        item.translation.toLowerCase().includes(searchLower) ||
                        item.notes?.toLowerCase().includes(searchLower)
                    );
                }
                if (filter.tags && filter.tags.length > 0) {
                    items = items.filter(item =>
                        filter.tags!.some(tag => item.tags.includes(tag))
                    );
                }
            }

            // Cache the fetched items
            await this.cacheItems(items);

            return {
                items,
                lastVisible: docs.length > 0 ? docs[docs.length - 1] : null,
                hasMore
            };
        } catch (error) {
            console.error('Error fetching vocabulary items:', error);
            
            // Fallback to cache on error
            const cachedItems = await this.getCachedItems();
            return {
                items: this.applyFilters(cachedItems, filter),
                lastVisible: null,
                hasMore: false,
            };
        }
    }

    private applyFilters(items: VocabularyItem[], filter?: VocabularyFilter): VocabularyItem[] {
        if (!filter) return items;

        return items.filter(item => {
            if (filter.favorite && !item.isFavorite) return false;
            if (filter.language && item.language !== filter.language) return false;
            if (filter.sourceBook && item.sourceBook !== filter.sourceBook) return false;
            if (filter.needsPractice && item.masteryScore >= 70) return false;
            if (filter.masteryScoreBelow && item.masteryScore >= filter.masteryScoreBelow) return false;
            if (filter.masteryScoreAbove && item.masteryScore <= filter.masteryScoreAbove) return false;
            if (filter.itemId && item.id !== filter.itemId) return false;
            
            if (filter.searchTerm) {
                const searchLower = filter.searchTerm.toLowerCase();
                return item.word.toLowerCase().includes(searchLower) ||
                    item.translation.toLowerCase().includes(searchLower) ||
                    item.notes?.toLowerCase().includes(searchLower);
            }
            
            if (filter.tags && filter.tags.length > 0) {
                return filter.tags.some(tag => item.tags.includes(tag));
            }
            
            return true;
        });
    }

    async addVocabularyItem(item: Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<VocabularyItem> {
        try {
            const timestamp = Date.now();
            const docRef = firestore().collection('vocabulary').add({
                ...item,
                createdAt: timestamp,
                updatedAt: timestamp,
            });

            return {
                id: (await docRef).id,
                ...item,
                createdAt: timestamp,
                updatedAt: timestamp,
            };
        } catch (error) {
            console.error('Error adding vocabulary item:', error);
            throw error;
        }
    }

    async updateVocabularyItem(id: string, updates: Partial<VocabularyItem>): Promise<VocabularyItem> {
        try {
            const docRef = firestore().collection('vocabulary').doc(id);
            const timestamp = Date.now();
            const updatedData = {
                ...updates,
                updatedAt: timestamp,
            };

            await docRef.update(updatedData);

            const updatedDoc = await docRef.get();
            const item = updatedDoc.data() as VocabularyItem;

            return {
                ...item,
                id: updatedDoc.id,
                ...updates,
                updatedAt: timestamp,
            };
        } catch (error) {
            console.error('Error updating vocabulary item:', error);
            throw error;
        }
    }

    async deleteVocabularyItem(id: string): Promise<void> {
        try {
            await firestore().collection('vocabulary').doc(id).delete();
        } catch (error) {
            console.error('Error deleting vocabulary item:', error);
            throw error;
        }
    }

    async playWordAudio(word: string, language: string): Promise<void> {
        try {
            await this.tts.speak(word, language);
        } catch (error) {
            console.error('Error playing word audio:', error);
            throw error;
        }
    }

    async updateMasteryScore(id: string, score: number): Promise<void> {
        try {
            const docRef = firestore().collection('vocabulary').doc(id);
            const doc = await docRef.get();
            const item = doc.data() as VocabularyItem;

            await this.updateVocabularyItem(id, {
                masteryScore: score,
                lastPracticed: Date.now(),
                practiceCount: (item.practiceCount || 0) + 1,
            });
        } catch (error) {
            console.error('Error updating mastery score:', error);
            throw error;
        }
    }

    async toggleFavorite(id: string): Promise<void> {
        try {
            const docRef = firestore().collection('vocabulary').doc(id);
            const doc = await docRef.get();
            const item = doc.data() as VocabularyItem;

            await this.updateVocabularyItem(id, {
                isFavorite: !item.isFavorite,
            });
        } catch (error) {
            console.error('Error toggling favorite status:', error);
            throw error;
        }
    }

    async exportVocabulary(format: 'csv' | 'json'): Promise<string> {
        try {
            const result = await this.getVocabularyItems();
            const items = result.items;

            if (format === 'json') {
                return JSON.stringify(items, null, 2);
            } else {
                const headers = [
                    'Word',
                    'Translation',
                    'Phonetic',
                    'Language',
                    'Examples',
                    'Tags',
                    'Favorite',
                    'Mastery Score',
                    'Practice Count',
                    'Last Practiced',
                    'Source Book',
                    'Source Chapter',
                    'Notes',
                    'Created At',
                    'Updated At',
                ].join(',');

                const rows = items.map(item => [
                    item.word,
                    item.translation,
                    item.phonetic,
                    item.language,
                    `"${item.examples.join('; ')}"`,
                    `"${item.tags.join('; ')}"`,
                    item.isFavorite,
                    item.masteryScore,
                    item.practiceCount,
                    new Date(item.lastPracticed).toISOString(),
                    item.sourceBook || '',
                    item.sourceChapter || '',
                    item.notes ? `"${item.notes}"` : '',
                    new Date(item.createdAt).toISOString(),
                    new Date(item.updatedAt).toISOString(),
                ].join(','));

                return [headers, ...rows].join('\n');
            }
        } catch (error) {
            console.error('Error exporting vocabulary:', error);
            throw error;
        }
    }
}

export const vocabularyService = new VocabularyService(); 