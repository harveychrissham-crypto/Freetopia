import { Platform, useWindowDimensions } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const { session, loading } = useAuth();
  const desktopWeb = Platform.OS === 'web' && width >= 1000;

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
        <Tabs.Screen name="communities" options={{ title: 'Communities', tabBarIcon: ({ color, size }) => <AppIcon name="users" size={size} color={color} /> }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color, size }) => <AppIcon name="message" size={size} color={color} /> }} />
        <Tabs.Screen name="notifications" options={{ title: 'Activity', href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <AppIcon name="profile" size={size} color={color} /> }} />
      </Tabs>
    </>
  );
}
