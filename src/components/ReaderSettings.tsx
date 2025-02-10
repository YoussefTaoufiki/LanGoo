import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Portal, Modal, Text, Button, IconButton, SegmentedButtons, useTheme, Divider } from 'react-native-paper';
import Slider from '@react-native-community/slider';

interface ReaderSettingsProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  fontFamily: string;
  onFontFamilyChange: (family: string) => void;
  textAlign: 'left' | 'center' | 'justify';
  onTextAlignChange: (align: 'left' | 'center' | 'justify') => void;
  lineHeight: number;
  onLineHeightChange: (height: number) => void;
  letterSpacing: number;
  onLetterSpacingChange: (spacing: number) => void;
  paragraphSpacing: number;
  onParagraphSpacingChange: (spacing: number) => void;
  marginHorizontal: number;
  onMarginHorizontalChange: (margin: number) => void;
  theme: 'light' | 'dark' | 'sepia';
  onThemeChange: (theme: 'light' | 'dark' | 'sepia') => void;
}

const FONTS = [
  { label: 'Default', value: 'System' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Palatino', value: 'Palatino' },
  { label: 'Garamond', value: 'Garamond' },
];

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog. This is a sample text to preview your reading settings.";

export const ReaderSettings: React.FC<ReaderSettingsProps> = ({
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  textAlign,
  onTextAlignChange,
  lineHeight,
  onLineHeightChange,
  letterSpacing,
  onLetterSpacingChange,
  paragraphSpacing,
  onParagraphSpacingChange,
  marginHorizontal,
  onMarginHorizontalChange,
  theme,
  onThemeChange,
}) => {
  const paperTheme = useTheme();
  const [activeTab, setActiveTab] = useState('text');
  const [previewText] = useState(new Animated.Value(1));

  const updateSettings = (updates: Partial<ReaderSettingsProps>) => {
    onFontSizeChange(updates.fontSize || fontSize);
    onFontFamilyChange(updates.fontFamily || fontFamily);
    onTextAlignChange(updates.textAlign || textAlign);
    onLineHeightChange(updates.lineHeight || lineHeight);
    onLetterSpacingChange(updates.letterSpacing || letterSpacing);
    onParagraphSpacingChange(updates.paragraphSpacing || paragraphSpacing);
    onMarginHorizontalChange(updates.marginHorizontal || marginHorizontal);
    onThemeChange(updates.theme || theme);
    // Animate preview text
    Animated.sequence([
      Animated.timing(previewText, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(previewText, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getPreviewStyle = () => {
    const themeColors = {
      light: { bg: '#ffffff', text: '#000000' },
      dark: { bg: '#121212', text: '#ffffff' },
      sepia: { bg: '#f4ecd8', text: '#5b4636' },
    }[theme];

    return {
      fontFamily: fontFamily,
      fontSize: fontSize,
      textAlign: textAlign,
      lineHeight: fontSize * lineHeight,
      letterSpacing: letterSpacing,
      marginVertical: paragraphSpacing,
      marginHorizontal: marginHorizontal,
      color: themeColors.text,
      backgroundColor: themeColors.bg,
      padding: 16,
      borderRadius: 8,
    };
  };

  const renderSlider = (
    value: number,
    onValueChange: (value: number) => void,
    minimumValue: number,
    maximumValue: number,
    step: number
  ) => (
    <Slider
      value={value}
      onValueChange={onValueChange}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      style={styles.slider}
      minimumTrackTintColor={paperTheme.colors.primary}
      maximumTrackTintColor={paperTheme.colors.surfaceVariant}
      thumbTintColor={paperTheme.colors.primary}
    />
  );

  const fontFamilies = [
    'system-ui',
    'Georgia',
    'Times New Roman',
    'Arial',
    'Verdana',
  ];

  return (
    <Portal>
      <Modal
        visible={true}
        onDismiss={() => {}}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <View style={styles.header}>
          <Text variant="titleLarge">Reading Settings</Text>
          <IconButton icon="close" onPress={() => {}} />
        </View>

        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'text', label: 'Text', icon: 'format-font' },
            { value: 'layout', label: 'Layout', icon: 'page-layout-body' },
            { value: 'theme', label: 'Theme', icon: 'palette' },
          ]}
          style={styles.tabs}
        />

        <ScrollView style={styles.content}>
          <Animated.Text
            style={[
              styles.previewText,
              getPreviewStyle(),
              { opacity: previewText },
            ]}
          >
            {SAMPLE_TEXT}
          </Animated.Text>

          {activeTab === 'text' && (
            <>
              <View style={styles.section}>
                <Text variant="titleMedium">Font Size</Text>
                <View style={styles.sliderContainer}>
                  <Text>A</Text>
                  {renderSlider(
                    fontSize,
                    (value) => updateSettings({ fontSize: value }),
                    12,
                    32,
                    1
                  )}
                  <Text style={styles.largeFontSize}>A</Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text variant="titleMedium">Font Family</Text>
                <View style={styles.fontGrid}>
                  {fontFamilies.map((family) => (
                    <Button
                      key={family}
                      mode={fontFamily === family ? 'contained' : 'outlined'}
                      onPress={() => updateSettings({ fontFamily: family })}
                      style={styles.fontButton}
                      labelStyle={{ fontFamily: family }}
                    >
                      {family}
                    </Button>
                  ))}
                </View>
              </View>
            </>
          )}

          {activeTab === 'layout' && (
            <>
              <View style={styles.section}>
                <Text variant="titleMedium">Text Alignment</Text>
                <SegmentedButtons
                  value={textAlign}
                  onValueChange={(value) =>
                    updateSettings({
                      textAlign: value as 'left' | 'center' | 'justify',
                    })
                  }
                  buttons={[
                    { value: 'left', icon: 'format-align-left', label: 'Left' },
                    { value: 'center', icon: 'format-align-center', label: 'Center' },
                    { value: 'justify', icon: 'format-align-justify', label: 'Justify' },
                  ]}
                />
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text variant="titleMedium">Line Height</Text>
                <View style={styles.sliderContainer}>
                  <IconButton icon="format-line-spacing" size={20} />
                  {renderSlider(
                    lineHeight,
                    (value) => updateSettings({ lineHeight: value }),
                    1,
                    2,
                    0.1
                  )}
                  <IconButton icon="format-line-spacing" size={24} />
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text variant="titleMedium">Letter Spacing</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.letterSpacingText}>aa</Text>
                  {renderSlider(
                    letterSpacing,
                    (value) => updateSettings({ letterSpacing: value }),
                    0,
                    2,
                    0.1
                  )}
                  <Text style={[styles.letterSpacingText, { letterSpacing: 2 }]}>aa</Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.section}>
                <Text variant="titleMedium">Margins</Text>
                <View style={styles.sliderContainer}>
                  <IconButton icon="arrow-collapse-horizontal" size={20} />
                  {renderSlider(
                    marginHorizontal,
                    (value) => updateSettings({ marginHorizontal: value }),
                    16,
                    64,
                    4
                  )}
                  <IconButton icon="arrow-expand-horizontal" size={24} />
                </View>
              </View>
            </>
          )}

          {activeTab === 'theme' && (
            <View style={styles.section}>
              <Text variant="titleMedium">Color Theme</Text>
              <View style={styles.themeGrid}>
                {['light', 'dark', 'sepia'].map((t) => (
                  <Button
                    key={t}
                    mode={theme === t ? 'contained' : 'outlined'}
                    onPress={() => updateSettings({ theme: t as typeof theme })}
                    style={[
                      styles.themeButton,
                      {
                        backgroundColor:
                          t === 'light'
                            ? '#ffffff'
                            : t === 'dark'
                            ? '#121212'
                            : '#f4ecd8',
                      },
                    ]}
                    labelStyle={{
                      color:
                        t === 'light'
                          ? '#000000'
                          : t === 'dark'
                          ? '#ffffff'
                          : '#5b4636',
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabs: {
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  previewText: {
    marginBottom: 24,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  divider: {
    marginVertical: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  largeFontSize: {
    fontSize: 24,
  },
  fontGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  fontButton: {
    flex: 1,
    minWidth: '30%',
    marginBottom: 8,
  },
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  themeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  letterSpacingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 