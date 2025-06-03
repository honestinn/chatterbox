import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'purple' | 'green' | 'pink' | 'orange';

interface ThemeContextType {
  theme: ThemeType;
  accentColor: AccentColor;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  setAccentColor: (color: AccentColor) => void;
  colors: typeof lightColors | typeof darkColors;
}

export const lightColors = {
  primary: '#007AFF',
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  text: '#1A1A1A',
  secondaryText: '#8E8E93',
  border: '#E1E1E1',
  messageBubble: {
    sent: {
      background: '#007AFF',
      text: '#FFFFFF'
    },
    received: {
      background: '#F2F2F7',
      text: '#1A1A1A'
    }
  },
  accent: {
    blue: ['#007AFF', '#47A3FF'],
    purple: ['#8E44AD', '#9B59B6'],
    green: ['#27AE60', '#2ECC71'],
    pink: ['#E91E63', '#F06292'],
    orange: ['#F39C12', '#F1C40F']
  }
};

export const darkColors = {
  primary: '#0A84FF',
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  text: '#FFFFFF',
  secondaryText: '#8E8E93',
  border: '#38383A',
  messageBubble: {
    sent: {
      background: '#0A84FF',
      text: '#FFFFFF'
    },
    received: {
      background: '#2C2C2E',
      text: '#FFFFFF'
    }
  },
  accent: {
    blue: ['#0A84FF', '#5856D6'],
    purple: ['#BF5AF2', '#D8B4FE'],
    green: ['#32D74B', '#86EFAC'],
    pink: ['#FF2D55', '#FF9EAA'],
    orange: ['#FF9F0A', '#FFD60A']
  }
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  accentColor: 'blue',
  isDark: false,
  setTheme: () => {},
  setAccentColor: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('system');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  
  const isDark = theme === 'system' 
    ? systemColorScheme === 'dark'
    : theme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  // Update message bubble colors based on accent color
  colors.messageBubble.sent.background = colors.accent[accentColor][0];

  return (
    <ThemeContext.Provider value={{
      theme,
      accentColor,
      isDark,
      setTheme,
      setAccentColor,
      colors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);