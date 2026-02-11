import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GARMENT_TEMPLATES, GarmentType } from '@/constants/garments';
import {
  fetchWardrobeItems,
  addColorToGarment,
  removeColorFromGarment,
  updateGarmentColorArray,
  deleteGarment,
} from '@/services/wardrobeService';

export interface WardrobeItem {
  id: GarmentType;
  colors: string[];
}

export interface Outfit {
  date: string;
  imageUri?: string;
  top?: { id: GarmentType; color: string };
  bottom?: { id: GarmentType; color: string };
  footwear?: { id: GarmentType; color: string };
}

interface WardrobeState {
  items: WardrobeItem[];
  outfits: Record<string, Outfit>;
  isLoading: boolean;

  fetchItems: () => Promise<void>;
  addColorToItem: (id: GarmentType, color: string) => Promise<void>;
  removeColorFromItem: (id: GarmentType, colorIndex: number) => Promise<void>;
  updateColorOfItem: (
    id: GarmentType,
    colorIndex: number,
    newColor: string
  ) => Promise<void>;
  deleteEntireItem: (id: GarmentType) => Promise<void>;

  setOutfitForDate: (date: string, outfit: Outfit) => void;
  setOutfitImage: (date: string, uri: string) => void;
  autoGenerateWeek: (startDate: Date, useAI: boolean) => void;
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      outfits: {},
      isLoading: false,

      fetchItems: async () => {
        set({ isLoading: true });
        try {
          const cloudItems = await fetchWardrobeItems();
          set({ items: cloudItems as WardrobeItem[] });
        } finally {
          set({ isLoading: false });
        }
      },

      addColorToItem: async (id, color) => {
        const state = get();
        const existing = state.items.find((i) => i.id === id);
        if (existing && existing.colors.includes(color)) return;

        // Optimistic Update
        let newItems;
        if (existing) {
          newItems = state.items.map((i) =>
            i.id === id ? { ...i, colors: [...i.colors, color] } : i
          );
        } else {
          newItems = [...state.items, { id, colors: [color] }];
        }
        set({ items: newItems });

        // Firebase Sync
        await addColorToGarment(id, color);
      },

      removeColorFromItem: async (id, index) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) return;

        const colorToRemove = item.colors[index];
        const isLastColor = item.colors.length === 1;

        // Optimistic Update
        const newItems = state.items
          .map((i) => {
            if (i.id === id) {
              const newColors = [...i.colors];
              newColors.splice(index, 1);
              return { ...i, colors: newColors };
            }
            return i;
          })
          .filter((i) => i.colors.length > 0);
        set({ items: newItems });

        // Firebase Sync
        await removeColorFromGarment(id, colorToRemove, isLastColor);
      },

      updateColorOfItem: async (id, index, newColor) => {
        const state = get();
        const item = state.items.find((i) => i.id === id);
        if (!item) return;

        const newColorsList = [...item.colors];
        newColorsList[index] = newColor;

        // Optimistic Update
        set({
          items: state.items.map((i) =>
            i.id === id ? { ...i, colors: newColorsList } : i
          ),
        });

        // Firebase Sync
        await updateGarmentColorArray(id, newColorsList);
      },

      deleteEntireItem: async (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
        await deleteGarment(id);
      },

      setOutfitForDate: (date, outfit) =>
        set((state) => ({ outfits: { ...state.outfits, [date]: outfit } })),

      setOutfitImage: (date, uri) =>
        set((state) => {
          const existing = state.outfits[date] || { date };
          return {
            outfits: {
              ...state.outfits,
              [date]: { ...existing, imageUri: uri },
            },
          };
        }),

      autoGenerateWeek: (startDate, useAI) => {
        const state = get();
        const newOutfits = { ...state.outfits };
        const pickRandom = (category: string) => {
          const candidates = state.items.filter(
            (i) => GARMENT_TEMPLATES[i.id].category === category
          );
          if (candidates.length === 0) return undefined;
          const item =
            candidates[Math.floor(Math.random() * candidates.length)];
          return {
            id: item.id,
            color: item.colors[Math.floor(Math.random() * item.colors.length)],
          };
        };

        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const dateKey = d.toISOString().split('T')[0];
          if (!newOutfits[dateKey]) {
            newOutfits[dateKey] = {
              date: dateKey,
              top: pickRandom('Tops'),
              bottom: pickRandom('Bottoms'),
              footwear: pickRandom('Footwear'),
            };
          }
        }
        set({ outfits: newOutfits });
      },
    }),
    {
      name: 'wardrobe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
