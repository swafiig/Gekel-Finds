import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import FindsScreen from '../screens/tabs/FindsScreen';
import OrdersScreen from '../screens/tabs/OrdersScreen';
import ChatListScreen from '../screens/tabs/ChatListScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';
import TabBar from '../components/TabBar';
import SideMenu from '../components/SideMenu';
import { isActive, useAppData } from '../context/AppDataContext';
import type { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { orders, chats } = useAppData();
  const activeOrders = orders.filter(isActive).length;
  const unread = chats.reduce((n, c) => n + c.unread, 0);

  return (
    <>
    <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarBadge: activeOrders || undefined }} />
      <Tab.Screen name="Finds" component={FindsScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ tabBarBadge: unread || undefined }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
    <SideMenu />
    </>
  );
}
