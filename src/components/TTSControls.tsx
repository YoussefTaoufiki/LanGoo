import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  listVoices,
  synthesizeSpeech,
  setSelectedVoice,
  updateConfig,
  setPlaying,
  setProgress,
  reset,
} from '../store/slices/ttsSlice';
import { TTSVoice, TTSConfig } from '../services/tts';

interface TTSControlsProps {
  text: string;
  languageCode?: string;
}

export const TTSControls: React.FC<TTSControlsProps> = ({ text, languageCode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    voices,
    selectedVoice,
    config,
    loading,
    playing,
    progress,
    error,
  } = useSelector((state: RootState) => state.tts);

  useEffect(() => {
    dispatch(listVoices(languageCode));
  }, [dispatch, languageCode]);

  const handleVoiceChange = (voice: TTSVoice | null) => {
    dispatch(setSelectedVoice(voice));
  };

  const handleConfigChange = (key: keyof TTSConfig['audioConfig'], value: number) => {
    dispatch(updateConfig({ [key]: value }));
  };

  const handlePlayPause = async () => {
    if (playing) {
      dispatch(setPlaying(false));
    } else if (config) {
      dispatch(synthesizeSpeech({ text, config }));
    }
  };

  const handleStop = () => {
    dispatch(reset());
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text>Voice:</Text>
        <Picker
          selectedValue={selectedVoice}
          onValueChange={handleVoiceChange}
          style={styles.picker}
          enabled={!loading}
        >
          {voices.map((voice) => (
            <Picker.Item
              key={voice.name}
              label={`${voice.name} (${voice.languageCode})`}
              value={voice}
            />
          ))}
        </Picker>
      </View>

      {config && (
        <>
          <View style={styles.row}>
            <Text>Speed:</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.25}
              maximumValue={4.0}
              value={config.audioConfig.speakingRate}
              onValueChange={(value) => handleConfigChange('speakingRate', value)}
              disabled={loading}
            />
            <Text>{config.audioConfig.speakingRate.toFixed(2)}x</Text>
          </View>

          <View style={styles.row}>
            <Text>Pitch:</Text>
            <Slider
              style={styles.slider}
              minimumValue={-20.0}
              maximumValue={20.0}
              value={config.audioConfig.pitch}
              onValueChange={(value) => handleConfigChange('pitch', value)}
              disabled={loading}
            />
            <Text>{config.audioConfig.pitch.toFixed(1)}</Text>
          </View>

          <View style={styles.row}>
            <Text>Volume:</Text>
            <Slider
              style={styles.slider}
              minimumValue={-96.0}
              maximumValue={16.0}
              value={config.audioConfig.volumeGainDb}
              onValueChange={(value) => handleConfigChange('volumeGainDb', value)}
              disabled={loading}
            />
            <Text>{config.audioConfig.volumeGainDb.toFixed(1)} dB</Text>
          </View>
        </>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePlayPause}
          disabled={loading || !config}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : playing ? 'Pause' : 'Play'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !playing && styles.buttonDisabled]}
          onPress={handleStop}
          disabled={!playing}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>

      {playing && (
        <View style={styles.progressContainer}>
          <Slider
            style={styles.progressSlider}
            minimumValue={0}
            maximumValue={1}
            value={progress}
            onValueChange={(value) => dispatch(setProgress(value))}
          />
          <Text>{Math.round(progress * 100)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  picker: {
    flex: 1,
    marginLeft: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  progressSlider: {
    flex: 1,
    marginRight: 8,
  },
  error: {
    color: '#ff3b30',
    textAlign: 'center',
  },
}); 