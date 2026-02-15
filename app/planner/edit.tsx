import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ArrowLeft, Check, Shirt, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useThemeStore } from '@/store/themeStore';
import { useWardrobeStore, Outfit } from '@/store/wardrobeStore';
import { GARMENT_TEMPLATES, GarmentType } from '@/constants/garments';

const { width } = Dimensions.get('window');
const CATEGORIES = ['Tops', 'Bottoms', 'Footwear'];

export default function EditOutfitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dateKey = params.date as string;

  const { colors, isDark } = useThemeStore();
  const { items, outfits, setOutfitForDate } = useWardrobeStore();

  const [draftOutfit, setDraftOutfit] = useState<Outfit>(() => {
    return (
      outfits[dateKey] || {
        date: dateKey,
        top: undefined,
        bottom: undefined,
        footwear: undefined,
      }
    );
  });

  const [activeTab, setActiveTab] = useState('Tops');

  const dateObj = new Date(dateKey);
  const dateDisplay = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // filter items by Category
  const filteredInventory = useMemo(() => {
    return items.filter(
      (item) => GARMENT_TEMPLATES[item.id].category === activeTab
    );
  }, [items, activeTab]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setOutfitForDate(dateKey, draftOutfit);

    router.replace('/(tabs)/planner');
  };

  const handleSelectItem = (
    garmentId: GarmentType,
    color: string,
    category: string
  ) => {
    Haptics.selectionAsync();

    let slot: keyof Outfit = 'top';
    if (category === 'Bottoms') slot = 'bottom';
    if (category === 'Footwear') slot = 'footwear';

    setDraftOutfit((prev) => ({
      ...prev,
      [slot]: { id: garmentId, color },
    }));
  };

  const handleClearSlot = (slot: 'top' | 'bottom' | 'footwear') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraftOutfit((prev) => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
  };

  const renderPreviewSlot = (
    slot: 'top' | 'bottom' | 'footwear',
    label: string
  ) => {
    const selection = draftOutfit[slot];

    return (
      <View style={styles.slotContainer}>
        <Text style={[styles.slotLabel, { color: colors.inactive }]}>
          {label}
        </Text>
        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderColor: selection ? colors.primary : 'transparent',
              borderWidth: selection ? 1.5 : 0,
            },
          ]}
        >
          {selection ? (
            <>
              <Svg width={60} height={60} viewBox="0 0 512 512">
                <Path
                  d={GARMENT_TEMPLATES[selection.id].path}
                  fill={selection.color}
                />
              </Svg>
              <TouchableOpacity
                style={[
                  styles.removeBtn,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => handleClearSlot(slot)}
              >
                <X size={12} color={colors.text} />
              </TouchableOpacity>
            </>
          ) : (
            <Shirt size={24} color={colors.inactive} style={{ opacity: 0.3 }} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Edit Look
          </Text>
          <Text style={[styles.headerSub, { color: colors.inactive }]}>
            {dateDisplay}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.iconBtn}>
          <Check size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 1. OUTFIT PREVIEW SECTION */}
      <View style={styles.previewSection}>
        {renderPreviewSlot('top', 'Top')}
        {renderPreviewSlot('bottom', 'Bottom')}
        {renderPreviewSlot('footwear', 'Shoes')}
      </View>

      <View
        style={[styles.divider, { backgroundColor: isDark ? '#333' : '#EEE' }]}
      />

      {/* 2. CATEGORY TABS */}
      <View style={styles.tabContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(cat);
            }}
            style={[
              styles.tab,
              activeTab === cat && {
                backgroundColor: colors.text,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === cat ? colors.background : colors.inactive,
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. WARDROBE GRID */}
      <FlatList
        data={filteredInventory}
        keyExtractor={(item) => item.id}
        numColumns={1} // List of items, expanding colors horizontally
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: colors.inactive }}>
              No {activeTab} found.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.itemRow,
              { borderBottomColor: isDark ? '#333' : '#F0F0F0' },
            ]}
          >
            {/* Garment Preview */}
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.miniPreview,
                  { backgroundColor: isDark ? '#222' : '#F9F9F9' },
                ]}
              >
                <Svg width={30} height={30} viewBox="0 0 512 512">
                  <Path
                    d={GARMENT_TEMPLATES[item.id].path}
                    fill={colors.inactive}
                  />
                </Svg>
              </View>
              <Text style={[styles.itemName, { color: colors.text }]}>
                {GARMENT_TEMPLATES[item.id].name}
              </Text>
            </View>

            {/* Color Variants */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {item.colors.map((color, idx) => (
                <TouchableOpacity
                  key={`${item.id}-${color}-${idx}`}
                  onPress={() => handleSelectItem(item.id, color, activeTab)}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderColor: isDark ? '#444' : '#DDD',
                    },
                  ]}
                />
              ))}
            </ScrollView>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, fontWeight: '500' },
  iconBtn: { padding: 8 },

  // Preview
  previewSection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 20,
  },
  slotContainer: { alignItems: 'center', gap: 8 },
  slotLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: '600' },
  previewBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },

  divider: { height: 1, width: '100%', marginBottom: 15 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: { fontWeight: '600', fontSize: 13 },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '40%',
  },
  miniPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '500' },

  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyState: { alignItems: 'center', marginTop: 40 },
});
