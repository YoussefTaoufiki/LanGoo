import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Text, IconButton, useTheme, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchChapters, fetchReadingProgress, setCurrentChapter } from '../store/slices/navigationSlice';
import { Chapter } from '../services/navigation';

interface ChapterNavigationProps {
  bookId: string;
  onChapterSelect: (chapter: Chapter) => void;
}

export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  bookId,
  onChapterSelect,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { chapters, progress, loading, error, currentChapter } = useSelector((state: RootState) => ({
    chapters: state.navigation.chapters[bookId] || [],
    progress: state.navigation.progress[bookId],
    loading: state.navigation.loading,
    error: state.navigation.error,
    currentChapter: state.navigation.currentChapter,
  }));

  useEffect(() => {
    void dispatch(fetchChapters(bookId));
    void dispatch(fetchReadingProgress(bookId));
  }, [dispatch, bookId]);

  const handleChapterSelect = (chapter: Chapter) => {
    dispatch(setCurrentChapter(chapter));
    onChapterSelect(chapter);
  };

  const renderChapter = (chapter: Chapter, level = 0) => {
    const isCurrentChapter = currentChapter?.id === chapter.id;
    const hasChildren = chapter.children && chapter.children.length > 0;
    const childChapters = hasChildren
      ? chapters.filter(c => chapter.children?.includes(c.id))
      : [];

    return (
      <View key={chapter.id}>
        <List.Item
          title={chapter.title}
          left={props => (
            <View style={[styles.levelIndicator, { width: level * 16 }]} />
          )}
          right={props => (
            <IconButton
              {...props}
              icon={isCurrentChapter ? 'bookmark' : 'bookmark-outline'}
              onPress={() => handleChapterSelect(chapter)}
            />
          )}
          style={[
            styles.chapterItem,
            isCurrentChapter && { backgroundColor: theme.colors.primaryContainer },
          ]}
          onPress={() => handleChapterSelect(chapter)}
        />
        {hasChildren && childChapters.map(child => renderChapter(child, level + 1))}
      </View>
    );
  };

  if (loading && !chapters.length) {
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

  const rootChapters = chapters.filter(chapter => !chapter.parent);

  return (
    <View style={styles.container}>
      {progress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {Math.round(progress.progress * 100)}% Complete
          </Text>
          <ProgressBar
            progress={progress.progress}
            style={styles.progressBar}
            color={theme.colors.primary}
          />
        </View>
      )}

      <ScrollView style={styles.chapterList}>
        {rootChapters.map(chapter => renderChapter(chapter))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  chapterList: {
    flex: 1,
  },
  chapterItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  levelIndicator: {
    height: '100%',
  },
  errorText: {
    textAlign: 'center',
  },
}); 