import React, { useEffect } from 'react';
import { View, Modal, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { getSettings, updateSettings, resetSettings } from '../store/slices/settingsSlice';
import { RootState, AppDispatch } from '../store/store';
import { AVAILABLE_FONTS, FONT_SIZE_RANGE, LINE_SPACING_RANGE, MARGIN_RANGE, ReadingSettings } from '../services/settings';

interface ReadingSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  bookId: string;
}

export const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({
  visible,
  onClose,
  bookId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { settings, loading, error } = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    if (visible && bookId) {
      dispatch(getSettings(bookId));
    }
  }, [visible, bookId, dispatch]);

  const handleSettingChange = (key: keyof ReadingSettings, value: number | string) => {
    dispatch(updateSettings({ bookId, settings: { [key]: value } }));
  };

  const handleReset = () => {
    dispatch(resetSettings(bookId));
  };

  if (!visible) return null;

  const currentSettings = settings?.[bookId] as ReadingSettings | undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.title}>Reading Settings</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Font Size</Text>
              <Slider
                style={styles.slider}
                minimumValue={FONT_SIZE_RANGE.min}
                maximumValue={FONT_SIZE_RANGE.max}
                value={currentSettings?.fontSize ?? FONT_SIZE_RANGE.min}
                onValueChange={(value) => handleSettingChange('fontSize', value)}
              />
              <Text style={styles.value}>{Math.round(currentSettings?.fontSize ?? FONT_SIZE_RANGE.min)}px</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Font Family</Text>
              <Picker
                selectedValue={currentSettings?.fontFamily ?? AVAILABLE_FONTS[0]}
                onValueChange={(value: string) => handleSettingChange('fontFamily', value)}
              >
                {AVAILABLE_FONTS.map((font) => (
                  <Picker.Item key={font} label={font} value={font} />
                ))}
              </Picker>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Line Spacing</Text>
              <Slider
                style={styles.slider}
                minimumValue={LINE_SPACING_RANGE.min}
                maximumValue={LINE_SPACING_RANGE.max}
                value={currentSettings?.lineSpacing ?? LINE_SPACING_RANGE.min}
                onValueChange={(value) => handleSettingChange('lineSpacing', value)}
              />
              <Text style={styles.value}>{(currentSettings?.lineSpacing ?? LINE_SPACING_RANGE.min).toFixed(1)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Margin</Text>
              <Slider
                style={styles.slider}
                minimumValue={MARGIN_RANGE.min}
                maximumValue={MARGIN_RANGE.max}
                value={currentSettings?.margin ?? MARGIN_RANGE.min}
                onValueChange={(value) => handleSettingChange('margin', value)}
              />
              <Text style={styles.value}>{currentSettings?.margin ?? MARGIN_RANGE.min}px</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Theme</Text>
              <Picker
                selectedValue={currentSettings?.theme ?? 'light'}
                onValueChange={(value: string) => handleSettingChange('theme', value)}
              >
                <Picker.Item label="Light" value="light" />
                <Picker.Item label="Dark" value="dark" />
                <Picker.Item label="Sepia" value="sepia" />
              </Picker>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleReset}>
                <Text style={styles.buttonText}>Reset to Default</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  value: {
    textAlign: 'center',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ReadingSettingsModal; 