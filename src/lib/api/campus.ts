import { jwtDecode } from 'jwt-decode';

import { clearAuthToken, getAuthToken, saveAuthToken } from '@/src/lib/auth/token';
import { env } from '@/src/lib/config/env';

export const API_BASE_URL = env.apiBaseUrl;

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
  exp?: number;
};

type CreateEventPayload = {
  image: string | null;
  name: string;
  event_datetime: string;
  event_location: string;
  description: string;
};

type UpdateEventPayload = Partial<CreateEventPayload>;

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

export class AuthSessionError extends Error {
  constructor(message = 'Sessão expirada. Faça login novamente.') {
    super(message);
    this.name = 'AuthSessionError';
  }
}

export function isAuthSessionError(error: unknown): error is AuthSessionError {
  return error instanceof AuthSessionError;
}

export async function hasAuthToken() {
  try {
    await getTokenPayload();
    return true;
  } catch {
    return false;
  }
}

export async function login(payload: LoginPayload) {
  const response = await requestPublic<TokenOut>('/users/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
  await saveAuthToken(response.access_token);
  return response;
}

export async function registerUser(payload: RegisterUserPayload) {
  return requestPublic<CurrentUser>('/users/register', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function getCurrentUser() {
  const tokenPayload = await getTokenPayload();
  return request<CurrentUser>(`/users/${tokenPayload.sub}`);
}

export async function listEvents() {
  return request<CampusEvent[]>('/events');
}

export async function getEvent(eventId: number) {
  return request<CampusEvent>(`/events/${eventId}`);
}

export async function createEvent(payload: CreateEventPayload) {
  return request<CampusEvent>('/events', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function updateEvent(eventId: number, payload: UpdateEventPayload) {
  return request<CampusEvent>(`/events/${eventId}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

async function getTokenPayload() {
  const authToken = await getAuthToken();

  if (!authToken) {
    await clearAuthToken();
    throw new AuthSessionError('Faça login para autenticar com o backend.');
  }

  try {
    const tokenPayload = jwtDecode<TokenPayload>(authToken);

    if (isTokenExpired(tokenPayload)) {
      await clearAuthToken();
      throw new AuthSessionError();
    }

    return tokenPayload;
  } catch (error) {
    if (isAuthSessionError(error)) {
      throw error;
    }

    await clearAuthToken();
    throw new AuthSessionError('Sessão inválida. Faça login novamente.');
  }
}

function isTokenExpired(tokenPayload: TokenPayload) {
  if (typeof tokenPayload.exp !== 'number') {
    return false;
  }

  return tokenPayload.exp <= Math.floor(Date.now() / 1000);
}

async function request<T>(path: string, init?: RequestInit) {
  const authToken = await getAuthToken();

  if (!authToken) {
    await clearAuthToken();
    throw new AuthSessionError('Faça login para autenticar com o backend.');
  }

  await getTokenPayload();

  return requestJson<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${authToken}`,
      ...init?.headers,
    },
  });
}

async function requestPublic<T>(path: string, init?: RequestInit) {
  return requestJson<T>(path, init);
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && path === '/users/login') {
      throw new Error('E-mail ou senha inválidos.');
    }

    if (response.status === 401) {
      await clearAuthToken();
      throw new AuthSessionError();
    }

    if (response.status === 404 && path.startsWith('/events')) {
      throw new Error('Use a branch feature/events-table do backend para habilitar /events.');
    }

    throw new Error(await getSafeErrorMessage(response, path));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function getSafeErrorMessage(response: Response, path: string) {
  const fallbackMessage = getFallbackErrorMessage(path);

  if (!__DEV__) {
    return fallbackMessage;
  }

  const responseText = await response.text();
  return responseText || `${fallbackMessage} Status: ${response.status}.`;
}

function getFallbackErrorMessage(path: string) {
  if (path === '/users/register') {
    return 'Não foi possível concluir o cadastro. Revise os dados e tente novamente.';
  }

  if (path.startsWith('/events')) {
    return 'Não foi possível carregar ou salvar eventos. Tente novamente.';
  }

  return 'Não foi possível concluir a solicitação. Tente novamente.';
}
