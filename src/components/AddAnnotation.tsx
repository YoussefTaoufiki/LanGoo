import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Chip, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { createAnnotation } from '../store/slices/annotationSlice';
import type { Annotation } from '../services/annotation';

interface AddAnnotationProps {
  bookId: string;
  chapterId: string;
  cfi: string;
  highlightedText: string;
  onComplete: () => void;
}

export const AddAnnotation: React.FC<AddAnnotationProps> = ({
  bookId,
  chapterId,
  cfi,
  highlightedText,
  onComplete,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [note, setNote] = useState('');
  const [color, setColor] = useState(theme.colors.primary);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const annotation: Omit<Annotation, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        bookId,
        chapterId,
        cfi,
        text: '',
        highlightedText,
        note,
        color,
        tags,
      };

      await dispatch(createAnnotation(annotation)).unwrap();
      onComplete();
    } catch (error) {
      console.error('Error creating annotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.error,
    theme.colors.tertiary,
    theme.colors.surfaceVariant,
  ];

  return (
    <View style={styles.container}>
      <TextInput
        label="Note"
        value={note}
        onChangeText={setNote}
        style={styles.input}
        placeholder="Add a note about this highlight"
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

      <View style={styles.tagInputContainer}>
        <TextInput
          label="Add Tags"
          value={tagInput}
          onChangeText={setTagInput}
          style={styles.tagInput}
          placeholder="Enter a tag"
          onSubmitEditing={handleAddTag}
          right={
            <TextInput.Icon
              icon="plus"
              onPress={handleAddTag}
            />
          }
        />
      </View>

      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              onClose={() => handleRemoveTag(tag)}
              style={styles.tag}
              textStyle={styles.tagText}
            >
              {tag}
            </Chip>
          ))}
        </View>
      )}

      <View style={styles.highlightedText}>
        <TextInput
          label="Highlighted Text"
          value={highlightedText}
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
        Save Annotation
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
  tagInputContainer: {
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  highlightedText: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
}); 