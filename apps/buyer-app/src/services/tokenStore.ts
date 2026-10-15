import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'gekel.refresh_token';

/**
 * The refresh token is the long-lived secret, so it lives in the OS keychain / keystore
 * (expo-secure-store). The short-lived access token is kept in memory only (see http.ts).
 * On web there is no secure storage, so we fall back to AsyncStorage (use httpOnly cookies there in production).
 */
const secure = Platform.OS !== 'web';

export const tokenStore = {
  async getRefresh(): Promise<string | null> {
    try {
      return secure ? await SecureStore.getItemAsync(KEY) : await AsyncStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  async setRefresh(token: string): Promise<void> {
    if (secure) await SecureStore.setItemAsync(KEY, token, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
    else await AsyncStorage.setItem(KEY, token);
  },
  async clear(): Promise<void> {
    try {
      if (secure) await SecureStore.deleteItemAsync(KEY);
      else await AsyncStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};
