import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import auth from '@react-native-firebase/auth';
import { apiClient, TTSRequest } from './api';

export interface TTSVoice {
  name: string;
  languageCode: string;
  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  naturalSampleRateHertz: number;
}

export interface TTSConfig {
  voice: TTSVoice;
  audioConfig: {
    audioEncoding: 'MP3' | 'OGG_OPUS';
    pitch: number;
    speakingRate: number;
    volumeGainDb: number;
  };
}

export interface TTSCacheEntry {
  text: string;
  audioPath: string;
  config: TTSConfig;
  timestamp: number;
}

class TTSService {
  private cacheCollection = 'tts_cache';
  private maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * List available voices
   */
  async listVoices(languageCode?: string): Promise<TTSVoice[]> {
    try {
      const response = await apiClient.listVoices(languageCode);
      return response.voices;
    } catch (error) {
      console.error('Error listing voices:', error);
      throw error;
    }
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(text: string, config: TTSConfig): Promise<string> {
    try {
      // Check cache first
      const cachedAudio = await this.checkCache(text, config);
      if (cachedAudio) {
        return cachedAudio;
      }

      // Request speech synthesis from our API
      const request: TTSRequest = {
        text,
        language: config.voice.languageCode,
        voice: config.voice.name,
        speed: config.audioConfig.speakingRate,
      };

      const response = await apiClient.synthesizeSpeech(request);

      if (response.error) {
        throw new Error(response.error);
      }

      // Download and save to cache
      const audioPath = await this.saveToCache(text, response.audioUrl, config);
      return audioPath;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  /**
   * Check cache for existing audio
   */
  private async checkCache(text: string, config: TTSConfig): Promise<string | null> {
    try {
      const cacheKey = this.getCacheKey(text, config);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (cached) {
        const entry: TTSCacheEntry = JSON.parse(cached);
        const age = Date.now() - entry.timestamp;

        if (age < this.maxCacheAge) {
          // Verify file exists
          const fileInfo = await FileSystem.getInfoAsync(entry.audioPath);
          if (fileInfo.exists) {
            return entry.audioPath;
          }
        }

        // Remove expired or invalid cache entry
        await AsyncStorage.removeItem(cacheKey);
      }

      return null;
    } catch (error) {
      console.error('Error checking cache:', error);
      return null;
    }
  }

  /**
   * Save audio to cache
   */
  private async saveToCache(text: string, audioUrl: string, config: TTSConfig): Promise<string> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Download and save audio file
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${
        config.audioConfig.audioEncoding.toLowerCase()
      }`;
      const filePath = `${FileSystem.cacheDirectory}tts/${fileName}`;

      await FileSystem.makeDirectoryAsync(`${FileSystem.cacheDirectory}tts/`, {
        intermediates: true,
      });

      const { uri } = await FileSystem.downloadAsync(audioUrl, filePath);

      // Save cache entry
      const cacheKey = this.getCacheKey(text, config);
      const cacheEntry: TTSCacheEntry = {
        text,
        audioPath: uri,
        config,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

      return uri;
    } catch (error) {
      console.error('Error saving to cache:', error);
      throw error;
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(text: string, config: TTSConfig): string {
    const hash = this.hashCode(`${text}${JSON.stringify(config)}`);
    return `@tts_cache_${hash}`;
  }

  /**
   * Simple string hash function
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Clean up old cache entries
   */
  async cleanCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@tts_cache_'));

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const entry: TTSCacheEntry = JSON.parse(cached);
          const age = Date.now() - entry.timestamp;

          if (age >= this.maxCacheAge) {
            // Remove audio file
            try {
              await FileSystem.deleteAsync(entry.audioPath);
            } catch (error) {
              console.warn('Error deleting cached audio file:', error);
            }
            // Remove cache entry
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning cache:', error);
      throw error;
    }
  }
}

export const ttsService = new TTSService(); 