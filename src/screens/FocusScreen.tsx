import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, IconButton, ProgressBar, Portal, Dialog, List } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Focus'>;

const DURATIONS = [
  { label: '15 minutes', value: 15 },
  { label: '25 minutes', value: 25 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
];

export const FocusScreen: React.FC<Props> = ({ navigation }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(25); // Default 25 minutes
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    setSessionsCompleted((prev) => prev + 1);
    setTimeLeft(duration * 60);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / (duration * 60);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text variant="headlineMedium">Focus Mode</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Text variant="displayLarge" style={styles.timer}>
            {formatTime(timeLeft)}
          </Text>
          <ProgressBar progress={progress} style={styles.progress} />
          <Text variant="bodyLarge" style={styles.duration} onPress={() => !isRunning && setShowDurationPicker(true)}>
            {duration} minutes
          </Text>
        </View>

        <View style={styles.controls}>
          <IconButton
            icon={isRunning ? 'pause' : 'play'}
            size={48}
            onPress={toggleTimer}
            style={styles.playButton}
          />
          <IconButton
            icon="refresh"
            size={32}
            onPress={resetTimer}
            disabled={isRunning}
          />
        </View>

        <View style={styles.stats}>
          <Text variant="titleMedium">Sessions Completed Today: {sessionsCompleted}</Text>
        </View>

        <View style={styles.tips}>
          <Text variant="titleMedium" style={styles.tipsTitle}>Focus Tips</Text>
          <Text variant="bodyMedium">• Find a quiet place to read</Text>
          <Text variant="bodyMedium">• Put your phone on silent mode</Text>
          <Text variant="bodyMedium">• Take short breaks between sessions</Text>
          <Text variant="bodyMedium">• Stay hydrated</Text>
        </View>
      </View>

      <Portal>
        <Dialog visible={showDurationPicker} onDismiss={() => setShowDurationPicker(false)}>
          <Dialog.Title>Select Duration</Dialog.Title>
          <Dialog.Content>
            <List.Section>
              {DURATIONS.map((item) => (
                <List.Item
                  key={item.value}
                  title={item.label}
                  onPress={() => {
                    setDuration(item.value);
                    setTimeLeft(item.value * 60);
                    setShowDurationPicker(false);
                  }}
                  right={(props) => duration === item.value && <List.Icon {...props} icon="check" />}
                />
              ))}
            </List.Section>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  timer: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progress: {
    width: 250,
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  duration: {
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  playButton: {
    marginHorizontal: 20,
  },
  stats: {
    marginBottom: 40,
  },
  tips: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  tipsTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
}); 