import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Searchbar,
  List,
  Text,
  IconButton,
  Portal,
  Dialog,
  Button,
  useTheme,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  searchInBook,
  getSearchHistory,
  clearSearchHistory,
  deleteSearchHistory,
  setQuery,
  clearResults,
} from '../store/slices/searchSlice';
import { SearchResult, SearchHistory } from '../services/search';

interface SearchPanelProps {
  bookId: string;
  onResultSelect: (cfi: string) => void;
  onClose: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  bookId,
  onResultSelect,
  onClose,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { results, history, loading, error, query } = useSelector(
    (state: RootState) => state.search
  );
  const [showHistory, setShowHistory] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    void dispatch(getSearchHistory(bookId));
    return () => {
      dispatch(clearResults());
    };
  }, [dispatch, bookId]);

  const handleSearch = (searchQuery: string) => {
    dispatch(setQuery(searchQuery));
    if (searchQuery.trim()) {
      void dispatch(searchInBook({ bookId, query: searchQuery }));
      setShowHistory(false);
    } else {
      dispatch(clearResults());
      setShowHistory(true);
    }
  };

  const handleClearHistory = () => {
    void dispatch(clearSearchHistory(bookId));
    setShowClearDialog(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    void dispatch(deleteSearchHistory(id));
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <List.Item
      title={item.text}
      description={item.snippet}
      onPress={() => onResultSelect(item.cfi)}
      right={props => (
        <IconButton
          {...props}
          icon="chevron-right"
          onPress={() => onResultSelect(item.cfi)}
        />
      )}
    />
  );

  const renderHistoryItem = ({ item }: { item: SearchHistory }) => (
    <List.Item
      title={item.query}
      description={new Date(item.timestamp).toLocaleString()}
      onPress={() => handleSearch(item.query)}
      right={props => (
        <IconButton
          {...props}
          icon="delete"
          onPress={() => item.id && handleDeleteHistoryItem(item.id)}
        />
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search in book"
          onChangeText={handleSearch}
          value={query}
          style={styles.searchBar}
        />
        <IconButton icon="close" onPress={onClose} />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {showHistory && history.length > 0 && (
        <>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium">Search History</Text>
            <Button onPress={() => setShowClearDialog(true)}>Clear All</Button>
          </View>
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id || item.timestamp.toString()}
            ItemSeparatorComponent={Divider}
          />
        </>
      )}

      {!showHistory && (
        <FlatList
          data={results}
          renderItem={renderSearchResult}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={
            loading ? null : (
              <Text style={styles.emptyText}>
                No results found for "{query}"
              </Text>
            )
          }
        />
      )}

      <Portal>
        <Dialog visible={showClearDialog} onDismiss={() => setShowClearDialog(false)}>
          <Dialog.Title>Clear Search History</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to clear all search history?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearDialog(false)}>Cancel</Button>
            <Button onPress={handleClearHistory}>Clear</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  searchBar: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    padding: 16,
    textAlign: 'center',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 