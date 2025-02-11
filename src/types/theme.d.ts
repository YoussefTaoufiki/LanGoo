import { Theme as MuiTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme extends MuiTheme {
    custom: {
      bookCard: {
        height: number;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      bookCard?: {
        height: number;
      };
    };
  }

  interface Palette {
    neutral?: Palette['primary'];
  }

  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
}

declare module '@mui/material/styles/createPalette' {
  interface TypeBackground {
    light?: string;
    dark?: string;
  }
}

declare module '@emotion/react' {
  export interface Theme extends MuiTheme {}
} 