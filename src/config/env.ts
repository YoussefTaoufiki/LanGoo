import { Platform } from 'react-native';

interface Config {
  openai: {
    apiKey: string;
  };
  expo: {
    clientId: string;
  };
  google: {
    webClientId: string;
    iosClientId: string;
    androidClientId: string;
  };
  ios: {
    bundleId: string;
  };
  android: {
    packageName: string;
  };
}

export const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  expo: {
    clientId: process.env.EXPO_CLIENT_ID || '',
  },
  google: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
  },
  ios: {
    bundleId: 'com.yourcompany.lango',
  },
  android: {
    packageName: 'com.yourcompany.lango',
  },
}; 