import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['home', 'home-outline'],
  Orders: ['bag-handle', 'bag-handle-outline'],
  Chat: ['chatbubble', 'chatbubble-outline'],
  Profile: ['person', 'person-outline'],
};

/** Custom tab bar with a large raised Search button in the centre. */
export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const inactiveColor = scheme === 'dark' ? '#8A8077' : '#A8A29E';
  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 8) }} className="flex-row items-end border-t border-line dark:border-surface-line bg-white dark:bg-surface px-2 pt-2">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const badge = descriptors[route.key].options.tabBarBadge;
        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name as never);
        };

        if (route.name === 'Finds') {
          return (
            <View key={route.key} className="flex-1 items-center">
              <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Search"
                style={{ marginTop: -30, shadowColor: '#F44236', shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}
                className="h-[66px] w-[66px] items-center justify-center rounded-full border-4 border-white bg-brand-500 active:bg-brand-600"
              >
                <Ionicons name="search" size={30} color="#fff" />
              </Pressable>
              <Text className={`mt-1 text-[11px] font-bold ${focused ? 'text-brand-500' : 'text-ink-mute'}`}>Search</Text>
            </View>
          );
        }

        const [on, off] = ICONS[route.name];
        const color = focused ? '#F44236' : inactiveColor;
        return (
          <Pressable key={route.key} onPress={onPress} accessibilityRole="button" accessibilityLabel={route.name} className="flex-1 items-center pb-1 pt-1">
            <View>
              <Ionicons name={focused ? on : off} size={24} color={color} />
              {badge ? (
                <View className="absolute -right-2.5 -top-1.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1">
                  <Text className="text-[10px] font-bold text-white">{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color }} className="mt-1 text-[11px] font-semibold">{route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
