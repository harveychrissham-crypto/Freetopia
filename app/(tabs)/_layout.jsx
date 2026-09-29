import { Platform, View, useWindowDimensions } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';

const navIcon = {
  width: 42,
  height: 30,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
};

const navIconActive = {
  backgroundColor: '#14263A',
  borderWidth: 1,
  borderColor: '#243B57',
};

function tabIcon(name, color, size, focused) {
  return (
    <View style={[navIcon, focused && navIconActive]}>
      <AppIcon name={name} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const { session, loading } = useAuth();
  const desktopWeb = Platform.OS === 'web' && width >= 1000;

  if (!loading && !session) {
    return <Redirect href="/auth" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#BFD6EE',
          tabBarInactiveTintColor: '#8795A8',
          tabBarStyle: desktopWeb
            ? { display: 'none' }
            : {
                height: 80,
                paddingTop: 8,
                paddingBottom: 10,
                borderTopColor: '#182533',
                borderTopWidth: 1,
                backgroundColor: '#050A11',
                elevation: 0,
              },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 3,
          },
          tabBarItemStyle: {
            paddingTop: 0,
          },
          tabBarHideOnKeyboard: true,
          sceneStyle: {
            backgroundColor: '#060B12',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => tabIcon('home', color, size, focused),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size, focused }) => tabIcon('compass', color, size, focused),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size, focused }) => tabIcon('message', color, size, focused),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color, size, focused }) => tabIcon('bell', color, size, focused),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => tabIcon('profile', color, size, focused),
          }}
        />
        <Tabs.Screen
          name="communities"
          options={{
            href: null,
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </>
  );
}
