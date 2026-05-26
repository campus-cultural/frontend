import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hasAuthToken, login } from '@/src/lib/api/campus';

const logoUtf = require('@/assets/logoUTF.png');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function redirectAuthenticatedUser() {
      if (await hasAuthToken()) {
        router.replace('/perfil');
      }
    }

    void redirectAuthenticatedUser();
  }, [router]);

  async function handleLogin() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      Alert.alert('Revise os dados', 'Informe e-mail e senha para entrar.');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: normalizedEmail, password });
      router.replace('/perfil');
    } catch (error) {
      Alert.alert(
        'Não foi possível entrar',
        error instanceof Error ? error.message : 'Verifique seus dados e tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoBlock}>
            <Image source={logoUtf} resizeMode="contain" style={styles.logoImage} />
            <Text style={styles.brand}>UTFPR CULTURAL</Text>
            <Text style={styles.subtitle}>ACESSO INSTITUCIONAL</Text>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.label}>Email *</Text>
              <View style={styles.inputLine}>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Insira seu email institucional"
                  placeholderTextColor="#B9B9B9"
                  style={styles.input}
                  value={email}
                />
                <MaterialIcons name="alternate-email" size={24} color="#C8C8C8" />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.inputLine}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Insira sua senha"
                  placeholderTextColor="#B9B9B9"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
                <MaterialIcons name="lock-outline" size={24} color="#C8C8C8" />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={handleLogin}
              style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : null]}>
              {isLoading ? <ActivityIndicator color="#111111" /> : null}
              <Text style={styles.loginButtonText}>Entrar</Text>
            </Pressable>

            <View style={styles.cardActions}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/cadastro' as never)}>
                <Text style={styles.cardActionText}>Cadastrar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/esqueceu-senha' as never)}>
                <Text style={styles.cardActionText}>Esqueceu a senha</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 34,
  },
  logoImage: {
    height: 96,
    width: 260,
  },
  brand: {
    color: '#202020',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 28,
  },
  subtitle: {
    color: '#4F4F4F',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 28,
    paddingHorizontal: 30,
    paddingVertical: 32,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 18,
    elevation: 2,
  },
  label: {
    color: '#222222',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  inputLine: {
    alignItems: 'center',
    borderBottomColor: '#E3E3E3',
    borderBottomWidth: 2,
    flexDirection: 'row',
    height: 42,
  },
  input: {
    color: '#222222',
    flex: 1,
    fontSize: 15,
    height: '100%',
    paddingHorizontal: 0,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 3,
    flexDirection: 'row',
    gap: 10,
    height: 58,
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardActionText: {
    color: '#4F4A45',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
