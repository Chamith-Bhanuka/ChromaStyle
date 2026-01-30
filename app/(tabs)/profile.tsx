import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, ClipPath, Circle, G } from 'react-native-svg';
import { ArrowLeft, Shuffle, Wand2, Share2, MoreHorizontal } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useWardrobeStore, GARMENT_TEMPLATES } from '../../store/wardrobeStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

// --- ASSETS: 3D-STYLE VECTOR MANNEQUIN ---
// This path mimics a 3D body with depth perspective
const BODY_PATH = "M180,90 C180,60 205,35 235,35 C265,35 290,60 290,90 C290,110 280,125 275,140 L300,155 C320,165 330,180 325,210 L315,290 C315,290 330,470 340,540 L300,540 L280,340 L260,340 L240,540 L200,540 C210,470 225,290 225,290 L215,210 C210,180 220,165 240,155 L265,140 C260,125 250,110 250,90";

// --- CLOTHES (Matched to Body Perspective) ---
const CLOTHING_PATHS = {
    shirt: "M240,155 L215,165 C205,170 200,180 205,200 L210,220 L225,215 L220,310 C220,310 320,310 320,310 L315,215 L330,220 L335,200 C340,180 335,170 325,165 L300,155 L270,170 L240,155 Z",
    trousers: "M220,300 L320,300 L325,340 L335,530 L295,530 L285,350 L255,350 L245,530 L205,530 L215,340 Z",
    shorts: "M220,300 L320,300 L325,340 L320,410 L280,410 L275,350 L265,350 L260,410 L220,410 L215,340 Z",
    dress: "M240,155 L215,165 L225,215 L210,390 C210,390 330,390 330,390 L315,215 L325,165 L300,155 L270,170 Z",
    footwear: "M195,530 C195,530 205,520 225,520 C245,520 255,530 255,530 L255,550 C255,560 245,570 225,570 C205,570 195,560 195,550 Z M285,530 C285,530 295,520 315,520 C335,520 345,530 345,530 L345,550 C345,560 335,570 315,570 C295,570 285,560 285,550 Z"
};

