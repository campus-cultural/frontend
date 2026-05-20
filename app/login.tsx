import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthToken } from '@/services/auth-token';
import { login } from '@/services/campus-api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function redirectAuthenticatedUser() {
      if (await getAuthToken()) {
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
            <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="contain" />
            <Text style={styles.brand}>UTFPR Cultura</Text>
            <Text style={styles.subtitle}>Acesse sua conta para continuar.</Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>E-mail institucional</Text>
              <View style={styles.inputShell}>
                <MaterialIcons name="mail" size={18} color="#9CA3AF" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="seu.email@utfpr.edu.br"
                  placeholderTextColor="#B9BDC4"
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputShell}>
                <MaterialIcons name="lock" size={18} color="#9CA3AF" />
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#B9BDC4"
                  secureTextEntry={!isPasswordVisible}
                  style={styles.input}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  accessibilityRole="button"
                  onPress={() => setIsPasswordVisible((current) => !current)}
                  hitSlop={10}>
                  <MaterialIcons
                    name={isPasswordVisible ? 'visibility-off' : 'visibility'}
                    size={18}
                    color="#9CA3AF"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable accessibilityRole="button" style={styles.forgotButton}>
              <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            onPress={handleLogin}
            style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : null]}>
            {isLoading ? <ActivityIndicator color="#111111" /> : null}
            <Text style={styles.loginButtonText}>Entrar</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem cadastro?</Text>
            <Pressable accessibilityRole="button">
              <Text style={styles.footerAction}>Criar conta</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 42,
  },
  logo: {
    height: 82,
    width: 82,
  },
  brand: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 18,
  },
  subtitle: {
    color: '#7A7F87',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 7,
  },
  form: {
    gap: 16,
  },
  label: {
    color: '#2B2B2B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    height: 54,
    paddingHorizontal: 14,
  },
  input: {
    color: '#111111',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    height: '100%',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  forgotText: {
    color: '#7A7F87',
    fontSize: 12,
    fontWeight: '800',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 7,
    flexDirection: 'row',
    gap: 10,
    height: 56,
    justifyContent: 'center',
    marginTop: 34,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    color: '#7A7F87',
    fontSize: 13,
    fontWeight: '700',
  },
  footerAction: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },
});
