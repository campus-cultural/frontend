import { StyleSheet, Text, View } from 'react-native';

export function UtfprLogo() {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoText}>UTFPR</Text>
      <View style={styles.logoAccent} />
      <Text style={styles.logoCaption}>UNIVERSIDADE TECNOLÓGICA FEDERAL DO PARANÁ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
  },
  logoText: {
    color: '#050505',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 62,
  },
  logoAccent: {
    backgroundColor: '#FFCC00',
    height: 28,
    marginLeft: 42,
    marginTop: -38,
    width: 38,
    zIndex: -1,
  },
  logoCaption: {
    color: '#111111',
    fontSize: 7,
    fontWeight: '900',
    marginTop: 12,
  },
});
