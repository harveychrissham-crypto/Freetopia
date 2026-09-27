import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const c = { ink: '#17171b', muted: '#696974', line: '#e8e8ec', surface: '#f7f7f9', accent: '#6546f5', danger: '#c93636' };

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setMessage('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!cleanEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'sign-up' && cleanName.length < 2) {
      setError('Enter your name to create your profile.');
      return;
    }

    setLoading(true);
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      : await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { display_name: cleanName } },
        });
    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Check your email to confirm your account, then come back to Freetopia.');
      return;
    }

    router.replace('/home');
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.brandRow}>
            <Image source={require('../public/brand/freetopia-mark.png')} style={s.logo} />
            <Text style={s.wordmark}>freetopia</Text>
          </View>

          <View style={s.hero}>
            <Text style={s.eyebrow}>{mode === 'sign-in' ? 'WELCOME BACK' : 'JOIN FREETOPIA'}</Text>
            <Text style={s.title}>{mode === 'sign-in' ? 'Come back to your world.' : 'Build your world.'}</Text>
            <Text style={s.lead}>{mode === 'sign-in' ? 'Sign in to express, discover, connect, create and belong.' : 'Create an account and make Freetopia yours.'}</Text>
          </View>

          {mode === 'sign-up' && (
            <Field label="Name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" autoCapitalize="words" />
          )}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry />

          {!!error && <Text style={s.error}>{error}</Text>}
          {!!message && <Text style={s.message}>{message}</Text>}

          <Pressable onPress={submit} disabled={loading} style={[s.primary, loading && s.disabled]}>
            <Text style={s.primaryText}>{loading ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>
          </Pressable>

          <Pressable onPress={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setMessage(''); }} style={s.switch}>
            <Text style={s.switchText}>{mode === 'sign-in' ? 'New to Freetopia? ' : 'Already have an account? '}<Text style={s.switchStrong}>{mode === 'sign-in' ? 'Create an account' : 'Sign in'}</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput {...props} style={s.input} placeholderTextColor="#9a9aa4" /></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' }, flex: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logo: { width: 34, height: 34 }, wordmark: { fontSize: 19, fontWeight: '750', color: c.ink, letterSpacing: -0.6 },
  hero: { paddingTop: 70, paddingBottom: 32 }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: c.accent }, title: { marginTop: 9, fontSize: 34, lineHeight: 38, fontWeight: '760', letterSpacing: -1.2, color: c.ink }, lead: { marginTop: 11, fontSize: 14, lineHeight: 21, color: c.muted },
  field: { marginBottom: 17 }, label: { marginBottom: 7, fontSize: 12, fontWeight: '700', color: c.ink }, input: { minHeight: 52, paddingHorizontal: 15, borderWidth: 1, borderColor: c.line, borderRadius: 14, backgroundColor: c.surface, fontSize: 15, color: c.ink },
  error: { marginBottom: 12, fontSize: 12, lineHeight: 18, color: c.danger }, message: { marginBottom: 12, fontSize: 12, lineHeight: 18, color: '#35734a' },
  primary: { minHeight: 52, borderRadius: 14, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center', marginTop: 4 }, disabled: { opacity: 0.55 }, primaryText: { color: '#fff', fontSize: 14, fontWeight: '750' },
  switch: { alignItems: 'center', paddingVertical: 20 }, switchText: { fontSize: 12, color: c.muted }, switchStrong: { color: c.ink, fontWeight: '750' },
});
