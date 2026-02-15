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
import { useRouter } from 'expo-router';
import { X, Zap, ZapOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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

let ImageColors: any;
try {
  ImageColors = require('react-native-image-colors').getColors;
} catch (err) {
  console.log('ImageColors module not available (Expo Go mode)');
}

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

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
  const [flash, setFlash] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const shutterScale = useSharedValue(1);
  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  if (!permission) return <View style={{ backgroundColor: '#000', flex: 1 }} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permTitle}>Camera Access</Text>
        <Text style={styles.permText}>Required to scan colors.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
          <Text style={styles.permButtonText}>Allow Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- ACTIONS ---
  const takePicture = async () => {
    if (!cameraRef.current) return;

    // 1. Animation & Haptics
    shutterScale.value = withSequence(withSpring(0.9), withSpring(1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });

      if (photo?.uri) {
        try {
          //  only extract colors from the focus area
          const minDimension = Math.min(photo.width, photo.height);
          const cropSize = Math.floor(minDimension * 0.6);

          const originX = Math.max(0, Math.floor((photo.width - cropSize) / 2));
          const originY = Math.max(
            0,
            Math.floor((photo.height - cropSize) / 2)
          );

          const croppedResult = await manipulateAsync(
            photo.uri,
            [{ crop: { originX, originY, width: cropSize, height: cropSize } }],
            { format: SaveFormat.JPEG }
          );

          let uniqueColors = [];
          try {
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
            console.log('Using fallback colors');
            uniqueColors = ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'];
          }

          router.push({
            pathname: '/atelier',
            params: {
              imageUri: photo.uri,
              scannedColors: JSON.stringify(uniqueColors),
            },
          });
        } catch (processError) {
          console.error('Processing Failed:', processError);
          Alert.alert('Error', 'Failed to process colors.');
        }
      }
    } catch (error) {
      console.log('Capture failed', error);
      Alert.alert('Error', 'Failed to capture image.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* LOCKED TO BACK CAMERA */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      />

      <ScannerOverlay />

      <SafeAreaView style={[styles.uiContainer, { zIndex: 3 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <X color="#fff" size={24} />
          </TouchableOpacity>

          <BlurView intensity={30} tint="dark" style={styles.modeBadge}>
            <Text style={styles.modeText}>FABRIC SCANNER</Text>
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
          {/* Empty View to balance layout since Flip btn is gone */}
          <View style={{ width: 60 }} />

          <TouchableOpacity onPress={takePicture}>
            <Animated.View style={[styles.shutterOuter, shutterAnimatedStyle]}>
              <View style={styles.shutterInner} />
            </Animated.View>
          </TouchableOpacity>

          {/* Empty View to balance layout */}
          <View style={{ width: 60 }} />
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
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
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
