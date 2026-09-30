import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';
import { useAppearance } from '../../providers/AppearanceProvider';
import { supabase } from '../../lib/supabase';

const NAV_ITEMS = [
  { label: 'Home', icon: 'nav-home', path: '/home' },
  { label: 'Explore', icon: 'nav-explore', path: '/explore' },
  { label: 'Messages', icon: 'nav-message', path: '/messages' },
  { label: 'Notifications', icon: 'nav-bell', path: '/notifications' },
  { label: 'Profile', icon: 'nav-profile', path: '/profile' },
];

function BottomNav() {
  const router = useRouter();
  const { user } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const pathname = usePathname();
  const { colors, accent, textScale } = useAppearance();

  const loadCounts = useCallback(async () => {
    if (!user?.id) { setMessageCount(0); setNotificationCount(0); return; }
    try {
      const [inboxResult, requestResult, notificationResult] = await Promise.all([
        supabase.rpc('get_message_inbox'),
        supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id).eq('request_status', 'pending'),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).is('read_at', null),
      ]);
      const inboxUnread = (inboxResult.error ? [] : inboxResult.data || []).reduce((sum, row) => sum + Number(row.unread_count || 0), 0);
      const requests = requestResult.error ? 0 : (requestResult.data || []).length;
      const notifications = notificationResult.error ? 0 : Number(notificationResult.count || 0);
      setMessageCount(Math.min(99, inboxUnread + requests));
      setNotificationCount(Math.min(99, notifications));
    } catch {
      // Badges are supplemental; navigation must remain usable if counts fail.
    }
  }, [user?.id]);

  useEffect(() => {
    loadCounts();
    if (!user?.id) return;
    const timer = setInterval(loadCounts, 30000);
    const channel = supabase.channel('bottom-nav-counts-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'recipient_id=eq.' + user.id }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + user.id }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reads', filter: 'user_id=eq.' + user.id }, loadCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadCounts)
      .subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(channel); };
  }, [user?.id, loadCounts]);

  return (
    <View style={[styles.nav, { backgroundColor: colors.nav, borderTopColor: colors.line }]}>
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.path ||
          (item.path === '/home' && (pathname === '/' || pathname?.startsWith('/home/')));

        return (
          <Pressable
            key={item.path}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => router.replace(item.path)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, active && { backgroundColor: colors.panel2, borderColor: accent, borderWidth: 1 }]}>
              <AppIcon
                name={item.icon}
                size={28}
                color={active ? colors.text : colors.muted}
              />
            </View>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: active ? colors.text : colors.muted, fontSize: 13 * textScale }]}>
                {item.label}
              </Text>
              {item.label === 'Messages' && messageCount > 0 ? <View style={styles.navBadge}><Text style={styles.navBadgeText}>{messageCount >= 99 ? '99+' : messageCount}</Text></View> : null}
              {item.label === 'Notifications' && notificationCount > 0 ? <View style={styles.navBadge}><Text style={styles.navBadgeText}>{notificationCount >= 99 ? '99+' : notificationCount}</Text></View> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  const { colors, isLight } = useAppearance();

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <StatusBar style={isLight ? 'dark' : 'light'} />
        <View style={styles.authLoading}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.authLoadingText, { color: colors.muted }]}>Loading your Freetopia session…</Text>
        </View>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#060B12',
  },
  content: {
    flex: 1,
  },
  authLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  authLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  nav: {
    height: 82,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#050A11',
    borderTopWidth: 1,
    borderTopColor: '#182533',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 48,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#14263A',
    borderWidth: 1,
    borderColor: '#243B57',
  },
  labelRow: {
    marginTop: 3,
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A95B69',
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  label: {
    marginTop: 3,
    color: '#7F8FA2',
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: '#DCE9F7',
  },
});
