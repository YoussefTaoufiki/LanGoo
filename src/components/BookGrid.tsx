import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper/lib/typescript/types';
import BookCard from './BookCard';
import { useBooks } from '../hooks/useBooks';

const useStyles = (theme: MD3Theme) => StyleSheet.create({
  grid: {
    flex: 1,
    padding: 16,
  },
  item: {
    flex: 1,
    margin: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    elevation: 2,
  },
});

interface BookGridProps {
  searchQuery: string;
  selectedLevel: string | null;
}

export const BookGrid: React.FC<BookGridProps> = ({
  searchQuery,
  selectedLevel,
}) => {
  const { books, isLoading, error } = useBooks();

  const filteredBooks = books?.filter((book) => {
    const matchesSearch =
      !searchQuery ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = !selectedLevel || book.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  if (isLoading) {
    return (
      <View style={useStyles(useTheme()).grid}>
        {[...Array(8)].map((_, index) => (
          <View key={index} style={useStyles(useTheme()).item}>
            <BookCard.Skeleton />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
        Error loading books. Please try again later.
      </View>
    );
  }

  if (!filteredBooks?.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 40 }}>
        No books found matching your criteria.
      </View>
    );
  }

  return (
    <View style={useStyles(useTheme()).grid}>
      {filteredBooks.map((book) => (
        <View key={book.id} style={useStyles(useTheme()).item}>
          <BookCard book={book} />
        </View>
      ))}
    </View>
  );
};

export default BookGrid; 