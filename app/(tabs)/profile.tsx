import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilePage() {
    const { colors } = useThemeStore();

    return (
        // Use SafeAreaView to avoid header collision
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

            <Text style={[styles.title, { color: colors.text }]}>
                Profile Page
            </Text>

            <Text style={[styles.subtitle, { color: colors.inactive }]}>
                This layout now automatically switches between Neon Teal (Dark) and Elegant Green (Light).
            </Text>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        maxWidth: 300,
        lineHeight: 24,
    },
});