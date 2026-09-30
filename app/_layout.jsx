import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../providers/AuthProvider';
import { AppearanceProvider } from '../providers/AppearanceProvider';

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </AuthProvider>
    </AppearanceProvider>
  );
}
