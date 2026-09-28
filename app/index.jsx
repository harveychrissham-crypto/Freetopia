import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { BootScreen } from './_layout';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? '/home' : '/auth');
  }, [loading, session, router]);

  return <BootScreen />;
}
