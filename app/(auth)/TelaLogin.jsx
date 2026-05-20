import { useState, useCallback } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import Colors from '../../constants/colors';
import { getEmailError, getPasswordError } from '../context/validation';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext'



const TelaLogin = ({ navigation }) => {

      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [emailTouched, setEmailTouched] = useState(false);
      const [passwordTouched, setPasswordTouched] = useState(false);
      const [emailError, setEmailError] = useState(null);
      const [passwordError, setPasswordError] = useState(null);
      const [loading, setLoading] = useState(false);

     
      //lidar com os textinputs
      //usecallback serve para evitar re-render do componente e o teclado ficar bugando
      //fiz junto do memo no inputField pra evitar um bug bizarro
      //so faz re-render se realmente tiver mudança no input
      const handleEmailChange = useCallback((text) => {
          setEmail(text);
          if (!emailTouched) setEmailTouched(true);
          if (emailError) setEmailError(null);
      }, [emailTouched, emailError]);

      const handlePasswordChange = useCallback((text) => {
          setPassword(text);
          if (!passwordTouched) setPasswordTouched(true);
          if (passwordError) setPasswordError(null);
      }, [passwordTouched, passwordError]);

      const handleEmailBlur = useCallback(() => {
          if (emailTouched) setEmailError(getEmailError(email));
      }, [emailTouched, email]);

      const handlePasswordBlur = useCallback(() => {
          if (passwordTouched) setPasswordError(getPasswordError(password));
      }, [passwordTouched, password]);
     

      const { signIn } = useAuth();
      // submit
      const handleLogin = async () => {
        const eError = getEmailError(email);
        const pError = getPasswordError(password);
        setEmailError(eError);
        setPasswordError(pError);

        setEmailTouched(true);
        setPasswordTouched(true);
    
        if (eError || pError) return;
    
        setLoading(true);
        try {
          //tem que integrar pra validar o login
          await signIn(email, password);
          router.replace('/(tabs)'); // redireciona após login
        } catch (err) {
          setEmailError('Credenciais inválidas. Tente novamente.');
        } finally {
          setLoading(false);
        }
      };
    
      return (
         <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          
            {/* Logo  */}
            <View style={styles.logoContainer}>
              
              <Image
                source={require('../../assets/images/UTFPRlogo_campusCultural.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
    
            {/*  Header  */}
            <View style={styles.headerContainer}>
              <Text style={styles.appTitle}>UTFPR Cultural</Text>
              <Text style={styles.appSubtitle}>Acesso Institucional</Text>
            </View>
    
            {/* Divider */}
            <View style={styles.divider} />
    
            {/* Form */}
            <View style={styles.form}>
              <InputField
                label="email"
                placeholder="Insira seu email institucional"
                value={email}                
                onBlur={handleEmailBlur}
                onChangeText={handleEmailChange}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon="✉️"
              />
    
              <InputField
                label="senha"
                placeholder="Insira sua senha"
                value={password}
                onBlur={handlePasswordBlur}
                onChangeText={handlePasswordChange}
                error={passwordError}
                secureTextEntry
              />
    
              <View style={styles.buttonWrapper}>
                <PrimaryButton
                  label="Entrar"
                  onPress={handleLogin}
                  loading={loading}
                />
              </View>
            </View>

            {/*Linkar com a tela de cadastro*/}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => router.push('/caminho do cadastro')}//-----------------------------------
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.footerLink}>Cadastrar</Text>
              </TouchableOpacity>
    
            </View>
            </ScrollView>
        </KeyboardAvoidingView>
      );
    };

  const styles = StyleSheet.create({
      flex: {
        flex: 1,
        backgroundColor: Colors.background,
      },
      scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
      },
      logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
      },
      logo: {
        width: 180,
        height: 80,
      },
      headerContainer: {
        alignItems: 'center',
        marginBottom: 8,
      },
      appTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
      },
      appSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textSecondary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 4,
      },
      divider: {
        height: 1.5,
        backgroundColor: Colors.divider,
        marginVertical: 28,
        marginHorizontal: 16,
      },
      form: {
        width: '100%',
      },
      buttonWrapper: {
        marginTop: 8,
      },
      footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 36,
        gap: 0,
      },
      footerLink: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
      },
      footerSeparator: {
        width: 1.5,
        height: 14,
        backgroundColor: Colors.divider,
        marginHorizontal: 16,
      },
    });
    
    export default function HomeScreen(){
  return <TelaLogin />
}
