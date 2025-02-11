declare module 'react-native-sound' {
  export interface SoundOptions {
    enableBackgroundPlayback?: boolean;
    mixWithOthers?: boolean;
  }

  export default class Sound {
    static setCategory(category: string, mixWithOthers?: boolean): void;
    static MAIN_BUNDLE: string;
    static DOCUMENT: string;
    static LIBRARY: string;
    static CACHES: string;

    constructor(
      filename: string,
      basePath: string,
      onError: (error: Error | null) => void,
      options?: SoundOptions
    );

    play(onEnd?: (success: boolean) => void): void;
    pause(callback?: () => void): void;
    stop(callback?: () => void): void;
    release(): void;
    getDuration(): number;
    getCurrentTime(callback: (seconds: number) => void): void;
    setCurrentTime(seconds: number): void;
    setVolume(value: number): void;
    setSpeed(value: number): void;
    setNumberOfLoops(loops: number): void;
    setPan(value: number): void;
    setCategory(category: string): void;
  }
} 