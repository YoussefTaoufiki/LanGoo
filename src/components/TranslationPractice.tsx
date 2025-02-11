import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  generatePractice,
  checkTranslation,
  playAudio,
  saveScore,
  getLeaderboard,
  updateUserTranslation,
  endPractice,
} from '../store/slices/translationSlice';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { CustomTheme } from '../theme/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceLang: string;
  targetLang: string;
  onClose: () => void;
}

const TranslationPractice: React.FC<Props> = ({
  bookId,
  difficulty,
  sourceLang,
  targetLang,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useCustomTheme();
  const styles = createStyles(theme);

  const {
    currentPair,
    userTranslation,
    feedback,
    startTime,
    correctTranslations,
    totalAttempts,
    loading,
    error,
  } = useSelector((state: RootState) => state.translation);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    dispatch(generatePractice({ bookId, difficulty, sourceLang, targetLang }));
    return () => {
      dispatch(endPractice());
    };
  }, [bookId, difficulty, sourceLang, targetLang, dispatch]);

  const handlePlayAudio = async () => {
    if (!currentPair || isPlaying) return;
    setIsPlaying(true);
    try {
      await dispatch(playAudio({
        text: currentPair.originalText,
        lang: currentPair.sourceLang,
      })).unwrap();
    } finally {
      setIsPlaying(false);
    }
  };

  const handleCheckTranslation = async () => {
    if (!currentPair?.id || !userTranslation.trim()) return;

    const result = await dispatch(checkTranslation({
      pairId: currentPair.id,
      userTranslation: userTranslation.trim(),
    })).unwrap();

    if (result.isCorrect) {
      const timeSeconds = Math.floor((Date.now() - (startTime || 0)) / 1000);
      await dispatch(saveScore({
        bookId,
        difficulty,
        timeSeconds,
        correctTranslations,
        totalAttempts,
        timestamp: Date.now(),
      }));
      await dispatch(getLeaderboard({ bookId, difficulty }));
      Alert.alert('Success!', result.feedback, [
        {
          text: 'Next',
          onPress: () => dispatch(generatePractice({ bookId, difficulty, sourceLang, targetLang })),
        },
        { text: 'Close', onPress: onClose },
      ]);
    } else {
      Alert.alert('Try Again', result.feedback);
    }
  };

  const handleNextPair = () => {
    dispatch(generatePractice({ bookId, difficulty, sourceLang, targetLang }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading practice...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentPair) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Translation Practice</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Correct: {correctTranslations}/{totalAttempts}
          </Text>
          {startTime && (
            <Text style={styles.statsText}>
              Time: {Math.floor((Date.now() - startTime) / 1000)}s
            </Text>
          )}
        </View>

        <View style={styles.originalContainer}>
          <View style={styles.textRow}>
            <Text style={styles.originalText}>{currentPair.originalText}</Text>
            <TouchableOpacity
              style={[styles.audioButton, isPlaying && styles.audioButtonPlaying]}
              onPress={handlePlayAudio}
              disabled={isPlaying}
            >
              <Icon
                name={isPlaying ? 'volume-high' : 'volume-medium'}
                size={24}
                color={theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </View>
          {currentPair.context && (
            <Text style={styles.contextText}>Context: {currentPair.context}</Text>
          )}
        </View>

        <View style={styles.translationContainer}>
          <Text style={styles.label}>Your Translation:</Text>
          <TextInput
            style={styles.input}
            value={userTranslation}
            onChangeText={(text) => dispatch(updateUserTranslation(text))}
            placeholder="Enter your translation..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            textAlignVertical="top"
          />
        </View>

        {feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.skipButton]}
            onPress={handleNextPair}
          >
            <Text style={styles.buttonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.checkButton]}
            onPress={handleCheckTranslation}
            disabled={!userTranslation.trim()}
          >
            <Text style={styles.buttonText}>Check Translation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: CustomTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  originalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  originalText: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    lineHeight: 24,
  },
  audioButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 8,
  },
  audioButtonPlaying: {
    backgroundColor: theme.colors.secondary,
  },
  contextText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  translationContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    padding: 12,
    minHeight: 100,
    color: theme.colors.text,
    fontSize: 16,
  },
  feedbackContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: theme.colors.secondary,
  },
  checkButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default TranslationPractice; 