import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CampusEvent,
  CurrentUser,
  getCurrentUser,
  isAuthSessionError,
  listEvents,
} from '@/src/lib/api/campus';
import { mockEvents } from '@/src/lib/events/mockEvents';

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CampusEvent[]>(mockEvents);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadHome() {
        setIsLoading(true);

        try {
          const [currentUser, apiEvents] = await Promise.all([getCurrentUser(), listEvents()]);

          if (!isMounted) {
            return;
          }

          setUser(currentUser);
          setEvents(apiEvents.length ? apiEvents : mockEvents);
        } catch (homeError) {
          if (isAuthSessionError(homeError)) {
            router.replace('/login' as never);
            return;
          }

          if (isMounted) {
            setEvents(mockEvents);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      void loadHome();

      return () => {
        isMounted = false;
      };
    }, [router]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>UTFPR CULTURA</Text>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#111111" />
            <Text style={styles.loadingText}>Atualizando eventos...</Text>
          </View>
        ) : null}

        {events.map((event, index) => (
          <EventCard
            event={event}
            index={index}
            key={event.id}
            userName={user?.name ?? 'Erinaldo Pereira'}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventCard({
  event,
  index,
  userName,
}: {
  event: CampusEvent;
  index: number;
  userName: string;
}) {
  const isSubscribed = index === 1;

  return (
    <View style={styles.card}>
      <View style={styles.authorRow}>
        <View style={styles.authorAvatar}>
          <MaterialIcons name="person" size={14} color="#FFFFFF" />
        </View>
        <Text style={styles.authorName}>{userName}</Text>
      </View>

      <View style={[styles.eventVisual, index % 2 ? styles.artVisual : styles.musicVisual]}>
        {index % 2 ? (
          <>
            <View style={styles.artShapeLarge} />
            <View style={styles.artShapeMedium} />
            <View style={styles.artShapeSmall} />
          </>
        ) : (
          <>
            <View style={styles.stageLight} />
            <MaterialIcons name="mic" size={88} color="#1A1A1A" />
          </>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.meta}>
          <Text style={styles.metaDate}>{formatDayMonth(event.event_datetime)}</Text>
          {'  •  '}
          {event.event_location}
        </Text>
        <Text style={styles.eventTitle}>{event.name}</Text>
        <Text numberOfLines={2} style={styles.eventDescription}>
          {event.description}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={[styles.eventButton, isSubscribed ? styles.eventButtonSubscribed : null]}>
          <Text style={styles.eventButtonText}>{isSubscribed ? 'Inscrito' : 'Inscrever-se'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatDayMonth(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(new Date(value))
    .replace('.', '')
    .toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  content: {
    gap: 18,
    paddingBottom: 108,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: {
    color: '#1E1E1E',
    fontSize: 18,
    fontWeight: '900',
    paddingBottom: 8,
    paddingTop: 10,
    textAlign: 'center',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: 34,
    paddingHorizontal: 12,
  },
  authorAvatar: {
    alignItems: 'center',
    backgroundColor: '#2F3338',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  authorName: {
    color: '#2F3338',
    fontSize: 10,
    fontWeight: '800',
  },
  eventVisual: {
    alignItems: 'center',
    height: 230,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  musicVisual: {
    backgroundColor: '#A66605',
  },
  artVisual: {
    backgroundColor: '#0F7190',
  },
  stageLight: {
    backgroundColor: '#FFD45A',
    borderRadius: 58,
    height: 116,
    opacity: 0.85,
    position: 'absolute',
    right: 28,
    top: 24,
    width: 116,
  },
  artShapeLarge: {
    backgroundColor: '#F9CE38',
    height: 320,
    left: -76,
    position: 'absolute',
    top: -30,
    transform: [{ rotate: '-28deg' }],
    width: 116,
  },
  artShapeMedium: {
    backgroundColor: '#3CB4AE',
    height: 260,
    left: 74,
    position: 'absolute',
    top: -20,
    transform: [{ rotate: '38deg' }],
    width: 138,
  },
  artShapeSmall: {
    backgroundColor: '#203D5E',
    height: 260,
    position: 'absolute',
    right: -28,
    top: 10,
    transform: [{ rotate: '28deg' }],
    width: 130,
  },
  cardBody: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  meta: {
    color: '#686868',
    fontSize: 10,
    fontWeight: '800',
  },
  metaDate: {
    color: '#9A7A00',
    fontWeight: '900',
  },
  eventTitle: {
    color: '#202124',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 8,
  },
  eventDescription: {
    color: '#555A61',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 10,
  },
  eventButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 3,
    height: 46,
    justifyContent: 'center',
    marginTop: 16,
  },
  eventButtonSubscribed: {
    backgroundColor: '#2EA32B',
  },
  eventButtonText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
