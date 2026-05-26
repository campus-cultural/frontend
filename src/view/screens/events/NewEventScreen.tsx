import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DatePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createEvent, getEvent, isAuthSessionError, updateEvent } from '@/src/lib/api/campus';
import { clearAuthToken } from '@/src/lib/auth/token';
import { getEventImageBase64, getEventImageUri } from '@/src/lib/events/eventImage';

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

type Feedback = {
  message: string;
  onClose?: () => void;
  title: string;
  type: 'error' | 'success' | 'warning';
};

export default function NewEventScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const datePickerStyles = useDefaultStyles();
  const editingEventId = eventId ? Number(eventId) : null;
  const [form, setForm] = useState<EventForm>(initialForm);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [draftDate, setDraftDate] = useState<Date>(new Date());
  const [isDatePopoverVisible, setIsDatePopoverVisible] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof EventForm, string>>>({});
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Number.isFinite(editingEventId);
  const descriptionReachedLimit = form.description.length >= DESCRIPTION_LIMIT;
  const hasDraft = useMemo(
    () => Object.values(form).some((value) => value.trim().length > 0),
    [form],
  );

  useEffect(() => {
    async function loadEventForEditing() {
      if (!isEditing || editingEventId === null) {
        discardDraft();
        return;
      }

      setIsLoadingEvent(true);

      try {
        const event = await getEvent(editingEventId);
        const nextDate = new Date(event.event_datetime);

        setSelectedDate(nextDate);
        setForm({
          imageName: event.image ? 'banner-atual.jpg' : '',
          imageUri: getEventImageUri(event.image) ?? '',
          imageMimeType: event.image ? 'image/jpeg' : '',
          imageBase64: getEventImageBase64(event.image),
          name: event.name,
          dateTime: formatDateTime(nextDate),
          place: event.event_location,
          description: event.description,
        });
      } catch (error) {
        if (isAuthSessionError(error)) {
          await clearAuthToken();
          router.replace('/login' as never);
          return;
        }

        showFeedback({
          title: 'Não foi possível carregar',
          message: error instanceof Error ? error.message : 'Tente novamente em instantes.',
          type: 'error',
        });
      } finally {
        setIsLoadingEvent(false);
      }
    }

    void loadEventForEditing();
  }, [editingEventId, isEditing, router]);

  function updateField(field: keyof EventForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function openImagePicker() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showFeedback({
        title: 'Permissão necessária',
        message: 'Permita o acesso à galeria para escolher o banner.',
        type: 'warning',
      });
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
    setDraftDate(selectedDate ?? new Date());
    setIsDatePopoverVisible(true);
  }

  function openTimePicker() {
    openDatePicker();
  }

  function applyDateTimeSelection() {
    setSelectedDate(draftDate);
    updateField('dateTime', formatDateTime(draftDate));
    setIsDatePopoverVisible(false);
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
      showFeedback({
        title: 'Revise o formulário',
        message: 'Preencha todos os campos obrigatórios antes de salvar.',
        type: 'warning',
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        image: form.imageBase64 || null,
        name: form.name.trim(),
        event_datetime: selectedDate?.toISOString() ?? new Date().toISOString(),
        event_location: form.place.trim(),
        description: form.description.trim(),
      };

      if (isEditing && editingEventId !== null) {
        await updateEvent(editingEventId, payload);
        showFeedback({
          title: 'Evento atualizado',
          message: 'As alterações foram salvas.',
          type: 'success',
          onClose: () => router.replace('/perfil' as never),
        });
      } else {
        await createEvent(payload);
        discardDraft();
        showFeedback({
          title: 'Evento salvo',
          message: 'O novo evento foi criado como ativo.',
          type: 'success',
        });
      }
    } catch (error) {
      if (isAuthSessionError(error)) {
        await clearAuthToken();
        router.replace('/login' as never);
        return;
      }

      showFeedback({
        title: 'Não foi possível salvar',
        message:
          error instanceof Error ? error.message : 'Verifique se a API está rodando e tente novamente.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function discardDraft() {
    setForm(initialForm);
    setSelectedDate(null);
    setDraftDate(new Date());
    setIsDatePopoverVisible(false);
    setErrors({});
  }

  function showFeedback(nextFeedback: Feedback) {
    setFeedback(nextFeedback);
  }

  function closeFeedback() {
    const onClose = feedback?.onClose;
    setFeedback(null);
    onClose?.();
  }

  function handlePickerChange(date: DateType) {
    if (date) {
      setDraftDate(toNativeDate(date));
    }
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

          {isLoadingEvent ? (
            <View style={styles.loadingEventBox}>
              <ActivityIndicator color="#111111" />
              <Text style={styles.loadingEventText}>Carregando evento...</Text>
            </View>
          ) : null}

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
              active={isDatePopoverVisible}
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
                onBlur={() => setIsDescriptionFocused(false)}
                onChangeText={(value) => updateField('description', value)}
                onFocus={() => setIsDescriptionFocused(true)}
                placeholder="Descreva os detalhes do evento, palestrantes e pré-requisitos..."
                placeholderTextColor="#B9BDC4"
                style={[
                  styles.descriptionInput,
                  isDescriptionFocused ? styles.inputFocused : null,
                  errors.description ? styles.inputError : null,
                ]}
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
              disabled={isSaving || isLoadingEvent}
              onPress={saveEvent}
              style={[styles.saveButton, isSaving || isLoadingEvent ? styles.saveButtonDisabled : null]}>
              {isSaving ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <MaterialIcons name="event-available" size={18} color="#111111" />
              )}
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Atualizar Evento' : 'Salvar Evento'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!hasDraft || isSaving || isEditing}
              onPress={discardDraft}
              style={[
                styles.discardButton,
                !hasDraft || isSaving || isEditing ? styles.discardButtonDisabled : null,
              ]}>
              <Text
                style={[
                  styles.discardText,
                  !hasDraft || isSaving || isEditing ? styles.discardTextDisabled : null,
                ]}>
                Descartar Rascunho
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent animationType="fade" visible={isDatePopoverVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.datePopover}>
            <View style={styles.popoverHeader}>
              <Text style={styles.popoverTitle}>Data e horário</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar seletor"
                onPress={() => setIsDatePopoverVisible(false)}
                hitSlop={10}>
                <MaterialIcons name="close" size={22} color="#5F6670" />
              </Pressable>
            </View>
            <DatePicker
              mode="single"
              date={draftDate}
              firstDayOfWeek={0}
              locale="pt-br"
              onChange={({ date }) => handlePickerChange(date)}
              timePicker
              use12Hours={false}
              styles={{
                ...datePickerStyles,
                selected: styles.datePickerSelected,
                selected_label: styles.datePickerSelectedLabel,
                today: styles.datePickerToday,
              }}
            />
            <View style={styles.popoverActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsDatePopoverVisible(false)}
                style={styles.popoverCancelButton}>
                <Text style={styles.popoverCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={applyDateTimeSelection}
                style={styles.popoverConfirmButton}>
                <Text style={styles.popoverConfirmText}>Aplicar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <FeedbackPopover feedback={feedback} onClose={closeFeedback} />
    </SafeAreaView>
  );
}

type LabeledInputProps = {
  active?: boolean;
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
  active = false,
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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isActive = active || isFocused;

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.required}>*</Text>
      </View>
      <Pressable
        onPress={onPress ?? (() => inputRef.current?.focus())}
        style={[
          styles.inputShell,
          isActive ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}>
        <TextInput
          ref={inputRef}
          editable={editable}
          onChangeText={onChangeText}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
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

function toNativeDate(value: DateType) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }

  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }

  return new Date();
}

