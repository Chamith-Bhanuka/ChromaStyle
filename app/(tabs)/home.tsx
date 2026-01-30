import React, { useState, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    ScrollView, Modal, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft, Check, Sliders, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import ColorPicker, { Panel1, Swatches, HueSlider, Preview } from 'reanimated-color-picker';
import * as Haptics from 'expo-haptics'; // Import Haptics

const { width, height } = Dimensions.get('window');

// --- 1. DATA: GARMENTS ---
const GARMENTS = [
    // --- TOPS ---
    {
        id: 'shirt',
        name: 'T-Shirt',
        category: 'Tops',
        path: "M378.5,64.5c-15.8,18.1-40.6,22.1-61.9,12.6c-20.3-9-40.6-9-60.9,0c-21.3,9.4-46.1,5.5-61.9-12.6 C146.4,49.8,103.6,19.7,103.6,19.7L18.9,102.1l59.6,73.1l-18.2,279l393.4,0l-18.2-279l59.6-73.1l-84.7-82.4 C410.4,19.7,378.5,64.5,378.5,64.5z"
    },
    {
        id: 'dress',
        name: 'Dress',
        category: 'Tops',
        path: "M180,60 C180,60 256,90 332,60 L380,120 L350,480 L162,480 L132,120 Z"
    },
    // --- BOTTOMS ---
    {
        id: 'trousers',
        name: 'Trousers',
        category: 'Bottoms',
        path: "M360,60 L152,60 L140,160 L160,480 L230,480 L256,200 L282,480 L352,480 L372,160 Z"
    },
    {
        id: 'shorts',
        name: 'Shorts',
        category: 'Bottoms',
        path: "M360,60 L152,60 L140,160 L160,300 L230,300 L256,180 L282,300 L352,300 L372,160 Z"
    },
    // --- FOOTWEAR ---
    {
        id: 'sneakers',
        name: 'Sneakers',
        category: 'Footwear',
        path: "M40,380 C40,380 40,320 80,280 C120,240 180,200 180,200 L220,160 C220,160 260,140 300,160 C340,180 380,220 420,220 C460,220 480,260 480,300 L480,380 L40,380 Z M300,380 L300,420 L480,420 L480,380 Z"
    },
    {
        id: 'slippers',
        name: 'Slippers',
        category: 'Footwear',
        // Clean Slide Slipper Shape
        path: "M80,400 C80,350 140,340 180,360 L340,360 C380,360 400,380 400,420 L80,420 Z M180,360 C180,290 320,290 360,360 L180,360 Z"
    },
    {
        id: 'heels',
        name: 'High Heels',
        category: 'Footwear',
        path: "M100,380 L140,380 L140,480 L120,480 L110,400 L60,400 L60,320 C60,280 120,280 140,320 L240,480 L320,480 L320,440 L260,380 L100,380 Z"
    }
];

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Footwear'];
const MOCK_COLORS = ['#E74C3C', '#8E44AD', '#3498DB', '#F1C40F', '#2ECC71', '#34495E'];

export default function EditorScreen() {
    const router = useRouter();
    const { colors, isDark } = useThemeStore();

    // --- STATE ---
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeIndex, setActiveIndex] = useState(0);
    const [customizations, setCustomizations] = useState<Record<string, string>>({});
    const [palette, setPalette] = useState(MOCK_COLORS);

    // Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
    const [tempColor, setTempColor] = useState('');

    const flatListRef = useRef<FlatList>(null);

    const filteredGarments = useMemo(() => {
        return selectedCategory === 'All'
            ? GARMENTS
            : GARMENTS.filter(g => g.category === selectedCategory);
    }, [selectedCategory]);

    // --- ACTIONS ---

    const handleColorDrop = async (color: string, x: number, y: number) => {
        // Check drop zone (Center Screen)
        if (x > width * 0.1 && x < width * 0.9 && y > height * 0.2 && y < height * 0.7) {

            // 1. Success Vibration (Heavy)
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            const activeItem = filteredGarments[activeIndex];
            if (activeItem) {
                setCustomizations(prev => ({ ...prev, [activeItem.id]: color }));
            }
        }
    };

    const openColorEditor = (color: string, index: number) => {
        // Light Vibration on open
        Haptics.selectionAsync();
        setTempColor(color);
        setEditingColorIndex(index);
        setEditModalVisible(true);
    };

    const onColorSelect = (result: any) => {
        setTempColor(result.hex);
    };

    const saveEditedColor = () => {
        if (editingColorIndex !== null) {
            const newPalette = [...palette];
            newPalette[editingColorIndex] = tempColor;
            setPalette(newPalette);
        }
        setEditModalVisible(false);
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.safeArea}>

                {/* --- HEADER --- */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <ArrowLeft color={colors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Atelier</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.iconBtn}>
                        <Check color={colors.primary} size={24} />
                    </TouchableOpacity>
                </View>

                {/* --- CATEGORY TABS --- */}
                <View style={styles.categoryContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => {
                                    setSelectedCategory(cat);
                                    setActiveIndex(0);
                                    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                                    Haptics.selectionAsync();
                                }}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === cat ? { backgroundColor: colors.text } : { borderColor: colors.inactive }
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    selectedCategory === cat ? { color: colors.background } : { color: colors.inactive }
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* --- MAIN WORKSPACE --- */}
                <View style={styles.workspace}>
                    <FlatList
                        ref={flatListRef}
                        data={filteredGarments}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            const itemColor = customizations[item.id] || '#E0E0E0';
                            return (
                                <View style={{ width: width, alignItems: 'center', justifyContent: 'center' }}>
                                    <Svg width={280} height={340} viewBox="0 0 512 512">
                                        <Path
                                            fill={itemColor}
                                            stroke={isDark ? "#333" : "#ddd"}
                                            strokeWidth="4"
                                            d={item.path}
                                        />
                                    </Svg>
                                    <Text style={[styles.itemName, { color: colors.inactive }]}>{item.name}</Text>
                                </View>
                            );
                        }}
                    />

                    <View style={styles.pagination}>
                        {filteredGarments.map((_, idx) => (
                            <View
                                key={idx}
                                style={[
                                    styles.dot,
                                    { backgroundColor: idx === activeIndex ? colors.primary : colors.inactive }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* --- PALETTE DOCK --- */}
                <View style={[styles.paletteDock, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                    <View style={styles.paletteHeader}>
                        <Text style={[styles.paletteTitle, { color: colors.text }]}>
                            Drag to Paint • Tap to Edit
                        </Text>
                        <Sliders size={16} color={colors.inactive} />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {palette.map((color, index) => (
                            <DraggableColor
                                key={index}
                                color={color}
                                onDrop={(x, y) => handleColorDrop(color, x, y)}
                                onTap={() => openColorEditor(color, index)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* --- COLOR PICKER MODAL --- */}
                <Modal visible={editModalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: isDark ? '#222' : '#fff' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Color</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ColorPicker
                                style={{ width: '100%', gap: 20 }}
                                value={tempColor}
                                onComplete={onColorSelect}
                            >
                                <Preview
                                    style={[styles.pickerPreview, { borderColor: colors.inactive }]}
                                    textStyle={{ color: isDark ? '#fff' : '#000' }}
                                />
                                <Panel1 style={styles.pickerPanel} />
                                <HueSlider style={styles.pickerSlider} />
                                <Swatches style={styles.pickerSwatches} />
                            </ColorPicker>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                                onPress={saveEditedColor}
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

// --- DRAGGABLE COLOR (PERFECT TAP vs DRAG) ---
const DraggableColor = ({ color, onDrop, onTap }: { color: string, onDrop: (x: number, y: number) => void, onTap: () => void }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const context = useSharedValue({ x: 0, y: 0 });

    // 1. TAP GESTURE: Handles simple taps immediately
    const tap = Gesture.Tap()
        .onEnd(() => {
            runOnJS(onTap)();
        });

    // 2. PAN GESTURE: Handles dragging
    // 'minDistance' ensures it doesn't activate for tiny taps (wait for 5px move)
    const pan = Gesture.Pan()
        .minDistance(5)
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
            scale.value = withTiming(1.3); // Pop effect
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd((event) => {
            scale.value = withTiming(1);
            runOnJS(onDrop)(event.absoluteX, event.absoluteY);
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    // SIMULTANEOUS: Allows Tap to fail if Pan starts, and Pan to fail if Tap finishes quickly
    const gesture = Gesture.Simultaneous(tap, pan);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        zIndex: scale.value > 1 ? 100 : 1, // Bring to front when dragging
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.colorCircle, { backgroundColor: color }, animatedStyle]} />
        </GestureDetector>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    iconBtn: { padding: 8 },
    title: { fontSize: 24, fontWeight: '300', fontFamily: 'serif', letterSpacing: 1 },

    categoryContainer: { height: 50 },
    categoryChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, marginRight: 10, justifyContent: 'center'
    },
    categoryText: { fontSize: 13, fontWeight: '600' },

    workspace: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
    itemName: { marginTop: 10, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' },

    pagination: { flexDirection: 'row', marginTop: 15, marginBottom: 10, gap: 8 },
    dot: { width: 6, height: 6, borderRadius: 3 },

    paletteDock: {
        height: 150,
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 15
    },
    paletteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    paletteTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    scrollContent: { alignItems: 'center', paddingRight: 40 },
    colorCircle: {
        width: 52, height: 52, borderRadius: 26, marginRight: 16,
        borderWidth: 2, borderColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3
    },

    // Color Picker
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 24, borderRadius: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },

    pickerPreview: { height: 40, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
    pickerPanel: { height: 150, borderRadius: 12 },
    pickerSlider: { height: 30, borderRadius: 15, marginTop: 10 },
    pickerSwatches: { marginTop: 10 },

    saveBtn: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});