import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    ImageBackground,
    Dimensions,
    StatusBar,
    Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Mail, Lock } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';

import FASHION_IMAGE from '../../assets/images/fashion-bg.jpg';

const { width, height } = Dimensions.get('window');

//const FASHION_IMAGE = require('@/assets/images/fashion-bg.jpg');

export default function LoginScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const [focused, setFocused] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Entrance Animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = () => {
        Alert.alert('Welcome Back', `Signing in as ${email}...`);
        router.push('/home');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* background image */}
            <ImageBackground
                source={FASHION_IMAGE}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* gradient overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                    style={styles.gradientOverlay}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardContainer}
                    >
                        <Animated.View
                            style={[
                                styles.contentContainer,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            {/* header section */}
                            <View style={styles.headerContainer}>
                                <Text style={styles.tagline}>WELCOME BACK</Text>
                                <Text style={styles.brandTitle}>ChromaStyle</Text>
                                <Text style={styles.subTitle}>Continue your style journey.</Text>
                            </View>

                            {/* form section */}
                            <View style={styles.formContainer}>
                                <GlassInput
                                    icon={<Mail color="#fff" size={20} />}
                                    placeholder="Email Address"
                                    value={focused === 'email'}
                                    textValue={email}
                                    onChangeText={setEmail}
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused('')}
                                />
                                <GlassInput
                                    icon={<Lock color="#fff" size={20} />}
                                    placeholder="Password"
                                    secureTextEntry
                                    value={focused === 'password'}
                                    textValue={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                />

                                {/* forgot password link */}
                                <TouchableOpacity style={styles.forgotContainer}>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            {/* login button */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.mainButton}
                                onPress={handleLogin}
                            >
                                <Text style={styles.mainButtonText}>Enter Atelier</Text>
                                <ArrowRight color="#000" size={20} />
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* google button */}
                            <TouchableOpacity activeOpacity={0.8} style={styles.googleButton}>
                                <BlurView intensity={20} tint="light" style={styles.googleBlur}>
                                    <Svg width={20} height={20} viewBox="0 0 18 18">
                                        <Path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                        <Path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                        <Path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
                                        <Path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                                    </Svg>
                                    <Text style={styles.googleText}>Sign in with Google</Text>
                                </BlurView>
                            </TouchableOpacity>

                            {/* navigation link */}
                            <Text style={styles.footerText}>
                                New to the Atelier?{' '}
                                <Text
                                    style={styles.linkText}
                                    onPress={() => router.push('/register')}
                                >
                                    Create Account
                                </Text>
                            </Text>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}

// glass input component
const GlassInput = ({ icon, placeholder, value, textValue, onChangeText, onFocus, onBlur, secureTextEntry }: any) => (
    <View style={[styles.inputContainer, value && styles.inputContainerFocused]}>
        <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
            <View style={styles.iconWrapper}>{icon}</View>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={styles.textInput}
                value={textValue}
                onChangeText={onChangeText}
                onFocus={onFocus}
                onBlur={onBlur}
                secureTextEntry={secureTextEntry}
                selectionColor="#fff"
                autoCapitalize="none"
            />
        </BlurView>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        width: width,
        height: height,
        flex: 1,
    },
    gradientOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    keyboardContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    contentContainer: {
        width: '100%',
        paddingBottom: 20,
    },

    headerContainer: {
        marginBottom: 40,
    },
    tagline: {
        color: '#fff',
        fontSize: 12,
        letterSpacing: 3,
        textTransform: 'uppercase',
        opacity: 0.8,
        marginBottom: 8,
        fontWeight: '600',
    },
    brandTitle: {
        fontSize: 48,
        color: '#fff',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontWeight: '400',
        letterSpacing: -1,
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 16,
        color: '#ccc',
        fontWeight: '300',
        letterSpacing: 0.5,
        fontStyle: 'italic',
    },

    formContainer: {
        gap: 16,
        marginBottom: 30,
    },
    inputContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    inputContainerFocused: {
        borderColor: '#fff',
    },
    blurContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 60,
    },
    iconWrapper: {
        marginRight: 16,
        opacity: 0.8,
    },
    textInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    forgotText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },
    mainButton: {
        height: 56,
        backgroundColor: '#fff',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 24,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    mainButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.5)',
        marginHorizontal: 16,
        fontSize: 12,
        fontWeight: '600',
    },

    googleButton: {
        borderRadius: 30,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    googleBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        gap: 12,
    },
    googleText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    footerText: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    linkText: {
        color: '#fff',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});