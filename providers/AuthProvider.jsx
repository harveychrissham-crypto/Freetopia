import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigError } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const configError = supabaseConfigError;

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      if (supabaseConfigError) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) console.warn('Unable to restore session:', error.message);
        setSession(data.session ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      if (!nextSession) {
        setProfile(null);
      }
    });

    loadSession();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }

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
    };

    if (supabaseConfigError) return;
    loadProfile();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configError,
    refreshProfile: async () => {
      if (supabaseConfigError) return null;
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, cover_url, website, location, is_private')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!error) setProfile(data ?? null);
      return data ?? null;
    },
    signOut: () => supabase.auth.signOut(),
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
