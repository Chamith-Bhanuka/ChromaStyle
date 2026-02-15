import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Trash2, Edit2, Plus, X, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { GARMENT_TEMPLATES, GarmentType } from '@/constants/garments';
import { useWardrobeStore, WardrobeItem } from '@/store/wardrobeStore';
import * as Haptics from 'expo-haptics';
import ColorPicker, {
  Panel1,
  HueSlider,
  Preview,
} from 'reanimated-color-picker';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Footwear'];

export default function WardrobeScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { items, deleteEntireItem, removeColorFromItem, updateColorOfItem } =
    useWardrobeStore();

  const [selectedCategory, setSelectedCategory] = useState('All');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    id: GarmentType;
    colorIndex: number;
    color: string;
  } | null>(null);
  const [tempColor, setTempColor] = useState('');

  const filteredItems = items.filter((item) => {
    const template = GARMENT_TEMPLATES[item.id];
    if (!template) return false;
    if (selectedCategory === 'All') return true;
    return template.category === selectedCategory;
  });

  const confirmDeleteItem = (id: GarmentType) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Item?',
      `Are you sure you want to remove all ${GARMENT_TEMPLATES[id].name} from your cupboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEntireItem(id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const openEditModal = (
    id: GarmentType,
    colorIndex: number,
    color: string
  ) => {
    Haptics.selectionAsync();
    setEditingItem({ id, colorIndex, color });
    setTempColor(color);
    setModalVisible(true);
  };

  const handleSaveColor = () => {
    if (editingItem) {
      updateColorOfItem(editingItem.id, editingItem.colorIndex, tempColor);
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDeleteColor = () => {
    if (editingItem) {
      removeColorFromItem(editingItem.id, editingItem.colorIndex);
      setModalVisible(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const renderItem = ({ item }: { item: WardrobeItem }) => {
    const template = GARMENT_TEMPLATES[item.id];
    if (!template) return null;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
        ]}
        onLongPress={() => confirmDeleteItem(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.svgContainer}>
          <Svg width={100} height={100} viewBox="0 0 512 512">
            <Path
              d={template.path}
              fill={item.colors[0] || '#ccc'}
              stroke={isDark ? '#444' : '#ddd'}
              strokeWidth="6"
            />
          </Svg>
        </View>

        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {template.name}
        </Text>
        <Text
          style={{
            color: colors.inactive,
            fontSize: 10,
            textTransform: 'uppercase',
          }}
        >
          {item.colors.length} Colors
        </Text>

        <View style={styles.colorRow}>
          {/* FIX: Types 'c' (string) and 'idx' (number) are inferred automatically now */}
          {item.colors.map((c, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => openEditModal(item.id, idx, c)}
              style={[
                styles.colorDot,
                { backgroundColor: c, borderColor: isDark ? '#333' : '#fff' },
              ]}
            />
          ))}
          <TouchableOpacity
            style={[styles.addDot, { borderColor: colors.inactive }]}
            // FIX: Cast path as any to bypass strict route checking errors
            onPress={() => router.push('/(tabs)/atelier' as any)}
          >
            <Plus size={10} color={colors.inactive} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Virtual Cupboard
        </Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Search size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.catContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.catChip,
                selectedCategory === item && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  {
                    color: selectedCategory === item ? '#fff' : colors.inactive,
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: colors.inactive }}>
              Your cupboard is empty.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/atelier' as any)}
            >
              <Text style={{ color: colors.primary, marginTop: 10 }}>
                Scan Items +
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ColorPicker
              style={{ width: '100%', gap: 15 }}
              value={tempColor}
              onComplete={(res) => setTempColor(res.hex)}
            >
              <Preview
                style={[styles.pickerPreview, { borderColor: colors.inactive }]}
                textStyle={{ color: isDark ? '#fff' : '#000' }}
              />
              <Panel1 style={{ height: 120, borderRadius: 12 }} />
              <HueSlider style={{ height: 30, borderRadius: 15 }} />
            </ColorPicker>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FF4757' }]}
                onPress={handleDeleteColor}
              >
                <Trash2 size={18} color="#fff" />
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.primary, flex: 1 },
                ]}
                onPress={handleSaveColor}
              >
                <Edit2 size={18} color="#fff" />
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '300', fontFamily: 'serif' },
  headerBtn: {
    padding: 8,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 20,
  },

  // --- CATEGORIES (FIXED CENTERING) ---
  catContainer: { height: 50, marginBottom: 10 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    marginLeft: 16,
    // These two lines fix the text alignment:
    justifyContent: 'center',
    alignItems: 'center',
  },
  catText: { fontSize: 12, fontWeight: '600' },

  gridContent: { padding: 16, paddingBottom: 100 },

  // Card Styles
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  svgContainer: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },

  colorRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap', gap: 6 },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  addDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: { alignItems: 'center', marginTop: 100 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: { padding: 20, borderRadius: 24 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  pickerPreview: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
