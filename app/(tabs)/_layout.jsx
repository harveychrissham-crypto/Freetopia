import { Redirect, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';

export default function TabLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) {
    return <Redirect href="/auth" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}
