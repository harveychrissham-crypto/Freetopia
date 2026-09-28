import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

function NavigationGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === 'auth';

    if (!session && !inAuth) router.replace('/auth');
    if (session && inAuth) router.replace('/home');
  }, [loading, session, segments, router]);

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationGate />
    </AuthProvider>
  );
}

export function BootScreen() {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingMark}>
        <Text style={styles.loadingMarkText}>F</Text>
      </View>
      <Text style={styles.loadingText}>Freetopia</Text>
      <ActivityIndicator size="small" color="#7F8D9D" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#060B12', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#182536', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#29415B' },
  loadingMarkText: { color: '#E9EEF4', fontSize: 20, fontWeight: '900' },
  loadingText: { color: '#C9D4E2', fontSize: 14, fontWeight: '800', marginBottom: 2 },
});
