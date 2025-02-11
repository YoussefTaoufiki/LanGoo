import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../store/slices/authSlice';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export interface AuthResponse {
  user: User | null;
  error?: string;
}

interface AppleError {
  code: string;
  message: string;
}

// Mock user storage
const USERS_STORAGE_KEY = '@users';
const CURRENT_USER_KEY = '@current_user';

// Initialize Google Sign In
const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
  clientId: Constants.expoConfig?.extra?.webClientId,
  androidClientId: Constants.expoConfig?.extra?.androidClientId,
  iosClientId: Constants.expoConfig?.extra?.iosClientId,
});

export const signUp = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    // Mock user creation
    const users = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const existingUsers = users ? JSON.parse(users) : {};

    if (existingUsers[email]) {
      return { user: null, error: 'Email is already registered' };
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      uid: Math.random().toString(36).substring(7), // Generate a unique UID
      email,
      displayName: '',
      emailVerified: false,
      isAnonymous: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    };

    existingUsers[email] = { ...newUser, password };
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers));
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return { user: newUser };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, error: 'Failed to create account' };
  }
};

export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const users = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const existingUsers = users ? JSON.parse(users) : {};

    const user = existingUsers[email];
    if (!user) {
      return { user: null, error: 'No account found with this email' };
    }

    if (user.password !== password) {
      return { user: null, error: 'Invalid password' };
    }

    const userData: User = {
      id: user.id,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      emailVerified: user.emailVerified || false,
      isAnonymous: user.isAnonymous || false,
      metadata: user.metadata || {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      selectedLanguage: user.selectedLanguage,
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return { user: userData };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error: 'Failed to sign in' };
  }
};

export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const result = await promptGoogleAsync();
    
    if (result.type === 'success') {
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${result.authentication?.accessToken}` },
        }
      );

      const userData = await userInfoResponse.json();
      const user: User = {
        id: userData.id,
        uid: userData.id,
        email: userData.email,
        displayName: userData.name || '',
        emailVerified: userData.email_verified || false,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        photoURL: userData.picture,
      };

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { user };
    }

    return { user: null, error: 'Google sign in was cancelled' };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { user: null, error: 'Failed to sign in with Google' };
  }
};

export const signInWithApple = async (): Promise<AuthResponse> => {
  try {
    if (Platform.OS !== 'ios') {
      return { user: null, error: 'Apple sign in is only available on iOS' };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const user: User = {
      id: credential.user,
      uid: credential.user,
      email: credential.email || '',
      displayName: credential.fullName?.givenName || '',
      emailVerified: true,
      isAnonymous: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { user };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as AppleError).code === 'ERR_CANCELED') {
      return { user: null, error: 'Apple sign in was cancelled' };
    }
    console.error('Apple sign in error:', error);
    return { user: null, error: 'Failed to sign in with Apple' };
  }
};

export const continueAsGuest = async (): Promise<AuthResponse> => {
  try {
    const guestId = `guest_${Math.random().toString(36).substring(7)}`;
    const guestUser: User = {
      id: guestId,
      uid: guestId,
      email: '',
      displayName: 'Guest User',
      emailVerified: false,
      isAnonymous: true,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      isGuest: true,
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(guestUser));
    return { user: guestUser };
  } catch (error) {
    console.error('Guest sign in error:', error);
    return { user: null, error: 'Failed to continue as guest' };
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}; 