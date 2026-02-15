import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Calendar as CalendarIcon,
  Wand2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { GARMENT_TEMPLATES } from '@/constants/garments';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { getAISuggestedWeek } from '@/services/aiService'; // IMPORT AI SERVICE
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const getDatesForWeek = (startDate: Date) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDateDisplay = (date: Date) => {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const num = date.getDate();
  return { day, num };
};

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export default function PlannerScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { items, outfits, autoGenerateWeek, setAIOutfits } = useWardrobeStore();

  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [isAIThinking, setIsAIThinking] = useState(false); // NEW: AI Loading State

  useEffect(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

  // random logic
  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    autoGenerateWeek(currentWeekStart, false);
  };

  // calls Gemini API with wardrobe data
  const handleAIPlan = async () => {
    if (items.length === 0) {
      Alert.alert(
        'Empty Wardrobe',
        'Add items to your cupboard first so the AI has clothes to choose from.'
      );
      return;
    }

    setIsAIThinking(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. Prepare the dates for this specific week
      const dateKeys = weekDates.map((d) => d.toISOString().split('T')[0]);

      // 2. Call gemini service
      const aiResponse = await getAISuggestedWeek(items, dateKeys);

      // 3. Update the Zustand store with actual AI results
      setAIOutfits(aiResponse);

      Alert.alert(
        'Atelier AI',
        "I've analyzed your color palette and curated a stylish week for you."
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        'AI Error',
        'Could not connect to the styling engine. Using local shuffle instead.'
      );
      handleShuffle();
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleDayPress = (dateKey: string) => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/planner/edit',
      params: { date: dateKey },
    });
  };

  const GarmentIcon = ({ item, size = 46 }: { item: any; size?: number }) => (
    <View
      style={[
        styles.garmentCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? '#333' : '#F5F5F5',
          borderColor: isDark ? '#444' : '#E0E0E0',
        },
      ]}
    >
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 512 512">
        <Path
          d={GARMENT_TEMPLATES[item.id as keyof typeof GARMENT_TEMPLATES].path}
          fill={item.color}
        />
      </Svg>
    </View>
  );

  const renderDay = ({ item, index }: { item: Date; index: number }) => {
    const dateKey = item.toISOString().split('T')[0];
    const outfit = outfits[dateKey];
    const { day, num } = formatDateDisplay(item);
    const isToday = isSameDay(new Date(), item);
    const hasItems = outfit && (outfit.top || outfit.bottom || outfit.footwear);

    const isFirst = index === 0;
    const isLast = index === weekDates.length - 1;
    const lineColor = isDark ? '#333' : '#E0E0E0';

    return (
      <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <View
            style={[
              styles.lineSegment,
              { backgroundColor: isFirst ? 'transparent' : lineColor },
            ]}
          />
          <View
            style={[
              styles.timelineDot,
              {
                backgroundColor: isToday ? colors.primary : colors.inactive,
                borderColor: isDark ? '#000' : '#FFF',
              },
              isToday && styles.timelineDotActive,
            ]}
          />
          <View
            style={[
              styles.lineSegment,
              { backgroundColor: isLast ? 'transparent' : lineColor },
            ]}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleDayPress(dateKey)}
          style={[
            styles.dayCard,
            {
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isToday ? colors.primary : 'transparent',
              borderWidth: isToday ? 1 : 0,
            },
          ]}
        >
          <View style={styles.dateSection}>
            <Text
              style={[
                styles.dayLabel,
                { color: isToday ? colors.primary : colors.inactive },
              ]}
            >
              {day}
            </Text>
            <Text style={[styles.numLabel, { color: colors.text }]}>{num}</Text>
          </View>
          <View
            style={[
              styles.verticalDivider,
              { backgroundColor: isDark ? '#333' : '#F0F0F0' },
            ]}
          />
          <View style={styles.contentSection}>
            {hasItems ? (
              <View style={styles.garmentRow}>
                {outfit.top && <GarmentIcon item={outfit.top} />}
                {outfit.bottom && <GarmentIcon item={outfit.bottom} />}
                {outfit.footwear && <GarmentIcon item={outfit.footwear} />}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyState,
                  { borderColor: isDark ? '#444' : '#DDD' },
                ]}
              >
                <Plus
                  size={16}
                  color={colors.inactive}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: colors.inactive,
                    fontSize: 13,
                    fontWeight: '500',
                  }}
                >
                  Tap to plan
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Weekly Plan
          </Text>
          <Text style={[styles.subtitle, { color: colors.inactive }]}>
            Curate your look
          </Text>
        </View>
        <View
          style={[
            styles.iconBtn,
            { backgroundColor: isDark ? '#333' : '#F5F5F5' },
          ]}
        >
          <CalendarIcon color={colors.text} size={20} />
        </View>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => changeWeek('prev')}
          style={styles.navArrow}
          hitSlop={20}
        >
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.dateRangeContainer}>
          <Text style={[styles.weekRange, { color: colors.text }]}>
            {weekDates[0].toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            {' — '}
            {weekDates[6].toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => changeWeek('next')}
          style={styles.navArrow}
          hitSlop={20}
        >
          <ChevronRight size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={weekDates}
        keyExtractor={(item) => item.toISOString()}
        renderItem={renderDay}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* --- UPDATED FAB WITH AI LOADING --- */}
      <View style={styles.fabWrapper}>
        <View
          style={[
            styles.fabContainer,
            { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' },
          ]}
        >
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShuffle}
            activeOpacity={0.7}
            disabled={isAIThinking}
          >
            <Shuffle size={20} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Shuffle
            </Text>
          </TouchableOpacity>

          <View style={[styles.fabDivider, { backgroundColor: '#DDD' }]} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleAIPlan}
            activeOpacity={0.7}
            disabled={isAIThinking}
          >
            {isAIThinking ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Wand2 size={20} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  AI Assist
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 14, marginTop: 4 },
  iconBtn: { padding: 10, borderRadius: 12 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  navArrow: { padding: 8 },
  dateRangeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  weekRange: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  listContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 120 },
  timelineRow: { flexDirection: 'row', paddingBottom: 10, minHeight: 90 },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  lineSegment: { width: 2, flex: 1 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    zIndex: 2,
  },
  timelineDotActive: { width: 14, height: 14, borderRadius: 7 },
  dayCard: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  dateSection: { alignItems: 'center', justifyContent: 'center', width: 50 },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  numLabel: { fontSize: 22, fontWeight: '300', fontFamily: 'serif' },
  verticalDivider: { width: 1, height: '75%', marginHorizontal: 14 },
  contentSection: { flex: 1, justifyContent: 'center' },
  garmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  garmentCircle: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    width: '100%',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabContainer: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    paddingHorizontal: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    height: '100%',
    gap: 8,
  },
  actionText: { fontWeight: '600', fontSize: 15 },
  fabDivider: { width: 1, height: 26, opacity: 0.5 },
});
