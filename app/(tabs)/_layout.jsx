import { AppState, Platform, useEffect, useState, useCallback, useWindowDimensions, useRef } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const { session, loading } = useAuth();
  const desktopWeb = Platform.OS === 'web' && width >= 1000;
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const mountedRef = useRef(true);
  const refreshSequence = useRef(0);

  const refreshUnread = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId || !mountedRef.current) {
      if (mountedRef.current) setUnreadMessages(0);
      return;
    }

    const sequence = ++refreshSequence.current;
    const { data, error } = await supabase.rpc('get_message_inbox');
    if (!mountedRef.current || sequence !== refreshSequence.current) return;
    if (error) {
      setUnreadMessages(0);
      return;
    }

    const total = (data || []).reduce((sum, row) => sum + Number(row.unread_count || 0), 0);
    setUnreadMessages(total);
  }, [session?.user?.id]);

  const refreshNotifications = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId || !mountedRef.current) {
      if (mountedRef.current) setUnreadNotifications(0);
      return;
    }

    const sequence = ++refreshSequence.current;
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (!mountedRef.current || sequence !== refreshSequence.current) return;
    setUnreadNotifications(error ? 0 : Number(count || 0));
  }, [session?.user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    refreshSequence.current += 1;
    refreshUnread();
    refreshNotifications();

    if (!session?.user?.id) return;

    const channel = supabase
      .channel('global-message-badge-' + session.user.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refreshUnread)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads', filter: 'user_id=eq.' + session.user.id }, refreshUnread)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: 'user_id=eq.' + session.user.id }, refreshUnread)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'recipient_id=eq.' + session.user.id }, refreshNotifications)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: 'recipient_id=eq.' + session.user.id }, refreshNotifications)
      .subscribe();

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshUnread();
        refreshNotifications();
      }
    });

    return () => {
      mountedRef.current = false;
      refreshSequence.current += 1;
      appStateSubscription.remove();
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, refreshUnread, refreshNotifications]);

  if (!loading && !session) return <Redirect href="/auth" />;

  return (
    <>
      <StatusBar style="light" />
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F5F7FA',
        tabBarInactiveTintColor: '#8795A8',
        tabBarStyle: desktopWeb
          ? { display: 'none' }
          : {
              height: 72,
              paddingTop: 9,
              paddingBottom: 10,
              borderTopColor: '#172538',
              borderTopWidth: 1,
              backgroundColor: '#050A11',
              elevation: 0,
            },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', marginTop: 1 },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: '#060B12' },
      }}>
        <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <AppIcon name="home" size={size} color={color} /> }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <AppIcon name="compass" size={size} color={color} /> }} />
        <Tabs.Screen name="messages" options={{
          title: 'Messages',
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#4B78A8', color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
          tabBarIcon: ({ color, size }) => <AppIcon name="message" size={size} color={color} />,
        }} />
        <Tabs.Screen name="notifications" options={{
          title: 'Notifications',
          tabBarBadge: unreadNotifications > 0 ? (unreadNotifications > 99 ? '99+' : unreadNotifications) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#4B78A8', color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
          tabBarIcon: ({ color, size }) => <AppIcon name="bell" size={size} color={color} />,
        }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <AppIcon name="profile" size={size} color={color} /> }} />
      </Tabs>
    </>
  );
}
