import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/env';
import { TTSVoice } from './tts';

// Constants
const API_BASE_URL = config.api.baseUrl;
const CACHE_KEYS = {
  TTS_AUDIO: '@tts_audio_cache',
  LAST_SYNC: '@api_last_sync',
};
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Types
export interface TTSRequest {
  text: string;
  language: string;
  voice?: string;
  speed?: number;
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
  error?: string;
}

export interface StorageUploadResponse {
  url: string;
  path: string;
  error?: string;
}

// API Client
class APIClient {
  private static instance: APIClient;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  async setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit & { params?: Record<string, string> } = {}): Promise<any> {
    const { params, ...restOptions } = options;
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';

    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...restOptions.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}${queryString}`, {
        ...restOptions,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Text-to-Speech API
  async listVoices(languageCode?: string): Promise<{ voices: TTSVoice[] }> {
    return this.request('/tts/voices', {
      method: 'GET',
      params: languageCode ? { language: languageCode } : undefined,
    });
  }

  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      // Check cache first
      const cacheKey = `${CACHE_KEYS.TTS_AUDIO}_${request.text}_${request.language}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const { audioUrl, duration, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return { audioUrl, duration };
        }
      }

      // Call backend API
      const response = await this.request('/tts/synthesize', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Cache the result
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        ...response,
        timestamp: Date.now(),
      }));

      return response;
    } catch (error) {
      console.error('TTS API Error:', error);
      return {
        audioUrl: '',
        duration: 0,
        error: 'Failed to synthesize speech',
      };
    }
  }

  // Storage API
  async uploadFile(file: File | Blob, path: string): Promise<StorageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      const response = await this.request('/storage/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      return response;
    } catch (error) {
      console.error('Storage API Error:', error);
      return {
        url: '',
        path: '',
        error: 'Failed to upload file',
      };
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this.request('/storage/delete', {
        method: 'DELETE',
        body: JSON.stringify({ path }),
      });
    } catch (error) {
      console.error('Storage API Error:', error);
      throw error;
    }
  }
}

export const apiClient = APIClient.getInstance(); 