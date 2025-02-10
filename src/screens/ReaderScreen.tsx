import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ActivityIndicator, Appbar, Portal, Dialog, Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { EPUBReader } from '../components/EPUBReader';
import { ReaderSettings } from '../components/ReaderSettings';
import { TranslationModal } from '../components/TranslationModal';
import { useAppSelector } from '../hooks/useAppSelector';
import * as epubService from '../services/epub';
import * as translationService from '../services/translation';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

interface BookInfo {
  title: string;
  author: string;
  location: string;
  language: string;
}

interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'justify';
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  marginHorizontal: number;
}

interface SavedTranslation {
  text: string;
  translation: string;
  timestamp: number;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'System',
  textAlign: 'left',
  theme: 'light',
  lineHeight: 1.5,
  letterSpacing: 0.5,
  paragraphSpacing: 16,
  marginHorizontal: 24,
};

export const ReaderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookId } = route.params;
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookPath, setBookPath] = useState<string | null>(null);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [showTranslationOptions, setShowTranslationOptions] = useState(false);
  const [savedTranslations, setSavedTranslations] = useState<SavedTranslation[]>([]);
  const [translationData, setTranslationData] = useState({
    translatedText: '',
    explanation: '',
    etymology: '',
    examples: [] as string[],
    synonyms: [] as string[],
    loading: false,
    error: '',
  });

  useEffect(() => {
    loadBook();
    loadSettings();
    loadSavedTranslations();
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load book metadata
      const metadata = await epubService.getEPUBMetadata(bookId);
      setBookInfo({
        title: metadata.title,
        author: metadata.author,
        location: '0',
        language: metadata.language || 'en',
      });

      // Get reading progress
      const progress = await epubService.getReadingProgress(bookId);
      if (progress) {
        setBookInfo(prev => prev ? { ...prev, location: progress.location } : null);
      }

      // Get book file path
      const path = await epubService.downloadBook(bookId);
      setBookPath(path);
    } catch (err) {
      setError('Failed to load book. Please try again.');
      console.error('Error loading book:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await epubService.getReaderSettings(bookId);
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleSettingsChange = async (newSettings: ReaderSettings) => {
    setSettings(newSettings);
    try {
      await epubService.saveReaderSettings(bookId, newSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleLocationChange = (location: string) => {
    if (bookInfo) {
      const progress: epubService.ReadingProgress = {
        bookId,
        location,
        percentage: parseFloat(location) * 100,
        lastRead: new Date(),
      };
      epubService.saveReadingProgress(progress);
      setBookInfo({ ...bookInfo, location });
    }
  };

  const loadSavedTranslations = async () => {
    try {
      const saved = await translationService.getSavedTranslations(bookId);
      setSavedTranslations(saved || []);
    } catch (err) {
      console.error('Error loading saved translations:', err);
    }
  };

  const handleTextSelection = async (text: string, isLongPress: boolean) => {
    if (!isLongPress) {
      return; // Only handle long press selections
    }

    setSelectedText(text);
    setTranslationData(prev => ({ ...prev, loading: true, error: '' }));
    setShowTranslationOptions(true);

    try {
      const response = await translationService.getEnhancedTranslation({
        text,
        fromLanguage: bookInfo?.language || 'en',
        toLanguage: user?.selectedLanguage || 'en',
      });

      setTranslationData({
        translatedText: response.translation,
        explanation: response.explanation,
        etymology: response.etymology,
        examples: response.examples,
        synonyms: response.synonyms,
        loading: false,
        error: '',
      });
    } catch (error) {
      setTranslationData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to get translation. Please try again.',
      }));
      console.error('Translation error:', error);
    }
  };

  const handleSaveTranslation = async () => {
    try {
      const newTranslation: SavedTranslation = {
        text: selectedText,
        translation: translationData.translatedText,
        timestamp: Date.now(),
      };

      await translationService.saveTranslation(bookId, newTranslation);
      setSavedTranslations(prev => [...prev, newTranslation]);
    } catch (error) {
      console.error('Error saving translation:', error);
    }
  };

  const isTranslationSaved = () => {
    return savedTranslations.some(t => t.text === selectedText);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>{error}</Text>
        <Button mode="contained" onPress={loadBook} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  const getThemeStyles = (): ViewStyle => {
    switch (settings.theme) {
      case 'dark':
        return {
          backgroundColor: '#121212',
          flex: 1,
        };
      case 'sepia':
        return {
          backgroundColor: '#f4ecd8',
          flex: 1,
        };
      default:
        return {
          backgroundColor: '#ffffff',
          flex: 1,
        };
    }
  };

  const getTextColor = () => {
    switch (settings.theme) {
      case 'dark':
        return '#ffffff';
      case 'sepia':
        return '#5b4636';
      default:
        return '#000000';
    }
  };

  return (
    <View style={styles.container}>
      <View style={getThemeStyles()}>
        <Appbar.Header style={{ backgroundColor: 'transparent' }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} color={getTextColor()} />
          <Appbar.Content 
            title={bookInfo?.title || ''}
            subtitle={bookInfo?.author || ''}
            titleStyle={{ color: getTextColor() }}
            subtitleStyle={{ color: getTextColor() }}
          />
          <Appbar.Action 
            icon="format-font" 
            onPress={() => setShowSettings(true)}
            color={getTextColor()}
          />
        </Appbar.Header>

        {bookPath && (
          <EPUBReader
            filePath={bookPath}
            onLocationChange={handleLocationChange}
            onTextSelection={handleTextSelection}
            initialLocation={bookInfo?.location}
            style={styles.reader}
            settings={settings}
            onError={setError}
          />
        )}

        <ReaderSettings
          fontSize={settings.fontSize}
          onFontSizeChange={(size) => handleSettingsChange({ ...settings, fontSize: size })}
          fontFamily={settings.fontFamily}
          onFontFamilyChange={(family) => handleSettingsChange({ ...settings, fontFamily: family })}
          textAlign={settings.textAlign}
          onTextAlignChange={(align) => handleSettingsChange({ ...settings, textAlign: align })}
          lineHeight={settings.lineHeight}
          onLineHeightChange={(height) => handleSettingsChange({ ...settings, lineHeight: height })}
          letterSpacing={settings.letterSpacing}
          onLetterSpacingChange={(spacing) => handleSettingsChange({ ...settings, letterSpacing: spacing })}
          paragraphSpacing={settings.paragraphSpacing}
          onParagraphSpacingChange={(spacing) => handleSettingsChange({ ...settings, paragraphSpacing: spacing })}
          marginHorizontal={settings.marginHorizontal}
          onMarginHorizontalChange={(margin) => handleSettingsChange({ ...settings, marginHorizontal: margin })}
          theme={settings.theme}
          onThemeChange={(theme) => handleSettingsChange({ ...settings, theme: theme })}
        />

        <TranslationModal
          visible={showTranslationOptions}
          onDismiss={() => setShowTranslationOptions(false)}
          selectedText={selectedText}
          translation={translationData}
          theme={settings.theme}
          onSave={handleSaveTranslation}
          isSaved={isTranslationSaved()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reader: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
  },
  selectedText: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  translation: {
    fontWeight: 'bold',
  },
  translationLoading: {
    marginVertical: 16,
  },
  errorText: {
    color: '#B00020',
    marginTop: 8,
  },
}); 