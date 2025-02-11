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
    firebaseApiKey: '{{FIREBASE_API_KEY}}',
    firebaseAuthDomain: '{{FIREBASE_AUTH_DOMAIN}}',
    firebaseProjectId: '{{FIREBASE_PROJECT_ID}}',
    firebaseStorageBucket: '{{FIREBASE_STORAGE_BUCKET}}',
    firebaseMessagingSenderId: '{{FIREBASE_MESSAGING_SENDER_ID}}',
    firebaseAppId: '{{FIREBASE_APP_ID}}',
    firebaseMeasurementId: '{{FIREBASE_MEASUREMENT_ID}}',
    openaiApiKey: '{{OPENAI_API_KEY}}',
    openaiModel: 'gpt-4',
    eas: {
      projectId: '{{EAS_PROJECT_ID}}'
    }
  }
}; 