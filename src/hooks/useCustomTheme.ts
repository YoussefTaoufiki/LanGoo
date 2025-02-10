import { useTheme } from 'react-native-paper';
import { CustomTheme } from '../theme/types';

export const useCustomTheme = (): CustomTheme => {
  const theme = useTheme();
  
  return {
    ...theme,
    colors: {
      ...theme.colors,
      warning: '#FFA726',  // Orange
      success: '#66BB6A',  // Green
      onSuccess: '#FFFFFF', // White text on success background
      text: theme.colors.onSurface, // Use onSurface color for text
      border: theme.colors.outline, // Use outline color for borders
    },
  } as CustomTheme;
}; 