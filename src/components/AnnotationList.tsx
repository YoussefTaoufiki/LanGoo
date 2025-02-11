import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, IconButton, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchAnnotations, deleteAnnotation, setSelectedAnnotation } from '../store/slices/annotationSlice';
import { Annotation } from '../services/annotation';

interface AnnotationListProps {
  bookId: string;
  onAnnotationSelect: (annotation: Annotation) => void;
}

export const AnnotationList: React.FC<AnnotationListProps> = ({
  bookId,
  onAnnotationSelect,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { annotations, loading, error } = useSelector((state: RootState) => ({
    annotations: state.annotation.annotations[bookId] || [],
    loading: state.annotation.loading,
    error: state.annotation.error,
  }));

  useEffect(() => {
    void dispatch(fetchAnnotations({ bookId, chapterId: '' }));
  }, [dispatch, bookId]);

  const handleDeleteAnnotation = async (id: string) => {
    try {
      await dispatch(deleteAnnotation(id)).unwrap();
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  };

  const handleSelectAnnotation = (annotation: Annotation) => {
    dispatch(setSelectedAnnotation(annotation));
    onAnnotationSelect(annotation);
  };

  const renderAnnotation = ({ item }: { item: Annotation }) => (
    <Card style={[styles.annotationCard, { borderLeftColor: item.color }]}>
      <Card.Title
        title={item.highlightedText}
        subtitle={new Date(item.createdAt).toLocaleDateString()}
        right={(props) => (
          <IconButton
            {...props}
            icon="delete"
            onPress={() => handleDeleteAnnotation(item.id!)}
          />
        )}
      />
      <Card.Content>
        {item.note && (
          <Text style={styles.noteText}>
            {item.note}
          </Text>
        )}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag: string) => (
              <Chip
                key={tag}
                style={styles.tag}
                textStyle={styles.tagText}
                mode="outlined"
              >
                {tag}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <IconButton
          icon="pencil"
          onPress={() => handleSelectAnnotation(item)}
        />
        <IconButton
          icon="export-variant"
          onPress={() => {/* TODO: Implement export single annotation */}}
        />
      </Card.Actions>
    </Card>
  );

  if (loading && !annotations.length) {
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
      data={annotations}
      renderItem={renderAnnotation}
      keyExtractor={(item) => item.id!}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No annotations yet</Text>
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
  annotationCard: {
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  noteText: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
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