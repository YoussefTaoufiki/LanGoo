import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { CustomTheme } from '../theme/theme';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  level: string;
}

interface BookCardProps {
  book: Book;
  onClick?: (bookId: string) => void;
}

type BookCardComponent = React.FC<BookCardProps> & {
  Skeleton: React.FC;
};

export const BookCard: BookCardComponent = ({ book, onClick }) => {
  const theme = useTheme<CustomTheme>();

  const handlePress = () => {
    onClick?.(book.id);
  };

  return (
    <Card style={styles.card} onPress={handlePress}>
      <Card.Cover source={{ uri: book.coverUrl }} style={styles.cover} />
      <Chip
        style={[styles.levelChip, { backgroundColor: theme.colors.primary }]}
        textStyle={{ color: theme.colors.onPrimary }}
      >
        {book.level}
      </Chip>
      <Card.Content style={styles.content}>
        <Text variant="titleLarge" numberOfLines={1} style={styles.title}>
          {book.title}
        </Text>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.author}>
          {book.author}
        </Text>
      </Card.Content>
    </Card>
  );
};

BookCard.Skeleton = function BookCardSkeleton() {
  const theme = useTheme<CustomTheme>();

  return (
    <Card style={styles.card}>
      <Card.Cover
        source={{ uri: 'placeholder' }}
        style={[styles.cover, styles.skeleton]}
      />
      <Card.Content style={styles.content}>
        <Text
          variant="titleLarge"
          style={[styles.skeletonText, { width: '80%' }]}
        >
          {' '}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.skeletonText, { width: '60%' }]}
        >
          {' '}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    height: '100%',
    elevation: 2,
  },
  cover: {
    height: 250,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  author: {
    opacity: 0.7,
  },
  levelChip: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  skeletonText: {
    height: 20,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
});

export default BookCard; 