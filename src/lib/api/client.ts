import { z } from 'zod';

import { requestBlobWithToken, requestJson } from './core';
import { getValidAuthSession } from './session';

export async function request<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>) {
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

export async function requestPublic<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>) {
  return requestJson(path, init, schema);
}

export async function requestBlob(path: string, options?: { allowNotFound?: boolean }) {
  const authSession = await getValidAuthSession();
  return requestBlobWithToken(path, authSession.token, options);
}
