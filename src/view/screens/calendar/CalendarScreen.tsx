import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CampusEvent } from '@/src/lib/api/campus';
import { mockAgendaEvents } from '@/src/lib/events/mockEvents';

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const monthDays = Array.from({ length: 28 }, (_, index) => index + 1);

export default function CalendarScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Agenda</Text>
          <MaterialIcons name="search" size={20} color="#111111" />
        </View>

        <View style={styles.monthRow}>
          <Text style={styles.monthTitle}>Abril 2026</Text>
          <View style={styles.monthActions}>
            <MaterialIcons name="chevron-left" size={18} color="#69707A" />
            <MaterialIcons name="chevron-right" size={18} color="#69707A" />
          </View>
        </View>

        <View style={styles.filters}>
          <View style={[styles.filterPill, styles.filterPillActive]}>
            <Text style={[styles.filterText, styles.filterTextActive]}>Todos</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterText}>Inscritos</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {monthDays.map((day) => {
              const isSelected = day === 13;
              const hasEvent = [9, 13, 20].includes(day);

              return (
                <View key={day} style={styles.dayCell}>
                  <View style={[styles.dayCircle, isSelected ? styles.dayCircleActive : null]}>
                    <Text style={[styles.dayText, isSelected ? styles.dayTextActive : null]}>
                      {day}
                    </Text>
                  </View>
                  {hasEvent && !isSelected ? <View style={styles.eventDot} /> : null}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.dayTitle}>13 de Abril de 2026</Text>

        <View style={styles.eventList}>
          {mockAgendaEvents.map((event, index) => (
            <AgendaCard event={event} isSubscribed={index === 0} key={event.id} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AgendaCard({ event, isSubscribed }: { event: CampusEvent; isSubscribed: boolean }) {
  return (
    <View style={styles.agendaCard}>
      <View style={styles.agendaAccent} />
      <View style={styles.agendaContent}>
        <View style={styles.agendaTop}>
          <Text style={styles.agendaTitle}>{event.name}</Text>
          <View style={[styles.statusPill, !isSubscribed ? styles.statusPillLight : null]}>
            <Text style={styles.statusText}>{isSubscribed ? 'Inscrito' : 'Inscrever-se'}</Text>
          </View>
        </View>
        <View style={styles.agendaMeta}>
          <MaterialIcons name="schedule" size={12} color="#6F7782" />
          <Text style={styles.agendaMetaText}>{formatTimeRange(event.event_datetime)}</Text>
          <MaterialIcons name="place" size={12} color="#6F7782" />
          <Text style={styles.agendaMetaText}>{event.event_location}</Text>
        </View>
      </View>
    </View>
  );
}

function formatTimeRange(value: string) {
  const date = new Date(value);
  const endDate = new Date(date.getTime() + 90 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  return `${formatter.format(date)} - ${formatter.format(endDate)}`;
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
  statusPill: {
    backgroundColor: '#FFCC00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusPillLight: {
    backgroundColor: '#ECEEF1',
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
