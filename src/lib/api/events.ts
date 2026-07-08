import { z } from 'zod';

import { request, requestPublic } from './client';
import {
  campusEventSchema,
  EventCreateIn,
  EventUpdateIn,
} from './schemas';

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
