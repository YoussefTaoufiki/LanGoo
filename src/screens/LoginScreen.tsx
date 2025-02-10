import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, Divider, Portal, Dialog, RadioButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setLoading, setError, setUser, updateLanguage, User } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import * as authService from '../services/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LanguageDialog } from '../components';
import { useNavigation } from '@react-navigation/native';

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [pendingUser, setPendingUser] = useState<Partial<User> | null>(null);

  const validateForm = () => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await authService.signIn(email, password);
      if (response.error) {
        dispatch(setError(response.error));
      } else if (response.user) {
        dispatch(setUser({
          id: response.user.uid,
          uid: response.user.uid,
          email: response.user.email || '',
          displayName: response.user.displayName || '',
          emailVerified: response.user.emailVerified || false,
          isAnonymous: response.user.isAnonymous || false,
          metadata: {
            creationTime: response.user.metadata?.creationTime || new Date().toISOString(),
            lastSignInTime: response.user.metadata?.lastSignInTime || new Date().toISOString(),
          },
          photoURL: response.user.photoURL || undefined,
        }));
        // Navigate to Dashboard on successful login
        navigation.replace('Dashboard');
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLanguageSelect = () => {
    if (pendingUser) {
      dispatch(setUser({
        ...pendingUser,
        selectedLanguage,
      } as User));
      dispatch(updateLanguage(selectedLanguage));
      setShowLanguageDialog(false);
      navigation.navigate('Dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await authService.signInWithGoogle();
      if (response.error) {
        dispatch(setError(response.error));
      } else if (response.user) {
        dispatch(setUser({
          id: response.user.uid,
          uid: response.user.uid,
          email: response.user.email || '',
          displayName: response.user.displayName || '',
          emailVerified: response.user.emailVerified || false,
          isAnonymous: response.user.isAnonymous || false,
          metadata: {
            creationTime: response.user.metadata?.creationTime || new Date().toISOString(),
            lastSignInTime: response.user.metadata?.lastSignInTime || new Date().toISOString(),
          },
          photoURL: response.user.photoURL || undefined,
        }));
        setPendingUser(response.user);
        setShowLanguageDialog(true);
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAppleSignIn = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await authService.signInWithApple();
      if (response.error) {
        dispatch(setError(response.error));
      } else if (response.user) {
        const userData: User = {
          id: response.user.uid,
          uid: response.user.uid,
          email: response.user.email || '',
          displayName: response.user.displayName || '',
          emailVerified: response.user.emailVerified || false,
          isAnonymous: response.user.isAnonymous || false,
          metadata: {
            creationTime: response.user.metadata?.creationTime || new Date().toISOString(),
            lastSignInTime: response.user.metadata?.lastSignInTime || new Date().toISOString(),
          },
          photoURL: response.user.photoURL || undefined,
        };
        dispatch(setUser(userData));
        setPendingUser(userData);
        setShowLanguageDialog(true);
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSkip = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await authService.continueAsGuest();
      if (response.error) {
        dispatch(setError(response.error));
      } else if (response.user) {
        const guestData: User = {
          id: response.user.uid,
          uid: response.user.uid,
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
        dispatch(setUser(guestData));
        setPendingUser(guestData);
        setShowLanguageDialog(true);
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome Back
        </Text>

        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
          error={!!emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <HelperText type="error" visible={!!emailError}>
          {emailError}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
          error={!!passwordError}
          secureTextEntry
          style={styles.input}
        />
        <HelperText type="error" visible={!!passwordError}>
          {passwordError}
        </HelperText>

        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>

        <Divider style={styles.divider} />

        <Text variant="bodyMedium" style={styles.orText}>
          Or continue with
        </Text>

        <View style={styles.socialButtons}>
          <Button
            mode="outlined"
            onPress={handleGoogleSignIn}
            icon={() => <Icon name="google" size={20} color="#DB4437" />}
            style={[styles.socialButton, styles.googleButton]}
            disabled={loading}
          >
            Google
          </Button>

          {Platform.OS === 'ios' && (
            <Button
              mode="outlined"
              onPress={handleAppleSignIn}
              icon={() => <Icon name="apple" size={20} color="#000000" />}
              style={[styles.socialButton, styles.appleButton]}
              disabled={loading}
            >
              Apple
            </Button>
          )}
        </View>

        <Button
          mode="text"
          onPress={() => navigation.navigate('SignUp')}
          style={styles.button}
        >
          Don't have an account? Sign Up
        </Button>

        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
          disabled={loading}
        >
          Skip for now
        </Button>
      </View>

      <LanguageDialog
        visible={showLanguageDialog}
        onDismiss={() => setShowLanguageDialog(false)}
        selectedLanguage={selectedLanguage}
        onLanguageSelect={setSelectedLanguage}
        onConfirm={handleLanguageSelect}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
  },
  orText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  socialButton: {
    flex: 1,
    maxWidth: 160,
  },
  googleButton: {
    borderColor: '#DB4437',
  },
  appleButton: {
    borderColor: '#000000',
  },
  skipButton: {
    marginTop: 8,
    opacity: 0.7,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    marginRight: 8,
    marginBottom: 8,
  },
}); 