export default {
  name: 'LanGo',
  slug: 'lango',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.lango'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.yourcompany.lango'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-localization',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/firestore',
    '@react-native-firebase/storage',
    '@react-native-firebase/analytics'
  ],
  extra: {
    isExpoSnack: true,
    apiUrl: 'https://api.lango-app.com',
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY || '{{FIREBASE_API_KEY}}',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '{{FIREBASE_AUTH_DOMAIN}}',
      projectId: process.env.FIREBASE_PROJECT_ID || '{{FIREBASE_PROJECT_ID}}',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '{{FIREBASE_STORAGE_BUCKET}}',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '{{FIREBASE_MESSAGING_SENDER_ID}}',
      appId: process.env.FIREBASE_APP_ID || '{{FIREBASE_APP_ID}}',
      measurementId: process.env.FIREBASE_MEASUREMENT_ID || '{{FIREBASE_MEASUREMENT_ID}}'
    },
    openaiApiKey: process.env.OPENAI_API_KEY || '{{OPENAI_API_KEY}}',
    openaiModel: 'gpt-4',
    eas: {
      projectId: process.env.EAS_PROJECT_ID || '{{EAS_PROJECT_ID}}'
    }
  }
}; 