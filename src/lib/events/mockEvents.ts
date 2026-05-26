import { CampusEvent } from '@/src/lib/api/campus';

export const mockEvents: CampusEvent[] = [
  {
    id: 1,
    image: null,
    name: 'Festival de Inverno: Orquestra UTFPR',
    event_datetime: '2026-05-24T19:30:00.000Z',
    event_location: 'Auditório Central',
    description:
      'Uma noite dedicada aos grandes clássicos, sob a regência do Maestro convidado.',
    created_at: '2026-05-01T12:00:00.000Z',
  },
  {
    id: 2,
    image: null,
    name: 'Retratos da Campus: Fotografia & Design',
    event_datetime: '2026-06-02T18:00:00.000Z',
    event_location: 'Galeria de Artes',
    description: 'Mostra visual com produções de estudantes e convidados da comunidade.',
    created_at: '2026-05-02T12:00:00.000Z',
  },
];

export const mockAgendaEvents: CampusEvent[] = [
  {
    id: 3,
    image: null,
    name: 'Termodinâmica Avançada',
    event_datetime: '2026-04-13T10:00:00.000Z',
    event_location: 'Science Hall 302',
    description: 'Aula aberta com vagas limitadas para estudantes inscritos.',
    created_at: '2026-04-01T12:00:00.000Z',
  },
  {
    id: 4,
    image: null,
    name: 'Análise de Literatura Moderna',
    event_datetime: '2026-04-13T14:00:00.000Z',
    event_location: 'Library Rm A',
    description: 'Encontro introdutório para debate de textos contemporâneos.',
    created_at: '2026-04-01T12:00:00.000Z',
  },
];
