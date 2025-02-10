import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share, Animated } from 'react-native';
import { Portal, Modal, Text, Button, IconButton, Divider, List, Surface, useTheme, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TranslationModalProps {
  visible: boolean;
  onDismiss: () => void;
  selectedText: string;
  translation: {
    translatedText: string;
    explanation?: string;
    etymology?: string;
    examples?: string[];
    synonyms?: string[];
    loading: boolean;
    error?: string;
  };
  theme: 'light' | 'dark' | 'sepia';
  onSave: () => void;
  isSaved: boolean;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  visible,
  onDismiss,
  selectedText,
  translation,
  theme,
  onSave,
  isSaved,
}) => {
  const paperTheme = useTheme();
  const [activeSection, setActiveSection] = useState('translation');
  const [fadeAnim] = useState(new Animated.Value(1));

  const getThemeColors = () => {
    switch (theme) {
      case 'dark':
        return {
          background: '#121212',
          text: '#ffffff',
          surface: '#1e1e1e',
        };
      case 'sepia':
        return {
          background: '#f4ecd8',
          text: '#5b4636',
          surface: '#e8e0cc',
        };
      default:
        return {
          background: '#ffffff',
          text: '#000000',
          surface: '#f5f5f5',
        };
    }
  };

  const colors = getThemeColors();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${selectedText}\n\nTranslation: ${translation.translatedText}`,
        title: 'Share Translation',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderContent = () => {
    if (translation.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={paperTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Analyzing text...
          </Text>
        </View>
      );
    }

    if (translation.error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#B00020" />
          <Text style={styles.errorText}>{translation.error}</Text>
          <Button mode="contained" onPress={onDismiss}>
            Close
          </Button>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content}>
        <Surface style={[styles.selectedTextContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.selectedText, { color: colors.text }]}>
            {selectedText}
          </Text>
        </Surface>

        <View style={styles.actions}>
          <IconButton
            icon={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            onPress={onSave}
            iconColor={paperTheme.colors.primary}
          />
          <IconButton
            icon="share-variant"
            size={24}
            onPress={handleShare}
            iconColor={paperTheme.colors.primary}
          />
        </View>

        <List.Section>
          <List.Accordion
            title="Translation"
            expanded={activeSection === 'translation'}
            onPress={() => setActiveSection(activeSection === 'translation' ? '' : 'translation')}
            titleStyle={{ color: colors.text }}
            style={{ backgroundColor: colors.background }}
          >
            <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.translationText, { color: colors.text }]}>
                {translation.translatedText}
              </Text>
            </Surface>
          </List.Accordion>

          {translation.explanation && (
            <List.Accordion
              title="Explanation"
              expanded={activeSection === 'explanation'}
              onPress={() => setActiveSection(activeSection === 'explanation' ? '' : 'explanation')}
              titleStyle={{ color: colors.text }}
              style={{ backgroundColor: colors.background }}
            >
              <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                <Text style={[styles.explanationText, { color: colors.text }]}>
                  {translation.explanation}
                </Text>
              </Surface>
            </List.Accordion>
          )}

          {translation.etymology && (
            <List.Accordion
              title="Etymology"
              expanded={activeSection === 'etymology'}
              onPress={() => setActiveSection(activeSection === 'etymology' ? '' : 'etymology')}
              titleStyle={{ color: colors.text }}
              style={{ backgroundColor: colors.background }}
            >
              <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                <Text style={[styles.etymologyText, { color: colors.text }]}>
                  {translation.etymology}
                </Text>
              </Surface>
            </List.Accordion>
          )}

          {translation.examples && translation.examples.length > 0 && (
            <List.Accordion
              title="Examples"
              expanded={activeSection === 'examples'}
              onPress={() => setActiveSection(activeSection === 'examples' ? '' : 'examples')}
              titleStyle={{ color: colors.text }}
              style={{ backgroundColor: colors.background }}
            >
              <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                {translation.examples.map((example, index) => (
                  <View key={index} style={styles.exampleItem}>
                    <Icon name="format-quote-open" size={16} color={colors.text} />
                    <Text style={[styles.exampleText, { color: colors.text }]}>
                      {example}
                    </Text>
                  </View>
                ))}
              </Surface>
            </List.Accordion>
          )}

          {translation.synonyms && translation.synonyms.length > 0 && (
            <List.Accordion
              title="Synonyms"
              expanded={activeSection === 'synonyms'}
              onPress={() => setActiveSection(activeSection === 'synonyms' ? '' : 'synonyms')}
              titleStyle={{ color: colors.text }}
              style={{ backgroundColor: colors.background }}
            >
              <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                <View style={styles.synonymsContainer}>
                  {translation.synonyms.map((synonym, index) => (
                    <Button
                      key={index}
                      mode="outlined"
                      style={styles.synonymChip}
                      labelStyle={{ color: colors.text }}
                    >
                      {synonym}
                    </Button>
                  ))}
                </View>
              </Surface>
            </List.Accordion>
          )}
        </List.Section>
      </ScrollView>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.header}>
          <IconButton icon="close" onPress={onDismiss} iconColor={colors.text} />
        </View>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {renderContent()}
        </Animated.View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectedTextContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedText: {
    fontSize: 18,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  sectionContent: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  translationText: {
    fontSize: 18,
    fontWeight: '500',
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  etymologyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  exampleText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  synonymsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorText: {
    color: '#B00020',
    marginVertical: 16,
    textAlign: 'center',
  },
}); 