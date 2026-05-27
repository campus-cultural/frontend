import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.container}>
        <View style={styles.content}>

          <Text style={styles.title}>"TELA DE LOGIN" SÓ PARA TESTES</Text>

          <View style={styles.card}>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#B9B9B9"
              style={styles.input}
            />

            <TextInput
              autoCapitalize="none"
              placeholder="Senha"
              placeholderTextColor="#B9B9B9"
              secureTextEntry
              style={styles.input}
            />

            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Entrar</Text>
            </Pressable>

            <View style={styles.actions}>
              <Pressable onPress={() => router.push('/(auth)/cadastro' as any)}>
                <Text style={styles.link}>Cadastrar</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/esqueceu-senha' as any)}>
                <Text style={styles.link}>Esqueceu a senha</Text>
              </Pressable>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 1,
  },
  card: { gap: 16 },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#E3E3E3',
    fontSize: 15,
    color: '#222',
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#FFCC00',
    borderRadius: 3,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { fontSize: 11, fontWeight: '900', color: '#888', letterSpacing: 1.5, textTransform: 'uppercase' },
});