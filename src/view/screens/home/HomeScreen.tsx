import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import * as Animatable from 'react-native-animatable';
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
  isAuthSessionError,
  listEvents,
} from '@/src/lib/api/campus';
import { getEventImageUri } from '@/src/lib/events/eventImage';

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadHome() {
        setIsLoading(true);

        try {
          const apiEvents = await listEvents();

          if (!isMounted) {
            return;
          }

          setEvents(apiEvents);
        } catch (homeError) {
          if (isAuthSessionError(homeError)) {
            router.replace('/login' as never);
            return;
          }

          if (isMounted) {
            setEvents([]);
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
        <Animatable.Text
          animation="fadeInDown"
          duration={420}
          style={styles.headerTitle}
          useNativeDriver>
          UTFPR CULTURA
        </Animatable.Text>

        {isLoading ? (
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={styles.loadingRow}
            useNativeDriver>
            <ActivityIndicator color="#111111" />
            <Text style={styles.loadingText}>Atualizando eventos...</Text>
          </Animatable.View>
        ) : null}

        {events.map((event, index) => (
          <EventCard event={event} index={index} key={event.id} />
        ))}

        {!isLoading && events.length === 0 ? (
          <Animatable.Text
            animation="fadeIn"
            duration={360}
            style={styles.emptyText}
            useNativeDriver>
            Nenhum evento disponível no momento.
          </Animatable.Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventCard({
  event,
  index,
}: {
  event: CampusEvent;
  index: number;
}) {
  const isSubscribed = index === 1;
  const imageUri = getEventImageUri(event.image);

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 90}
      duration={420}
      style={styles.card}
      useNativeDriver>
      <View style={[styles.eventVisual, index % 2 ? styles.artVisual : styles.musicVisual]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} contentFit="cover" style={styles.eventImage} />
        ) : index % 2 ? (
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
        <Animatable.View animation="fadeIn" delay={index * 90 + 180} useNativeDriver>
          <Pressable
            accessibilityRole="button"
            style={[styles.eventButton, isSubscribed ? styles.eventButtonSubscribed : null]}>
            <Text style={styles.eventButtonText}>{isSubscribed ? 'Inscrito' : 'Inscrever-se'}</Text>
          </Pressable>
        </Animatable.View>
      </View>
    </Animatable.View>
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
  emptyText: {
    color: '#7A7F87',
    fontSize: 13,
    fontWeight: '800',
    paddingTop: 32,
    textAlign: 'center',
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
    height: 250,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eventImage: {
    height: '100%',
    width: '100%',
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