function FeedbackPopover({
  feedback,
  onClose,
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  if (!feedback) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.modalOverlay}>
        <View style={styles.feedbackPopover}>
          <View style={[styles.feedbackIcon, getFeedbackIconStyle(feedback.type)]}>
            <MaterialIcons
              name={feedback.type === 'success' ? 'check' : feedback.type === 'warning' ? 'warning' : 'close'}
              size={22}
              color="#111111"
            />
          </View>
          <Text style={styles.feedbackTitle}>{feedback.title}</Text>
          <Text style={styles.feedbackMessage}>{feedback.message}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.feedbackButton}>
            <Text style={styles.feedbackButtonText}>Entendi</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getFeedbackIconStyle(type: Feedback['type']) {
  if (type === 'success') {
    return styles.feedbackIcon_success;
  }

  if (type === 'warning') {
    return styles.feedbackIcon_warning;
  }

  return styles.feedbackIcon_error;
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
  loadingEventBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 12,
    padding: 14,
  },
  loadingEventText: {
    color: '#5F6670',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.36)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  datePopover: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxWidth: 430,
    padding: 16,
    width: '100%',
  },
  popoverHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  popoverTitle: {
    color: '#20242A',
    fontSize: 17,
    fontWeight: '900',
  },
  datePickerSelected: {
    backgroundColor: '#FFCC00',
    borderColor: '#FFCC00',
  },
  datePickerSelectedLabel: {
    color: '#111111',
    fontWeight: '900',
  },
  datePickerToday: {
    borderColor: '#FFCC00',
    borderWidth: 1,
  },
  popoverActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  popoverCancelButton: {
    alignItems: 'center',
    backgroundColor: '#ECEDEF',
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
    minWidth: 104,
    paddingHorizontal: 16,
  },
  popoverCancelText: {
    color: '#5F6670',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  popoverConfirmButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
    minWidth: 104,
    paddingHorizontal: 16,
  },
  popoverConfirmText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  feedbackPopover: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxWidth: 360,
    padding: 22,
    width: '100%',
  },
  feedbackIcon: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginBottom: 14,
    width: 44,
  },
  feedbackIcon_success: {
    backgroundColor: '#FFCC00',
  },
  feedbackIcon_warning: {
    backgroundColor: '#FFE8A3',
  },
  feedbackIcon_error: {
    backgroundColor: '#FECACA',
  },
  feedbackTitle: {
    color: '#20242A',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  feedbackMessage: {
    color: '#5F6670',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  feedbackButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    marginTop: 18,
    width: '100%',
  },
  feedbackButtonText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  inputFocused: {
    backgroundColor: '#FFFBEA',
    borderBottomColor: '#FFCC00',
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
