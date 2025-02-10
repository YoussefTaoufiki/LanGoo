import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, IconButton, Portal, Dialog, Button, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { updateReadingProgress, setCurrentChapter } from '../store/slices/navigationSlice';
import { navigationService, PageInfo } from '../services/navigation';

interface PageNavigationProps {
  bookId: string;
  currentCfi: string;
  onPageChange: (cfi: string) => void;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  bookId,
  currentCfi,
  onPageChange,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [targetPage, setTargetPage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageInfo = async () => {
      try {
        const info = await navigationService.getPageInfo(bookId, currentCfi);
        if (info) {
          setPageInfo(info);
          // Update reading progress with current page
          await dispatch(updateReadingProgress({
            bookId,
            data: {
              currentPage: info.currentPage,
              totalPages: info.totalPages,
            },
          })).unwrap();
        }
      } catch (error) {
        console.error('Error fetching page info:', error);
      }
    };

    void fetchPageInfo();
  }, [bookId, currentCfi, dispatch]);

  const handleJumpToPage = async () => {
    try {
      setError(null);
      const pageNumber = parseInt(targetPage, 10);
      
      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > (pageInfo?.totalPages || 0)) {
        setError(`Please enter a valid page number between 1 and ${pageInfo?.totalPages || 0}`);
        return;
      }

      const result = await navigationService.jumpToPage(bookId, pageNumber);
      if (result) {
        dispatch(setCurrentChapter(result.chapter));
        onPageChange(result.cfi);
        setShowJumpDialog(false);
        setTargetPage('');
      } else {
        setError('Could not find the specified page');
      }
    } catch (error) {
      console.error('Error jumping to page:', error);
      setError('Failed to jump to page');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageInfo}>
        <IconButton
          icon="chevron-left"
          onPress={() => {
            if (pageInfo && pageInfo.currentPage > 1) {
              void navigationService
                .jumpToPage(bookId, pageInfo.currentPage - 1)
                .then((result) => {
                  if (result) {
                    dispatch(setCurrentChapter(result.chapter));
                    onPageChange(result.cfi);
                  }
                });
            }
          }}
          disabled={!pageInfo || pageInfo.currentPage <= 1}
        />
        <Text onPress={() => setShowJumpDialog(true)} style={styles.pageText}>
          Page {pageInfo?.currentPage || '-'} of {pageInfo?.totalPages || '-'}
        </Text>
        <IconButton
          icon="chevron-right"
          onPress={() => {
            if (pageInfo && pageInfo.currentPage < pageInfo.totalPages) {
              void navigationService
                .jumpToPage(bookId, pageInfo.currentPage + 1)
                .then((result) => {
                  if (result) {
                    dispatch(setCurrentChapter(result.chapter));
                    onPageChange(result.cfi);
                  }
                });
            }
          }}
          disabled={!pageInfo || pageInfo.currentPage >= (pageInfo.totalPages || 0)}
        />
      </View>

      <Portal>
        <Dialog visible={showJumpDialog} onDismiss={() => setShowJumpDialog(false)}>
          <Dialog.Title>Jump to Page</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Page Number"
              value={targetPage}
              onChangeText={setTargetPage}
              keyboardType="number-pad"
              error={!!error}
              style={styles.input}
            />
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}
            <Text style={styles.helperText}>
              Enter a page number between 1 and {pageInfo?.totalPages || '-'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowJumpDialog(false)}>Cancel</Button>
            <Button onPress={handleJumpToPage}>Go</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageText: {
    fontSize: 16,
    paddingHorizontal: 8,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 