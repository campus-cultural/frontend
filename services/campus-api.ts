import { Platform } from 'react-native';
import { jwtDecode } from 'jwt-decode';

import { getAuthToken, saveAuthToken } from './auth-token';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000');

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

export type RegisterUserPayload = {
  role: Exclude<UserRole, 'admin'>;
  email: string;
  name: string;
  last_name: string;
  birth_date: string | null;
  is_active: boolean;
  ra: string | null;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type TokenOut = {
  access_token: string;
  token_type: string;
};

export async function hasAuthToken() {
  return Boolean(await getAuthToken());
}

export async function login(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    body: JSON.stringify(payload),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const message = await response.text();
    throw new Error(message || `A API respondeu com status ${response.status}.`);
  }

  const token = (await response.json()) as TokenOut;
  await saveAuthToken(token.access_token);
  return token;
}

export async function registerUser(payload: RegisterUserPayload) {
  const response = await fetch(`${API_BASE_URL}/users/register`, {
    body: JSON.stringify(payload),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `A API respondeu com status ${response.status}.`);
  }

  return (await response.json()) as CurrentUser;
}

export async function getCurrentUser() {
  const tokenPayload = await getTokenPayload();
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

async function getTokenPayload() {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error('Faça login para autenticar com o backend.');
  }

  return jwtDecode<TokenPayload>(authToken);
}

async function request<T>(path: string, init?: RequestInit) {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error('Faça login para autenticar com o backend.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${authToken}`,
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
