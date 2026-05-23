import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

//Feedback 
type FeedbackModal = {
  visible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

function FeedbackModal({
  visible,
  type,
  title,
  message,
  onClose,
}: FeedbackModal & { onClose: () => void }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconBox, type === 'success' ? styles.modalIconSuccess : styles.modalIconError]}>
            <Ionicons
              name={type === 'success' ? 'checkmark' : 'close'}
              size={28}
              color="#fff"
            />
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <Pressable
            onPress={onClose}
            style={[styles.modalButton, type === 'success' ? styles.modalButtonSuccess : styles.modalButtonError]}>
            <Text style={styles.modalButtonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

//Tela de esqueceu a senha
export default function EsqueceuSenhaScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [modal, setModal] = useState<FeedbackModal>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  function validateEmail(): boolean {
    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      setEmailError('O e-mail é obrigatório.');
      return false;
    }

    if (!/^[a-z0-9._%+\-]+@(alunos\.)?utfpr\.edu\.br$/.test(normalized)) {
      setEmailError('Use seu e-mail institucional (ex: nome@alunos.utfpr.edu.br)');
      return false;
    }

    setEmailError(null);
    return true;
  }

  function handleEnviar() {
    if (!validateEmail()) return;

//Integrar com a API depois
    setModal({
      visible: true,
      type: 'success',
      title: 'E-mail enviado!',
      message: 'Se esse e-mail estiver cadastrado, você receberá as instruções em breve.',
    });
  }

  function handleModalClose() {
    setModal((m) => ({ ...m, visible: false }));
    if (modal.type === 'success') {
      router.replace('/(auth)/login' as any);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <View style={styles.container}>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login' as any))}
            style={styles.header}>
            <Ionicons name="arrow-back" size={20} color="#FFC107" />
            <Text style={styles.headerText}>Voltar</Text>
          </Pressable>

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>SEGURANÇA</Text>
          </View>

          <Text style={styles.title}>Esqueceu{'\n'}sua senha?</Text>

          <Text style={styles.description}>
            Insira o e-mail cadastrado para receber as instruções de recuperação.
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>
              E-MAIL <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
              <TextInput
                style={styles.textInput}
                placeholder="exemplo@alunos.utfpr.edu.br"
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleEnviar}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>ENVIAR</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </Pressable>

        </View>
      </KeyboardAvoidingView>

      <FeedbackModal {...modal} onClose={handleModalClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 6,
    alignSelf: 'flex-start',
  },
  headerText: {
    fontSize: 16,
    color: '#1D1D1F',
    fontWeight: '500',
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFC107',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 46,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 1,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#FFC107',
  },
  inputContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#BDBDBD',
    paddingBottom: 8,
  },
  inputError: {
    borderBottomColor: '#F04438',
  },
  textInput: {
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  errorText: {
    color: '#F04438',
    fontSize: 11,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconSuccess: {
    backgroundColor: '#22C55E',
  },
  modalIconError: {
    backgroundColor: '#F04438',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    borderRadius: 8,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSuccess: {
    backgroundColor: '#FFC107',
  },
  modalButtonError: {
    backgroundColor: '#F04438',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});