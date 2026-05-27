function getApiBaseUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL deve estar configurada no arquivo .env.');
  }

  return apiUrl.replace(/\/$/, '');
}

export const env = {
  apiBaseUrl: getApiBaseUrl(),
};
