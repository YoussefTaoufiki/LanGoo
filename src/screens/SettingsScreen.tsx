import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  List, 
  Switch, 
  Portal, 
  Dialog, 
  IconButton,
  Divider,
  Button,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { updateLanguage } from '../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
];

const FONT_SIZES = [
  { label: 'Small', value: 14 },
  { label: 'Medium', value: 16 },
  { label: 'Large', value: 18 },
  { label: 'Extra Large', value: 20 },
];

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    sessionComplete: true,
    weeklyProgress: true,
  });

  const handleLanguageChange = (languageCode: string) => {
    dispatch(updateLanguage(languageCode));
    setShowLanguagePicker(false);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getCurrentLanguageName = () => {
    return AVAILABLE_LANGUAGES.find((lang) => lang.code === user?.selectedLanguage)?.name || 'Not selected';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text variant="headlineMedium">Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader>Language Settings</List.Subheader>
          <List.Item
            title="Learning Language"
            description={getCurrentLanguageName()}
            onPress={() => setShowLanguagePicker(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Reading Preferences</List.Subheader>
          <List.Item
            title="Font Size"
            description={`${FONT_SIZES.find((f) => f.value === fontSize)?.label}`}
            onPress={() => setShowFontSizePicker(true)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Notifications</List.Subheader>
          <List.Item
            title="Daily Reading Reminder"
            right={() => (
              <Switch
                value={notifications.dailyReminder}
                onValueChange={() => toggleNotification('dailyReminder')}
              />
            )}
          />
          <List.Item
            title="Session Complete"
            right={() => (
              <Switch
                value={notifications.sessionComplete}
                onValueChange={() => toggleNotification('sessionComplete')}
              />
            )}
          />
          <List.Item
            title="Weekly Progress Report"
            right={() => (
              <Switch
                value={notifications.weeklyProgress}
                onValueChange={() => toggleNotification('weeklyProgress')}
              />
            )}
          />
        </List.Section>
      </ScrollView>

      <Portal>
        <Dialog visible={showLanguagePicker} onDismiss={() => setShowLanguagePicker(false)}>
          <Dialog.Title>Select Language</Dialog.Title>
          <Dialog.Content>
            <List.Section>
              {AVAILABLE_LANGUAGES.map((language) => (
                <List.Item
                  key={language.code}
                  title={language.name}
                  onPress={() => handleLanguageChange(language.code)}
                  right={(props) =>
                    user?.selectedLanguage === language.code && (
                      <List.Icon {...props} icon="check" />
                    )
                  }
                />
              ))}
            </List.Section>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLanguagePicker(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showFontSizePicker} onDismiss={() => setShowFontSizePicker(false)}>
          <Dialog.Title>Select Font Size</Dialog.Title>
          <Dialog.Content>
            <List.Section>
              {FONT_SIZES.map((size) => (
                <List.Item
                  key={size.value}
                  title={size.label}
                  onPress={() => {
                    setFontSize(size.value);
                    setShowFontSizePicker(false);
                  }}
                  right={(props) =>
                    fontSize === size.value && <List.Icon {...props} icon="check" />
                  }
                />
              ))}
            </List.Section>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowFontSizePicker(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
  },
}); 