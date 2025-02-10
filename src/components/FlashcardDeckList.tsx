import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, IconButton, Portal, Dialog, TextInput, Button, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { createDeck } from '../store/slices/flashcardSlice';
import { FlashcardDeck } from '../services/flashcard';

interface FlashcardDeckListProps {
  bookId: string;
  onDeckSelect: (deck: FlashcardDeck) => void;
}

export const FlashcardDeckList: React.FC<FlashcardDeckListProps> = ({
  bookId,
  onDeckSelect,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { decks, loading, error } = useSelector((state: RootState) => ({
    decks: Object.values(state.flashcard.decks).filter(deck => deck.bookId === bookId),
    loading: state.flashcard.loading,
    error: state.flashcard.error,
  }));

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    try {
      await dispatch(createDeck({
        bookId,
        name: newDeckName.trim(),
        description: newDeckDescription.trim() || undefined,
      })).unwrap();

      setShowCreateDialog(false);
      setNewDeckName('');
      setNewDeckDescription('');
    } catch (error) {
      console.error('Error creating deck:', error);
    }
  };

  const renderDeck = ({ item }: { item: FlashcardDeck }) => (
    <Card style={styles.deckCard} onPress={() => onDeckSelect(item)}>
      <Card.Title
        title={item.name}
        subtitle={`${item.cardCount} cards`}
        right={(props) => (
          <IconButton
            {...props}
            icon="chevron-right"
            onPress={() => onDeckSelect(item)}
          />
        )}
      />
      {item.description && (
        <Card.Content>
          <Text style={styles.description}>{item.description}</Text>
        </Card.Content>
      )}
      <Card.Content>
        <Text style={styles.lastStudied}>
          {item.lastStudied
            ? `Last studied: ${new Date(item.lastStudied).toLocaleDateString()}`
            : 'Not studied yet'}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge">Flashcard Decks</Text>
        <IconButton
          icon="plus"
          onPress={() => setShowCreateDialog(true)}
        />
      </View>

      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <FlatList
        data={decks}
        renderItem={renderDeck}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No flashcard decks yet. Create one to get started!
          </Text>
        }
      />

      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create New Deck</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Deck Name"
              value={newDeckName}
              onChangeText={setNewDeckName}
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              value={newDeckDescription}
              onChangeText={setNewDeckDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onPress={handleCreateDeck}
              disabled={!newDeckName.trim() || loading}
            >
              Create
            </Button>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  list: {
    padding: 16,
  },
  deckCard: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  lastStudied: {
    fontSize: 12,
    opacity: 0.5,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    padding: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 32,
  },
}); 