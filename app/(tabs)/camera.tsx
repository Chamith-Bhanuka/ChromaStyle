import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  X,
  Zap,
  ZapOff,
  RefreshCcw,
  Image as ImageIcon,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useWardrobeStore } from '@/store/wardrobeStore';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
// We use 'require' for ImageColors to avoid hard crashes if it's missing
let ImageColors: any;
try {
  ImageColors = require('react-native-image-colors').getColors;
} catch (err) {
  console.log('ImageColors module not available (Expo Go mode)');
}

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

// --- SCANNER OVERLAY ---
const ScannerOverlay = () => {
  const scanLineY = useSharedValue(0);

  useEffect(() => {
    scanLineY.value = 0;
    scanLineY.value = withRepeat(
      withTiming(SCAN_SIZE, { duration: 1500, easing: Easing.linear }),
      -1,
      true
    );
    return () => cancelAnimation(scanLineY);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} pointerEvents="none">
      <View style={styles.maskContainer}>
        <View style={styles.maskRow} />
        <View style={styles.middleMaskRow}>
          <View style={styles.maskSide} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <Animated.View style={[styles.scanLaser, animatedStyle]} />
          </View>
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskRow} />
      </View>
    </View>
  );
};

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  const dateToLog = params.date as string;

  const { setOutfitImage } = useWardrobeStore();

  const shutterScale = useSharedValue(1);
  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  useEffect(() => {
    if (dateToLog) setFacing('front');
  }, [dateToLog]);

  if (!permission) return <View style={{ backgroundColor: '#000', flex: 1 }} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permTitle}>Camera Access</Text>
        <Text style={styles.permText}>
          Required to scan fabrics & log daily looks.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
          <Text style={styles.permButtonText}>Allow Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- ACTIONS ---
  const takePicture = async () => {
    if (!cameraRef.current) return;

    shutterScale.value = withSequence(withSpring(0.9), withSpring(1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (facing === 'front') {
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 200);
    }

    try {
      setTimeout(
        async () => {
          const photo = await cameraRef.current?.takePictureAsync({
            quality: 0.8,
            base64: false,
          });

          if (photo?.uri) {
            if (dateToLog) {
              // LOG MODE
              setOutfitImage(dateToLog, photo.uri);
              router.back();
            } else {
              // SCAN MODE

              // 1. Crop Image (Simulate Focus Area)
              const cropSize = photo.width * 0.7;
              const originX = (photo.width - cropSize) / 2;
              const originY = (photo.height - cropSize) / 2;

              const croppedResult = await manipulateAsync(
                photo.uri,
                [
                  {
                    crop: {
                      originX: originX,
                      originY: originY,
                      width: cropSize,
                      height: cropSize,
                    },
                  },
                ],
                { format: SaveFormat.JPEG }
              );

              // 2. Safe Color Extraction
              let uniqueColors = [];

              try {
                // Check if native module exists
                if (ImageColors) {
                  const result = await ImageColors(croppedResult.uri, {
                    fallback: '#000000',
                    cache: true,
                    key: croppedResult.uri,
                  });

                  const palette = [];
                  if (result.platform === 'android') {
                    if (result.dominant) palette.push(result.dominant);
                    if (result.vibrant) palette.push(result.vibrant);
                    if (result.darkVibrant) palette.push(result.darkVibrant);
                  } else if (result.platform === 'ios') {
                    if (result.primary) palette.push(result.primary);
                    if (result.secondary) palette.push(result.secondary);
                    if (result.detail) palette.push(result.detail);
                  }
                  uniqueColors = [...new Set(palette)].filter((c) =>
                    /^#[0-9A-F]{6}$/i.test(c)
                  );
                } else {
                  throw new Error('Native module missing');
                }
              } catch (e) {
                // FALLBACK: If scanning fails (Expo Go), use random vibrant colors
                // so the app flow doesn't break for you right now.
                console.warn(
                  'Using Fallback Colors (Native Scanner Unavailable in Expo Go)'
                );
                uniqueColors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'];
              }

              // 3. Send to Editor
              router.push({
                pathname: '/atelier',
                params: {
                  imageUri: photo.uri,
                  scannedColors: JSON.stringify(uniqueColors),
                },
              });
            }
          }
        },
        facing === 'front' ? 150 : 0
      );
    } catch (error) {
      console.log('Capture failed', error);
      Alert.alert('Error', 'Failed to capture image.');
    }
  };

  const toggleCamera = () => {
    Haptics.selectionAsync();
    setIsCameraReady(false);
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={flash && facing === 'back'}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {facing === 'back' && <ScannerOverlay />}

      {screenFlash && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'white', zIndex: 2 },
          ]}
          pointerEvents="none"
        />
      )}

      <SafeAreaView style={[styles.uiContainer, { zIndex: 3 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <X color="#fff" size={24} />
          </TouchableOpacity>

          <BlurView intensity={30} tint="dark" style={styles.modeBadge}>
            {facing === 'back' ? (
              <Text style={styles.modeText}>SCAN FABRIC</Text>
            ) : (
              <Text style={[styles.modeText, { color: '#FFD700' }]}>
                LOG OUTFIT
              </Text>
            )}
          </BlurView>

          <TouchableOpacity
            onPress={() => setFlash(!flash)}
            style={styles.iconBtn}
          >
            {flash ? (
              <Zap color="#FFD700" size={24} />
            ) : (
              <ZapOff color="#fff" size={24} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.sideBtn} disabled>
            {dateToLog ? (
              <View style={styles.logIndicator}>
                <Text style={styles.logText}>TODAY</Text>
              </View>
            ) : (
              <BlurView intensity={20} style={styles.galleryBtn}>
                <ImageIcon color="#fff" size={22} />
              </BlurView>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={takePicture}>
            <Animated.View
              style={[
                styles.shutterOuter,
                facing === 'front' && styles.shutterOuterSelfie,
                shutterAnimatedStyle,
              ]}
            >
              <View
                style={[
                  styles.shutterInner,
                  facing === 'back'
                    ? styles.shutterInnerScan
                    : styles.shutterInnerSelfie,
                ]}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleCamera} style={styles.sideBtn}>
            <BlurView intensity={20} style={styles.flipBtn}>
              <RefreshCcw color="#fff" size={22} />
            </BlurView>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 30,
  },
  permTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  permText: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
  },
  permButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 40,
  },
  permButtonText: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  uiContainer: { flex: 1, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  iconBtn: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
  },
  modeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
    paddingTop: 20,
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  shutterOuterSelfie: {
    borderColor: '#FFD700',
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  shutterInner: { width: 64, height: 64, borderRadius: 32 },
  shutterInnerScan: { backgroundColor: '#fff' },
  shutterInnerSelfie: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  sideBtn: { width: 60, alignItems: 'center', justifyContent: 'center' },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  flipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logIndicator: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  maskContainer: { flex: 1 },
  maskRow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleMaskRow: { height: SCAN_SIZE, flexDirection: 'row' },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanWindow: { width: SCAN_SIZE, height: SCAN_SIZE, position: 'relative' },
  scanLaser: {
    width: '100%',
    height: 2,
    backgroundColor: '#00dec3',
    shadowColor: '#00dec3',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
