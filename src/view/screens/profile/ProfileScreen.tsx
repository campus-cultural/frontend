import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CurrentUser,
  getCurrentUser,
  hasAuthToken,
  isAuthSessionError,
} from '@/src/lib/api/campus';
import { clearAuthToken } from '@/src/lib/auth/token';
import { getProfileAvatarUri, saveProfileAvatarUri } from '@/src/lib/profile/avatar';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [savedProfileImageUri, setSavedProfileImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageEvents = user?.role === 'professor' || user?.role === 'admin';
  const hasUnsavedProfileImage = profileImageUri !== savedProfileImageUri;

  const loadProfile = useCallback(async () => {
    if (!(await hasAuthToken())) {
      await clearAuthToken();
      router.replace('/login' as never);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await getCurrentUser();
      const savedAvatarUri = await getProfileAvatarUri(currentUser.id);
      setUser(currentUser);
      setProfileImageUri(savedAvatarUri);
      setSavedProfileImageUri(savedAvatarUri);
    } catch (profileError) {
      if (isAuthSessionError(profileError)) {
        await clearAuthToken();
        router.replace('/login' as never);
        return;
      }

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

  async function handleSignOut() {
    await clearAuthToken();
    router.replace('/login' as never);
  }

  async function handleUpdateProfile() {
    if (user && profileImageUri) {
      await saveProfileAvatarUri(user.id, profileImageUri);
      setSavedProfileImageUri(profileImageUri);
    }

    Alert.alert('Perfil salvo', 'A imagem e os dados do perfil foram atualizados neste dispositivo.');
  }

  async function handleChangeProfileImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para escolher a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadProfile} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            onPress={handleChangeProfileImage}
            style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  contentFit="cover"
                  style={styles.profileImage}
                />
              ) : (
                <MaterialIcons name="person" size={76} color="#3A281D" />
              )}
            </View>
            <View style={styles.editBadge}>
              <MaterialIcons name="edit" size={16} color="#111111" />
            </View>
          </Pressable>
          <Text style={styles.title}>Meu Perfil</Text>
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
          <View style={styles.profileBody}>
            <ProfileField editable label="Nome" value={user.name} />
            <ProfileField editable label="Sobrenome" value={user.last_name} />
            <ProfileField label="E-mail institucional" value={user.email} />
            <ProfileField label="Conta" value={roleLabel(user.role).toUpperCase()} />
            {user.role === 'student' && user.ra ? (
              <ProfileField label="RA" value={user.ra} />
            ) : null}

            {canManageEvents ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cadastrar novo evento"
                onPress={() => router.push('/novo-evento')}
                style={styles.primaryButton}>
                <MaterialIcons name="add-box" size={15} color="#111111" />
                <Text style={styles.primaryButtonText}>Cadastrar evento</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Atualizar dados"
                onPress={handleUpdateProfile}
                style={styles.primaryButton}>
                <MaterialIcons name="save" size={15} color="#111111" />
                <Text style={styles.primaryButtonText}>Atualizar dados</Text>
              </Pressable>
            )}

            {canManageEvents && hasUnsavedProfileImage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Salvar foto de perfil"
                onPress={handleUpdateProfile}
                style={styles.secondaryButton}>
                <MaterialIcons name="save" size={15} color="#4C535C" />
                <Text style={styles.secondaryButtonText}>Salvar foto</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              onPress={handleSignOut}
              style={styles.signOutButton}>
              <MaterialIcons name="logout" size={15} color="#676C74" />
              <Text style={styles.signOutText}>Sair da conta</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileField({
  editable,
  label,
  value,
}: {
  editable?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <Text numberOfLines={1} style={styles.fieldValue}>
          {value}
        </Text>
        {editable ? <MaterialIcons name="edit" size={14} color="#8A8D94" /> : null}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F9',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 102,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 2,
  },
  avatarOuter: {
    alignItems: 'center',
    borderColor: '#FFCC00',
    borderRadius: 18,
    borderWidth: 3,
    height: 122,
    justifyContent: 'center',
    width: 122,
  },
  avatarInner: {
    alignItems: 'center',
    backgroundColor: '#C59A70',
    borderColor: '#222222',
    borderRadius: 14,
    borderWidth: 2,
    height: 106,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 106,
  },
  profileImage: {
    height: '100%',
    width: '100%',
  },
  editBadge: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 15,
    bottom: 8,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    width: 30,
  },
  title: {
    color: '#242424',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 14,
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
  profileBody: {
    gap: 17,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    color: '#303239',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  fieldBox: {
    alignItems: 'center',
    backgroundColor: '#F0F0F1',
    borderBottomColor: '#D7D7D9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 12,
  },
  fieldValue: {
    color: '#20242A',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 5,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#E5E5E6',
    borderRadius: 5,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#4C535C',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#E5E5E6',
    borderRadius: 5,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    justifyContent: 'center',
  },
  signOutText: {
    color: '#676C74',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
