export const CAMPUS_TIME_ZONE = 'America/Sao_Paulo';

const CAMPUS_UTC_OFFSET = '-03:00';

export function formatCampusDayMonth(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: CAMPUS_TIME_ZONE,
  })
    .format(toDate(value))
    .replace('.', '')
    .toUpperCase();
}

export function formatCampusDateTimeLabel(value: Date) {
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    timeZone: CAMPUS_TIME_ZONE,
  }).format(value);
  const month = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    timeZone: CAMPUS_TIME_ZONE,
  })
    .format(value)
    .replace('.', '')
    .toUpperCase();
  const time = formatCampusTime(value);

  return `${day} ${month} · ${time}`;
}

export function formatCampusTimeRange(value: string | Date, durationMinutes = 90) {
  const startDate = toDate(value);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return `${formatCampusTime(startDate)} - ${formatCampusTime(endDate)}`;
}

export function getCampusDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: CAMPUS_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(toDate(value));

  return `${getPart(parts, 'year')}-${getPart(parts, 'month')}-${getPart(parts, 'day')}`;
}

export function toCampusDateTimeIso(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:00${CAMPUS_UTC_OFFSET}`;
}

function formatCampusTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: CAMPUS_TIME_ZONE,
  }).format(value);
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? '';
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}
