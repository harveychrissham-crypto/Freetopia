import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../providers/AuthProvider';
import {
  AppearanceProvider,
  useAppearance,
} from '../providers/AppearanceProvider';
import AppErrorBoundary from '../components/AppErrorBoundary';

function RootContent() {
  const { isLight } = useAppearance();

  return (
    <AuthProvider>
      <StatusBar style={isLight ? 'dark' : 'light'} />

      <AppErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </AppErrorBoundary>
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
