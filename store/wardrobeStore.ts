import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- SHARED GARMENT DATA ---
export const GARMENT_TEMPLATES = {
    shirt: { name: 'T-Shirt', category: 'Tops', path: "M378.5,64.5c-15.8,18.1-40.6,22.1-61.9,12.6c-20.3-9-40.6-9-60.9,0c-21.3,9.4-46.1,5.5-61.9-12.6 C146.4,49.8,103.6,19.7,103.6,19.7L18.9,102.1l59.6,73.1l-18.2,279l393.4,0l-18.2-279l59.6-73.1l-84.7-82.4 C410.4,19.7,378.5,64.5,378.5,64.5z" },
    dress: { name: 'Dress', category: 'Tops', path: "M180,60 C180,60 256,90 332,60 L380,120 L350,480 L162,480 L132,120 Z" },
    trousers: { name: 'Trousers', category: 'Bottoms', path: "M360,60 L152,60 L140,160 L160,480 L230,480 L256,200 L282,480 L352,480 L372,160 Z" },
    shorts: { name: 'Shorts', category: 'Bottoms', path: "M360,60 L152,60 L140,160 L160,300 L230,300 L256,180 L282,300 L352,300 L372,160 Z" },
    sneakers: { name: 'Sneakers', category: 'Footwear', path: "M40,380 C40,380 40,320 80,280 C120,240 180,200 180,200 L220,160 C220,160 260,140 300,160 C340,180 380,220 420,220 C460,220 480,260 480,300 L480,380 L40,380 Z M300,380 L300,420 L480,420 L480,380 Z" },
    slippers: { name: 'Slippers', category: 'Footwear', path: "M80,400 C80,350 140,340 180,360 L340,360 C380,360 400,380 400,420 L80,420 Z M180,360 C180,290 320,290 360,360 L180,360 Z" },
    heels: { name: 'High Heels', category: 'Footwear', path: "M100,380 L140,380 L140,480 L120,480 L110,400 L60,400 L60,320 C60,280 120,280 140,320 L240,480 L320,480 L320,440 L260,380 L100,380 Z" },
};

export type GarmentType = keyof typeof GARMENT_TEMPLATES;

export interface WardrobeItem {
    id: GarmentType;
    colors: string[];
}

// Defines a single day's outfit
export interface Outfit {
    date: string; // ISO String "YYYY-MM-DD"
    top?: { id: GarmentType, color: string };
    bottom?: { id: GarmentType, color: string };
    footwear?: { id: GarmentType, color: string };
}

interface WardrobeState {
    items: WardrobeItem[];
    outfits: Record<string, Outfit>; // Key is "YYYY-MM-DD"

    // Basic Actions
    addColorToItem: (id: GarmentType, color: string) => void;
    removeColorFromItem: (id: GarmentType, colorIndex: number) => void;
    updateColorOfItem: (id: GarmentType, colorIndex: number, newColor: string) => void;
    deleteEntireItem: (id: GarmentType) => void;

    // Planner Actions
    setOutfitForDate: (date: string, outfit: Outfit) => void;
    autoGenerateWeek: (startDate: Date, useAI: boolean) => void;
}

export const useWardrobeStore = create<WardrobeState>()(
    persist(
        (set, get) => ({
            items: [
                { id: 'shirt', colors: ['#E74C3C', '#3498DB'] },
                { id: 'trousers', colors: ['#34495E'] },
                { id: 'sneakers', colors: ['#9B59B6'] },
            ],
            outfits: {},

            addColorToItem: (id, color) => set((state) => {
                const existing = state.items.find(i => i.id === id);
                if (existing) {
                    if (!existing.colors.includes(color)) {
                        return { items: state.items.map(i => i.id === id ? { ...i, colors: [...i.colors, color] } : i) };
                    }
                    return state;
                } else {
                    return { items: [...state.items, { id, colors: [color] }] };
                }
            }),

            removeColorFromItem: (id, index) => set((state) => ({
                items: state.items.map(i => {
                    if (i.id === id) {
                        const newColors = [...i.colors];
                        newColors.splice(index, 1);
                        return { ...i, colors: newColors };
                    }
                    return i;
                }).filter(i => i.colors.length > 0)
            })),

            updateColorOfItem: (id, index, newColor) => set((state) => ({
                items: state.items.map(i => {
                    if (i.id === id) {
                        const newColors = [...i.colors];
                        newColors[index] = newColor;
                        return { ...i, colors: newColors };
                    }
                    return i;
                })
            })),

            deleteEntireItem: (id) => set((state) => ({
                items: state.items.filter(i => i.id !== id)
            })),

            // --- PLANNER LOGIC ---
            setOutfitForDate: (date, outfit) => set((state) => ({
                outfits: { ...state.outfits, [date]: outfit }
            })),

            autoGenerateWeek: (startDate, useAI) => {
                const state = get();
                const newOutfits = { ...state.outfits };

                // Helper to pick random item from category
                const pickRandom = (category: string) => {
                    const candidates = state.items.filter(i => GARMENT_TEMPLATES[i.id].category === category);
                    if (candidates.length === 0) return undefined;
                    const item = candidates[Math.floor(Math.random() * candidates.length)];
                    const color = item.colors[Math.floor(Math.random() * item.colors.length)];
                    return { id: item.id, color };
                };

                // Loop 7 days
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    const dateKey = d.toISOString().split('T')[0];

                    // Basic Random Logic (AI Logic can be expanded here)
                    // If useAI is true, we could filter for matching colors, but for now we random.
                    newOutfits[dateKey] = {
                        date: dateKey,
                        top: pickRandom('Tops'),
                        bottom: pickRandom('Bottoms'),
                        footwear: pickRandom('Footwear'),
                    };
                }

                set({ outfits: newOutfits });
            }
        }),
        {
            name: 'wardrobe-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);