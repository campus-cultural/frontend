import { jwtDecode } from 'jwt-decode';
import { z } from 'zod';

import { clearAuthToken, getAuthToken, saveAuthToken } from '@/src/lib/auth/token';
import { env } from '@/src/lib/config/env';

export const API_BASE_URL = env.apiBaseUrl;
const TOKEN_REFRESH_THRESHOLD_SECONDS = 5 * 60;

const userRoleSchema = z.enum(['student', 'professor', 'admin']);
const campusUserSchema = z.object({
  birth_date: z.string().nullable(),
  email: z.string(),
  id: z.number(),
  is_active: z.boolean(),
  last_name: z.string(),
  name: z.string(),
  ra: z.string().nullable(),
  role: userRoleSchema,
});
const campusEventSchema = z.object({
  created_at: z.string(),
  description: z.string(),
  event_datetime: z.string(),
  event_location: z.string(),
  id: z.number(),
  image: z.string().nullable(),
  name: z.string(),
});
const healthOutSchema = z.object({
  status: z.literal('ok'),
});
const tokenOutSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
});
const tokenPayloadSchema = z.object({
  exp: z.number().optional(),
  role: userRoleSchema,
  sub: z.string(),
});

export type UserRole = z.infer<typeof userRoleSchema>;

export type CampusUser = z.infer<typeof campusUserSchema>;

export type CurrentUser = CampusUser;

export type CampusEvent = z.infer<typeof campusEventSchema>;

type TokenPayload = z.infer<typeof tokenPayloadSchema>;

type AuthSession = {
  payload: TokenPayload;
  token: string;
};

export type EventCreateIn = {
  image?: string | null;
  name: string;
  event_datetime: string;
  event_location: string;
  description: string;
};

export type EventUpdateIn = Partial<EventCreateIn>;

export type UserCreateIn = {
  role: UserRole;
  email: string;
  name: string;
  last_name: string;
  birth_date: string | null;
  is_active: boolean;
  ra: string | null;
  password: string;
};

export type UserUpdateIn = UserCreateIn;

export type UserLoginIn = {
  email: string;
  password: string;
};

export type TokenOut = z.infer<typeof tokenOutSchema>;

export type HealthOut = z.infer<typeof healthOutSchema>;

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
    await getValidAuthSession();
    return true;
  } catch {
    return false;
  }
}

export async function getHealth() {
  return requestPublic('/health', undefined, healthOutSchema);
}

export async function login(payload: UserLoginIn) {
  const response = await requestPublic(
    '/users/login',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    tokenOutSchema,
  );
  await saveAuthToken(response.access_token);
  return response;
}

export async function refreshToken() {
  const authSession = await getStoredAuthSession();

  try {
    assertTokenPayloadIsValid(authSession.payload);
  } catch (error) {
    if (isAuthSessionError(error)) {
      await clearAuthToken();
    }

    throw error;
  }

  const response = await requestJson(
    '/users/refresh-token',
    {
      headers: {
        Authorization: `Bearer ${authSession.token}`,
      },
      method: 'POST',
    },
    tokenOutSchema,
  );
  await saveAuthToken(response.access_token);
  return response;
}

export async function registerUser(payload: UserCreateIn) {
  return requestPublic(
    '/users/register',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    campusUserSchema,
  );
}

export async function listUsers() {
  return request('/users', undefined, z.array(campusUserSchema));
}

export async function getUser(userId: number) {
  return request(`/users/${userId}`, undefined, campusUserSchema);
}

export async function getCurrentUser() {
  const authSession = await getValidAuthSession();

  return requestJson(
    `/users/${Number(authSession.payload.sub)}`,
    {
      headers: {
        Authorization: `Bearer ${authSession.token}`,
      },
    },
    campusUserSchema,
  );
}

export async function updateUser(userId: number, payload: UserUpdateIn) {
  return request(
    `/users/${userId}`,
    {
      body: JSON.stringify(payload),
      method: 'PUT',
    },
    campusUserSchema,
  );
}

