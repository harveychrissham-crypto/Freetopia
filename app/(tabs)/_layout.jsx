import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../providers/AuthProvider';
import AppIcon from '../../components/AppIcon';
import { useAppearance } from '../../providers/AppearanceProvider';

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
  const { colors, accent, textScale } = useAppearance();

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
            <Text style={[styles.label, { color: active ? colors.text : colors.muted, fontSize: 13 * textScale }]}>
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
