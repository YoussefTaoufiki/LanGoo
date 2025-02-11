import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Searchbar, useTheme } from 'react-native-paper';
import { CustomTheme } from '../theme/theme';
import { BookCard } from './BookCard';
import { LevelFilter } from './LevelFilter';
import { LastReadBook } from './LastReadBook';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  progress: number;
  currentChapter: number;
  totalChapters: number;
}

interface LibraryViewProps {
  books: Book[];
  lastReadBook?: Book;
  onBookSelect: (bookId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  lastReadBook,
  onBookSelect,
}) => {
  const theme = useTheme<CustomTheme>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<Book['level'] | null>(null);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = !selectedLevel || book.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const renderBook = ({ item }: { item: Book }) => (
    <View style={styles.bookCard}>
      <BookCard book={item} onClick={onBookSelect} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {lastReadBook && (
          <View style={styles.lastReadSection}>
            <LastReadBook book={lastReadBook} />
          </View>
        )}
        <Searchbar
          placeholder="Search books..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <LevelFilter
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
        />
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  lastReadSection: {
    marginBottom: 32,
  },
  searchBar: {
    marginBottom: 16,
  },
  grid: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  bookCard: {
    flex: 1,
    maxWidth: '50%',
    padding: 8,
  },
});

export default LibraryView; 