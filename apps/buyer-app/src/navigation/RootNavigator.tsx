import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import AskGekelScreen from '../screens/home/AskGekelScreen';
import RequestDetailScreen from '../screens/home/RequestDetailScreen';
import ProductDetailScreen from '../screens/home/ProductDetailScreen';
import CheckoutScreen from '../screens/home/CheckoutScreen';
import SuppliersScreen from '../screens/home/SuppliersScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import OrderDetailScreen from '../screens/tabs/OrderDetailScreen';
import ChatRoomScreen from '../screens/tabs/ChatRoomScreen';
import OwnSupplierScreen from '../screens/home/OwnSupplierScreen';
import SupplierProfileScreen from '../screens/home/SupplierProfileScreen';
import CallScreen from '../screens/tabs/CallScreen';
import CartScreen from '../screens/home/CartScreen';
import BundleScreen from '../screens/home/BundleScreen';
import AddressesScreen from '../screens/account/AddressesScreen';
import AddressFormScreen from '../screens/account/AddressFormScreen';
import MapPickerScreen from '../screens/account/MapPickerScreen';
import PaymentsScreen from '../screens/account/PaymentsScreen';
import RequestsScreen from '../screens/account/RequestsScreen';
import MainTabs from './MainTabs';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { status } = useAuth();
  if (status === 'loading') return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {status === 'onboarding' ? (
        <Stack.Group key="onboarding">
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Group>
      ) : status === 'signedOut' ? (
        <Stack.Group key="auth">
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ gestureEnabled: false }} />
        </Stack.Group>
      ) : (
        <Stack.Group key="app">
          <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
          <Stack.Screen name="AskGekel" component={AskGekelScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
          <Stack.Screen name="Suppliers" component={SuppliersScreen} />
          <Stack.Screen name="SupplierProfile" component={SupplierProfileScreen} />
          <Stack.Screen name="OwnSupplier" component={OwnSupplierScreen} />
          <Stack.Screen name="Call" component={CallScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Bundle" component={BundleScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Requests" component={RequestsScreen} />
          <Stack.Screen name="Addresses" component={AddressesScreen} />
          <Stack.Screen name="AddressForm" component={AddressFormScreen} />
          <Stack.Screen name="MapPicker" component={MapPickerScreen} />
          <Stack.Screen name="Payments" component={PaymentsScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
