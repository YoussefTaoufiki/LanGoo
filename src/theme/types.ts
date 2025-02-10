import { MD3Theme } from 'react-native-paper';

export interface CustomColors {
  warning: string;
  success: string;
  onSuccess: string;
  text: string;
  border: string;
}

export interface CustomTheme extends MD3Theme {
  colors: MD3Theme['colors'] & CustomColors;
} 