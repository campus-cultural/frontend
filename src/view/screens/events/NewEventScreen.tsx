import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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

import { createEvent } from '@/src/lib/api/campus';

const DESCRIPTION_LIMIT = 500;

type EventForm = {
  imageName: string;
  imageUri: string;
  imageMimeType: string;
  imageBase64: string;
  name: string;
  dateTime: string;
  place: string;
  description: string;
};

const initialForm: EventForm = {
  imageName: '',
  imageUri: '',
  imageMimeType: '',
  imageBase64: '',
  name: '',
  dateTime: '',
  place: '',
  description: '',
};

const requiredFields: (keyof Pick<EventForm, 'name' | 'dateTime' | 'place' | 'description'>)[] = [
  'name',
  'dateTime',
  'place',
  'description',
];

type PickerMode = 'date' | 'time';

export default function NewEventScreen() {
  const router = useRouter();
  const [form, setForm] = useState<EventForm>(initialForm);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof EventForm, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const descriptionReachedLimit = form.description.length >= DESCRIPTION_LIMIT;
  const hasDraft = useMemo(
    () => Object.values(form).some((value) => value.trim().length > 0),
    [form],
  );

  function updateField(field: keyof EventForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function openImagePicker() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para escolher o banner.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1920, 820],
      base64: true,
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    setForm((current) => ({
      ...current,
      imageName: asset.fileName ?? 'banner-evento.jpg',
      imageUri: asset.uri,
      imageMimeType: asset.mimeType ?? 'image/jpeg',
      imageBase64: asset.base64 ?? '',
    }));
  }

  function openDatePicker() {
    setPickerMode('date');
  }

  function openTimePicker() {
    setPickerMode('time');
  }

  function handleDateTimeChange(event: DateTimePickerEvent, value?: Date) {
    if (event.type === 'dismissed' || !value) {
      setPickerMode(null);
      return;
    }

    const nextDate = mergeDateTime(selectedDate ?? new Date(), value, pickerMode ?? 'date');
    setSelectedDate(nextDate);
    updateField('dateTime', formatDateTime(nextDate));

    if (Platform.OS === 'android' && pickerMode === 'date') {
      setPickerMode('time');
      return;
    }

    setPickerMode(null);
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof EventForm, string>> = {};

    requiredFields.forEach((field) => {
      if (!form[field].trim()) {
        nextErrors[field] = 'Campo obrigatório';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveEvent() {
    if (!validateForm()) {
      Alert.alert('Revise o formulário', 'Preencha todos os campos obrigatórios antes de salvar.');
      return;
    }

    setIsSaving(true);

    try {
      await createEvent({
        image: form.imageBase64 || null,
        name: form.name.trim(),
        event_datetime: selectedDate?.toISOString() ?? new Date().toISOString(),
        event_location: form.place.trim(),
        description: form.description.trim(),
      });
      Alert.alert('Evento salvo', 'O novo evento foi criado como ativo.');
      discardDraft();
    } catch (error) {
      Alert.alert(
        'Não foi possível salvar',
        error instanceof Error ? error.message : 'Verifique se a API está rodando e tente novamente.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function discardDraft() {
    setForm(initialForm);
    setSelectedDate(null);
    setPickerMode(null);
    setErrors({});
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={20} color="#FFCC00" />
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Selecionar imagem do evento"
            onPress={openImagePicker}
            style={styles.uploadCard}>
            {form.imageUri ? (
              <Image source={{ uri: form.imageUri }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialIcons name="image" size={36} color="#A6A6A6" />
                <Text style={styles.uploadTitle}>Banner do evento</Text>
                <Text style={styles.uploadHint}>Recomendado: 1920x820px</Text>
                <View style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </View>
              </View>
            )}
          </Pressable>

          {form.imageName ? <Text style={styles.imageName}>{form.imageName}</Text> : null}

          <View style={styles.form}>
            <LabeledInput
              error={errors.name}
              label="Nome do Evento"
              onChangeText={(value) => updateField('name', value)}
              placeholder="Ex: Festival de Jazz da Primavera"
              value={form.name}
            />

            <LabeledInput
              editable={false}
              error={errors.dateTime}
              label="Data e Horário"
              onPress={openDatePicker}
              onPressIcon={openDatePicker}
              onChangeText={(value) => updateField('dateTime', value)}
              placeholder="24 OUT · 19:30"
              rightIcon="calendar-today"
              value={form.dateTime}
            />

            <View style={styles.dateTimeActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar data do evento"
                onPress={openDatePicker}
                style={styles.dateTimeButton}>
                <MaterialIcons name="event" size={16} color="#111111" />
                <Text style={styles.dateTimeButtonText}>Data</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Selecionar horário do evento"
                onPress={openTimePicker}
                style={styles.dateTimeButton}>
                <MaterialIcons name="schedule" size={16} color="#111111" />
                <Text style={styles.dateTimeButtonText}>Horário</Text>
              </Pressable>
            </View>

            {pickerMode ? (
              <DateTimePicker
                display={Platform.select({ ios: 'spinner', default: 'default' })}
                mode={pickerMode}
                onChange={handleDateTimeChange}
                value={selectedDate ?? new Date()}
              />
            ) : null}

            <LabeledInput
              error={errors.place}
              label="Local"
              onChangeText={(value) => updateField('place', value)}
              placeholder="Auditório Central"
              rightIcon="place"
              value={form.place}
            />

            <View>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Descrição</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                multiline
                maxLength={DESCRIPTION_LIMIT}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Descreva os detalhes do evento, palestrantes e pré-requisitos..."
                placeholderTextColor="#B9BDC4"
                style={[styles.descriptionInput, errors.description ? styles.inputError : null]}
                textAlignVertical="top"
                value={form.description}
              />
              <View style={styles.descriptionFooter}>
                <Text style={[styles.errorText, !errors.description && styles.hiddenText]}>
                  {errors.description ?? ' '}
                </Text>
                <Text
                  style={[
                    styles.counterText,
                    descriptionReachedLimit ? styles.counterLimit : null,
                  ]}>
                  {form.description.length}/{DESCRIPTION_LIMIT}
                </Text>
              </View>
              {descriptionReachedLimit ? (
                <Text style={styles.limitWarning}>Limite máximo de caracteres atingido.</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={saveEvent}
              style={[styles.saveButton, isSaving ? styles.saveButtonDisabled : null]}>
              {isSaving ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <MaterialIcons name="event-available" size={18} color="#111111" />
              )}
              <Text style={styles.saveButtonText}>Salvar Evento</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!hasDraft || isSaving}
              onPress={discardDraft}
              style={[
                styles.discardButton,
                !hasDraft || isSaving ? styles.discardButtonDisabled : null,
              ]}>
              <Text
                style={[
                  styles.discardText,
                  !hasDraft || isSaving ? styles.discardTextDisabled : null,
                ]}>
                Descartar Rascunho
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type LabeledInputProps = {
  editable?: boolean;
  error?: string;
  label: string;
  onChangeText: (value: string) => void;
  onPress?: () => void;
  onPressIcon?: () => void;
  placeholder: string;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  value: string;
};

function LabeledInput({
  editable = true,
  error,
  label,
  onChangeText,
  onPress,
  onPressIcon,
  placeholder,
  rightIcon,
  value,
}: LabeledInputProps) {
  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <Pressable disabled={!onPress} onPress={onPress} style={[styles.inputShell, error ? styles.inputError : null]}>
        <TextInput
          editable={editable}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#C7C9CE"
          pointerEvents={editable ? 'auto' : 'none'}
          style={styles.textInput}
          value={value}
        />
        {rightIcon ? (
          <Pressable accessibilityRole="button" onPress={onPressIcon} hitSlop={10}>
            <MaterialIcons name={rightIcon} size={20} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </Pressable>
      <Text style={[styles.errorText, !error && styles.hiddenText]}>{error ?? ' '}</Text>
    </View>
  );
}

function formatDateTime(value: Date) {
  const day = String(value.getDate()).padStart(2, '0');
  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const month = months[value.getMonth()];
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');

  return `${day} ${month} · ${hours}:${minutes}`;
}

function mergeDateTime(current: Date, picked: Date, mode: PickerMode) {
  const nextDate = new Date(current);

  if (mode === 'date') {
    nextDate.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    return nextDate;
  }

  nextDate.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return nextDate;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    minHeight: 32,
    marginBottom: 12,
  },
  backText: {
    color: '#161616',
    fontSize: 14,
    fontWeight: '800',
  },
  uploadCard: {
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    borderColor: '#D6D6D6',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 168,
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 3,
  },
  uploadTitle: {
    color: '#565656',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  uploadHint: {
    color: '#A0A0A0',
    fontSize: 10,
    marginBottom: 8,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 28,
    justifyContent: 'center',
    minWidth: 108,
    paddingHorizontal: 22,
  },
  uploadButtonText: {
    color: '#2A2A2A',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  imageName: {
    color: '#7A7F87',
    fontSize: 11,
    marginBottom: 16,
  },
  form: {
    gap: 8,
    marginTop: 16,
  },
  dateTimeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -4,
    marginBottom: 8,
  },
  dateTimeButton: {
    alignItems: 'center',
    backgroundColor: '#F3F3F4',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 7,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  dateTimeButtonText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  label: {
    color: '#2B2B2B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  required: {
    color: '#F04438',
    fontSize: 11,
    fontWeight: '900',
  },
  inputShell: {
    alignItems: 'center',
    borderBottomColor: '#DADDE2',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
  },
  textInput: {
    color: '#202020',
    flex: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  descriptionInput: {
    backgroundColor: '#F3F3F4',
    borderColor: '#F3F3F4',
    borderRadius: 2,
    borderWidth: 1,
    color: '#202020',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 146,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  descriptionFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 22,
  },
  inputError: {
    borderColor: '#F04438',
    borderBottomColor: '#F04438',
  },
  errorText: {
    color: '#F04438',
    fontSize: 11,
    marginTop: 4,
  },
  hiddenText: {
    opacity: 0,
  },
  counterText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  counterLimit: {
    color: '#F04438',
    fontWeight: '700',
  },
  limitWarning: {
    color: '#F04438',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    gap: 14,
    marginTop: 46,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 7,
    flexDirection: 'row',
    gap: 12,
    height: 64,
    justifyContent: 'center',
    shadowColor: '#C68F00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  discardButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 34,
    justifyContent: 'center',
  },
  discardButtonDisabled: {
    opacity: 0.52,
  },
  discardText: {
    color: '#8D929A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  discardTextDisabled: {
    color: '#B8BCC3',
  },
});
