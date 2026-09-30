import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../providers/AuthProvider';
import { AppearanceProvider, useAppearance } from '../providers/AppearanceProvider';

function RootContent() {
  const { isLight } = useAppearance();
  return (
    <AuthProvider>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <RootContent />
    </AppearanceProvider>
  );
}
