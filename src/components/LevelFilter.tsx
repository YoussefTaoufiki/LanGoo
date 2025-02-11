import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, useTheme } from 'react-native-paper';
import { CustomTheme } from '../theme/theme';

const LEVELS = [
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Mastery' },
] as const;

type Level = typeof LEVELS[number]['value'];

interface LevelFilterProps {
  selectedLevel: Level | null;
  onLevelChange: (level: Level | null) => void;
}

export const LevelFilter: React.FC<LevelFilterProps> = ({
  selectedLevel,
  onLevelChange,
}) => {
  const theme = useTheme<CustomTheme>();

  const buttons = [
    { value: '', label: 'All Levels' },
    ...LEVELS.map(level => ({
      value: level.value,
      label: level.value,
    })),
  ];

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={selectedLevel || ''}
        onValueChange={value => onLevelChange(value as Level | null)}
        buttons={buttons}
        style={styles.buttons}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  buttons: {
    flexWrap: 'wrap',
  },
});

export default LevelFilter; 