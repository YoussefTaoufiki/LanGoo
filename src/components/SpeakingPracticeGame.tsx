import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  generatePrompt,
  playPrompt,
  submitRecording,
  getLeaderboard,
  startRecording as startRecordingAction,
  stopRecording as stopRecordingAction,
  updateRecordingDuration,
  clearRecording,
} from '../store/slices/speakingPracticeSlice';
import { Button } from './Button';
import { useCustomTheme } from '../hooks/useCustomTheme';
import { CustomTheme } from '../theme/types';
import { formatTime } from '../utils/timeUtils';
import { SpeakingScore } from '../services/speakingPracticeGame';
import { ThunkDispatch, AnyAction } from '@reduxjs/toolkit';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import type {
  AudioSet,
  PlayBackType,
  RecordBackType,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

interface SpeakingPracticeGameProps {
  bookId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  onClose: () => void;
}

export const SpeakingPracticeGame: React.FC<SpeakingPracticeGameProps> = ({
  bookId,
  difficulty,
  language,
  onClose,
}) => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, AnyAction>>();
  const theme = useCustomTheme();
  const styles = createStyles(theme);

  const {
    currentPrompt,
    isRecording,
    recordingDuration,
    audioUrl,
    submission,
    loading,
    error,
    leaderboard,
  } = useSelector((state: RootState) => state.speakingPractice);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer());

  const stopPlayback = useCallback(async () => {
    try {
      await audioRecorderPlayer.current.stopPlayer();
      audioRecorderPlayer.current.removePlayBackListener();
      setIsPlaying(false);
      setPlaybackProgress(0);
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      const result = await audioRecorderPlayer.current.stopRecorder();
      audioRecorderPlayer.current.removeRecordBackListener();
      dispatch(stopRecordingAction({
        audioUrl: result,
        duration: recordingDuration,
      }));
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  }, [dispatch, isRecording, recordingDuration]);

  useEffect(() => {
    const loadPrompt = async () => {
      await dispatch(generatePrompt({ bookId, difficulty, language }));
    };
    loadPrompt();
    return () => {
      stopRecording();
      stopPlayback();
    };
  }, [bookId, difficulty, language, dispatch, stopRecording, stopPlayback]);

  const startRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          Alert.alert('Permission Error', 'Microphone and storage permissions are required');
          return;
        }
      }

      const audioPath = Platform.select({
        ios: 'recording.m4a',
        android: `${RNFS.CachesDirectoryPath}/recording.mp3`,
      });

      await audioRecorderPlayer.current.startRecorder(audioPath);
      audioRecorderPlayer.current.addRecordBackListener((e: RecordBackType) => {
        dispatch(updateRecordingDuration(e.currentPosition / 1000));
      });

      dispatch(startRecordingAction());
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const playPromptAudio = async () => {
    if (!currentPrompt?.text) return;

    try {
      await dispatch(playPrompt({
        text: currentPrompt.text,
        language,
        speed: difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 1.0 : 1.2,
      })).unwrap();
    } catch (error) {
      console.error('Error playing prompt:', error);
      Alert.alert('Error', 'Failed to play prompt');
    }
  };

  const startPlayback = async () => {
    if (!audioUrl) return;

    try {
      await audioRecorderPlayer.current.startPlayer(audioUrl);
      audioRecorderPlayer.current.addPlayBackListener((e: PlayBackType) => {
        setPlaybackProgress(e.currentPosition / e.duration);
        if (e.currentPosition === e.duration) {
          stopPlayback();
        }
      });
      setIsPlaying(true);
    } catch (error) {
      console.error('Error starting playback:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const handleSubmit = async () => {
    if (!currentPrompt?.id || !audioUrl) return;

    try {
      await dispatch(submitRecording({
        promptId: currentPrompt.id,
        audioUrl,
        duration: recordingDuration,
      })).unwrap();
      
      await dispatch(getLeaderboard({ bookId, difficulty }));
    } catch (error) {
      console.error('Error submitting recording:', error);
    }
  };

  const handleNewPrompt = () => {
    dispatch(generatePrompt({ bookId, difficulty, language }));
    dispatch(clearRecording());
  };

  if (loading && !currentPrompt) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={handleNewPrompt} />
      </View>
    );
  }

  if (submission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Speaking Analysis</Text>
        
        <ScrollView style={styles.feedbackContainer}>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreTitle}>Scores:</Text>
            <Text style={styles.scoreText}>Pronunciation: {submission.pronunciationScore}%</Text>
            <Text style={styles.scoreText}>Fluency: {submission.fluencyScore}%</Text>
            <Text style={styles.scoreText}>Accuracy: {submission.accuracyScore}%</Text>
            <Text style={styles.scoreText}>Overall: {submission.overallScore}%</Text>
          </View>

          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Feedback:</Text>
            {submission.feedback.map((item, index) => (
              <Text key={index} style={styles.feedbackItem}>• {item}</Text>
            ))}
          </View>

          {submission.corrections.length > 0 && (
            <View style={styles.correctionsSection}>
              <Text style={styles.correctionsTitle}>Pronunciation Corrections:</Text>
              {submission.corrections.map((correction, index) => (
                <View key={index} style={styles.correctionItem}>
                  <Text style={styles.correctionText}>
                    Word: <Text style={styles.highlightText}>{correction.word}</Text>
                  </Text>
                  <Text style={styles.correctionText}>
                    Correct: <Text style={styles.highlightText}>{correction.correctPronunciation}</Text>
                  </Text>
                  <Text style={styles.correctionText}>
                    Your pronunciation: <Text style={styles.highlightText}>{correction.userPronunciation}</Text>
                  </Text>
                  <Text style={styles.correctionTimestamp}>
                    Time: {formatTime(correction.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {showLeaderboard && (
            <View style={styles.leaderboardSection}>
              <Text style={styles.leaderboardTitle}>Leaderboard</Text>
              {leaderboard.map((score: SpeakingScore, index: number) => (
                <View key={score.id} style={styles.leaderboardItem}>
                  <Text style={styles.rankText}>{index + 1}.</Text>
                  <Text style={styles.playerText}>{score.userName}</Text>
                  <Text style={styles.scoreText}>{score.averageScore.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            title={showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
            onPress={() => setShowLeaderboard(!showLeaderboard)}
            variant="secondary"
          />
          <Button title="Try Another" onPress={handleNewPrompt} />
          <Button title="Close" onPress={onClose} variant="secondary" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Speaking Practice</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.promptContainer}>
        <Text style={styles.promptTitle}>Prompt:</Text>
        <Text style={styles.promptText}>{currentPrompt?.text}</Text>
        {currentPrompt?.translation && (
          <Text style={styles.translationText}>
            Translation: {currentPrompt.translation}
          </Text>
        )}
        {currentPrompt?.context && (
          <Text style={styles.contextText}>
            Context: {currentPrompt.context}
          </Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <Button
          title="Listen to Prompt"
          onPress={playPromptAudio}
          disabled={loading}
          variant="secondary"
        />

        {!audioUrl ? (
          <Button
            title={isRecording ? `Recording... ${formatTime(recordingDuration)}` : 'Start Recording'}
            onPress={isRecording ? stopRecording : startRecording}
            variant={isRecording ? 'secondary' : 'primary'}
          />
        ) : (
          <View style={styles.playbackContainer}>
            <Button
              title={isPlaying ? 'Stop Playback' : 'Play Recording'}
              onPress={isPlaying ? stopPlayback : startPlayback}
              variant="secondary"
            />
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${playbackProgress * 100}%` },
                ]}
              />
            </View>
            <Button
              title="Clear Recording"
              onPress={() => dispatch(clearRecording())}
              variant="secondary"
            />
          </View>
        )}

        {audioUrl && (
          <Button
            title="Submit"
            onPress={handleSubmit}
            disabled={loading}
          />
        )}
      </View>
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
  promptContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  translationText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    fontStyle: 'italic',
  },
  contextText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  playbackContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  feedbackContainer: {
    flex: 1,
    marginVertical: 16,
  },
  scoreSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  feedbackSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  feedbackItem: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  correctionsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  correctionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  correctionItem: {
    marginBottom: 12,
  },
  correctionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  highlightText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  correctionTimestamp: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  leaderboardSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rankText: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  playerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
}); 