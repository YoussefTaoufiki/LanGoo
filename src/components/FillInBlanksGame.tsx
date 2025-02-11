import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  generatePuzzle,
  checkAnswer,
  saveScore,
  getLeaderboard,
  updateAnswer,
  endGame,
} from '../store/slices/fillInBlanksSlice';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { CustomTheme } from '../theme/types';

interface Props {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onClose: () => void;
}

const FillInBlanksGame: React.FC<Props> = ({ bookId, difficulty, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useCustomTheme();
  const styles = createStyles(theme);

  const {
    currentPuzzle,
    answers,
    startTime,
    correctAnswers,
    loading,
    error,
  } = useSelector((state: RootState) => state.fillInBlanks);

  const [selectedBlankIndex, setSelectedBlankIndex] = useState<number | null>(null);

  useEffect(() => {
    dispatch(generatePuzzle({ bookId, difficulty }));
    return () => {
      dispatch(endGame());
    };
  }, [bookId, difficulty]);

  const handleBlankPress = (index: number) => {
    setSelectedBlankIndex(index);
  };

  const handleOptionPress = (option: string) => {
    if (selectedBlankIndex !== null) {
      dispatch(updateAnswer({ index: selectedBlankIndex, answer: option }));
      setSelectedBlankIndex(null);
    }
  };

  const handleCheckAnswers = async () => {
    if (!currentPuzzle?.id) return;

    const results = await dispatch(checkAnswer({
      puzzleId: currentPuzzle.id,
      answers,
    })).unwrap();

    const allCorrect = results.every(Boolean);
    if (allCorrect) {
      const timeSeconds = Math.floor((Date.now() - (startTime || 0)) / 1000);
      await dispatch(saveScore({
        bookId,
        difficulty,
        timeSeconds,
        correctAnswers: results.filter(Boolean).length,
        totalQuestions: answers.length,
        timestamp: Date.now(),
      }));
      await dispatch(getLeaderboard({ bookId, difficulty }));
      Alert.alert('Success!', 'All answers are correct!', [
        { text: 'Close', onPress: onClose },
      ]);
    } else {
      Alert.alert('Try Again', 'Some answers are incorrect.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading puzzle...</Text>
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

  if (!currentPuzzle) {
    return null;
  }

  const renderSentence = () => {
    const words = currentPuzzle.sentence.split(' ');
    return words.map((word, index) => {
      if (word === '___') {
        const blankIndex = words.slice(0, index).filter(w => w === '___').length;
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.blank,
              selectedBlankIndex === blankIndex && styles.selectedBlank,
            ]}
            onPress={() => handleBlankPress(blankIndex)}
          >
            <Text style={[
              styles.blankText,
              selectedBlankIndex === blankIndex && styles.selectedBlankText,
            ]}>
              {answers[blankIndex] || '___'}
            </Text>
          </TouchableOpacity>
        );
      }
      return (
        <Text key={index} style={styles.word}>
          {word}
        </Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fill in the Blanks</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sentenceContainer}>
          <View style={styles.sentenceWrapper}>
            {renderSentence()}
          </View>
        </View>

        {currentPuzzle.context && (
          <View style={styles.contextContainer}>
            <Text style={styles.contextTitle}>Context:</Text>
            <Text style={styles.contextText}>{currentPuzzle.context}</Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Choose the correct words:</Text>
          <View style={styles.optionsGrid}>
            {currentPuzzle.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  answers.includes(option) && styles.usedOption,
                ]}
                onPress={() => handleOptionPress(option)}
                disabled={answers.includes(option)}
              >
                <Text style={[
                  styles.optionText,
                  answers.includes(option) && styles.usedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {answers.every(answer => answer !== '') && (
          <TouchableOpacity
            style={styles.checkButton}
            onPress={handleCheckAnswers}
          >
            <Text style={styles.checkButtonText}>Check Answers</Text>
          </TouchableOpacity>
        )}
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
  sentenceContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sentenceWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  word: {
    fontSize: 18,
    color: theme.colors.text,
  },
  blank: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 4,
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedBlank: {
    backgroundColor: theme.colors.primary,
  },
  blankText: {
    fontSize: 18,
    color: theme.colors.onPrimaryContainer,
    fontWeight: 'bold',
  },
  selectedBlankText: {
    color: theme.colors.onPrimary,
  },
  contextContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  contextText: {
    fontSize: 16,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  optionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 4,
    padding: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  usedOption: {
    backgroundColor: theme.colors.surfaceVariant,
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.onSecondaryContainer,
  },
  usedOptionText: {
    color: theme.colors.onSurfaceVariant,
  },
  checkButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  checkButtonText: {
    fontSize: 18,
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
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
  },
});

export default FillInBlanksGame; 