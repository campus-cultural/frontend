import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

function getAvatarKey(userId: number) {
  return `campus-cultural.profile-avatar.${userId}`;
}

function getWebStorage() {
  if (typeof localStorage === 'undefined') {
    throw new Error('Armazenamento local indisponivel neste ambiente.');
  }

  return localStorage;
}

export async function getProfileAvatarUri(userId: number) {
  const avatarKey = getAvatarKey(userId);

  if (Platform.OS === 'web') {
    return getWebStorage().getItem(avatarKey);
  }

  return SecureStore.getItemAsync(avatarKey);
}

export async function saveProfileAvatarUri(userId: number, imageUri: string) {
  const avatarKey = getAvatarKey(userId);

  if (Platform.OS === 'web') {
    getWebStorage().setItem(avatarKey, imageUri);
    return;
  }

  await SecureStore.setItemAsync(avatarKey, imageUri);
}
