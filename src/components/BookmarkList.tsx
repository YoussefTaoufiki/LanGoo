import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchBookmarks, deleteBookmark, setSelectedBookmark } from '../store/slices/bookmarkSlice';
import { Bookmark } from '../services/bookmark';

interface BookmarkListProps {
  bookId: string;
  onBookmarkSelect: (bookmark: Bookmark) => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  bookId,
  onBookmarkSelect,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { bookmarks, loading, error } = useSelector((state: RootState) => ({
    bookmarks: state.bookmark.bookmarks[bookId] || [],
    loading: state.bookmark.loading,
    error: state.bookmark.error,
  }));

  useEffect(() => {
    void dispatch(fetchBookmarks(bookId));
  }, [dispatch, bookId]);

  const handleDeleteBookmark = async (id: string) => {
    try {
      await dispatch(deleteBookmark(id)).unwrap();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const handleSelectBookmark = (bookmark: Bookmark) => {
    dispatch(setSelectedBookmark(bookmark));
    onBookmarkSelect(bookmark);
  };

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <Card style={[styles.bookmarkCard, { borderLeftColor: item.color || theme.colors.primary }]}>
      <Card.Title
        title={item.title}
        subtitle={new Date(item.createdAt).toLocaleDateString()}
        right={(props) => (
          <IconButton
            {...props}
            icon="delete"
            onPress={() => handleDeleteBookmark(item.id!)}
          />
        )}
      />
      <Card.Content>
        <Text numberOfLines={2} style={styles.bookmarkText}>
          {item.text}
        </Text>
        {item.note && (
          <Text numberOfLines={1} style={styles.noteText}>
            Note: {item.note}
          </Text>
        )}
      </Card.Content>
      <Card.Actions>
        <IconButton
          icon="bookmark-outline"
          onPress={() => handleSelectBookmark(item)}
        />
      </Card.Actions>
    </Card>
  );

  if (loading && !bookmarks.length) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bookmarks}
      renderItem={renderBookmark}
      keyExtractor={(item) => item.id!}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No bookmarks yet</Text>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bookmarkCard: {
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  bookmarkText: {
    fontSize: 14,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 32,
  },
}); 