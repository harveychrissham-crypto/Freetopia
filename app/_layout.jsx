import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="small" /></View>;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <NavigationGate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
