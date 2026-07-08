import { requestPublic } from './client';
import { healthOutSchema } from './schemas';

export async function getHealth() {
  return requestPublic('/health', undefined, healthOutSchema);
}
