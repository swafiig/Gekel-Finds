import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Finds: undefined;
  Orders: undefined;
  Chat: undefined;
  Profile: undefined;
};


export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { phone?: string } | undefined;
  ResetPassword: { token?: string } | undefined;
  Main: undefined;
  AskGekel: undefined;
  RequestDetail: { id: string };
  ProductDetail: { id: string };
  Checkout: { productId: string };
  OrderDetail: { id: string };
  ChatRoom: { id: string };
  Suppliers: { productId?: string } | undefined;
  Notifications: undefined;
};