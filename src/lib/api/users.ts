import { z } from 'zod';

import { request, requestBlob, requestPublic } from './client';
import { requestJson } from './core';
import { getValidAuthSession } from './session';
import {
  campusUserSchema,
  UserCreateIn,
  UserUpdateIn,
} from './schemas';

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
