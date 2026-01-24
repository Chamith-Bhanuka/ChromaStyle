import { create } from 'zustand';
import { Appearance } from 'react-native';

export const COLORS = {
    light: {
        background: '#F5F5F7',
        text: '#111827',
        primary: '#00584c',
        tabBarBase: '#ffffff',
        inactive: '#9ca3af',
    },
    dark: {
        background: '#000000',
        text: '#ffffff',
        primary: '#00dec3',
        tabBarBase: '#121212',
        inactive: '#4b5563',
    },
};

type ThemeState = {
    isDark: boolean;
    colors: typeof COLORS.light;
    toggleTheme: () => void;
    initialize: () => () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
    isDark: true,
    colors: COLORS.dark,

    toggleTheme: () => {
        const newIsDark = !get().isDark;
        set({ isDark: newIsDark, colors: newIsDark ? COLORS.dark : COLORS.light });
    },

    initialize: () => {

        const initialScheme = Appearance.getColorScheme();
        const isDarkInitial = initialScheme === 'dark';
        set({ isDark: isDarkInitial, colors: isDarkInitial ? COLORS.dark : COLORS.light });

        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            const isDark = colorScheme === 'dark';
            set({ isDark, colors: isDark ? COLORS.dark : COLORS.light });
        });

        return () => subscription.remove();
    },
}));