export async function deleteUser(userId: number) {
  return request<void>(`/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function getProfilePictureUri(userId: number) {
  const imageBlob = await requestBlob(`/users/${userId}/profile-picture`, { allowNotFound: true });

  if (!imageBlob) {
    return null;
  }

  return blobToDataUri(imageBlob);
}

export async function updateProfilePicture(userId: number, imageUri: string) {
  const imageBlob = await uriToBlob(imageUri);

  return request(
    `/users/${userId}/profile-picture`,
    {
      body: imageBlob,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      method: 'POST',
    },
    campusUserSchema,
  );
}

export async function listEvents() {
  return requestPublic('/events', undefined, z.array(campusEventSchema));
}

export async function getEvent(eventId: number) {
  return requestPublic(`/events/${eventId}`, undefined, campusEventSchema);
}

export async function createEvent(payload: EventCreateIn) {
  return request(
    '/events',
    {
      body: JSON.stringify(payload),
      method: 'POST',
    },
    campusEventSchema,
  );
}

export async function updateEvent(eventId: number, payload: EventUpdateIn) {
  return request(
    `/events/${eventId}`,
    {
      body: JSON.stringify(payload),
      method: 'PUT',
    },
    campusEventSchema,
  );
}

export async function deleteEvent(eventId: number) {
  return request<void>(`/events/${eventId}`, {
    method: 'DELETE',
  });
}

async function getStoredAuthSession(): Promise<AuthSession> {
  const authToken = await getAuthToken();

  if (!authToken) {
    await clearAuthToken();
    throw new AuthSessionError('Faça login para autenticar com o backend.');
  }

  try {
    return {
      payload: getTokenPayload(authToken),
      token: authToken,
    };
  } catch (error) {
    if (isAuthSessionError(error)) {
      await clearAuthToken();
    }

    throw error;
  }
}

async function getValidAuthSession(): Promise<AuthSession> {
  const authSession = await getStoredAuthSession();

  if (isTokenExpired(authSession.payload)) {
    await clearAuthToken();
    throw new AuthSessionError();
  }

  if (shouldRefreshToken(authSession.payload)) {
    return refreshAuthSession(authSession.token);
  }

  return authSession;
}

async function refreshAuthSession(authToken: string): Promise<AuthSession> {
  const response = await requestJson(
    '/users/refresh-token',
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      method: 'POST',
    },
    tokenOutSchema,
  );
  await saveAuthToken(response.access_token);
  return {
    payload: getTokenPayload(response.access_token),
    token: response.access_token,
  };
}

function getTokenPayload(authToken: string) {
  try {
    return tokenPayloadSchema.parse(jwtDecode<unknown>(authToken));
  } catch (error) {
    if (isAuthSessionError(error)) {
      throw error;
    }

    throw new AuthSessionError('Sessão inválida. Faça login novamente.');
  }
}

function assertTokenPayloadIsValid(tokenPayload: TokenPayload) {
  if (isTokenExpired(tokenPayload)) {
    throw new AuthSessionError();
  }
}

function isTokenExpired(tokenPayload: TokenPayload) {
  if (typeof tokenPayload.exp !== 'number') {
    return false;
  }

  return tokenPayload.exp <= Math.floor(Date.now() / 1000);
}

async function request<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>) {
  const authSession = await getValidAuthSession();

  return requestJson(
    path,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${authSession.token}`,
        ...init?.headers,
      },
    },
    schema,
  );
}

async function requestPublic<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>) {
  return requestJson(path, init, schema);
}

async function requestBlob(path: string, options?: { allowNotFound?: boolean }) {
  const authSession = await getValidAuthSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/octet-stream',
      Authorization: `Bearer ${authSession.token}`,
    },
  });

  if (options?.allowNotFound && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      await clearAuthToken();
      throw new AuthSessionError();
    }

    throw new Error(await getSafeErrorMessage(response, path));
  }

  return response.blob();
}

async function requestJson<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>) {
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

    if (__DEV__ && response.status === 404 && path.startsWith('/events')) {
      throw new Error('Endpoint de eventos não encontrado no backend configurado.');
    }

    throw new Error(await getSafeErrorMessage(response, path));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseBody = await response.json();

  if (!schema) {
    return responseBody as T;
  }

  try {
    return schema.parse(responseBody);
  } catch {
    throw new Error(getInvalidApiResponseMessage(path));
  }
}

async function uriToBlob(uri: string) {
  const response = await fetch(uri);
  return response.blob();
}

function blobToDataUri(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Não foi possível ler a imagem de perfil.'));
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Não foi possível carregar a imagem de perfil.'));
        return;
      }

      const base64 = reader.result.split(',')[1] ?? '';
      resolve(`data:${getImageMimeType(base64)};base64,${base64}`);
    };
    reader.readAsDataURL(blob);
  });
}

function getImageMimeType(base64: string) {
  if (base64.startsWith('iVBOR')) {
    return 'image/png';
  }

  if (base64.startsWith('/9j/')) {
    return 'image/jpeg';
  }

  if (base64.startsWith('R0lG')) {
    return 'image/gif';
  }

  if (base64.startsWith('UklGR')) {
    return 'image/webp';
  }

  return 'image/jpeg';
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

function getInvalidApiResponseMessage(path: string) {
  if (path.startsWith('/events')) {
    return 'O backend retornou eventos em um formato inesperado.';
  }

  if (path.startsWith('/users')) {
    return 'O backend retornou dados de usuário em um formato inesperado.';
  }

  return 'O backend retornou dados em um formato inesperado.';
}

function shouldRefreshToken(tokenPayload: TokenPayload) {
  if (typeof tokenPayload.exp !== 'number') {
    return false;
  }

  return tokenPayload.exp - Math.floor(Date.now() / 1000) <= TOKEN_REFRESH_THRESHOLD_SECONDS;
}
