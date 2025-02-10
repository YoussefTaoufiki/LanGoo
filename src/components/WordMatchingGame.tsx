import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Card, Button, IconButton, Portal, Dialog, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  getWordPairs,
  startGame,
  matchPair,
  incrementMistakes,
  endGame,
  saveScore,
} from '../store/slices/wordGameSlice';
import { WordPair } from '../services/wordGame';

interface WordMatchingGameProps {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onClose: () => void;
}

export const WordMatchingGame: React.FC<WordMatchingGameProps> = ({
  bookId,
  difficulty,
  onClose,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { currentGame, loading, error } = useSelector((state: RootState) => state.wordGame);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      try {
        const pairs = await dispatch(getWordPairs({ bookId, difficulty, count: 10 })).unwrap();
        dispatch(startGame(pairs));
      } catch (error) {
        console.error('Error initializing game:', error);
      }
    };

    void initGame();
  }, [dispatch, bookId, difficulty]);

  const handleWordSelect = (word: string) => {
    if (selectedWord === word) {
      setSelectedWord(null);
    } else {
      setSelectedWord(word);
      if (selectedTranslation) {
        checkMatch(word, selectedTranslation);
      }
    }
  };

  const handleTranslationSelect = (translation: string) => {
    if (selectedTranslation === translation) {
      setSelectedTranslation(null);
    } else {
      setSelectedTranslation(translation);
      if (selectedWord) {
        checkMatch(selectedWord, translation);
      }
    }
  };

  const checkMatch = (word: string, translation: string) => {
    const pair = currentGame?.pairs.find(p => p.word === word && p.translation === translation);
    
    if (pair) {
      dispatch(matchPair(pair.id!));
      setSelectedWord(null);
      setSelectedTranslation(null);

      if (currentGame?.pairs && currentGame.matchedPairs.length === currentGame.pairs.length - 1) {
        handleGameOver();
      }
    } else {
      dispatch(incrementMistakes());
      setSelectedWord(null);
      setSelectedTranslation(null);
    }
  };

  const handleGameOver = async () => {
    if (!currentGame) return;

    const timeSpent = Math.floor((Date.now() - currentGame.startTime) / 1000);
    const score = Math.max(
      0,
      1000 - (currentGame.mistakes * 50) - (timeSpent * 2)
    );

    try {
      await dispatch(saveScore({
        bookId,
        gameType: 'matching',
        difficulty,
        score,
        timeSpent,
        mistakes: currentGame.mistakes,
        completedAt: Date.now(),
      })).unwrap();

      setShowGameOver(true);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const handlePlayAgain = () => {
    setShowGameOver(false);
    dispatch(endGame());
    void dispatch(getWordPairs({ bookId, difficulty, count: 10 })).then(
      (action) => {
        if (action.payload) {
          dispatch(startGame(action.payload as WordPair[]));
        }
      }
    );
  };

  if (loading || !currentGame) {
    return (
      <View style={styles.container}>
        <Text>Loading game...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
        <Button mode="contained" onPress={onClose}>
          Close
        </Button>
      </View>
    );
  }

  const unmatched = currentGame.pairs.filter(
    pair => !currentGame.matchedPairs.includes(pair.id!)
  );

  const words = unmatched.map(pair => pair.word);
  const translations = unmatched.map(pair => pair.translation);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match the words</Text>
        <IconButton icon="close" onPress={onClose} />
      </View>

      <View style={styles.gameInfo}>
        <Text>Mistakes: {currentGame.mistakes}</Text>
        <Text>
          Pairs left: {currentGame.pairs.length - currentGame.matchedPairs.length}
        </Text>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.column}>
          {words.map((word) => (
            <Card
              key={word}
              style={[
                styles.card,
                selectedWord === word && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => handleWordSelect(word)}
            >
              <Card.Content>
                <Text>{word}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.column}>
          {translations.map((translation) => (
            <Card
              key={translation}
              style={[
                styles.card,
                selectedTranslation === translation && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => handleTranslationSelect(translation)}
            >
              <Card.Content>
                <Text>{translation}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>

      <Portal>
        <Dialog visible={showGameOver} onDismiss={() => setShowGameOver(false)}>
          <Dialog.Title>Game Over!</Dialog.Title>
          <Dialog.Content>
            <Text>Time: {Math.floor((Date.now() - currentGame.startTime) / 1000)}s</Text>
            <Text>Mistakes: {currentGame.mistakes}</Text>
            <Text>Score: {Math.max(0, 1000 - (currentGame.mistakes * 50) - (Math.floor((Date.now() - currentGame.startTime) / 1000) * 2))}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handlePlayAgain}>Play Again</Button>
            <Button onPress={onClose}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gameArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  card: {
    marginVertical: 4,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
}); 