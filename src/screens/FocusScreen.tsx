import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Portal, Dialog, IconButton, ProgressBar, List } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper/lib/typescript/types';
import { useDispatch } from 'react-redux';
import { addFocusSession } from '../store/slices/focusSlice';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Focus'>;

interface FocusState {
  isActive: boolean;
  time: number;
  timerId: ReturnType<typeof setInterval> | null;
  isPaused: boolean;
}

const FOCUS_DURATIONS = [
  { label: '15 minutes', value: 15 },
  { label: '25 minutes', value: 25 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
];

export const FocusScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [state, setState] = useState<FocusState>({
    isActive: false,
    time: FOCUS_DURATIONS[1].value * 60, // Default to 25 minutes
    timerId: null,
    isPaused: false,
  });
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const startTimer = useCallback(() => {
    const id = setInterval(() => {
      setState((prevState) => {
        if (prevState.time <= 1) {
          clearInterval(id);
          setShowCompleteDialog(true);
          setSessionsCompleted(prev => prev + 1);
          return {
            ...prevState,
            isActive: false,
            time: 0,
            timerId: null,
          };
        }
        return {
          ...prevState,
          time: prevState.time - 1,
        };
      });
    }, 1000);

    setState((prevState) => ({
      ...prevState,
      isActive: true,
      timerId: id,
      isPaused: false,
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    if (state.timerId) {
      clearInterval(state.timerId);
      setState((prevState) => ({
        ...prevState,
        timerId: null,
        isPaused: true,
      }));
    }
  }, [state.timerId]);

  const resetTimer = useCallback(() => {
    if (state.timerId) {
      clearInterval(state.timerId);
    }
    setState({
      isActive: false,
      time: FOCUS_DURATIONS[1].value * 60,
      timerId: null,
      isPaused: false,
    });
  }, [state.timerId]);

  const handleSessionComplete = useCallback(() => {
    dispatch(addFocusSession({
      duration: FOCUS_DURATIONS[1].value,
      timestamp: Date.now(),
    }));
    setShowCompleteDialog(false);
    resetTimer();
  }, [dispatch, resetTimer]);

  useEffect(() => {
    return () => {
      if (state.timerId) {
        clearInterval(state.timerId);
      }
    };
  }, [state.timerId]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = 1 - state.time / (FOCUS_DURATIONS[1].value * 60);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    timer: {
      fontSize: 72,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 20,
    },
    progress: {
      width: 200,
      height: 8,
      marginBottom: 10,
    },
    duration: {
      color: theme.colors.primary,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    playButton: {
      backgroundColor: theme.colors.primaryContainer,
    },
    stats: {
      marginTop: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(state.time)}</Text>
        <ProgressBar progress={progress} style={styles.progress} />
        <Text 
          style={styles.duration} 
          onPress={() => !state.isActive && setShowDurationPicker(true)}
        >
          {FOCUS_DURATIONS[1].value} minutes
        </Text>
      </View>

      <View style={styles.controls}>
        <IconButton
          icon={state.isActive ? 'pause' : 'play'}
          size={48}
          onPress={state.isActive ? pauseTimer : startTimer}
          style={styles.playButton}
        />
        <IconButton
          icon="refresh"
          size={32}
          onPress={resetTimer}
          disabled={state.isActive}
        />
      </View>

      <View style={styles.stats}>
        <Text>Sessions Completed: {sessionsCompleted}</Text>
      </View>

      <Portal>
        <Dialog visible={showCompleteDialog} onDismiss={handleSessionComplete}>
          <Dialog.Title>Focus Session Complete!</Dialog.Title>
          <Dialog.Content>
            <Text>Great job! You've completed your focus session.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSessionComplete}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={showDurationPicker} onDismiss={() => setShowDurationPicker(false)}>
          <Dialog.Title>Select Duration</Dialog.Title>
          <Dialog.Content>
            {FOCUS_DURATIONS.map((item) => (
              <List.Item
                key={item.value}
                title={item.label}
                onPress={() => {
                  setState((prevState) => ({
                    ...prevState,
                    time: item.value * 60,
                    timerId: null,
                    isPaused: false,
                  }));
                  setShowDurationPicker(false);
                }}
                right={(props) => FOCUS_DURATIONS[1].value === item.value && <List.Icon {...props} icon="check" />}
              />
            ))}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}; 