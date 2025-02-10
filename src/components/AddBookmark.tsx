import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { createBookmark } from '../store/slices/bookmarkSlice';
import type { Bookmark } from '../services/bookmark';

interface AddBookmarkProps {
  bookId: string;
  chapterId: string;
  cfi: string;
  selectedText: string;
  onComplete: () => void;
}

export const AddBookmark: React.FC<AddBookmarkProps> = ({
  bookId,
  chapterId,
  cfi,
  selectedText,
  onComplete,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [color, setColor] = useState(theme.colors.primary);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        bookId,
        chapterId,
        cfi,
        title: title || 'Untitled Bookmark',
        text: selectedText,
        note,
        color,
      };

      await dispatch(createBookmark(bookmark)).unwrap();
      onComplete();
    } catch (error) {
      console.error('Error creating bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.error,
    theme.colors.inversePrimary,
    theme.colors.tertiary,
  ];

  return (
    <View style={styles.container}>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Enter bookmark title"
      />

      <TextInput
        label="Note"
        value={note}
        onChangeText={setNote}
        style={styles.input}
        placeholder="Add a note (optional)"
        multiline
        numberOfLines={3}
      />

      <View style={styles.colorContainer}>
        {colors.map((c) => (
          <Button
            key={c}
            mode={color === c ? 'contained' : 'outlined'}
            onPress={() => setColor(c)}
            style={[styles.colorButton, { borderColor: c }]}
            contentStyle={[styles.colorButtonContent, { backgroundColor: color === c ? c : 'transparent' }]}
          >
            {''}
          </Button>
        ))}
      </View>

      <View style={styles.selectedText}>
        <TextInput
          label="Selected Text"
          value={selectedText}
          multiline
          numberOfLines={3}
          disabled
          style={styles.input}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        disabled={loading}
        style={styles.saveButton}
      >
        Save Bookmark
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
  },
  colorButtonContent: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedText: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
}); 