export default function OutfitScreen() {
    const router = useRouter();
    const { date } = useLocalSearchParams();
    const { colors, isDark } = useThemeStore();
    const { outfits, setOutfitForDate, items } = useWardrobeStore();

    const [currentOutfit, setCurrentOutfit] = useState(outfits[date as string] || {});

    // --- ACTIONS ---
    const handleShuffle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const pick = (cat: string) => {
            const candidates = items.filter(i => GARMENT_TEMPLATES[i.id].category === cat);
            if (!candidates.length) return undefined;
            const item = candidates[Math.floor(Math.random() * candidates.length)];
            return { id: item.id, color: item.colors[Math.floor(Math.random() * item.colors.length)] };
        };
        const newFit = { date: date as string, top: pick('Tops'), bottom: pick('Bottoms'), footwear: pick('Footwear') };
        setCurrentOutfit(newFit);
        setOutfitForDate(date as string, newFit);
    };

    const handleAI = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => handleShuffle(), 300);
    };

    // --- 3D RENDERING ENGINE (SVG BASED) ---
    const Garment3D = ({ type, data, zIndex }: { type: string, data: any, zIndex: number }) => {
        if (!data) return null; // Safety check

        // Get the path for this garment ID (fallback to shirt/trousers if id mismatch)
        const pathKey = CLOTHING_PATHS[data.id as keyof typeof CLOTHING_PATHS]
            ? data.id
            : (type === 'top' ? 'shirt' : type === 'bottom' ? 'trousers' : 'footwear');

        const path = CLOTHING_PATHS[pathKey as keyof typeof CLOTHING_PATHS];
        const gradId = `lighting-${type}-${data.id}`;

        return (
            <View style={[styles.layer, { zIndex }]}>
                <Svg width={350} height={550} viewBox="0 0 540 600">
                    <Defs>
                        {/* --- LIGHTING ENGINE --- */}
                        {/* This gradient creates the 3D cylinder effect (Highlights & Shadows) */}
                        <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="black" stopOpacity="0.5" />
                            <Stop offset="0.2" stopColor="white" stopOpacity="0.1" />
                            <Stop offset="0.5" stopColor="white" stopOpacity="0.5" /> {/* Highlight Center */}
                            <Stop offset="0.8" stopColor="white" stopOpacity="0.1" />
                            <Stop offset="1" stopColor="black" stopOpacity="0.5" />
                        </LinearGradient>
                        <ClipPath id={`clip-${type}`}>
                            <Path d={path} />
                        </ClipPath>
                    </Defs>

                    {/* 1. Base Fabric Color */}
                    <Path d={path} fill={data.color} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />

                    {/* 2. Volume Overlay (The 3D Trick) */}
                    <Rect
                        x="0" y="0" width="540" height="600"
                        fill={`url(#${gradId})`}
                        clipPath={`url(#clip-${type})`}
                    />
                </Svg>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Background Glow */}
            <View style={[styles.ambiance, { backgroundColor: colors.primary, opacity: 0.1 }]} />

            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <ArrowLeft color={colors.text} size={24} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.dateTitle, { color: colors.text }]}>
                            {new Date(date as string).toLocaleDateString('en-US', { weekday: 'long' })}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.iconBtn}>
                        <MoreHorizontal color={colors.text} size={24} />
                    </TouchableOpacity>
                </View>

                {/* --- STAGE --- */}
                <View style={styles.stage}>
                    <View style={styles.avatarContainer}>

                        {/* 1. MANNEQUIN BODY (Always Visible) */}
                        <Svg width={350} height={550} viewBox="0 0 540 600" style={{ position: 'absolute' }}>
                            <Path d={BODY_PATH} fill={isDark ? "#444" : "#E0E0E0"} stroke={isDark ? "#555" : "#CCC"} strokeWidth="2" />
                            {/* Head */}
                            <Circle cx="265" cy="80" r="35" fill={isDark ? "#444" : "#E0E0E0"} />
                        </Svg>

                        {/* 2. GARMENT LAYERS */}
                        <Garment3D type="footwear" data={currentOutfit.footwear} zIndex={10} />
                        <Garment3D type="bottom" data={currentOutfit.bottom} zIndex={5} />
                        <Garment3D type="top" data={currentOutfit.top} zIndex={20} />

                    </View>
                </View>

                {/* --- CONTROLS --- */}
                <Animated.View entering={FadeInRight.delay(300)} style={styles.verticalBar}>
                    <TouchableOpacity style={styles.vBtn} onPress={handleShuffle}>
                        <View style={[styles.vIconCtx, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                            <Shuffle size={22} color={colors.text} />
                        </View>
                        <Text style={[styles.vLabel, { color: colors.inactive }]}>Shuffle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.vBtn} onPress={handleAI}>
                        <View style={[styles.vIconCtx, { backgroundColor: colors.primary }]}>
                            <Wand2 size={24} color="#fff" />
                        </View>
                        <Text style={[styles.vLabel, { color: colors.primary, fontWeight: 'bold' }]}>AI Look</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.vBtn}>
                        <View style={[styles.vIconCtx, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                            <Share2 size={22} color={colors.text} />
                        </View>
                        <Text style={[styles.vLabel, { color: colors.inactive }]}>Share</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* --- INFO CARD --- */}
                <View style={[styles.infoCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                    <View style={styles.infoRow}>
                        <View style={styles.swatchStack}>
                            <View style={[styles.swatch, { backgroundColor: currentOutfit.top?.color || 'transparent', zIndex: 2 }]} />
                            <View style={[styles.swatch, { backgroundColor: currentOutfit.bottom?.color || 'transparent', marginLeft: -10 }]} />
                        </View>
                        <View style={{ marginLeft: 15 }}>
                            <Text style={[styles.infoTitle, { color: colors.text }]}>Selected Fit</Text>
                            <Text style={{ color: colors.inactive, fontSize: 12 }}>
                                {currentOutfit.top ? GARMENT_TEMPLATES[currentOutfit.top.id].name : 'No Top'} +
                                {' '}
                                {currentOutfit.bottom ? GARMENT_TEMPLATES[currentOutfit.bottom.id].name : 'No Bottom'}
                            </Text>
                        </View>
                    </View>
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    ambiance: { position: 'absolute', top: 0, left: 0, right: 0, height: '65%', borderBottomLeftRadius: 100, borderBottomRightRadius: 100 },
    safeArea: { flex: 1 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    iconBtn: { padding: 10, backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 25 },
    dateTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },

    // STAGE
    stage: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -30 },
    avatarContainer: { width: 350, height: 550, alignItems: 'center', justifyContent: 'center' },
    layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

    // CONTROLS
    verticalBar: { position: 'absolute', right: 24, top: '25%', gap: 25, alignItems: 'center' },
    vBtn: { alignItems: 'center', gap: 6 },
    vIconCtx: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.1, elevation: 4 },
    vLabel: { fontSize: 10, textAlign: 'center' },

    // INFO
    infoCard: { margin: 24, padding: 16, borderRadius: 20, shadowOpacity: 0.05, elevation: 5 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    swatchStack: { flexDirection: 'row' },
    swatch: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },
    infoTitle: { fontSize: 14, fontWeight: 'bold' }
});