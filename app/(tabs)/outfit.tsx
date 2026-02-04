import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Share2,
  Shuffle,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useWardrobeStore } from '../../store/wardrobeStore';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function OutfitScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams();
  const dateKey = date as string;

  const { colors, isDark } = useThemeStore();
  const { outfits, setOutfitImage, autoGenerateWeek } = useWardrobeStore();

  const currentOutfit = outfits[dateKey] || {};
  const hasImage = !!currentOutfit.imageUri;

  // --- ACTIONS ---

  const handleCapture = () => {
    Haptics.selectionAsync();
    // Navigate to Camera with the date parameter
    router.push({ pathname: '/camera', params: { date: dateKey } });
  };

  const handleDeletePhoto = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setOutfitImage(dateKey, ''); // Clear image
  };

  const handleShuffle = () => {
    // Optional: Keep shuffle functionality for text-based fallback
    // implementation depends on if you still want text data
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.dateTitle, { color: colors.text }]}>
              {new Date(dateKey).toLocaleDateString('en-US', {
                weekday: 'long',
              })}
            </Text>
            <Text style={[styles.dateSub, { color: colors.inactive }]}>
              {new Date(dateKey).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Share2 color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        {/* --- MAIN CONTENT AREA --- */}
        <View style={styles.content}>
          {hasImage ? (
            // STATE 1: SHOW CAPTURED PHOTO
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: currentOutfit.imageUri }}
                style={styles.fullImage}
                resizeMode="cover"
              />

              {/* Overlay Controls */}
              <View style={styles.imageOverlay}>
                <TouchableOpacity
                  onPress={handleDeletePhoto}
                  style={styles.deleteBtn}
                >
                  <Trash2 color="#fff" size={20} />
                  <Text style={styles.overlayText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // STATE 2: EMPTY STATE (PROMPT TO CAPTURE)
            <View style={[styles.emptyState, { borderColor: colors.inactive }]}>
              <TouchableOpacity
                onPress={handleCapture}
                style={styles.captureBtn}
              >
                <View
                  style={[
                    styles.captureIconCircle,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Camera size={40} color="#fff" />
                </View>
                <Text style={[styles.captureText, { color: colors.text }]}>
                  Capture Today's Look
                </Text>
                <Text
                  style={{
                    color: colors.inactive,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  Tap to open selfie camera
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* --- BOTTOM CONTROLS --- */}
        {/* You can hide these if an image exists, or keep them for extra data */}
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
          ]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              {hasImage ? 'Look Captured' : 'No Look Logged'}
            </Text>
            {!hasImage && (
              <TouchableOpacity onPress={handleShuffle} style={styles.miniBtn}>
                <Shuffle size={16} color={colors.text} />
                <Text
                  style={{ color: colors.text, fontSize: 12, marginLeft: 6 }}
                >
                  Suggest
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 25,
  },
  dateTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  dateSub: { fontSize: 12, textAlign: 'center' },

  content: { flex: 1, padding: 20 },

  // Empty State
  emptyState: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  captureBtn: { alignItems: 'center' },
  captureIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  captureText: { fontSize: 20, fontWeight: '600' },

  // Photo State
  photoContainer: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
  },
  fullImage: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  overlayText: { color: '#fff', marginLeft: 8, fontWeight: '600' },

  // Bottom Bar
  bottomBar: {
    margin: 20,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold' },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.1)',
    padding: 8,
    borderRadius: 12,
  },
});
