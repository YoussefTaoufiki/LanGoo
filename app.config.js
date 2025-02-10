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
    'expo-apple-authentication',
    'expo-auth-session'
  ],
  scheme: 'lango'
}; 