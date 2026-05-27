import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CustomInputProps extends TextInputProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  error?: string;
  inputRef?: React.RefObject<TextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done' | 'default';
}

type CadastroForm = {
  nome: string;
  sobrenome: string;
  email: string;
  dataNascimento: string;
  senha: string;
  confirmarSenha: string;
};

type CadastroErrors = Partial<Record<keyof CadastroForm, string>>;

type FeedbackModal = {
  visible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

function CustomInput({
  label,
  iconName,
  required,
  error,
  inputRef,
  ...rest
}: CustomInputProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredAsterisk}>*</Text>}
      </Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <Ionicons name={iconName} size={20} color={error ? '#F04438' : '#9E9E9E'} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholderTextColor="#9E9E9E"
          {...rest}
        />
      </View>
      <Text style={[styles.errorText, !error && styles.errorHidden]}>
        {error ?? ' '}
      </Text>
    </View>
  );
}

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
          <Pressable onPress={onClose} style={[styles.modalButton, type === 'success' ? styles.modalButtonSuccess : styles.modalButtonError]}>
            <Text style={styles.modalButtonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

//Validações
function sanitizeDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  let day = digits.slice(0, 2);
  let month = digits.slice(2, 4);
  let year = digits.slice(4, 8);

  // primeiro digito max 3, valor máximo até 31
  if (day.length === 1 && parseInt(day) > 3) day = '3';
  if (day.length === 2 && parseInt(day) > 31) day = '31';
  if (day.length === 2 && parseInt(day) === 0) day = '01';

  // primeiro digito max 1, valor máximo até 12
  if (month.length === 1 && parseInt(month) > 1) month = '1';
  if (month.length === 2 && parseInt(month) > 12) month = '12';
  if (month.length === 2 && parseInt(month) === 0) month = '01';

  const parts = [day, month, year].filter(Boolean);
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

function isValidDate(value: string): boolean {
  const parts = value.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isAdult(value: string): boolean {
  const parts = value.split('/');
  const date = new Date(
    parseInt(parts[2], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[0], 10),
  );
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) return age - 1 >= 18;
  return age >= 18;
}

function hasOnlyLetters(value: string): boolean {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(value.trim());
}

function isStrongPassword(value: string): string | null {
  if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
  if (!/[0-9]/.test(value)) return 'A senha deve conter pelo menos um número';
  if (!/[^A-Za-z0-9]/.test(value)) return 'A senha deve conter pelo menos um caractere especial';
  return null;
}

const initialForm: CadastroForm = {
  nome: '',
  sobrenome: '',
  email: '',
  dataNascimento: '',
  senha: '',
  confirmarSenha: '',
};

//Tela de cadastro 
export default function CadastroScreen() {
  const router = useRouter();
  const [form, setForm] = useState<CadastroForm>(initialForm);
  const [errors, setErrors] = useState<CadastroErrors>({});
  const [modal, setModal] = useState<FeedbackModal>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Refs para focar o próximo campo ao pressionar "next"
  const sobrenomeRef = useRef<TextInput | null>(null);
  const emailRef = useRef<TextInput | null>(null);
  const dataNascimentoRef = useRef<TextInput | null>(null);
  const senhaRef = useRef<TextInput | null>(null);
  const confirmarSenhaRef = useRef<TextInput | null>(null);

  function updateField(field: keyof CadastroForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleDateChange(value: string) {
    updateField('dataNascimento', sanitizeDateInput(value));
  }

  function validateForm(): boolean {
    const nextErrors: CadastroErrors = {};

    if (!form.nome.trim()) {
      nextErrors.nome = 'Campo obrigatório';
    } else if (!hasOnlyLetters(form.nome)) {
      nextErrors.nome = 'O nome deve conter apenas letras';
    }

    if (!form.sobrenome.trim()) {
      nextErrors.sobrenome = 'Campo obrigatório';
    } else if (!hasOnlyLetters(form.sobrenome)) {
      nextErrors.sobrenome = 'O sobrenome deve conter apenas letras';
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail) {
      nextErrors.email = 'Campo obrigatório';
    } else if (!/^[a-z0-9._%+\-]+@(alunos\.)?utfpr\.edu\.br$/.test(normalizedEmail)) {
      nextErrors.email = 'Use seu e-mail institucional (@utfpr.edu.br ou @alunos.utfpr.edu.br)';
    }

    if (!form.dataNascimento.trim()) {
      nextErrors.dataNascimento = 'Campo obrigatório';
    } else if (form.dataNascimento.length < 10) {
      nextErrors.dataNascimento = 'Informe a data completa (dd/mm/aaaa)';
    } else if (!isValidDate(form.dataNascimento)) {
      nextErrors.dataNascimento = 'Data inválida';
    } else if (!isAdult(form.dataNascimento)) {
      nextErrors.dataNascimento = 'É necessário ter pelo menos 18 anos';
    }

    if (!form.senha) {
      nextErrors.senha = 'Campo obrigatório';
    } else {
      const senhaError = isStrongPassword(form.senha);
      if (senhaError) nextErrors.senha = senhaError;
    }

    if (!form.confirmarSenha) {
      nextErrors.confirmarSenha = 'Campo obrigatório';
    } else if (form.senha !== form.confirmarSenha) {
      nextErrors.confirmarSenha = 'As senhas não conferem';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleCadastro() {
    if (!validateForm()) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Dados inválidos',
        message: 'Corrija os campos destacados em vermelho antes de continuar.',
      });
      return;
    }

// Integar API
    setModal({
      visible: true,
      type: 'success',
      title: 'Cadastro realizado!',
      message: 'Sua conta foi criada com sucesso.',
    });
  }

  function handleModalClose() {
    setModal((m) => ({ ...m, visible: false }));
    if (modal.type === 'success') {
      setForm(initialForm);
      setErrors({});
      router.replace('/(auth)/login' as any);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', default: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 24 })}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login' as any))}
            style={styles.header}>
            <Ionicons name="arrow-back" size={24} color="#FFC107" />
            <Text style={styles.headerText}>Voltar</Text>
          </Pressable>

          <View style={styles.formContainer}>
            <CustomInput
              label="NOME"
              iconName="person-outline"
              placeholder="Ex: Erinaldo"
              required
              value={form.nome}
              onChangeText={(value) => updateField('nome', value)}
              error={errors.nome}
              returnKeyType="next"
              onSubmitEditing={() => sobrenomeRef.current?.focus()}
            />

            <CustomInput
              label="SOBRENOME"
              iconName="person-outline"
              placeholder="Ex: Gomes"
              required
              value={form.sobrenome}
              onChangeText={(value) => updateField('sobrenome', value)}
              error={errors.sobrenome}
              inputRef={sobrenomeRef}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <CustomInput
              label="E-MAIL INSTITUCIONAL"
              iconName="mail-outline"
              placeholder="nome@alunos.utfpr.edu.br"
              required
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              inputRef={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => dataNascimentoRef.current?.focus()}
            />

            <CustomInput
              label="DATA DE NASCIMENTO"
              iconName="calendar-outline"
              placeholder="dd/mm/aaaa"
              required
              value={form.dataNascimento}
              onChangeText={handleDateChange}
              error={errors.dataNascimento}
              keyboardType="numeric"
              maxLength={10}
              inputRef={dataNascimentoRef}
              returnKeyType="next"
              onSubmitEditing={() => senhaRef.current?.focus()}
            />

            <CustomInput
              label="SENHA"
              iconName="lock-closed-outline"
              placeholder="Mín. 8 caracteres, número e símbolo"
              required
              secureTextEntry
              value={form.senha}
              onChangeText={(value) => updateField('senha', value)}
              error={errors.senha}
              inputRef={senhaRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
            />

            <CustomInput
              label="CONFIRMAR SENHA"
              iconName="shield-checkmark-outline"
              placeholder="••••••••"
              secureTextEntry
              value={form.confirmarSenha}
              onChangeText={(value) => updateField('confirmarSenha', value)}
              error={errors.confirmarSenha}
              inputRef={confirmarSenhaRef}
              returnKeyType="done"
              onSubmitEditing={handleCadastro}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleCadastro}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>CADASTRAR</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      <FeedbackModal {...modal} onClose={handleModalClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
scrollContainer: {
  padding: 24,
  paddingTop: 12,
  paddingBottom: 48,
  flexGrow: 1,
},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 0, 
    gap: 6,
    alignSelf: 'flex-start',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  formContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  requiredAsterisk: {
    color: 'red',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    height: 55,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: '#F04438',
    backgroundColor: '#FFF8F8',
  },
  icon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  errorText: {
    color: '#F04438',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 2,
  },
  errorHidden: {
    opacity: 0,
  },
  primaryButton: {
    backgroundColor: '#FFC107',
    borderRadius: 8,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
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