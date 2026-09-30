import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';

const NAV_ITEMS = [
  { label: 'Home', icon: 'nav-home', path: '/home' },
  { label: 'Explore', icon: 'nav-explore', path: '/explore' },
  { label: 'Messages', icon: 'nav-message', path: '/messages' },
  { label: 'Notifications', icon: 'nav-bell', path: '/notifications' },
  { label: 'Profile', icon: 'nav-profile', path: '/profile' },
];

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.nav}>
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
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <AppIcon
                name={item.icon}
                size={21}
                color={active ? '#DCE9F7' : '#7F8FA2'}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { session, loading } = useAuth();

  if (!loading && !session) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
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
  nav: {
    height: 78,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 9,
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
    width: 42,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#14263A',
    borderWidth: 1,
    borderColor: '#243B57',
  },
  label: {
    marginTop: 3,
    color: '#7F8FA2',
    fontSize: 12,
    fontWeight: '700',
  },
  labelActive: {
    color: '#DCE9F7',
  },
});
