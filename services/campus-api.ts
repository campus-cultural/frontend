import { Platform } from 'react-native';
import { jwtDecode } from 'jwt-decode';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000');

const AUTH_TOKEN = process.env.EXPO_PUBLIC_AUTH_TOKEN;

export type UserRole = 'student' | 'professor' | 'admin';

export type CurrentUser = {
  id: number;
  role: UserRole;
  email: string;
  name: string;
  last_name: string;
  birth_date: string | null;
  is_active: boolean;
  ra: string | null;
};

export type CampusEvent = {
  id: number;
  image: string | null;
  name: string;
  event_datetime: string;
  event_location: string;
  description: string;
  created_at: string;
};

type TokenPayload = {
  sub: string;
  role: UserRole;
};

type CreateEventPayload = {
  image: string | null;
  name: string;
  event_datetime: string;
  event_location: string;
  description: string;
};

export function hasAuthToken() {
  return Boolean(AUTH_TOKEN);
}

export async function getCurrentUser() {
  const tokenPayload = getTokenPayload();
  return request<CurrentUser>(`/users/${tokenPayload.sub}`);
}

export async function listEvents() {
  return request<CampusEvent[]>('/events');
}

export async function createEvent(payload: CreateEventPayload) {
  return request<CampusEvent>('/events', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

function getTokenPayload() {
  if (!AUTH_TOKEN) {
    throw new Error('Informe EXPO_PUBLIC_AUTH_TOKEN para autenticar com o backend.');
  }

  return jwtDecode<TokenPayload>(AUTH_TOKEN);
}

async function request<T>(path: string, init?: RequestInit) {
  if (!AUTH_TOKEN) {
    throw new Error('Informe EXPO_PUBLIC_AUTH_TOKEN para autenticar com o backend.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 404 && path.startsWith('/events')) {
      throw new Error('Use a branch feature/events-table do backend para habilitar /events.');
    }

    const message = await response.text();
    throw new Error(message || `A API respondeu com status ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
