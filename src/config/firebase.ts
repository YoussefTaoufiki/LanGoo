import firebase from '@react-native-firebase/app';
import Constants from 'expo-constants';
import { config } from './env';
import auth from '@react-native-firebase/auth';

if (!config.firebase.apiKey) {
  throw new Error('Firebase API key is required');
}

// Initialize Firebase
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
  measurementId: config.firebase.measurementId,
};

// Initialize Firebase app if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const firebaseAuth = auth();

export { firebaseConfig }; 