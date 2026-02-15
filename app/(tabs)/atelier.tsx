import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft, Check, Sliders, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { GARMENT_TEMPLATES, GarmentType } from '@/constants/garments';
import { useWardrobeStore } from '@/store/wardrobeStore';
import ColorPicker, {
  Panel1,
  Swatches,
  HueSlider,
  Preview,
} from 'reanimated-color-picker';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Footwear'];
const MOCK_COLORS = [
  '#E74C3C',
  '#8E44AD',
  '#3498DB',
  '#F1C40F',
  '#2ECC71',
  '#34495E',
];

export default function EditorScreen() {
  const router = useRouter();
  const { scannedColors } = useLocalSearchParams();
  const { colors, isDark } = useThemeStore();
  const { addColorToItem } = useWardrobeStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const [customizations, setCustomizations] = useState<Record<string, string>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  const [palette, setPalette] = useState(() => {
    if (scannedColors) {
      try {
        const parsed = JSON.parse(scannedColors as string);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return MOCK_COLORS;
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(
    null
  );
  const [tempColor, setTempColor] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const garmentList = useMemo(
    () =>
      Object.entries(GARMENT_TEMPLATES).map(([id, data]) => ({
        id: id as GarmentType,
        ...data,
      })),
    []
  );

  const filteredGarments = useMemo(
    () =>
      selectedCategory === 'All'
        ? garmentList
        : garmentList.filter((g) => g.category === selectedCategory),
    [selectedCategory, garmentList]
  );

  const handleDone = async () => {
    // get the list of garment IDs that have a customization assigned
    const customizedIds = Object.keys(customizations) as GarmentType[];

    // If nothing was customized, let the user know and stop
    if (customizedIds.length === 0) {
      Alert.alert(
        'Nothing to Save',
        'Drag a color onto at least one garment before saving.'
      );
      return;
    }

    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // save only the customized items
      await Promise.all(
        customizedIds.map(async (id) => {
          const color = customizations[id];
          if (color) {
            console.log(`Saving ${id} with color ${color}`);
            await addColorToItem(id, color);
          }
        })
      );

      router.replace('/(tabs)/wardrobe');
    } catch (error) {
      console.error('Save Error:', error);
      Alert.alert(
        'Error',
        'Could not sync with Firebase. Please check your connection.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleColorDrop = async (color: string, x: number, y: number) => {
    if (
      x > width * 0.1 &&
      x < width * 0.9 &&
      y > height * 0.2 &&
      y < height * 0.7
    ) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const activeItem = filteredGarments[activeIndex];
      if (activeItem)
        setCustomizations((prev) => ({ ...prev, [activeItem.id]: color }));
    }
  };

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={isSaving}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Atelier</Text>
          <TouchableOpacity onPress={handleDone} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Check color={colors.primary} size={24} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => {
                  setSelectedCategory(cat);
                  setActiveIndex(0);
                  flatListRef.current?.scrollToOffset({
                    offset: 0,
                    animated: false,
                  });
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat
                    ? { backgroundColor: colors.text }
                    : { borderColor: colors.inactive },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat
                      ? { color: colors.background }
                      : { color: colors.inactive },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.workspace}>
          <FlatList
            ref={flatListRef}
            data={filteredGarments}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={
              useRef(({ viewableItems }: any) => {
                if (viewableItems.length > 0)
                  setActiveIndex(viewableItems[0].index);
              }).current
            }
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  width,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Svg width={280} height={340} viewBox="0 0 512 512">
                  <Path
                    fill={customizations[item.id] || '#E0E0E0'}
                    stroke={isDark ? '#333' : '#ddd'}
                    strokeWidth="4"
                    d={item.path}
                  />
                </Svg>
                <Text style={[styles.itemName, { color: colors.inactive }]}>
                  {item.name}
                </Text>
              </View>
            )}
          />
          <View style={styles.pagination}>
            {filteredGarments.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      idx === activeIndex ? colors.primary : colors.inactive,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View
          style={[
            styles.paletteDock,
            { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
          ]}
        >
          <View style={styles.paletteHeader}>
            <Text style={[styles.paletteTitle, { color: colors.text }]}>
              Drag to Paint • Tap to Edit
            </Text>
            <Sliders size={16} color={colors.inactive} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {palette.map((color: any, index: any) => (
              <DraggableColor
                key={index}
                color={color}
                onDrop={(x, y) => handleColorDrop(color, x, y)}
                onTap={() => {
                  Haptics.selectionAsync();
                  setTempColor(color);
                  setEditingColorIndex(index);
                  setEditModalVisible(true);
                }}
              />
            ))}
          </ScrollView>
        </View>

        <Modal visible={editModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? '#222' : '#fff' },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Edit Color
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ColorPicker
                style={{ width: '100%', gap: 20 }}
                value={tempColor}
                onComplete={(res) => setTempColor(res.hex)}
              >
                <Preview
                  style={[
                    styles.pickerPreview,
                    { borderColor: colors.inactive },
                  ]}
                  textStyle={{ color: isDark ? '#fff' : '#000' }}
                />
                <Panel1 style={styles.pickerPanel} />
                <HueSlider style={styles.pickerSlider} />
                <Swatches style={styles.pickerSwatches} />
              </ColorPicker>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary, marginTop: 20 },
                ]}
                onPress={() => {
                  if (editingColorIndex !== null) {
                    const newPalette = [...palette];
                    newPalette[editingColorIndex] = tempColor;
                    setPalette(newPalette);
                  }
                  setEditModalVisible(false);
                }}
              >
                <Text style={styles.saveBtnText}>Apply Color</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const DraggableColor = ({
  color,
  onDrop,
  onTap,
}: {
  color: string;
  onDrop: (x: number, y: number) => void;
  onTap: () => void;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const context = useSharedValue({ x: 0, y: 0 });

  const gesture = Gesture.Simultaneous(
    Gesture.Tap().onEnd(() => runOnJS(onTap)()),
    Gesture.Pan()
      .minDistance(5)
      .onStart(() => {
        context.value = { x: translateX.value, y: translateY.value };
        scale.value = withTiming(1.3);
      })
      .onUpdate((e) => {
        translateX.value = e.translationX + context.value.x;
        translateY.value = e.translationY + context.value.y;
      })
      .onEnd((e) => {
        scale.value = withTiming(1);
        runOnJS(onDrop)(e.absoluteX, e.absoluteY);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      })
  );

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.colorCircle,
          { backgroundColor: color, zIndex: scale.value > 1 ? 100 : 1 },
          useAnimatedStyle(() => ({
            transform: [
              { translateX: translateX.value },
              { translateY: translateY.value },
              { scale: scale.value },
            ],
          })),
        ]}
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: '300', fontFamily: 'serif' },
  categoryContainer: { height: 50 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  categoryText: { fontSize: 13, fontWeight: '600' },
  workspace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  itemName: {
    marginTop: 10,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pagination: { flexDirection: 'row', marginTop: 15, marginBottom: 10, gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  paletteDock: {
    height: 150,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    elevation: 15,
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paletteTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  scrollContent: { alignItems: 'center', paddingRight: 40 },
  colorCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { padding: 24, borderRadius: 24 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  pickerPreview: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  pickerPanel: { height: 150, borderRadius: 12 },
  pickerSlider: { height: 30, borderRadius: 15, marginTop: 10 },
  pickerSwatches: { marginTop: 10 },
  saveBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
