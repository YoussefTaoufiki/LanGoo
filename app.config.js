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
    bundleIdentifier: 'com.yourusername.lango'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.yourusername.lango'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  scheme: 'lango',
  extra: {
    // Firebase configuration
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    firebaseAnalyticsId: process.env.FIREBASE_ANALYTICS_ID,
    // Google OAuth configuration
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  },
  plugins: [
    'expo-dev-client'
  ]
}; 