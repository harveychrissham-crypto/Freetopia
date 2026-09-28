import { Platform, useWindowDimensions } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';

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
              height: 68,
              paddingTop: 8,
              paddingBottom: 9,
              borderTopColor: '#172538',
              borderTopWidth: 1,
              backgroundColor: '#050A11',
              elevation: 0,
            },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: '#060B12' },
      }}>
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
        <Tabs.Screen name="communities" options={{ title: 'Communities' }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages', href: null }} />
        <Tabs.Screen name="notifications" options={{ title: 'Activity', href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}
