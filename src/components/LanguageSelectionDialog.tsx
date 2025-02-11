import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Portal,
  Dialog,
  Button,
  List,
  Searchbar,
  useTheme,
  Text,
} from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper/lib/typescript/types';
import { Language } from '../types/language';

interface LanguageSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (language: Language) => void;
  title: string;
  languages: Language[];
  currentLanguage?: Language;
}

const useStyles = (theme: MD3Theme) => StyleSheet.create({
  dialog: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  list: {
    maxHeight: 300,
  },
  listItem: {
    borderRadius: 4,
  },
  selectedItem: {
    backgroundColor: theme.colors.primaryContainer,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
});

export const LanguageSelectionDialog: React.FC<LanguageSelectionDialogProps> = ({
  open,
  onClose,
  onSelect,
  title,
  languages,
  currentLanguage,
}) => {
  const theme = useTheme();
  const styles = useStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (language: Language) => {
    onSelect(language);
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={open} onDismiss={onClose}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search languages"
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
          </View>
          <View style={styles.list}>
            {filteredLanguages.map((language) => (
              <List.Item
                key={language.code}
                title={language.name}
                description={language.nativeName}
                onPress={() => handleSelect(language)}
                style={[
                  styles.listItem,
                  currentLanguage?.code === language.code && styles.selectedItem,
                ]}
                left={(props) => (
                  <List.Icon {...props} icon={currentLanguage?.code === language.code ? 'check' : 'translate'} />
                )}
              />
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <Button onPress={onClose}>Cancel</Button>
            <Button
              mode="contained"
              onPress={onClose}
              disabled={!currentLanguage}
            >
              Done
            </Button>
          </View>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
}; 