import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, List, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setLoading, setError, setUser, updateLanguage, User } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import * as authService from '../services/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LanguageDialog } from '../components';
import { useGoogleAuth } from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

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

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state: RootState) => state.auth);
  const { promptAsync } = useGoogleAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [pendingUser, setPendingUser] = useState<Partial<User> | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [languageError, setLanguageError] = useState('');

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

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    // Language validation
    if (!selectedLanguage) {
      setLanguageError('Please select a language to learn');
      isValid = false;
    } else {
      setLanguageError('');
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await authService.signUp(email, password);
      if (response.error) {
        dispatch(setError(response.error));
      } else if (response.user) {
        const userData: User = {
          id: response.user.uid,
          uid: response.user.uid,
          email: response.user.email || '',
          displayName: response.user.displayName || '',
          emailVerified: response.user.emailVerified || false,
          isAnonymous: false,
          metadata: {
            creationTime: response.user.metadata?.creationTime || new Date().toISOString(),
            lastSignInTime: response.user.metadata?.lastSignInTime || new Date().toISOString(),
          },
          selectedLanguage,
        };
        setPendingUser(userData);
        setShowLanguageDialog(true);
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleSignUp = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await authService.signInWithGoogle(promptAsync);
      if (response.error) {
        dispatch(setError(response.error));
      } else if (response.user) {
        const userData: User = {
          id: response.user.uid,
          uid: response.user.uid,
          email: response.user.email || '',
          displayName: response.user.displayName || '',
          emailVerified: response.user.emailVerified || false,
          isAnonymous: false,
          metadata: {
            creationTime: response.user.metadata?.creationTime || new Date().toISOString(),
            lastSignInTime: response.user.metadata?.lastSignInTime || new Date().toISOString(),
          },
          selectedLanguage,
        };
        setPendingUser(userData);
        setShowLanguageDialog(true);
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Google sign up failed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAppleSignUp = async () => {
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
          isAnonymous: false,
          metadata: {
            creationTime: response.user.metadata?.creationTime || new Date().toISOString(),
            lastSignInTime: response.user.metadata?.lastSignInTime || new Date().toISOString(),
          },
          selectedLanguage,
        };
        setPendingUser(userData);
        setShowLanguageDialog(true);
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Apple sign up failed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGuestSignUp = async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));

    try {
      const response = await authService.continueAsGuest();
      if (response.error) {
        dispatch(setError(response.error));
      } else if (response.user) {
        const userData: User = {
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
          selectedLanguage,
          isGuest: true,
        };
        setPendingUser(userData);
        setShowLanguageDialog(true);
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Guest sign up failed'));
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Create Account
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

          <TextInput
            mode="outlined"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
            }}
            error={!!confirmPasswordError}
            secureTextEntry
            style={styles.input}
          />
          <HelperText type="error" visible={!!confirmPasswordError}>
            {confirmPasswordError}
          </HelperText>

          <TextInput
            mode="outlined"
            label="Language to Learn"
            value={AVAILABLE_LANGUAGES.find(lang => lang.code === selectedLanguage)?.name || ''}
            onFocus={() => setShowLanguageDialog(true)}
            error={!!languageError}
            style={styles.input}
            right={<TextInput.Icon icon={showLanguageDialog ? 'chevron-up' : 'chevron-down'} />}
          />
          <HelperText type="error" visible={!!languageError}>
            {languageError}
          </HelperText>

          {showLanguageDialog && (
            <List.Section style={styles.languageList}>
              {AVAILABLE_LANGUAGES.map((language) => (
                <List.Item
                  key={language.code}
                  title={language.name}
                  onPress={() => {
                    setSelectedLanguage(language.code);
                    setShowLanguageDialog(false);
                    setLanguageError('');
                  }}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={selectedLanguage === language.code ? 'check' : 'circle-outline'}
                    />
                  )}
                />
              ))}
            </List.Section>
          )}

          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign Up
          </Button>

          <Divider style={styles.divider} />

          <Text variant="bodyMedium" style={styles.orText}>
            Or continue with
          </Text>

          <View style={styles.socialButtons}>
            <Button
              mode="outlined"
              onPress={handleGoogleSignUp}
              icon={() => <Icon name="google" size={20} color="#DB4437" />}
              style={[styles.socialButton, styles.googleButton]}
              disabled={loading}
            >
              Google
            </Button>

            {Platform.OS === 'ios' && (
              <Button
                mode="outlined"
                onPress={handleAppleSignUp}
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
            onPress={handleGuestSignUp}
            style={styles.skipButton}
            disabled={loading}
          >
            Skip for now
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          >
            Already have an account? Login
          </Button>
        </View>
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
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
  languageList: {
    marginTop: -8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
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