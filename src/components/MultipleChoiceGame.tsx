import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  generateQuestions,
  checkAnswer,
  saveScore,
  getLeaderboard,
  startGame,
  setAnswer,
  nextQuestion,
  previousQuestion,
  endGame,
} from '../store/slices/multipleChoiceSlice';
import { Button } from '../components/Button';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { CustomTheme } from '../theme/types';
import { formatTime } from '../utils/timeUtils';
import { MultipleChoiceScore } from '../services/multipleChoiceGame';
import { ThunkDispatch, AnyAction } from '@reduxjs/toolkit';

interface MultipleChoiceGameProps {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onClose: () => void;
}

export const MultipleChoiceGame: React.FC<MultipleChoiceGameProps> = ({
  bookId,
  difficulty,
  onClose,
}) => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, AnyAction>>();
  const theme = useCustomTheme();
  const styles = createStyles(theme);
  const {
    questions,
    currentQuestionIndex,
    answers,
    startTime,
    correctAnswers,
    loading,
    error,
    leaderboard,
  } = useSelector((state: RootState) => state.multipleChoice);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const loadQuestions = async () => {
      await dispatch(generateQuestions({ bookId, difficulty }));
    };
    loadQuestions();
    return () => {
      dispatch(endGame());
    };
  }, [bookId, difficulty, dispatch]);

  useEffect(() => {
    if (startTime && !gameEnded) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, gameEnded]);

  useEffect(() => {
    if (gameEnded) {
      dispatch(getLeaderboard({ bookId, difficulty }));
    }
  }, [gameEnded, bookId, difficulty, dispatch]);

  const handleAnswerSelect = async (answer: string) => {
    if (loading || gameEnded) return;

    const currentQuestion = questions[currentQuestionIndex];
    dispatch(setAnswer({ index: currentQuestionIndex, answer }));
    
    await dispatch(checkAnswer({
      questionId: currentQuestion.id,
      answer,
    }));

    if (currentQuestionIndex === questions.length - 1) {
      handleGameEnd();
    } else {
      dispatch(nextQuestion());
    }
  };

  const handleGameEnd = async () => {
    setGameEnded(true);
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - (startTime || endTime)) / 1000);
    
    await dispatch(saveScore({
      bookId,
      difficulty,
      correctAnswers,
      totalQuestions: questions.length,
      timeTaken,
      totalAttempts: questions.length,
      timestamp: Date.now(),
    }));
  };

  const handleRestartGame = async () => {
    setGameEnded(false);
    setShowLeaderboard(false);
    await dispatch(generateQuestions({ bookId, difficulty }));
  };

  if (loading && questions.length === 0) {
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
        <Button title="Try Again" onPress={handleRestartGame} />
      </View>
    );
  }

  if (gameEnded) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.scoreText}>
          Score: {correctAnswers} / {questions.length}
        </Text>
        <Text style={styles.timeText}>Time: {formatTime(elapsedTime)}</Text>
        
        {showLeaderboard ? (
          <ScrollView style={styles.leaderboardContainer}>
            <Text style={styles.subtitle}>Leaderboard</Text>
            {leaderboard.map((score: MultipleChoiceScore, index: number) => (
              <View key={score.id} style={styles.leaderboardItem}>
                <Text style={styles.rankText}>{index + 1}.</Text>
                <Text style={styles.playerText}>{score.userName}</Text>
                <Text style={styles.scoreText}>
                  {score.correctAnswers}/{score.totalQuestions}
                </Text>
                <Text style={styles.timeText}>{formatTime(score.timeTaken)}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Button
            title="View Leaderboard"
            onPress={() => setShowLeaderboard(true)}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <Button title="Play Again" onPress={handleRestartGame} />
          <Button title="Close" onPress={onClose} variant="secondary" />
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.timeText}>Time: {formatTime(elapsedTime)}</Text>
        <Text style={styles.scoreText}>
          Score: {correctAnswers} / {currentQuestionIndex}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion?.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion?.options.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                answers[currentQuestionIndex] === option && styles.selectedOption,
              ]}
              onPress={() => handleAnswerSelect(option)}
              disabled={loading}
            >
              <Text style={[
                styles.optionText,
                answers[currentQuestionIndex] === option && styles.selectedOptionText,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.navigationContainer}>
        <Button
          title="Previous"
          onPress={() => dispatch(previousQuestion())}
          disabled={currentQuestionIndex === 0}
          variant="secondary"
        />
        {currentQuestionIndex === questions.length - 1 ? (
          <Button title="Finish" onPress={handleGameEnd} />
        ) : (
          <Button
            title="Next"
            onPress={() => dispatch(nextQuestion())}
            disabled={currentQuestionIndex === questions.length - 1}
          />
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: CustomTheme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  timeText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  scoreText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 20,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: theme.colors.onPrimary,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  leaderboardContainer: {
    maxHeight: 300,
    marginVertical: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    width: 30,
  },
  playerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 10,
  },
}); 