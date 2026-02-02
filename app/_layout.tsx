import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View, StatusBar, Platform } from 'react-native';
import { useThemeStore} from "@/store/themeStore";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { LoaderProvider } from '@/context/LoaderContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
    const { initialize, isDark, colors } = useThemeStore();

    useEffect(() => {
        const cleanup = initialize();
        return cleanup;
    }, []);

    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(colors.background);
            NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
        }
    }, [isDark, colors.background]);

    return (
      <LoaderProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
              />
              <Slot />
            </View>
          </SafeAreaProvider>
        </AuthProvider>
      </LoaderProvider>
    );
}