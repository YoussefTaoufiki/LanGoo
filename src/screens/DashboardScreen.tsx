import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card, IconButton, Avatar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import * as authService from '../services/auth';
import { Appbar } from 'react-native-paper';
import { Asset } from 'expo-asset';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// Replace the direct image imports with require statements
const readingImage = require('../assets/reading.jpg');
const focusImage = require('../assets/focus.jpg');

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      dispatch(logout());
      navigation.replace('Welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Dashboard" />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card} onPress={() => navigation.navigate('Reader', { bookId: 'sample' })}>
          <Image source={readingImage} style={styles.categoryImage} />
          <Card.Title title="Continue Reading" subtitle="Resume where you left off" />
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate('Focus')}>
          <Image source={focusImage} style={styles.categoryImage} />
          <Card.Title 
            title="Focus Mode" 
            subtitle="Stay focused with timed reading sessions"
            left={(props) => <Avatar.Icon {...props} icon="timer" />}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Language Progress" />
          <Card.Content>
            <Text variant="bodyMedium">
              Learning {user?.selectedLanguage || 'a new language'}
            </Text>
            {/* TODO: Add progress indicators and stats */}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Settings" />
          <Card.Content>
            <Text variant="bodyMedium">
              Customize your learning experience.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => navigation.navigate('Settings')}>
              Open Settings
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  categoryImage: {
    height: 200,
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
}); 