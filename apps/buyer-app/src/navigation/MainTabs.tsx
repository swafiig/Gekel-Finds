import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import FindsScreen from '../screens/tabs/FindsScreen';
import OrdersScreen from '../screens/tabs/OrdersScreen';
import ChatListScreen from '../screens/tabs/ChatListScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';
import { useAppData } from '../context/AppDataContext';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['home', 'home-outline'],
  Finds: ['search', 'search-outline'],
  Orders: ['lock-closed', 'lock-closed-outline'],
  Chat: ['chatbubble', 'chatbubble-outline'],
  Profile: ['person', 'person-outline'],
};

export default function MainTabs() {
  const { orders, chats } = useAppData();
  const activeOrders = orders.filter((o) => o.stage < 3).length;
  const unread = chats.reduce((n, c) => n + c.unread, 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#E8590C',
        tabBarInactiveTintColor: '#A8A29E',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { borderTopColor: '#E7E2DA', height: 64, paddingTop: 6, paddingBottom: 8, backgroundColor: '#fff' },
        tabBarBadgeStyle: { backgroundColor: '#E8590C', color: '#fff', fontSize: 10 },
        tabBarIcon: ({ focused, color, size }) => <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Finds" component={FindsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarBadge: activeOrders || undefined }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarBadge: unread || undefined }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
