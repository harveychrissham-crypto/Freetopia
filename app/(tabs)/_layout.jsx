import { AppState, Platform, View, useEffect, useState, useCallback, useWindowDimensions, useRef } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const navIcon = { width: 42, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' };
const navIconActive = { backgroundColor: '#14263A', borderWidth: 1, borderColor: '#243B57' };

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const { session, loading } = useAuth();
  const desktopWeb = Platform.OS === 'web' && width >= 1000;
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const mountedRef = useRef(true);
  const messageRefreshSequence = useRef(0);
  const notificationRefreshSequence = useRef(0);

  const refreshUnread = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId || !mountedRef.current) {
      if (mountedRef.current) setUnreadMessages(0);
      return;
    }

    const sequence = ++messageRefreshSequence.current;
    const { data, error } = await supabase.rpc('get_message_inbox');
    if (!mountedRef.current || sequence !== messageRefreshSequence.current) return;
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

    const sequence = ++notificationRefreshSequence.current;
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (!mountedRef.current || sequence !== notificationRefreshSequence.current) return;
    setUnreadNotifications(error ? 0 : Number(count || 0));
  }, [session?.user?.id]);

  useEffect(() => {
    mountedRef.current = true;
    messageRefreshSequence.current += 1;
    notificationRefreshSequence.current += 1;
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
      messageRefreshSequence.current += 1;
      notificationRefreshSequence.current += 1;
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
        tabBarActiveTintColor: '#BFD6EE',
        tabBarInactiveTintColor: '#8795A8',
        tabBarStyle: desktopWeb
          ? { display: 'none' }
          : {
              height: 76,
              paddingTop: 8,
              paddingBottom: 9,
              borderTopColor: '#182533',
              borderTopWidth: 1,
              backgroundColor: '#050A11',
              elevation: 0,
            },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '750', marginTop: 2 },
        tabBarItemStyle: { paddingTop: 0 },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: '#060B12' },
      }}>
        <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <View style={[navIcon, focused && navIconActive]}><AppIcon name="home" size={size} color={color} /></View> }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color, size, focused }) => <View style={[navIcon, focused && navIconActive]}><AppIcon name="compass" size={size} color={color} /></View> }} />
        <Tabs.Screen name="messages" options={{
          title: 'Messages',
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 99 ? '99+' : unreadMessages) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#4B78A8', color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
          tabBarIcon: ({ color, size, focused }) => <View style={[navIcon, focused && navIconActive]}><AppIcon name="message" size={size} color={color} /></View>,
        }} />
        <Tabs.Screen name="notifications" options={{
          title: 'Notifications',
          tabBarBadge: unreadNotifications > 0 ? (unreadNotifications > 99 ? '99+' : unreadNotifications) : undefined,
          tabBarBadgeStyle: { backgroundColor: '#4B78A8', color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
          tabBarIcon: ({ color, size, focused }) => <View style={[navIcon, focused && navIconActive]}><AppIcon name="bell" size={size} color={color} /></View>,
        }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size, focused }) => <View style={[navIcon, focused && navIconActive]}><AppIcon name="profile" size={size} color={color} /></View> }} />
      </Tabs>
    </>
  );
}
