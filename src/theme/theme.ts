import { MD3Theme, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export interface CustomTheme extends MD3Theme {
  custom: {
    bookCard: {
      height: number;
    };
  };
}

const baseTheme = {
  custom: {
    bookCard: {
      height: 400,
    },
  },
};

export const lightTheme: CustomTheme = {
  ...MD3LightTheme,
  ...baseTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(52, 152, 219)',
    primaryContainer: 'rgb(93, 173, 226)',
    secondary: 'rgb(46, 204, 113)',
    secondaryContainer: 'rgb(85, 217, 141)',
    background: 'rgb(255, 255, 255)',
    surface: 'rgb(248, 249, 250)',
    error: 'rgb(231, 76, 60)',
    onPrimary: 'rgb(255, 255, 255)',
    onSecondary: 'rgb(255, 255, 255)',
    onBackground: 'rgb(44, 62, 80)',
    onSurface: 'rgb(108, 117, 125)',
    onError: 'rgb(255, 255, 255)',
  },
};

export const darkTheme: CustomTheme = {
  ...MD3DarkTheme,
  ...baseTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(77, 171, 247)',
    primaryContainer: 'rgb(116, 192, 252)',
    secondary: 'rgb(64, 192, 87)',
    secondaryContainer: 'rgb(105, 219, 124)',
    background: 'rgb(26, 26, 26)',
    surface: 'rgb(45, 45, 45)',
    error: 'rgb(235, 87, 87)',
    onPrimary: 'rgb(255, 255, 255)',
    onSecondary: 'rgb(255, 255, 255)',
    onBackground: 'rgb(255, 255, 255)',
    onSurface: 'rgb(179, 179, 179)',
    onError: 'rgb(255, 255, 255)',
  },
}; 