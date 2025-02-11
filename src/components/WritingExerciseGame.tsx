import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  generatePrompt,
  submitWriting,
  getLeaderboard,
  updateContent,
  startExercise,
  endExercise,
} from '../store/slices/writingExerciseSlice';
import { Button } from './Button';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { CustomTheme } from '../theme/types';
import { formatTime } from '../utils/timeUtils';
import { WritingScore } from '../services/writingExerciseGame';
import { ThunkDispatch, AnyAction } from '@reduxjs/toolkit';

interface WritingExerciseGameProps {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onClose: () => void;
}

// Add type for corrections
interface Correction {
  original: string;
  suggestion: string;
  type: 'grammar' | 'spelling' | 'style';
  explanation: string;
}

export const WritingExerciseGame: React.FC<WritingExerciseGameProps> = ({
  bookId,
  difficulty,
  onClose,
}) => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, AnyAction>>();
  const theme = useCustomTheme();
  const styles = createStyles(theme);

  const {
    currentPrompt,
    currentContent,
    startTime,
    submission,
    loading,
    error,
    leaderboard,
  } = useSelector((state: RootState) => state.writingExercise);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const loadPrompt = async () => {
      await dispatch(generatePrompt({ bookId, difficulty }));
    };
    loadPrompt();
    return () => {
      dispatch(endExercise());
    };
  }, [bookId, difficulty, dispatch]);

  useEffect(() => {
    if (startTime && !submission) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, submission]);

  useEffect(() => {
    const words = currentContent.trim().split(/\s+/);
    setWordCount(currentContent.trim() ? words.length : 0);
  }, [currentContent]);

  const handleContentChange = (text: string) => {
    dispatch(updateContent(text));
  };

  const handleSubmit = async () => {
    if (!currentPrompt?.id || !currentContent.trim()) return;

    const minWords = currentPrompt.suggestedLength || 50;
    if (wordCount < minWords) {
      Alert.alert(
        'Warning',
        `Your response is too short. Please write at least ${minWords} words.`
      );
      return;
    }

    try {
      await dispatch(submitWriting({
        promptId: currentPrompt.id,
        content: currentContent.trim(),
      })).unwrap();
      
      await dispatch(getLeaderboard({ bookId, difficulty }));
    } catch (error) {
      console.error('Error submitting writing:', error);
    }
  };

  const handleNewPrompt = () => {
    dispatch(generatePrompt({ bookId, difficulty }));
  };

  if (loading && !currentPrompt) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={handleNewPrompt} />
      </View>
    );
  }

  if (submission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Writing Analysis</Text>
        
        <ScrollView style={styles.feedbackContainer}>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreTitle}>Scores:</Text>
            <Text style={styles.scoreText}>Grammar: {submission.grammarScore}%</Text>
            <Text style={styles.scoreText}>Vocabulary: {submission.vocabularyScore}%</Text>
            <Text style={styles.scoreText}>Coherence: {submission.coherenceScore}%</Text>
            <Text style={styles.scoreText}>Overall: {submission.overallScore}%</Text>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Feedback:</Text>
            {submission.feedback.map((item: string, index: number) => (
              <Text key={index} style={styles.feedbackItem}>• {item}</Text>
            ))}
          </View>

          {submission.corrections.length > 0 && (
            <View style={styles.correctionsSection}>
              <Text style={styles.correctionsTitle}>Suggested Corrections:</Text>
              {submission.corrections.map((correction: Correction, index: number) => (
                <View key={index} style={styles.correctionItem}>
                  <Text style={styles.correctionText}>
                    Original: <Text style={styles.highlightText}>{correction.original}</Text>
                  </Text>
                  <Text style={styles.correctionText}>
                    Suggestion: <Text style={styles.highlightText}>{correction.suggestion}</Text>
                  </Text>
                  <Text style={styles.correctionExplanation}>{correction.explanation}</Text>
                </View>
              ))}
            </View>
          )}

          {showLeaderboard && (
            <View style={styles.leaderboardSection}>
              <Text style={styles.leaderboardTitle}>Leaderboard</Text>
              {leaderboard.map((score: WritingScore, index: number) => (
                <View key={score.id} style={styles.leaderboardItem}>
                  <Text style={styles.rankText}>{index + 1}.</Text>
                  <Text style={styles.playerText}>{score.userName}</Text>
                  <Text style={styles.scoreText}>{score.averageScore.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            title={showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
            onPress={() => setShowLeaderboard(!showLeaderboard)}
            variant="secondary"
          />
          <Button title="Try Another" onPress={handleNewPrompt} />
          <Button title="Close" onPress={onClose} variant="secondary" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Writing Exercise</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.promptContainer}>
        <Text style={styles.promptTitle}>Prompt:</Text>
        <Text style={styles.promptText}>{currentPrompt?.prompt}</Text>
        {currentPrompt?.context && (
          <Text style={styles.contextText}>Context: {currentPrompt.context}</Text>
        )}
        {currentPrompt?.keywords && (
          <Text style={styles.keywordsText}>
            Keywords: {currentPrompt.keywords.join(', ')}
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Time: {formatTime(elapsedTime)}</Text>
        <Text style={styles.statsText}>
          Words: {wordCount}/{currentPrompt?.suggestedLength || 50}
        </Text>
      </View>

      <View style={styles.editorContainer}>
        <TextInput
          style={styles.editor}
          multiline
          value={currentContent}
          onChangeText={handleContentChange}
          placeholder="Start writing your response here..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Submit"
          onPress={handleSubmit}
          disabled={!currentContent.trim() || loading}
        />
      </View>
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
  promptContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 8,
  },
  keywordsText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  editor: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  feedbackContainer: {
    flex: 1,
    marginVertical: 16,
  },
  scoreSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  feedbackSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  feedbackItem: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  correctionsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  correctionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  correctionItem: {
    marginBottom: 12,
  },
  correctionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  correctionExplanation: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  leaderboardSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rankText: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  playerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
}); 