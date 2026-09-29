import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigError } from '../lib/supabase';

const AuthContext = createContext(null);
const AUTH_STARTUP_TIMEOUT = 7000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState(null);
  const configError = supabaseConfigError;

  useEffect(() => {
    let mounted = true;
    let startupFinished = false;
    let timeoutId;

    const finishStartup = () => {
      if (!mounted || startupFinished) return;
      startupFinished = true;
      clearTimeout(timeoutId);
      setLoading(false);
    };

    if (supabaseConfigError) {
      setStartupError(supabaseConfigError);
      finishStartup();
      return () => { mounted = false; };
    }

    timeoutId = setTimeout(() => {
      if (!mounted || startupFinished) return;
      startupFinished = true;
      setStartupError('Freetopia could not restore your session in time. Please continue to the sign-in screen.');
      setSession(null);
      setProfile(null);
      setLoading(false);
    }, AUTH_STARTUP_TIMEOUT);

    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession ?? null);
        if (!nextSession) setProfile(null);
        setStartupError(null);

        if (event === 'INITIAL_SESSION') {
          finishStartup();
        }
      });
      subscription = data?.subscription;
    } catch (error) {
      console.warn('Auth listener failed:', error?.message || error);
      setStartupError(null);
      finishStartup();
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!session?.user?.id || supabaseConfigError) {
        setProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, bio, avatar_url, cover_url, website, location, is_private')
          .eq('id', session.user.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          console.warn('Unable to load profile:', error.message);
          setProfile(null);
          return;
        }
        setProfile(data ?? null);
      } catch (error) {
        if (!cancelled) {
          console.warn('Profile load failed:', error?.message || error);
          setProfile(null);
        }
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configError,
    startupError,
    setAuthenticatedSession: (nextSession) => {
      setSession(nextSession ?? null);
      setStartupError(null);
      setLoading(false);
    },
    refreshProfile: async () => {
      if (supabaseConfigError || !session?.user?.id) return null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, bio, avatar_url, cover_url, website, location, is_private')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!error) setProfile(data ?? null);
        return data ?? null;
      } catch {
        return null;
      }
    },
    signOut: () => supabase.auth.signOut(),
  }), [session, profile, loading, configError, startupError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
