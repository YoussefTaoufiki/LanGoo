import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    warning: '#FFA726',  // Orange
    success: '#66BB6A',  // Green
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    warning: '#FFB74D',  // Lighter Orange for dark theme
    success: '#81C784',  // Lighter Green for dark theme
  },
}; 