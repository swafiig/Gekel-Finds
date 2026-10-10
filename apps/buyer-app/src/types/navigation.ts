import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = { Home: undefined; Orders: undefined; Finds: undefined; Chat: undefined; Profile: undefined };

export type RootStackParamList = {
  Onboarding: undefined; Welcome: undefined; Login: undefined; Register: undefined; ForgotPassword: undefined;
  VerifyOtp: { identifier: string }; ResetPassword: { identifier: string; code: string };
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AskGekel: undefined; OwnSupplier: undefined; RequestDetail: { id: string }; Requests: undefined;
  ProductDetail: { id: string };
  Cart: undefined;
  Checkout: { lines: { productId: string; qty: number }[]; fromCart?: boolean };
  Bundle: { id: string };
  OrderDetail: { id: string }; ChatRoom: { id: string };
  Suppliers: { tab?: 'wholesale' | 'retail'; market?: string } | undefined;
  SupplierProfile: { id: string };
  Call: { name: string; role?: string; limitSeconds?: number };
  Notifications: undefined;
  Addresses: undefined;
  AddressForm: { id?: string; pin?: { lat: number; lng: number } };
  MapPicker: { lat?: number; lng?: number };
  Payments: undefined;
};
