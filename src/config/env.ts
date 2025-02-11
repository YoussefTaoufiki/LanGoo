import Constants from 'expo-constants';

export interface Config {
  api: {
    baseUrl: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
}

// Default configuration for Expo Snack
const defaultConfig: Config = {
  api: {
    baseUrl: 'https://api.lango-app.com',
  },
  firebase: {
    apiKey: Constants.expoConfig?.extra?.firebaseApiKey ?? '',
    authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain ?? '',
    projectId: Constants.expoConfig?.extra?.firebaseProjectId ?? '',
    storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket ?? '',
    messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId ?? '',
    appId: Constants.expoConfig?.extra?.firebaseAppId ?? '',
    measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId,
  },
  openai: {
    apiKey: Constants.expoConfig?.extra?.openaiApiKey ?? '',
    model: Constants.expoConfig?.extra?.openaiModel ?? 'gpt-4',
  },
};

// Get environment-specific configuration
export const getEnvVars = (): Config => {
  // In Expo Snack, we'll always use the default config
  if (Constants.expoConfig?.extra?.isExpoSnack) {
    return defaultConfig;
  }

  // For development and production environments
  if (Constants.expoConfig?.extra?.releaseChannel === 'production') {
    return {
      ...defaultConfig,
      api: {
        baseUrl: Constants.expoConfig?.extra?.apiUrl ?? defaultConfig.api.baseUrl,
      },
    };
  }

  return defaultConfig;
};

export const config = getEnvVars(); 