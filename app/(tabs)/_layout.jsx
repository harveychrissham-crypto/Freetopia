import { Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const desktopWeb = Platform.OS === 'web' && width >= 1000;

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
              backgroundColor: '#050A11',
            },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}>
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
        <Tabs.Screen name="communities" options={{ title: 'Communities' }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
        <Tabs.Screen name="notifications" options={{ title: 'Activity' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}
