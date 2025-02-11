import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import { apiClient, TTSRequest } from './api';

interface TTSOptions {
  languageCode?: string;
  name?: string;
  ssmlGender?: 'NEUTRAL' | 'MALE' | 'FEMALE';
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  speakingRate?: number;
}

export class GoogleCloudTTS {
  constructor() {
    // Initialize react-native-sound
    Sound.setCategory('Playback');
  }

  async speak(
    text: string,
    lang: string,
    options: TTSOptions = {}
  ): Promise<void> {
    try {
      // Generate a unique filename for caching
      const hash = await this.generateHash(text + lang + JSON.stringify(options));
      const cacheDir = `${RNFS.CachesDirectoryPath}/tts`;
      const cachePath = `${cacheDir}/${hash}.mp3`;

      // Check if audio is already cached
      const exists = await RNFS.exists(cachePath);
      if (!exists) {
        // Ensure cache directory exists
        await RNFS.mkdir(cacheDir);

        // Request speech synthesis from our API
        const request: TTSRequest = {
          text,
          language: this.getLanguageCode(lang),
          voice: options.name || this.getVoiceName(lang),
          speed: options.speakingRate || 1.0,
        };

        const response = await apiClient.synthesizeSpeech(request);

        if (response.error) {
          throw new Error(response.error);
        }

        // Download and save audio to cache
        await RNFS.downloadFile({
          fromUrl: response.audioUrl,
          toFile: cachePath,
        }).promise;
      }

      // Play the audio
      return new Promise((resolve, reject) => {
        const sound = new Sound(cachePath, '', (error: Error | null) => {
          if (error) {
            console.error('Error loading sound:', error);
            reject(error);
            return;
          }

          sound.play((success: boolean) => {
            if (success) {
              console.log('Successfully finished playing');
              resolve();
            } else {
              console.error('Playback failed due to audio decoding errors');
              reject(new Error('Playback failed'));
            }
            sound.release();
          });
        });
      });
    } catch (error) {
      console.error('Error in TTS:', error);
      throw error;
    }
  }

  private async generateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getLanguageCode(lang: string): string {
    // Map language codes to Google Cloud TTS language codes
    const languageMap: { [key: string]: string } = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      ja: 'ja-JP',
      ko: 'ko-KR',
      zh: 'zh-CN',
      ru: 'ru-RU',
      // Add more language mappings as needed
    };

    return languageMap[lang.toLowerCase()] || 'en-US';
  }

  private getVoiceName(lang: string): string {
    // Map languages to specific voice names
    const voiceMap: { [key: string]: string } = {
      en: 'en-US-Neural2-A',
      es: 'es-ES-Neural2-A',
      fr: 'fr-FR-Neural2-A',
      de: 'de-DE-Neural2-A',
      it: 'it-IT-Neural2-A',
      ja: 'ja-JP-Neural2-A',
      ko: 'ko-KR-Neural2-A',
      zh: 'zh-CN-Neural2-A',
      ru: 'ru-RU-Neural2-A',
      // Add more voice mappings as needed
    };

    return voiceMap[lang.toLowerCase()] || 'en-US-Neural2-A';
  }
} 