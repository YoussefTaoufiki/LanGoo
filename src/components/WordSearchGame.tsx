import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  generatePuzzle,
  findWord,
  saveScore,
  getLeaderboard,
  endGame,
} from '../store/slices/wordSearchSlice';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { CustomTheme } from '../theme/types';

interface Props {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  onClose: () => void;
}

const WordSearchGame: React.FC<Props> = ({ bookId, difficulty, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useCustomTheme();
  const styles = createStyles(theme);

  const { currentPuzzle, foundWords, startTime, loading, error } = useSelector(
    (state: RootState) => state.wordSearch
  );

  const [selectedCells, setSelectedCells] = useState<number[][]>([]);
  const [startCell, setStartCell] = useState<number[] | null>(null);
  const [endCell, setEndCell] = useState<number[] | null>(null);

  useEffect(() => {
    dispatch(generatePuzzle({ bookId, difficulty, wordCount: 8 }));
    return () => {
      dispatch(endGame());
    };
  }, [bookId, difficulty, dispatch]);

  const handleCellPress = (row: number, col: number) => {
    if (!startCell) {
      setStartCell([row, col]);
      setSelectedCells([[row, col]]);
    } else if (!endCell) {
      setEndCell([row, col]);
      const cells = getLinePoints(startCell[0], startCell[1], row, col);
      setSelectedCells(cells);
      
      // Check if a word is found
      const word = getSelectedWord(cells);
      if (currentPuzzle?.words.includes(word)) {
        dispatch(findWord(word));
      }

      // Reset selection
      setTimeout(() => {
        setStartCell(null);
        setEndCell(null);
        setSelectedCells([]);
      }, 300);
    }
  };

  const getLinePoints = (x1: number, y1: number, x2: number, y2: number): number[][] => {
    const points: number[][] = [];
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
      points.push([x, y]);
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return points;
  };

  const getSelectedWord = (cells: number[][]): string => {
    if (!currentPuzzle) return '';
    return cells.map(([row, col]) => currentPuzzle.grid[row][col]).join('');
  };

  const handleGameEnd = async () => {
    if (currentPuzzle && startTime) {
      const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
      await dispatch(saveScore({
        bookId,
        difficulty,
        timeSeconds,
        wordsFound: foundWords.length,
        totalWords: currentPuzzle.words.length,
        timestamp: Date.now(),
      }));
      await dispatch(getLeaderboard({ bookId, difficulty }));
      onClose();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading puzzle...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentPuzzle) {
    return null;
  }

  const isGameComplete = foundWords.length === currentPuzzle.words.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Search</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.gridContainer}>
          {currentPuzzle.grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((letter, colIndex) => {
                const isSelected = selectedCells.some(
                  ([r, c]) => r === rowIndex && c === colIndex
                );
                const isFound = startCell && endCell ? foundWords.some(word => {
                  const cells = getLinePoints(
                    startCell[0],
                    startCell[1],
                    endCell[0],
                    endCell[1]
                  );
                  return getSelectedWord(cells) === word;
                }) : false;

                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={[
                      styles.cell,
                      isSelected && styles.selectedCell,
                      isFound && styles.foundCell,
                    ]}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                  >
                    <Text style={[
                      styles.letter,
                      isSelected && styles.selectedLetter,
                      isFound && styles.foundLetter,
                    ]}>
                      {letter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.wordList}>
          <Text style={styles.subtitle}>Words to Find:</Text>
          <View style={styles.wordsContainer}>
            {currentPuzzle.words.map((word, index) => (
              <Text
                key={index}
                style={[
                  styles.word,
                  foundWords.includes(word) && styles.foundWord,
                ]}
              >
                {word}
              </Text>
            ))}
          </View>
        </View>

        {isGameComplete && (
          <TouchableOpacity style={styles.button} onPress={handleGameEnd}>
            <Text style={styles.buttonText}>Finish Game</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: CustomTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCell: {
    backgroundColor: theme.colors.primary,
  },
  foundCell: {
    backgroundColor: theme.colors.success,
  },
  letter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  selectedLetter: {
    color: theme.colors.onPrimary,
  },
  foundLetter: {
    color: theme.colors.onSuccess,
  },
  wordList: {
    marginTop: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  word: {
    fontSize: 16,
    color: theme.colors.text,
    padding: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
  },
  foundWord: {
    color: theme.colors.success,
    textDecorationLine: 'line-through',
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default WordSearchGame; 