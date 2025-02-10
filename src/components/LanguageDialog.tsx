import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';

interface LanguageDialogProps {
  visible: boolean;
  onDismiss: () => void;
  selectedLanguage: string;
  onLanguageSelect: (language: string) => void;
  onConfirm: () => void;
}

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

export const LanguageDialog: React.FC<LanguageDialogProps> = ({
  visible,
  onDismiss,
  selectedLanguage,
  onLanguageSelect,
  onConfirm,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Select Your Language</Dialog.Title>
        <Dialog.Content>
          <View style={styles.languageGrid}>
            {AVAILABLE_LANGUAGES.map((lang) => (
              <Button
                key={lang.code}
                mode={selectedLanguage === lang.code ? 'contained' : 'outlined'}
                onPress={() => onLanguageSelect(lang.code)}
                style={styles.languageButton}
              >
                {lang.name}
              </Button>
            ))}
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onConfirm}>Confirm</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
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