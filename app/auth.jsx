import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase, supabaseConfigError } from '../lib/supabase';
import AppIcon from '../components/AppIcon';
import { useAuth } from '../providers/AuthProvider';

const c = {
  ink: '#17171b',
  muted: '#696974',
  line: '#e7e7ec',
  surface: '#f7f7f9',
  accent: '#6546f5',
  accentSoft: '#f0edff',
  danger: '#c93636',
};

export default function Auth() {
  const router = useRouter();
  const { session, loading: authLoading, setAuthenticatedSession } = useAuth();
  const [mode, setMode] = useState('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailConfirmationNeeded, setEmailConfirmationNeeded] = useState(false);
  const navigationLock = useRef(false);

  useEffect(() => {
    if (!authLoading && session && !navigationLock.current) {
      navigationLock.current = true;
      router.replace('/home');
    }
  }, [authLoading, session, router]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  const resendConfirmation = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || loading) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (resendError) throw resendError;
      setMessage('A new confirmation email has been sent. Open the newest email and confirm your address before signing in again.');
    } catch (resendError) {
      setError(resendError?.message || 'Could not resend the confirmation email.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (loading) return;
    setError('');
    setMessage('');
    setEmailConfirmationNeeded(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!cleanEmail || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (mode === 'sign-up' && password.length < 6) {
      setError('Your password must be at least 6 characters.');
      return;
    }

    if (mode === 'sign-up' && cleanName.length < 2) {
      setError('Enter your name to create your profile.');
      return;
    }

    if (supabaseConfigError) {
      setError('Freetopia is not configured with its Supabase connection. Please install the latest build from GitHub Releases.');
      return;
    }

    setLoading(true);

    try {
      const authRequest = mode === 'sign-in'
        ? supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { data: { display_name: cleanName } },
          });

      let timeoutId;
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(
          'Freetopia could not reach its authentication service. Check this device’s internet connection and try again. If it persists on other networks, check the Supabase project status.'
        )), 10000);
      });

      let result;
      try {
        result = await Promise.race([authRequest, timeout]);
      } finally {
        clearTimeout(timeoutId);
      }

      if (result.error) {
        const isEmailNotConfirmed =
          result.error?.code === 'email_not_confirmed' ||
          result.error?.error_code === 'email_not_confirmed' ||
          /email.*not.*confirmed/i.test(result.error?.message || '');

        if (isEmailNotConfirmed && mode === 'sign-in') {
          setEmailConfirmationNeeded(true);
          setError('Supabase still has this account marked as unconfirmed. If you already clicked the confirmation link, request a fresh confirmation email or check the account in Supabase Auth.');
        } else {
          setError(result.error.message);
        }
        return;
      }

      if (mode === 'sign-up' && !result.data.session) {
        setMessage('Check your email to confirm your account, then come back to Freetopia.');
        return;
      }

      if (result.data.session) {
        setAuthenticatedSession(result.data.session);
        navigationLock.current = true;
        router.replace('/home');
      } else {
        setError('Sign-in completed without a session. Please try again.');
      }
    } catch (submitError) {
      setError(submitError?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.brandRow}>
            <Image source={require('../public/brand/freetopia-mark.png')} style={s.logo} />
            <Text style={s.wordmark}>freetopia</Text>
          </View>

          <View style={s.hero}>
            <View style={s.eyebrowPill}>
              <View style={s.eyebrowDot} />
              <Text style={s.eyebrow}>
                {mode === 'sign-in' ? 'WELCOME BACK' : 'JOIN FREETOPIA'}
              </Text>
            </View>

            <Text style={s.title}>
              {mode === 'sign-in' ? 'Come back to your world.' : 'Build your world.'}
            </Text>

            <Text style={s.lead}>
              {mode === 'sign-in'
                ? 'Express, discover, connect, create and belong.'
                : 'Create your space and start connecting with people who get you.'}
            </Text>
          </View>

          <View style={s.modeSwitch} accessibilityRole="tablist">
            <Pressable
              onPress={() => switchMode('sign-in')}
              style={[s.modeTab, mode === 'sign-in' && s.modeTabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'sign-in' }}
            >
              <Text style={[s.modeText, mode === 'sign-in' && s.modeTextActive]}>Sign in</Text>
            </Pressable>

            <Pressable
              onPress={() => switchMode('sign-up')}
              style={[s.modeTab, mode === 'sign-up' && s.modeTabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'sign-up' }}
            >
              <Text style={[s.modeText, mode === 'sign-up' && s.modeTextActive]}>Create account</Text>
            </Pressable>
          </View>

          <View style={s.formCard}>
            {mode === 'sign-up' && (
              <Field
                label="Name"
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  setError('');
                }}
                placeholder="Your name"
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}

            <Field
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError('');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <View style={s.field}>
              <View style={s.labelRow}>
                <Text style={s.label}>Password</Text>
                {mode === 'sign-in' && (
                  <Text style={s.helper}>Keep it secure</Text>
                )}
              </View>

              <View style={s.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError('');
                  }}
                  placeholder="Your password"
                  placeholderTextColor="#9a9aa4"
                  secureTextEntry={!showPassword}
                  style={s.passwordInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  style={s.passwordToggle}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <AppIcon name={showPassword ? 'eye-off' : 'eye'} size={18} color={c.ink} />
                </Pressable>
              </View>
            </View>

            {!!error && (
              <View style={s.feedbackError}>
                <Text style={s.feedbackText}>{error}</Text>
              </View>
            )}

            {!!message && (
              <View style={s.feedbackMessage}>
                <Text style={s.feedbackMessageText}>{message}</Text>
              </View>
            )}

            {emailConfirmationNeeded && (
              <Pressable
                onPress={resendConfirmation}
                disabled={loading}
                style={s.resendButton}
              >
                <Text style={s.resendText}>{loading ? 'Sending…' : 'Resend confirmation email'}</Text>
              </Pressable>
            )}

            <Pressable
              onPress={submit}
              disabled={loading}
              style={[s.primary, loading && s.disabled]}
            >
              <Text style={s.primaryText}>
                {loading
                  ? 'Connecting…'
                  : mode === 'sign-in'
                    ? 'Sign in to Freetopia'
                    : 'Create my account'}
              </Text>
            </Pressable>
          </View>

          <Text style={s.bottomCopy}>
            {mode === 'sign-in'
              ? 'New to Freetopia?'
              : 'Already have an account?'}{' '}
            <Text
              onPress={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              style={s.bottomLink}
            >
              {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
            </Text>
          </Text>

          <View style={s.footer}>
            <Text style={s.footerText}>
              By continuing, you agree to use Freetopia responsibly and respectfully.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput {...props} style={s.input} placeholderTextColor="#9a9aa4" />
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logo: {
    width: 34,
    height: 34,
  },
  wordmark: {
    fontSize: 19,
    fontWeight:'700',
    color: c.ink,
    letterSpacing: -0.6,
  },
  hero: {
    paddingTop: 56,
    paddingBottom: 26,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: c.accentSoft,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.accent,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.35,
    color: c.accent,
  },
  title: {
    marginTop: 13,
    fontSize: 35,
    lineHeight: 40,
    fontWeight:'700',
    letterSpacing: -1.35,
    color: c.ink,
  },
  lead: {
    marginTop: 11,
    maxWidth: 340,
    fontSize: 14,
    lineHeight: 21,
    color: c.muted,
  },
  modeSwitch: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 18,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
  },
  modeTab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: c.line,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.muted,
  },
  modeTextActive: {
    color: c.ink,
  },
  formCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: '#fff',
  },
  field: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  label: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: '700',
    color: c.ink,
  },
  helper: {
    fontSize: 10,
    color: '#9898a3',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 14,
    backgroundColor: c.surface,
    fontSize: 15,
    color: c.ink,
  },
  passwordWrap: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 14,
    backgroundColor: c.surface,
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    paddingLeft: 15,
    paddingRight: 8,
    fontSize: 15,
    color: c.ink,
  },
  passwordToggle: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  passwordToggleText: { fontSize: 11, fontWeight:'700', color: c.ink },
  feedbackError: {
    marginBottom: 13,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#fff3f3',
  },
  feedbackText: {
    fontSize: 12,
    lineHeight: 18,
    color: c.danger,
  },
  feedbackMessage: {
    marginBottom: 13,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#f0f8f3',
  },
  feedbackMessageText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#35734a',
  },
  resendButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  resendText: {
    color: c.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  primary: {
    minHeight: 53,
    borderRadius: 14,
    backgroundColor: c.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  disabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight:'700',
  },
  bottomCopy: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: c.muted,
  },
  bottomLink: {
    color: c.ink,
    fontWeight:'700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 34,
    alignItems: 'center',
  },
  footerText: {
    maxWidth: 300,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 16,
    color: '#9a9aa4',
  },
});
