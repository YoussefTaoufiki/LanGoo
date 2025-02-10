# LanGo - Language Learning App

A mobile application built with React Native and Expo for learning languages through interactive exercises and real-time translations.

## Running in Expo Snack

1. Visit [Expo Snack](https://snack.expo.dev/)
2. Create a new project
3. Copy the contents of this repository into the Snack editor
4. The project should automatically run in the preview window

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on your device:
- Install the Expo Go app on your iOS or Android device
- Scan the QR code from the terminal with your device's camera
- The app will open in Expo Go

## Configuration

Before running the app, you need to set up the following:

1. Google Sign-In:
- Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
- Enable the Google Sign-In API
- Create OAuth 2.0 credentials
- Add your Expo client ID and other credentials to `app.config.js`

2. Apple Sign-In (iOS only):
- Set up Apple Sign-In in your [Apple Developer Account](https://developer.apple.com/)
- Configure your app's bundle identifier
- Add the necessary entitlements

## Features

- Email/Password Authentication
- Google Sign-In
- Apple Sign-In (iOS)
- Guest Mode
- Language Selection
- Modern UI with React Native Paper
- TypeScript Support

## Project Structure

```
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable components
│   ├── services/         # API and authentication services
│   ├── store/           # Redux store and slices
│   ├── navigation/      # Navigation configuration
│   └── config/          # App configuration
├── assets/              # Images and fonts
├── app.config.js        # Expo configuration
├── App.tsx             # Root component
└── package.json        # Dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
