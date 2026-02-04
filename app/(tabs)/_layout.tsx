import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Shirt, Camera, Calendar, User } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';

export default function TabLayout() {
  const { colors, isDark } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        tabBarStyle: {
          backgroundColor: colors.tabBarBase,
          borderTopColor: isDark ? '#333' : '#e5e5e5',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          elevation: 0,
          shadowOpacity: 0,
        },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 12,
        },
      }}
    >
      <Tabs.Screen
        name="atelier"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Home} colors={colors} />
          ),
        }}
      />

      <Tabs.Screen
        name="wardrobe"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Shirt} colors={colors} />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.centerBtn,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Camera size={26} color="#ffffff" strokeWidth={2.5} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="planner"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Calendar} colors={colors} />
          ),
        }}
      />

      <Tabs.Screen
        name="outfit"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={User} colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}

const TabIcon = ({ focused, Icon, colors }: any) => (
  <View style={styles.iconWrapper}>
    <Icon
      size={26}
      color={focused ? colors.primary : colors.inactive}
      strokeWidth={focused ? 2.5 : 2}
    />

    {focused && (
      <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
    )}
  </View>
);

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 50,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6, // Space between icon and dot
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 16, // Squircle shape
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
