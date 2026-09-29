import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? 'Freetopia is missing its Supabase configuration. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the Expo environment.'
    : null;

const fallbackUrl = 'https://placeholder.invalid';
const fallbackKey = 'missing-supabase-publishable-key';

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabasePublishableKey || fallbackKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // React Native is a single-process environment. Use Supabase's
      // process-local lock instead of browser/Web Locks, which can become
      // orphaned and cause signInWithPassword() to hang indefinitely.
      lock: processLock,
    },
  },
);

if (AppState.currentState === 'active') {
  supabase.auth.startAutoRefresh();
}

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
