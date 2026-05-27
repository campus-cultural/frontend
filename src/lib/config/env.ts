import { Platform } from 'react-native';

const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

function getApiBaseUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (apiUrl) {
    return apiUrl.replace(/\/$/, '');
  }

  if (__DEV__) {
    return LOCAL_API_URL;
  }

  throw new Error('EXPO_PUBLIC_API_URL deve estar configurada para builds de produção.');
}

export const env = {
  apiBaseUrl: getApiBaseUrl(),
};
