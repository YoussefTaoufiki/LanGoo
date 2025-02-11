import firebase from '@react-native-firebase/app';
import Constants from 'expo-constants';
import { config } from './config/env';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Export Firebase services
export const firebaseAuth: FirebaseAuthTypes.Module = auth();
export const firestore = getFirestore();
export const storage = getStorage();
export { firebaseConfig }; 