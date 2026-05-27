import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type UnsavedChangesDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  message?: string;
  onCancel: () => void;
  onDiscard: () => void;
  title?: string;
  visible: boolean;
};

export function UnsavedChangesDialog({
  cancelLabel = 'Continuar editando',
  confirmLabel = 'Descartar e sair',
  message = 'As mudanças ainda não foram salvas. Se sair agora, elas serão perdidas.',
  onCancel,
  onDiscard,
  title = 'Descartar alterações?',
  visible,
}: UnsavedChangesDialogProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animatable.View
          animation="zoomIn"
          duration={220}
          style={styles.dialog}
          useNativeDriver>
          <View style={styles.iconBox}>
            <MaterialIcons name="warning" size={22} color="#111111" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onDiscard} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{confirmLabel}</Text>
          </Pressable>
        </Animatable.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.38)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxWidth: 360,
    padding: 22,
    width: '100%',
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: '#FFE8A3',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    marginBottom: 14,
    width: 44,
  },
  title: {
    color: '#20242A',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: '#5F6670',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    borderRadius: 6,
    height: 44,
    justifyContent: 'center',
    marginTop: 18,
    width: '100%',
  },
  primaryText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  secondaryText: {
    color: '#6F7782',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
