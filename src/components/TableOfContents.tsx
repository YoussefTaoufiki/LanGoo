import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  List,
  Text,
  IconButton,
  useTheme,
  ActivityIndicator,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  getToc,
  getTocMetadata,
  setSelectedEntry,
  updateTocEntry,
} from '../store/slices/tocSlice';
import { TocEntry } from '../services/toc';

interface TableOfContentsProps {
  bookId: string;
  onEntrySelect: (cfi: string) => void;
  onClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  bookId,
  onEntrySelect,
  onClose,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { entries, metadata, loading, error, selectedEntry } = useSelector(
    (state: RootState) => state.toc
  );

  useEffect(() => {
    void dispatch(getToc(bookId));
    void dispatch(getTocMetadata(bookId));
  }, [dispatch, bookId]);

  const handleEntrySelect = (entry: TocEntry) => {
    dispatch(setSelectedEntry(entry));
    onEntrySelect(entry.cfi);
  };

  const renderTocEntry = (entry: TocEntry, level = 0) => {
    const isSelected = selectedEntry?.id === entry.id;
    const hasChildren = entry.children && entry.children.length > 0;
    const childEntries = hasChildren
      ? entries.filter(e => entry.children?.includes(e.id))
      : [];

    return (
      <View key={entry.id}>
        <List.Item
          title={entry.title}
          description={entry.pageNumber ? `Page ${entry.pageNumber}` : undefined}
          left={props => (
            <View style={[styles.levelIndicator, { width: level * 16 }]} />
          )}
          right={props => (
            <IconButton
              {...props}
              icon={isSelected ? 'bookmark' : 'chevron-right'}
              onPress={() => handleEntrySelect(entry)}
            />
          )}
          style={[
            styles.tocEntry,
            isSelected && { backgroundColor: theme.colors.primaryContainer },
          ]}
          onPress={() => handleEntrySelect(entry)}
        />
        {hasChildren && childEntries.map(child => renderTocEntry(child, level + 1))}
      </View>
    );
  };

  if (loading && !entries.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  const rootEntries = entries.filter(entry => !entry.parent);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge">Table of Contents</Text>
        <IconButton icon="close" onPress={onClose} />
      </View>

      {metadata && (
        <View style={styles.metadata}>
          <Text variant="bodySmall">
            {metadata.totalEntries} entries • {metadata.maxDepth} levels deep
          </Text>
          <Text variant="bodySmall">
            Last updated: {new Date(metadata.lastUpdated).toLocaleString()}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {rootEntries.map(entry => renderTocEntry(entry))}
        {!entries.length && (
          <Text style={styles.emptyText}>
            No table of contents available
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  metadata: {
    padding: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  tocEntry: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  levelIndicator: {
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  error: {
    textAlign: 'center',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 