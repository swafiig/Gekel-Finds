import { Platform } from 'react-native';

/**
 * API base URL. Set EXPO_PUBLIC_API_URL in .env (Expo inlines it at build time).
 *  - Android emulator:  http://10.0.2.2:8080
 *  - iOS simulator:     http://localhost:8080
 *  - Real phone (dev):  http://<your-computer-LAN-IP>:8080   (phone and computer on the same Wi-Fi)
 *  - Production:        https://api.yourdomain.co.ke   (HTTPS only)
 */
const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? fallback).replace(/\/+$/, '');
export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 15000;

if (!__DEV__ && !API_BASE.startsWith('https://')) {
  // Tokens and passwords must never travel over plain HTTP in a release build.
  console.warn('[config] API_BASE is not HTTPS in a release build:', API_BASE);
}
