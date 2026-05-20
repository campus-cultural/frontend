import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login, registerUser, UserRole } from '@/services/campus-api';

type RegisterRole = Exclude<UserRole, 'admin'>;

type RegisterForm = {
  role: RegisterRole;
  fullName: string;
  name: string;
  lastName: string;
  email: string;
  birthDate: Date | null;
  password: string;
  confirmPassword: string;
};

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;

const initialForm: RegisterForm = {
  role: 'student',
  fullName: '',
  name: '',
  lastName: '',
  email: '',
  birthDate: null,
  password: '',
  confirmPassword: '',
};

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isStudent = form.role === 'student';
  const birthDateLabel = useMemo(
    () => (form.birthDate ? formatDisplayDate(form.birthDate) : 'mm/dd/yyyy'),
    [form.birthDate],
  );

  function updateField<Key extends keyof RegisterForm>(field: Key, value: RegisterForm[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleBirthDateChange(event: DateTimePickerEvent, value?: Date) {
    if (event.type === 'dismissed' || !value) {
      setShowBirthPicker(false);
      return;
    }

    updateField('birthDate', value);
    setShowBirthPicker(false);
  }

  function validateForm() {
    const nextErrors: RegisterErrors = {};
    const normalizedEmail = form.email.trim();
    const fullNameParts = form.fullName.trim().split(/\s+/).filter(Boolean);

    if (isStudent) {
      if (fullNameParts.length < 2) {
        nextErrors.fullName = 'Informe nome e sobrenome';
      }
    } else {
      if (!form.name.trim()) {
        nextErrors.name = 'Campo obrigatório';
      }

      if (!form.lastName.trim()) {
        nextErrors.lastName = 'Campo obrigatório';
      }
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Campo obrigatório';
    } else if (!normalizedEmail.includes('@')) {
      nextErrors.email = 'Informe um e-mail válido';
    }

    if (!form.birthDate) {
      nextErrors.birthDate = 'Campo obrigatório';
    }

    if (!form.password) {
      nextErrors.password = 'Campo obrigatório';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Campo obrigatório';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'As senhas não conferem';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function getNameParts() {
    if (!isStudent) {
      return {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
      };
    }

    const [name, ...lastNameParts] = form.fullName.trim().split(/\s+/);

    return {
      name,
      lastName: lastNameParts.join(' '),
    };
  }

  async function handleRegister() {
    if (!validateForm() || !form.birthDate) {
      Alert.alert('Revise os dados', 'Preencha todos os campos obrigatórios para cadastrar.');
      return;
    }

    const nameParts = getNameParts();
    const normalizedEmail = form.email.trim();

    setIsSaving(true);

    try {
      await registerUser({
        role: form.role,
        email: normalizedEmail,
        name: nameParts.name,
        last_name: nameParts.lastName,
        birth_date: formatApiDate(form.birthDate),
        is_active: true,
        ra: null,
        password: form.password,
      });

      await login({
        email: normalizedEmail,
        password: form.password,
      });

      Alert.alert('Cadastro criado', 'Sua conta foi criada com sucesso.');
      router.replace('/perfil');
    } catch (error) {
      Alert.alert(
        'Não foi possível cadastrar',
        error instanceof Error ? error.message : 'Verifique seus dados e tente novamente.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/login' as never))}
            style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color="#FFCC00" />
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <View style={styles.roleSelector}>
            <RoleButton
              isActive={form.role === 'student'}
              label="Aluno"
              onPress={() => {
                updateField('role', 'student');
                setErrors({});
              }}
            />
            <RoleButton
              isActive={form.role === 'professor'}
              label="Professor"
              onPress={() => {
                updateField('role', 'professor');
                setErrors({});
              }}
            />
          </View>

          <View style={styles.form}>
            {isStudent ? (
              <FormInput
                error={errors.fullName}
                icon="person-outline"
                label="Nome e Sobrenome"
                onChangeText={(value) => updateField('fullName', value)}
                placeholder="Ex: João Silva"
                value={form.fullName}
              />
            ) : (
              <>
                <FormInput
                  error={errors.name}
                  icon="person-outline"
                  label="Nome"
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="Ex: Erinaldo"
                  value={form.name}
                />
                <FormInput
                  error={errors.lastName}
                  icon="person-outline"
                  label="Sobrenome"
                  onChangeText={(value) => updateField('lastName', value)}
                  placeholder="Ex: Gomes"
                  value={form.lastName}
                />
              </>
            )}

            <FormInput
              autoCapitalize="none"
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              label={isStudent ? 'E-mail' : 'E-mail Institucional'}
              onChangeText={(value) => updateField('email', value)}
              placeholder={isStudent ? 'nome@utfpr.edu.br' : 'nome@utfpr.edu.br'}
              value={form.email}
            />

            <View>
              <Text style={styles.label}>Data de Nascimento *</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar data de nascimento"
                onPress={() => setShowBirthPicker(true)}
                style={[styles.inputCard, errors.birthDate ? styles.inputError : null]}>
                <MaterialIcons name="calendar-today" size={20} color="#7C8794" />
                <Text style={[styles.dateText, form.birthDate ? styles.dateTextFilled : null]}>
                  {birthDateLabel}
                </Text>
              </Pressable>
              <Text style={[styles.errorText, !errors.birthDate && styles.hiddenText]}>
                {errors.birthDate ?? ' '}
              </Text>
            </View>

            {showBirthPicker ? (
              <DateTimePicker
                display={Platform.select({ ios: 'spinner', default: 'default' })}
                maximumDate={new Date()}
                mode="date"
                onChange={handleBirthDateChange}
                value={form.birthDate ?? new Date(2000, 0, 1)}
              />
            ) : null}

            <FormInput
              error={errors.password}
              icon="lock-outline"
              label="Senha"
              onChangeText={(value) => updateField('password', value)}
              placeholder="••••••••"
              secureTextEntry
              value={form.password}
            />

            <FormInput
              error={errors.confirmPassword}
              icon="shield"
              label="Confirmar Senha"
              onChangeText={(value) => updateField('confirmPassword', value)}
              placeholder="••••••••"
              secureTextEntry
              value={form.confirmPassword}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={handleRegister}
            style={[styles.submitButton, isSaving ? styles.submitButtonDisabled : null]}>
            {isSaving ? <ActivityIndicator color="#111111" /> : null}
            <Text style={styles.submitButtonText}>Cadastrar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type RoleButtonProps = {
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function RoleButton({ isActive, label, onPress }: RoleButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.roleButton, isActive ? styles.roleButtonActive : null]}>
      <Text style={[styles.roleButtonText, isActive ? styles.roleButtonTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

type FormInputProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: 'default' | 'email-address';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
};

function FormInput({
  autoCapitalize,
  error,
  icon,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  secureTextEntry,
  value,
}: FormInputProps) {
  return (
    <View>
      <Text style={styles.label}>{label} *</Text>
      <View style={[styles.inputCard, error ? styles.inputError : null]}>
        <MaterialIcons name={icon} size={20} color="#7C8794" />
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#7C8794"
          secureTextEntry={secureTextEntry}
          style={styles.input}
          value={value}
        />
      </View>
      <Text style={[styles.errorText, !error && styles.hiddenText]}>{error ?? ' '}</Text>
    </View>
  );
}

function formatDisplayDate(value: Date) {
  return new Intl.DateTimeFormat('pt-BR').format(value);
}

function formatApiDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 18,
    minHeight: 38,
  },
  backText: {
    color: '#1D1D1F',
    fontSize: 17,
    fontWeight: '900',
  },
  roleSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    flexDirection: 'row',
    gap: 8,
    marginTop: 44,
    padding: 6,
  },
  roleButton: {
    alignItems: 'center',
    borderRadius: 5,
    flex: 1,
    height: 42,
    justifyContent: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#FFCC00',
  },
  roleButtonText: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  roleButtonTextActive: {
    color: '#111111',
  },
  form: {
    gap: 3,
    marginTop: 34,
  },
  label: {
    color: '#1F1F1F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    minHeight: 56,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.03,
    shadowRadius: 18,
    elevation: 1,
  },
  inputError: {
    borderColor: '#F04438',
  },
  input: {
    color: '#1F2937',
    flex: 1,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 0,
  },
  dateText: {
    color: '#7C8794',
    flex: 1,
    fontSize: 15,
  },
  dateTextFilled: {
    color: '#1F2937',
  },
  errorText: {
    color: '#F04438',
    fontSize: 11,
    minHeight: 18,
    paddingTop: 4,
  },
  hiddenText: {
    opacity: 0,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 3,
    flexDirection: 'row',
    gap: 10,
    height: 60,
    justifyContent: 'center',
    marginTop: 28,
    shadowColor: '#C68F00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.72,
  },
  submitButtonText: {
    color: '#3F3300',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
