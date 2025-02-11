import analytics from '@react-native-firebase/analytics';
import { VocabularyItem } from './vocabularyService';

export const VocabularyAnalytics = {
    async trackVocabularyView() {
        await analytics().logEvent('vocabulary_view');
    },

    async trackWordView(word: string, language: string) {
        await analytics().logEvent('word_view', {
            word,
            language,
        });
    },

    async trackWordAdd(item: VocabularyItem) {
        await analytics().logEvent('word_add', {
            word: item.word,
            language: item.language,
            hasExamples: item.examples.length > 0,
            hasTags: item.tags.length > 0,
        });
    },

    async trackWordDelete(word: string) {
        await analytics().logEvent('word_delete', {
            word,
        });
    },

    async trackWordUpdate(item: VocabularyItem) {
        await analytics().logEvent('word_update', {
            word: item.word,
            language: item.language,
            masteryScore: item.masteryScore,
            practiceCount: item.practiceCount,
        });
    },

    async trackSearch(query: string, resultCount: number) {
        await analytics().logEvent('vocabulary_search', {
            query,
            resultCount,
        });
    },

    async trackFilter(filterType: string) {
        await analytics().logEvent('vocabulary_filter', {
            filterType,
        });
    },

    async trackExport(format: 'csv' | 'json', itemCount: number) {
        await analytics().logEvent('vocabulary_export', {
            format,
            itemCount,
        });
    },

    async trackAudioPlay(word: string, language: string) {
        await analytics().logEvent('word_audio_play', {
            word,
            language,
        });
    },

    async trackMasteryUpdate(word: string, oldScore: number, newScore: number) {
        await analytics().logEvent('mastery_update', {
            word,
            oldScore,
            newScore,
            improvement: newScore - oldScore,
        });
    },

    async trackError(action: string, error: Error) {
        await analytics().logEvent('vocabulary_error', {
            action,
            errorMessage: error.message,
            errorStack: error.stack,
        });
    },
}; 