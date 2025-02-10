/// <reference types="expo" />
/// <reference types="expo-auth-session" />
/// <reference types="expo-apple-authentication" />
/// <reference types="expo-web-browser" />
/// <reference types="nativewind/types" />
/// <reference types="expo/types" />

declare module 'expo-auth-session/providers/google' {
  export interface AuthRequest {
    promptAsync(options?: any): Promise<any>;
  }

  export interface AuthSessionResult {
    type: string;
    authentication?: {
      accessToken: string;
    };
  }

  export interface GoogleAuthRequestConfig {
    expoClientId?: string;
    androidClientId?: string;
    iosClientId?: string;
    webClientId?: string;
  }

  export function useAuthRequest(config: any): [AuthRequest | null, AuthSessionResult | null, any];
}

declare module 'expo-apple-authentication' {
  export enum AppleAuthenticationScope {
    FULL_NAME = 1,
    EMAIL = 2,
  }

  export interface AppleAuthenticationCredential {
    user: string;
    email?: string | null;
    fullName?: {
      familyName?: string;
      givenName?: string;
    } | null;
  }

  export function signInAsync(options: {
    requestedScopes: AppleAuthenticationScope[];
  }): Promise<AppleAuthenticationCredential>;
}

declare module 'expo-web-browser' {
  export function maybeCompleteAuthSession(): void;
}

// Asset modules
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module 'react-native-dotenv' {
  export const OPENAI_API_KEY: string;
  export const EXPO_CLIENT_ID: string;
  export const GOOGLE_WEB_CLIENT_ID: string;
  export const GOOGLE_IOS_CLIENT_ID: string;
  export const GOOGLE_ANDROID_CLIENT_ID: string;
  export const APP_ENV: 'development' | 'production';
  
  // Firebase Configuration
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
} 