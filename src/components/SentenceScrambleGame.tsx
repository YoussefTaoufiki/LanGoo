import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import DraggableFlatList, { 
  RenderItemParams,
  ScaleDecorator,
  DragEndParams,
} from 'react-native-draggable-flatlist';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  generatePuzzle,
  checkSolution,
  getHint,
  saveScore,
  getLeaderboard,
  updateArrangement,
  incrementMistakes,
  endGame,
} from '../store/slices/sentenceScrambleSlice';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { CustomTheme } from '../theme/types';

interface Props {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onClose: () => void;
}

const SentenceScrambleGame: React.FC<Props> = ({ bookId, difficulty, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useCustomTheme();
  const styles = createStyles(theme);

  const {
    currentPuzzle,
    currentArrangement,
    startTime,
    mistakeCount,
    hint,
    loading,
    error,
  } = useSelector((state: RootState) => state.sentenceScramble);

  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    dispatch(generatePuzzle({ bookId, difficulty }));
    return () => {
      dispatch(endGame());
    };
  }, [bookId, difficulty]);

  const handleArrangementChange = (newArrangement: string[]) => {
    dispatch(updateArrangement(newArrangement));
  };

  const handleCheckSolution = async () => {
    if (!currentPuzzle?.id) return;

    const isCorrect = await dispatch(checkSolution({
      puzzleId: currentPuzzle.id,
      solution: currentArrangement,
    })).unwrap();

    if (isCorrect) {
      const timeSeconds = Math.floor((Date.now() - (startTime || 0)) / 1000);
      await dispatch(saveScore({
        bookId,
        difficulty,
        timeSeconds,
        mistakeCount,
        timestamp: Date.now(),
      }));
      await dispatch(getLeaderboard({ bookId, difficulty }));
      Alert.alert('Success!', 'You solved the puzzle correctly!', [
        { text: 'Close', onPress: onClose },
      ]);
    } else {
      dispatch(incrementMistakes());
      Alert.alert('Try Again', 'The sentence is not arranged correctly.');
    }
  };

  const handleGetHint = async () => {
    if (!currentPuzzle?.id) return;
    await dispatch(getHint(currentPuzzle.id));
    setShowHint(true);
  };

  const renderWord = ({ item, drag, isActive }: RenderItemParams<string>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.wordCard,
            isActive && styles.draggingWord,
          ]}
        >
          <Text style={styles.wordText}>{item}</Text>
        </TouchableOpacity>
      </ScaleDecorator>
    );
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sentence Scramble</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Mistakes: {mistakeCount}</Text>
          {startTime && (
            <Text style={styles.statsText}>
              Time: {Math.floor((Date.now() - startTime) / 1000)}s
            </Text>
          )}
        </View>

        <View style={styles.puzzleContainer}>
          <DraggableFlatList<string>
            data={currentArrangement}
            renderItem={renderWord}
            keyExtractor={(item: string, index: number) => `${item}-${index}`}
            onDragEnd={({ data }: DragEndParams<string>) => handleArrangementChange(data)}
            containerStyle={styles.wordList}
          />
        </View>

        {hint && showHint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.hintButton]}
            onPress={handleGetHint}
          >
            <Text style={styles.buttonText}>Get Hint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.checkButton]}
            onPress={handleCheckSolution}
          >
            <Text style={styles.buttonText}>Check Solution</Text>
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
  puzzleContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  wordList: {
    flexGrow: 0,
  },
  wordCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    elevation: 2,
  },
  draggingWord: {
    backgroundColor: theme.colors.primaryContainer,
    elevation: 8,
  },
  wordText: {
    fontSize: 18,
    color: theme.colors.onPrimary,
    textAlign: 'center',
  },
  hintContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 16,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  hintButton: {
    backgroundColor: theme.colors.secondary,
  },
  checkButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
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

export default SentenceScrambleGame; 