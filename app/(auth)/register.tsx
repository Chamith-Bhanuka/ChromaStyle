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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Mail, Lock, User } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { registerUser } from '@/services/authService';

const { width, height } = Dimensions.get('window');

const FASHION_IMAGE =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1888&auto=format&fit=crop';

export default function RegisterScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [focused, setFocused] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Loading State
  const [isLoading, setIsLoading] = useState(false);

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

  const handleRegister = async () => {
    if (!fullName || !email || !password || isLoading) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(fullName, email, password);

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'Login Now',
          onPress: () => router.push('/login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Something went wrong.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={{ uri: FASHION_IMAGE }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
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
              <View style={styles.headerContainer}>
                <Text style={styles.tagline}>EST. 2026</Text>
                <Text style={styles.brandTitle}>ChromaStyle</Text>
                <Text style={styles.subTitle}>The Art of Curated Fashion.</Text>
              </View>

              <View style={styles.formContainer}>
                <GlassInput
                  icon={<User color="#fff" size={20} />}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  isFocused={focused === 'name'}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused('')}
                />
                <GlassInput
                  icon={<Mail color="#fff" size={20} />}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  isFocused={focused === 'email'}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <GlassInput
                  icon={<Lock color="#fff" size={20} />}
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  isFocused={focused === 'password'}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
              </View>

              {/* Join Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.mainButton,
                  isLoading && styles.mainButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.mainButtonText}>Join the Atelier</Text>
                    <ArrowRight color="#000" size={20} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity activeOpacity={0.8} style={styles.googleButton}>
                <BlurView intensity={20} tint="light" style={styles.googleBlur}>
                  <Svg width={20} height={20} viewBox="0 0 18 18">
                    <Path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    />
                    <Path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    />
                    <Path
                      fill="#FBBC05"
                      d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"
                    />
                    <Path
                      fill="#EA4335"
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    />
                  </Svg>
                  <Text style={styles.googleText}>Continue with Google</Text>
                </BlurView>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                Already a member?{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => router.push('/login')}
                >
                  Sign In
                </Text>
              </Text>
            </Animated.View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const GlassInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  isFocused,
  onFocus,
  onBlur,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: any) => (
  <View
    style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}
  >
    <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
      <View style={styles.iconWrapper}>{icon}</View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.5)"
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        selectionColor="#fff"
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

  // -- Buttons --
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
  mainButtonDisabled: {
    opacity: 0.7, // Reduce opacity when disabled
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
