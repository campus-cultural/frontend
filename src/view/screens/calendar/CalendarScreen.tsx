import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import * as Animatable from 'react-native-animatable';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CampusEvent,
  isAuthSessionError,
  listEvents,
  listSubscribedEvents,
} from '@/src/lib/api/campus';
import { formatCampusTimeRange, getCampusDateKey } from '@/src/lib/datetime/campusTime';

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type EventFilter = 'all' | 'subscribed';

export default function CalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthDays = useMemo(() => getCalendarDays(monthDate), [monthDate]);
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const selectedDayEvents = useMemo(
    () => (selectedDate ? eventsByDay.get(getDateKey(selectedDate)) ?? [] : []),
    [eventsByDay, selectedDate],
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadEvents() {
        setIsLoading(true);
        setError(null);

        try {
          const apiEvents =
            filter === 'subscribed' ? await listSubscribedEvents() : await listEvents();
          const sortedEvents = [...apiEvents].sort(
            (left, right) =>
              new Date(left.event_datetime).getTime() - new Date(right.event_datetime).getTime(),
          );
          const initialEvent = sortedEvents.find((event) => !isEventInPast(event));
          const initialDate = initialEvent ? new Date(initialEvent.event_datetime) : new Date();

          if (!isMounted) {
            return;
          }

          setEvents(sortedEvents);
          setMonthDate(startOfMonth(initialDate));
          setSelectedDate(initialDate);
        } catch (calendarError) {
          if (isAuthSessionError(calendarError)) {
            router.replace('/login' as never);
            return;
          }

          if (isMounted) {
            setEvents([]);
            setError(
              calendarError instanceof Error
                ? calendarError.message
                : 'Não foi possível carregar a agenda.',
            );
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      void loadEvents();

      return () => {
        isMounted = false;
      };
    }, [filter, router]),
  );

  function goToPreviousMonth() {
    setMonthDate((current) => startOfMonth(new Date(current.getFullYear(), current.getMonth() - 1, 1)));
    setSelectedDate(null);
  }

  function goToNextMonth() {
    setMonthDate((current) => startOfMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1)));
    setSelectedDate(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animatable.View
          animation="fadeInDown"
          duration={360}
          style={styles.header}
          useNativeDriver>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Agenda</Text>
          <MaterialIcons name="search" size={20} color="#111111" />
        </Animatable.View>

        <Animatable.View
          animation="fadeInLeft"
          delay={80}
          duration={360}
          style={styles.monthRow}
          useNativeDriver>
          <Text style={styles.monthTitle}>{formatMonthTitle(monthDate)}</Text>
          <View style={styles.monthActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mês anterior"
              hitSlop={10}
              onPress={goToPreviousMonth}>
              <MaterialIcons name="chevron-left" size={18} color="#69707A" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Próximo mês"
              hitSlop={10}
              onPress={goToNextMonth}>
              <MaterialIcons name="chevron-right" size={18} color="#69707A" />
            </Pressable>
          </View>
        </Animatable.View>

        <Animatable.View
          animation="fadeIn"
          delay={140}
          duration={360}
          style={styles.filters}
          useNativeDriver>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: filter === 'all' }}
            onPress={() => setFilter('all')}
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: filter === 'subscribed' }}
            onPress={() => setFilter('subscribed')}
            style={[styles.filterPill, filter === 'subscribed' && styles.filterPillActive]}>
            <Text style={[styles.filterText, filter === 'subscribed' && styles.filterTextActive]}>
              Inscritos
            </Text>
          </Pressable>
        </Animatable.View>

        {isLoading ? (
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={styles.loadingRow}
            useNativeDriver>
            <ActivityIndicator color="#111111" />
            <Text style={styles.loadingText}>Atualizando agenda...</Text>
          </Animatable.View>
        ) : null}

        {error ? (
          <Animatable.Text animation="fadeIn" duration={320} style={styles.errorText} useNativeDriver>
            {error}
          </Animatable.Text>
        ) : null}

        <Animatable.View
          animation="fadeInUp"
          delay={180}
          duration={420}
          style={styles.calendarCard}
          useNativeDriver>
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {monthDays.map((day, index) => {
              if (!day) {
                return <View key={`blank-${index}`} style={styles.dayCell} />;
              }

              const dayDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
              const dateKey = getDateKey(dayDate);
              const isSelected = selectedDate ? getDateKey(selectedDate) === dateKey : false;
              const hasEvent = eventsByDay.has(dateKey);

              return (
                <View key={day} style={styles.dayCell}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar dia ${day}`}
                    onPress={() => setSelectedDate(dayDate)}
                    style={[styles.dayCircle, isSelected ? styles.dayCircleActive : null]}>
                    <Text style={[styles.dayText, isSelected ? styles.dayTextActive : null]}>
                      {day}
                    </Text>
                  </Pressable>
                  {hasEvent && !isSelected ? <View style={styles.eventDot} /> : null}
                </View>
              );
            })}
          </View>
        </Animatable.View>

        <Animatable.Text
          animation="fadeIn"
          delay={260}
          duration={360}
          style={styles.dayTitle}
          useNativeDriver>
          {selectedDate ? formatSelectedDayTitle(selectedDate) : 'Selecione um dia'}
        </Animatable.Text>

        <View style={styles.eventList}>
          {selectedDayEvents.map((event, index) => (
            <AgendaCard event={event} index={index} key={event.id} />
          ))}

          {!isLoading && selectedDate && selectedDayEvents.length === 0 ? (
            <Animatable.Text
              animation="fadeIn"
              duration={320}
              style={styles.emptyText}
              useNativeDriver>
              Nenhum evento para este dia.
            </Animatable.Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AgendaCard({
  event,
  index,
}: {
  event: CampusEvent;
  index: number;
}) {
  return (
    <Animatable.View
      animation="fadeInUp"
      delay={320 + index * 90}
      duration={420}
      style={styles.agendaCard}
      useNativeDriver>
      <View style={styles.agendaAccent} />
      <View style={styles.agendaContent}>
        <View style={styles.agendaTop}>
          <Text style={styles.agendaTitle}>{event.name}</Text>
          <View style={styles.statusPillLight}>
            <Text style={styles.statusText}>Inscrever-se</Text>
          </View>
        </View>
        <View style={styles.agendaMeta}>
          <MaterialIcons name="schedule" size={12} color="#6F7782" />
          <Text style={styles.agendaMetaText}>{formatTimeRange(event.event_datetime)}</Text>
          <MaterialIcons name="place" size={12} color="#6F7782" />
          <Text style={styles.agendaMetaText}>{event.event_location}</Text>
        </View>
      </View>
    </Animatable.View>
  );
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  return [
    ...Array.from<null>({ length: leadingBlanks }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

function groupEventsByDay(events: CampusEvent[]) {
  return events.reduce((groupedEvents, event) => {
    const dateKey = getCampusDateKey(event.event_datetime);
    const currentEvents = groupedEvents.get(dateKey) ?? [];
    groupedEvents.set(dateKey, [...currentEvents, event]);
    return groupedEvents;
  }, new Map<string, CampusEvent[]>());
}

function getDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

function formatMonthTitle(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
    .format(value)
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatSelectedDayTitle(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(value)
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatTimeRange(value: string) {
  return formatCampusTimeRange(value);
}

function isEventInPast(event: CampusEvent) {
  return new Date(event.event_datetime).getTime() < Date.now();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  content: {
    paddingBottom: 112,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  headerSpacer: {
    width: 20,
  },
  headerTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },
  monthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  monthTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
  },
  monthActions: {
    flexDirection: 'row',
    gap: 10,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  filterPillActive: {
    backgroundColor: '#FFCC00',
  },
  filterText: {
    color: '#5D6470',
    fontSize: 10,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#111111',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    color: '#20242A',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
    width: 32,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    rowGap: 10,
  },
  dayCell: {
    alignItems: 'center',
    height: 32,
    width: `${100 / 7}%`,
  },
  dayCircle: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  dayCircleActive: {
    backgroundColor: '#FFCC00',
  },
  dayText: {
    color: '#2F3338',
    fontSize: 10,
    fontWeight: '700',
  },
  dayTextActive: {
    color: '#111111',
    fontWeight: '900',
  },
  eventDot: {
    backgroundColor: '#1684A5',
    borderRadius: 2,
    height: 3,
    marginTop: -2,
    width: 3,
  },
  dayTitle: {
    color: '#2A2E35',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 26,
  },
  eventList: {
    gap: 12,
    marginTop: 12,
  },
  emptyText: {
    color: '#7A7F87',
    fontSize: 12,
    fontWeight: '800',
    paddingTop: 12,
    textAlign: 'center',
  },
  agendaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    minHeight: 84,
    overflow: 'hidden',
  },
  agendaAccent: {
    backgroundColor: '#FFCC00',
    width: 4,
  },
  agendaContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  agendaTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  agendaTitle: {
    color: '#2F3338',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  statusPillLight: {
    backgroundColor: '#ECEEF1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusText: {
    color: '#333333',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  agendaMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 12,
  },
  agendaMetaText: {
    color: '#5F6670',
    fontSize: 10,
    fontWeight: '700',
  },
});
