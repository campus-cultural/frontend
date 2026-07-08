import { saveAuthToken } from '@/src/lib/auth/token';

import { requestPublic } from './client';
import { tokenOutSchema, UserLoginIn } from './schemas';

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
