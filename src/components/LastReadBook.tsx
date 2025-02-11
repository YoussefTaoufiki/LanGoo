import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Surface, Text, Button, ProgressBar, useTheme } from 'react-native-paper';
import { CustomTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  progress: number;
  currentChapter: number;
  totalChapters: number;
}

interface LastReadBookProps {
  book?: Book;
}

export const LastReadBook: React.FC<LastReadBookProps> = ({ book }) => {
  const theme = useTheme<CustomTheme>();

  if (!book) {
    return null;
  }

  const handleResume = () => {
    // Navigate to reader view with the book
    console.log('Resuming book:', book.id);
  };

  return (
    <View>
      <Text variant="headlineSmall" style={styles.sectionTitle}>
        Continue Reading
      </Text>
      <Surface style={[styles.container, { elevation: 3 }]}>
        <Image source={{ uri: book.coverUrl }} style={styles.cover} />
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            {book.title}
          </Text>
          <Text variant="titleMedium" style={[styles.author, { color: theme.colors.onSurfaceVariant }]}>
            {book.author}
          </Text>
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={book.progress / 100}
              style={styles.progressBar}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
              {book.progress}% completed • Chapter {book.currentChapter} of{' '}
              {book.totalChapters}
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={handleResume}
            icon={() => <Icon name="play-arrow" size={24} color={theme.colors.onPrimary} />}
            style={styles.button}
          >
            Continue Reading
          </Button>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 16,
  },
  container: {
    padding: 24,
    flexDirection: 'row',
    gap: 24,
    borderRadius: 16,
  },
  cover: {
    width: 200,
    height: 300,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  title: {
    marginBottom: 4,
  },
  author: {
    marginBottom: 16,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },
});

export default LastReadBook; 