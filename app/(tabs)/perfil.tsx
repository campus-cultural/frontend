import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearAuthToken } from '@/services/auth-token';
import {
  CampusEvent,
  CurrentUser,
  getCurrentUser,
  hasAuthToken,
  listEvents,
} from '@/services/campus-api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageEvents = user?.role === 'professor' || user?.role === 'admin';

  const loadProfile = useCallback(async () => {
    if (!(await hasAuthToken())) {
      router.replace('/login' as never);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [currentUser, allEvents] = await Promise.all([getCurrentUser(), listEvents()]);
      setUser(currentUser);
      setEvents(allEvents);
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : 'Não foi possível carregar o perfil.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadProfile} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarFrame}>
            <MaterialIcons name="person" size={44} color="#6A421F" />
          </View>
          <Text style={styles.title}>Meu Perfil</Text>
          {user ? <Text style={styles.rolePill}>{roleLabel(user.role)}</Text> : null}
        </View>

        {isLoading ? (
          <View style={styles.feedbackBox}>
            <ActivityIndicator color="#111111" />
            <Text style={styles.feedbackText}>Carregando perfil...</Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <View style={styles.feedbackBox}>
            <MaterialIcons name="warning" size={22} color="#B45309" />
            <Text style={styles.feedbackText}>{error}</Text>
          </View>
        ) : null}

        {user ? (
          <>
            <View style={styles.fields}>
              <ProfileField label="Nome" value={user.name} />
              <ProfileField label="Sobrenome" value={user.last_name} />
              <ProfileField label="E-mail institucional" value={user.email} />
              <ProfileField label="Conta" value={roleLabel(user.role).toUpperCase()} />
              {user.role === 'student' ? <ProfileField label="RA" value={user.ra ?? '-'} /> : null}
            </View>

            <View style={styles.permissionsBox}>
              <MaterialIcons
                name={canManageEvents ? 'event-available' : 'visibility'}
                size={22}
                color="#111111"
              />
              <View style={styles.permissionCopy}>
                <Text style={styles.permissionTitle}>
                  {canManageEvents ? 'Permissões de professor' : 'Permissões de aluno'}
                </Text>
                <Text style={styles.permissionText}>
                  {canManageEvents
                    ? 'Você pode cadastrar e gerenciar eventos culturais.'
                    : 'Você pode visualizar eventos disponíveis para inscrição.'}
                </Text>
              </View>
            </View>

            {canManageEvents ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cadastrar evento"
                onPress={() => router.push('/novo-evento')}
                style={styles.primaryButton}>
                <MaterialIcons name="add" size={18} color="#111111" />
                <Text style={styles.primaryButtonText}>Cadastrar Evento</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              onPress={async () => {
                await clearAuthToken();
                router.replace('/login' as never);
              }}
              style={styles.signOutButton}>
              <MaterialIcons name="logout" size={15} color="#6B7280" />
              <Text style={styles.signOutText}>Sair da Conta</Text>
            </Pressable>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {canManageEvents ? 'Eventos cadastrados' : 'Eventos disponíveis'}
              </Text>

              {events.length ? (
                events.map((event) => <EventCard event={event} key={event.id} />)
              ) : (
                <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <Text numberOfLines={1} style={styles.fieldValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function EventCard({ event }: { event: CampusEvent }) {
  const eventDate = new Date(event.event_datetime);

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventAccent} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.name}</Text>
        <Text numberOfLines={2} style={styles.eventDescription}>
          {event.description}
        </Text>
        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="schedule" size={12} color="#9CA3AF" />
            <Text style={styles.metaText}>{formatEventDate(eventDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="place" size={12} color="#9CA3AF" />
            <Text style={styles.metaText}>{event.event_location}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function roleLabel(role: CurrentUser['role']) {
  const labels = {
    admin: 'Administrador',
    professor: 'Professor',
    student: 'Aluno',
  };

  return labels[role];
}

function formatEventDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(value);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 104,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarFrame: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 10,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  title: {
    color: '#2A2A2A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
  },
  rolePill: {
    backgroundColor: '#F3F3F4',
    borderRadius: 14,
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 8,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  feedbackBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    gap: 10,
    marginBottom: 18,
    padding: 18,
  },
  feedbackText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  fields: {
    gap: 16,
  },
  fieldLabel: {
    color: '#2F3137',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fieldBox: {
    alignItems: 'center',
    backgroundColor: '#F3F3F4',
    borderRadius: 2,
    flexDirection: 'row',
    height: 42,
    paddingHorizontal: 12,
  },
  fieldValue: {
    color: '#2E3138',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  permissionsBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    padding: 16,
  },
  permissionCopy: {
    flex: 1,
    gap: 3,
  },
  permissionTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
  },
  permissionText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#ECEDEF',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    justifyContent: 'center',
    marginTop: 10,
  },
  signOutText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  section: {
    gap: 12,
    marginTop: 22,
  },
  sectionTitle: {
    color: '#2B2B2B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    flexDirection: 'row',
    minHeight: 82,
    overflow: 'hidden',
  },
  eventAccent: {
    backgroundColor: '#FFCC00',
    width: 4,
  },
  eventContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventTitle: {
    color: '#2E3138',
    fontSize: 12,
    fontWeight: '900',
  },
  eventDescription: {
    color: '#5F6570',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 9,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  metaText: {
    color: '#7A7F87',
    fontSize: 9,
    fontWeight: '700',
  },
  emptyText: {
    color: '#8D929A',
    fontSize: 13,
    fontWeight: '700',
  },
});
