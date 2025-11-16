import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [step, setStep] = useState('login'); // 'login' or '2fa'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ticket, setTicket] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false, code: false });

  const trimmedUsername = username.trim();
  const isLoginDisabled =
    loading || trimmedUsername.length === 0 || password.trim().length === 0;
  const isCodeComplete = code.trim().length >= 6;

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleLogin() {
    setError('');
    if (trimmedUsername.length === 0 || password.trim().length === 0) {
      setTouched((prev) => ({ ...prev, username: true, password: true }));
      setError('Enter your username and password to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ username: trimmedUsername, password });
      if (res?.status === 'TWOFA_REQUIRED') {
        setTicket(res.ticket);
        setStep('2fa');
        setCode('');
        setTouched((prev) => ({ ...prev, code: false }));
      } else {
        router.replace('/home');
      }
    } catch (e) {
      console.error('[login] error', e);
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA() {
    setError('');
    if (!isCodeComplete) {
      setTouched((prev) => ({ ...prev, code: true }));
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ ticket, code });
      if (res?.ok) {
        router.replace('/home');
      } else {
        setError('2FA failed');
      }
    } catch (e) {
      setError('2FA failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#000000e0', '#111']} style={styles.bg}>
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#ff4655', '#ff6b6b', '#ff4655']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBar}
          />

          <View style={styles.header}>
            <Text style={styles.title}>Login to your Invidious Account</Text>
            <Text style={styles.subtitle}>
              Don’t have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => router.push('/register')}
              >
                Create one for free
              </Text>
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.form}>
                {step === 'login' && (
                  <>
                    <View style={styles.inputWrap}>
                      <FontAwesome5 name="user" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your username"
                        placeholderTextColor="#888"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                        onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                      />
                    </View>
                    {touched.username && trimmedUsername.length === 0 ? (
                      <Text style={styles.helper}>Username is required.</Text>
                    ) : null}

                    <View style={styles.inputWrap}>
                      <FontAwesome5 name="lock" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#888"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                      />
                    </View>
                    {touched.password && password.trim().length === 0 ? (
                      <Text style={styles.helper}>Password is required.</Text>
                    ) : null}

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                      style={[styles.btn, (loading || isLoginDisabled) && styles.btnDisabled]}
                      onPress={handleLogin}
                      disabled={isLoginDisabled}
                    >
                      <LinearGradient
                        colors={['#ff4655', '#ff6b6b']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.btnInner}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.btnText}>Login</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.hint}>
                      By signing in you agree to follow community rules and best practices.
                    </Text>
                  </>
                )}

              {step === '2fa' && (
                <>
                  <Text style={styles.label}>Enter your 2FA code</Text>
                  <Text style={styles.hint}>
                    Open your authenticator app and type the 6-digit code for Invidious.
                  </Text>
                  <View style={styles.inputWrap}>
                    <FontAwesome5 name="key" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123456"
                      placeholderTextColor="#888"
                      keyboardType="numeric"
                      value={code}
                      onChangeText={setCode}
                      onBlur={() => setTouched((prev) => ({ ...prev, code: true }))}
                    />
                  </View>
                  {touched.code && !isCodeComplete ? (
                    <Text style={styles.helper}>Enter a 6-digit code to continue.</Text>
                  ) : null}
                  {error ? <Text style={styles.error}>{error}</Text> : null}
                  <TouchableOpacity
                    style={[styles.btn, (loading || !isCodeComplete) && styles.btnDisabled]}
                    onPress={handleVerify2FA}
                    disabled={loading || !isCodeComplete}
                  >
                    <LinearGradient
                      colors={['#ff4655', '#ff6b6b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.btnInner}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnText}>Verify</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.twoFaActions}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => {
                        setStep('login');
                        setCode('');
                        setTicket(null);
                        setError('');
                        setTouched((prev) => ({ ...prev, code: false }));
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>Back to login</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: width * 0.9,
    maxWidth: 440,
    borderRadius: 16,
    backgroundColor: 'rgba(25,25,25,0.9)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  topBar: { height: 4, width: '100%' },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaa',
    textAlign: 'center',
  },
  link: {
    color: '#ff6b6b',
    fontWeight: '500',
  },
  form: {
    padding: 24,
  },
  inputWrap: {
    marginBottom: 18,
  },
  icon: {
    position: 'absolute',
    left: 16,
    top: 14,
    color: '#888',
    fontSize: 16,
  },
  input: {
    backgroundColor: 'rgba(20,20,20,0.8)',
    borderColor: '#333',
    borderWidth: 1,
    color: '#fff',
    borderRadius: 10,
    paddingLeft: 44,
    paddingVertical: 12,
    fontSize: 15,
  },
  btn: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
  },
  hint: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  error: {
    color: '#f87171',
    marginBottom: 8,
  },
  helper: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },
  twoFaActions: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
});