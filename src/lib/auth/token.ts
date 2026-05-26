import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'campus-cultural.access-token';
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function getWebStorage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Armazenamento local indisponivel neste ambiente.');
  }

  return localStorage;
}

async function assertSecureStoreAvailable() {
  if (!(await SecureStore.isAvailableAsync())) {
    throw new Error('Armazenamento seguro indisponivel neste dispositivo.');
  }
}

export async function getAuthToken() {
  if (Platform.OS === 'web') {
    return getWebStorage().getItem(TOKEN_KEY);
  }

  await assertSecureStoreAvailable();
  return SecureStore.getItemAsync(TOKEN_KEY, SECURE_STORE_OPTIONS);
}

export async function saveAuthToken(token: string) {
  if (Platform.OS === 'web') {
    getWebStorage().setItem(TOKEN_KEY, token);
    return;
  }

  await assertSecureStoreAvailable();
  await SecureStore.setItemAsync(TOKEN_KEY, token, SECURE_STORE_OPTIONS);
}

export async function clearAuthToken() {
  if (Platform.OS === 'web') {
    getWebStorage().removeItem(TOKEN_KEY);
    return;
  }

  await assertSecureStoreAvailable();
  await SecureStore.deleteItemAsync(TOKEN_KEY, SECURE_STORE_OPTIONS);
}
