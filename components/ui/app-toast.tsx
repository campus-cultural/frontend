import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

export type AppToastType = 'error' | 'success' | 'warning';

type AppToastProps = {
  bottom?: number;
  message: string;
  type?: AppToastType;
  visible: boolean;
};

const iconByType: Record<AppToastType, keyof typeof MaterialIcons.glyphMap> = {
  error: 'error',
  success: 'check-circle',
  warning: 'warning',
};

export function AppToast({ bottom = 112, message, type = 'success', visible }: AppToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.toast, styles[type], { bottom }]}>
      <MaterialIcons name={iconByType[type]} size={18} color="#111111" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    maxWidth: '88%',
    minHeight: 44,
    paddingHorizontal: 18,
    position: 'absolute',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  success: {
    backgroundColor: '#FFCC00',
  },
  warning: {
    backgroundColor: '#FFE8A3',
  },
  error: {
    backgroundColor: '#FECACA',
  },
  text: {
    color: '#111111',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
  },
});
