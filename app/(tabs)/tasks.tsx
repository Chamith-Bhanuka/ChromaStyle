import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    FlatList, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Calendar, Wand2, Shuffle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useWardrobeStore, GARMENT_TEMPLATES } from '../../store/wardrobeStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Helper to get formatted dates
const getDatesForWeek = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
};

// Helper to format "Mon, 12"
const formatDateDisplay = (date: Date) => {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const num = date.getDate();
    return { day, num };
};

export default function PlannerScreen() {
    const router = useRouter();
    const { colors, isDark } = useThemeStore();
    const { outfits, autoGenerateWeek } = useWardrobeStore();

    // State: Start date of the currently viewed week
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

    // Normalize start date to Monday of this week
    useEffect(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        setCurrentWeekStart(monday);
    }, []);

    const changeWeek = (direction: 'prev' | 'next') => {
        Haptics.selectionAsync();
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentWeekStart(newDate);
    };

    const weekDates = getDatesForWeek(currentWeekStart);

    // --- ACTIONS ---

    const handleShuffle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        autoGenerateWeek(currentWeekStart, false); // False = Random
    };

    const handleAIPlan = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        autoGenerateWeek(currentWeekStart, true); // True = AI (Simulated)
        Alert.alert("Atelier AI", "I've curated a style plan based on your color palette.");
    };

    // --- RENDER DAY CARD ---
    const renderDay = ({ item }: { item: Date }) => {
        const dateKey = item.toISOString().split('T')[0];
        const outfit = outfits[dateKey];
        const { day, num } = formatDateDisplay(item);

        // Check if today
        const isToday = new Date().toDateString() === item.toDateString();

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                // FIX: Navigate to the outfit details page with the date param
                onPress={() => {
                    Haptics.selectionAsync();
                    router.push({ pathname: "/profile", params: { date: dateKey } } as any);
                }}
                style={[styles.dayCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
            >

                {/* Date Column */}
                <View style={[styles.dateCol, isToday && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.dayText, isToday && { color: '#FFF' }]}>{day}</Text>
                    <Text style={[styles.numText, isToday && { color: '#FFF' }]}>{num}</Text>
                </View>

                {/* Outfit Preview Row */}
                <View style={styles.outfitRow}>
                    {outfit ? (
                        <>
                            {/* TOP */}
                            {outfit.top && (
                                <View style={styles.garmentPreview}>
                                    <Svg width={50} height={50} viewBox="0 0 512 512">
                                        <Path d={GARMENT_TEMPLATES[outfit.top.id].path} fill={outfit.top.color} />
                                    </Svg>
                                </View>
                            )}
                            {/* BOTTOM */}
                            {outfit.bottom && (
                                <View style={styles.garmentPreview}>
                                    <Svg width={50} height={50} viewBox="0 0 512 512">
                                        <Path d={GARMENT_TEMPLATES[outfit.bottom.id].path} fill={outfit.bottom.color} />
                                    </Svg>
                                </View>
                            )}
                            {/* SHOES */}
                            {outfit.footwear && (
                                <View style={styles.garmentPreview}>
                                    <Svg width={40} height={40} viewBox="0 0 512 512">
                                        <Path d={GARMENT_TEMPLATES[outfit.footwear.id].path} fill={outfit.footwear.color} />
                                    </Svg>
                                </View>
                            )}
                        </>
                    ) : (
                        <Text style={{ color: colors.inactive, fontStyle: 'italic' }}>No Plan</Text>
                    )}
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

            {/* --- HEADER --- */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Weekly Plan</Text>
                <Calendar color={colors.text} size={24} />
            </View>

            {/* --- WEEK NAVIGATOR --- */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => changeWeek('prev')} style={styles.navBtn}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.weekRange, { color: colors.text }]}>
                    {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>

                <TouchableOpacity onPress={() => changeWeek('next')} style={styles.navBtn}>
                    <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* --- LIST --- */}
            <FlatList
                data={weekDates}
                keyExtractor={(item) => item.toISOString()}
                renderItem={renderDay}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* --- FLOATING ACTION BAR --- */}
            <View style={[styles.fabContainer, { backgroundColor: isDark ? '#222' : '#FFF' }]}>

                <TouchableOpacity style={styles.actionBtn} onPress={handleShuffle}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.inactive }]}>
                        <Shuffle size={20} color="#FFF" />
                    </View>
                    <Text style={[styles.actionText, { color: colors.text }]}>Shuffle</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.actionBtn} onPress={handleAIPlan}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                        <Wand2 size={20} color="#FFF" />
                    </View>
                    <Text style={[styles.actionText, { color: colors.text }]}>AI Suggest</Text>
                </TouchableOpacity>

            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    title: { fontSize: 28, fontFamily: 'serif', fontWeight: '300' },

    navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    navBtn: { padding: 10 },
    weekRange: { fontSize: 16, fontWeight: '600' },

    listContent: { padding: 20, paddingBottom: 120 },

    dayCard: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 16,
        borderRadius: 16, padding: 10,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
    },

    dateCol: {
        width: 60, height: 60, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.1)',
        alignItems: 'center', justifyContent: 'center', marginRight: 16
    },
    dayText: { fontSize: 12, fontWeight: 'bold', color: '#888', textTransform: 'uppercase' },
    numText: { fontSize: 20, fontWeight: 'bold', color: '#555' },

    outfitRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15 },
    garmentPreview: { alignItems: 'center', justifyContent: 'center' },

    // FAB
    fabContainer: {
        position: 'absolute', bottom: 100, left: 40, right: 40, height: 70,
        borderRadius: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
        shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10
    },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    actionText: { fontWeight: 'bold', fontSize: 14 },
    divider: { width: 1, height: 30, backgroundColor: '#ddd' }
});