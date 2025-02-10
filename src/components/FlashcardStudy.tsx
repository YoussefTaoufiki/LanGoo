import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Text, Button, IconButton, useTheme, ProgressBar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { getDueCards, updateCardReview, setCurrentCard } from '../store/slices/flashcardSlice';
import { FlashcardDeck, Flashcard } from '../services/flashcard';
import { useCustomTheme } from '../hooks/useCustomTheme';

interface FlashcardStudyProps {
  deck: FlashcardDeck;
  onClose: () => void;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  deck,
  onClose,
}) => {
  const theme = useCustomTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { currentCard, dueCards, loading, error } = useSelector((state: RootState) => ({
    currentCard: state.flashcard.currentCard,
    dueCards: state.flashcard.dueCards[deck.id!] || [],
    loading: state.flashcard.loading,
    error: state.flashcard.error,
  }));

  const [showAnswer, setShowAnswer] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    void dispatch(getDueCards(deck.id!));
  }, [dispatch, deck.id]);

  const handleFlip = () => {
    Animated.spring(flipAnim, {
      toValue: showAnswer ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setShowAnswer(!showAnswer);
  };

  const handleRate = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard?.id) return;

    try {
      await dispatch(updateCardReview({ cardId: currentCard.id, quality })).unwrap();
      setShowAnswer(false);
      flipAnim.setValue(0);
    } catch (error) {
      console.error('Error updating card review:', error);
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  if (loading && !currentCard) {
    return (
      <View style={styles.container}>
        <Text>Loading cards...</Text>
        <ProgressBar indeterminate />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
        <Button onPress={() => dispatch(getDueCards(deck.id!))}>
          Retry
        </Button>
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          No cards due for review!
        </Text>
        <Button onPress={onClose}>
          Close
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium">{deck.name}</Text>
        <Text>{`${dueCards.length} cards remaining`}</Text>
        <IconButton icon="close" onPress={onClose} />
      </View>

      <View style={styles.cardContainer}>
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
          <Card style={styles.cardContent}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.cardText}>
                {currentCard.front}
              </Text>
              {currentCard.context && (
                <Text style={styles.context}>
                  Context: {currentCard.context}
                </Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <Card style={styles.cardContent}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.cardText}>
                {currentCard.back}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      </View>

      {!showAnswer ? (
        <Button
          mode="contained"
          onPress={handleFlip}
          style={styles.button}
        >
          Show Answer
        </Button>
      ) : (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you know this?</Text>
          <View style={styles.ratingButtons}>
            <Button
              mode="outlined"
              onPress={() => handleRate(0)}
              style={[styles.ratingButton, { borderColor: theme.colors.error }]}
            >
              Again
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleRate(3)}
              style={[styles.ratingButton, { borderColor: theme.colors.warning }]}
            >
              Hard
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleRate(4)}
              style={[styles.ratingButton, { borderColor: theme.colors.primary }]}
            >
              Good
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleRate(5)}
              style={[styles.ratingButton, { borderColor: theme.colors.success }]}
            >
              Easy
            </Button>
          </View>
        </View>
      )}
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
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backfaceVisibility: 'hidden',
    position: 'absolute',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  cardContent: {
    minHeight: 200,
    justifyContent: 'center',
  },
  cardText: {
    textAlign: 'center',
  },
  context: {
    marginTop: 16,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 16,
  },
  ratingContainer: {
    marginTop: 16,
  },
  ratingTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
}); 