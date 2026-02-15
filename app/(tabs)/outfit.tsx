import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Share2,
  Play,
  Pause,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronRight as ArrowRight,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import * as Haptics from 'expo-haptics';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { auth } from '@/services/firebase';

import * as FileSystem from 'expo-file-system/legacy';
import { signOut } from '@firebase/auth';

const { width, height } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40;
const BUTTON_SIZE = 54;
const SWIPE_RANGE = SLIDER_WIDTH - BUTTON_SIZE - 8;

export default function OutfitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const dateKey =
    (params.date as string) || new Date().toISOString().split('T')[0];
  const isToday = dateKey === new Date().toISOString().split('T')[0];

  const { colors } = useThemeStore();

  // UI State
  const [images, setImages] = useState<string[]>([]);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const intervalRef = useRef<any>(null);

  // Animation State for Logout
  const translateX = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      loadImagesFromFolder();
      return () => stopSlideshow();
    }, [dateKey])
  );

  const loadImagesFromFolder = async () => {
    try {
      const docDir = FileSystem.documentDirectory?.endsWith('/')
        ? FileSystem.documentDirectory
        : `${FileSystem.documentDirectory}/`;

      const dir = `${docDir}outfits/${dateKey}/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);

      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(dir);
        const imagePaths = files
          .filter((f) => f.match(/\.(jpg|jpeg|png)$/i))
          .map((f) => dir + f)
          .reverse();

        setImages(imagePaths);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Error accessing date folder:', error);
    }
  };

  const onLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Logout', 'You have been logged out.', [
      { text: 'OK', onPress: () => handleLogout() },
    ]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.min(Math.max(0, event.translationX), SWIPE_RANGE);
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_RANGE * 0.8) {
        translateX.value = withSpring(SWIPE_RANGE);
        runOnJS(onLogout)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedHandleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_RANGE * 0.5],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  // day nav
  const navigateDay = (offset: number) => {
    Haptics.selectionAsync();
    const current = new Date(dateKey);
    current.setDate(current.getDate() + offset);
    const newDate = current.toISOString().split('T')[0];
    router.setParams({ date: newDate });
  };

  // cam actions
  const handleOpenStats = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to log your outfit.'
        );
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      if (photo?.uri) {
        const fileName = `selfie_${Date.now()}.jpg`;
        const docDir = FileSystem.documentDirectory?.endsWith('/')
          ? FileSystem.documentDirectory
          : `${FileSystem.documentDirectory}/`;
        const folderPath = `${docDir}outfits/${dateKey}/`;
        const newPath = folderPath + fileName;

        await FileSystem.makeDirectoryAsync(folderPath, {
          intermediates: true,
        });
        await FileSystem.moveAsync({ from: photo.uri, to: newPath });

        setIsCameraOpen(false);
        loadImagesFromFolder();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to capture image.');
    }
  };

  const handleShare = async () => {
    if (images.length === 0) return;
    try {
      const imageToShare = isSlideshowOpen ? images[currentIndex] : images[0];
      await Share.share({
        url: imageToShare,
        message: `Check out my outfit from ${new Date(dateKey).toLocaleDateString()}!`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the image.');
    }
  };

  const stopSlideshow = () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startSlideshow = () => {
    setIsPlaying(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2500);
  };

  const openSlideshow = (index: number) => {
    setCurrentIndex(index);
    setIsSlideshowOpen(true);
    if (images.length > 1) startSlideshow();
  };

  const handleDeletePhoto = async (uri: string) => {
    Alert.alert('Delete Selfie', 'Remove this look from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await FileSystem.deleteAsync(uri);
          loadImagesFromFolder();
        },
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>

            <View style={styles.dateSelector}>
              <TouchableOpacity onPress={() => navigateDay(-1)}>
                <ChevronLeft color={colors.inactive} size={20} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center', marginHorizontal: 15 }}>
                <Text style={[styles.dateTitle, { color: colors.text }]}>
                  {isToday
                    ? 'Today'
                    : new Date(dateKey).toLocaleDateString('en-US', {
                        weekday: 'long',
                      })}
                </Text>
                <Text style={[styles.dateSub, { color: colors.inactive }]}>
                  {new Date(dateKey).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigateDay(1)}>
                <ChevronRight color={colors.inactive} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
              <Share2 color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            {images.length > 0 ? (
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => openSlideshow(0)}
                >
                  <Play fill="#fff" color="#fff" size={16} />
                  <Text style={styles.playButtonText}>Play Slideshow</Text>
                </TouchableOpacity>
                <FlatList
                  data={images}
                  keyExtractor={(item) => item}
                  numColumns={2}
                  contentContainerStyle={{ paddingBottom: 150 }}
                  columnWrapperStyle={{ gap: 12 }}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => openSlideshow(index)}
                      style={styles.gridImageContainer}
                    >
                      <Image source={{ uri: item }} style={styles.gridImage} />
                      {isToday && (
                        <TouchableOpacity
                          style={styles.miniDeleteBtn}
                          onPress={() => handleDeletePhoto(item)}
                        >
                          <Trash2 size={14} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : (
              <View
                style={[styles.emptyState, { borderColor: colors.inactive }]}
              >
                {isToday ? (
                  <TouchableOpacity
                    onPress={handleOpenStats}
                    style={styles.captureBtnLarge}
                  >
                    <View
                      style={[
                        styles.captureCircle,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Camera size={40} color="#fff" />
                    </View>
                    <Text style={styles.captureText}>
                      {"Record Today's Look"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: colors.inactive, fontSize: 16 }}>
                    No looks recorded for this day
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* SWIPE TO LOGOUT */}
          <View style={styles.logoutWrapper}>
            <View
              style={[
                styles.sliderTrack,
                { backgroundColor: colors.inactive + '20' },
              ]}
            >
              <Animated.Text
                style={[
                  styles.sliderText,
                  { color: colors.text },
                  animatedTextStyle,
                ]}
              >
                Swipe to Logout
              </Animated.Text>
              <GestureDetector gesture={gesture}>
                <Animated.View
                  style={[
                    styles.sliderHandle,
                    { backgroundColor: colors.primary },
                    animatedHandleStyle,
                  ]}
                >
                  <LogOut color="#fff" size={24} />
                </Animated.View>
              </GestureDetector>
            </View>
          </View>

          {/* FAB (Only for Today) */}
          {isToday && images.length > 0 && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.primary }]}
              onPress={handleOpenStats}
            >
              <Plus color="#fff" size={32} />
            </TouchableOpacity>
          )}

          {/* CAMERA MODAL */}
          <Modal visible={isCameraOpen} animationType="slide">
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="front"
                ref={cameraRef}
              />
              <SafeAreaView style={styles.cameraOverlay}>
                <TouchableOpacity
                  onPress={() => setIsCameraOpen(false)}
                  style={styles.closeCamera}
                >
                  <X color="#fff" size={28} />
                </TouchableOpacity>
                <View style={styles.shutterContainer}>
                  <TouchableOpacity
                    onPress={takeSelfie}
                    style={styles.shutterBtn}
                  >
                    <View style={styles.shutterInner} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </Modal>

          {/* SLIDESHOW MODAL */}
          <Modal visible={isSlideshowOpen} transparent animationType="fade">
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => {
                  setIsSlideshowOpen(false);
                  stopSlideshow();
                }}
              >
                <X color="#fff" size={30} />
              </TouchableOpacity>
              <Image
                source={{ uri: images[currentIndex] }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <View style={styles.controls}>
                <TouchableOpacity
                  onPress={() =>
                    isPlaying ? stopSlideshow() : startSlideshow()
                  }
                  style={styles.controlBtn}
                >
                  {isPlaying ? (
                    <Pause fill="#fff" color="#fff" size={32} />
                  ) : (
                    <Play fill="#fff" color="#fff" size={32} />
                  )}
                </TouchableOpacity>
                <Text style={styles.slideCounter}>
                  {currentIndex + 1} / {images.length}
                </Text>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 10,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 25,
  },
  dateSelector: { flexDirection: 'row', alignItems: 'center' },
  dateTitle: { fontSize: 18, fontWeight: '700' },
  dateSub: { fontSize: 12 },
  content: { flex: 1, paddingHorizontal: 20 },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  playButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  gridImageContainer: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gridImage: { width: '100%', height: '100%' },
  miniDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  captureBtnLarge: { alignItems: 'center' },
  captureCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  captureText: { fontSize: 20, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 120,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  // LOGOUT SLIDER
  logoutWrapper: { paddingHorizontal: 20, paddingBottom: 30 },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 62,
    borderRadius: 31,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  sliderHandle: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    position: 'absolute',
    left: 4,
    top: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  sliderText: { fontSize: 16, fontWeight: '600', opacity: 0.6 },

  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  closeCamera: {
    alignSelf: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  shutterContainer: { width: '100%', alignItems: 'center', paddingBottom: 40 },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    padding: 4,
  },
  shutterInner: { flex: 1, backgroundColor: '#fff', borderRadius: 40 },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: { width: width, height: height * 0.8 },
  closeModalBtn: {
    position: 'absolute',
    top: 60,
    right: 25,
    zIndex: 10,
    padding: 10,
  },
  controls: { position: 'absolute', bottom: 60, alignItems: 'center' },
  controlBtn: {
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
  },
  slideCounter: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});
