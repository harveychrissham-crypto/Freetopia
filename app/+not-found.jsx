import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.mark}>
          <Text style={s.markText}>F</Text>
        </View>
        <Text style={s.code}>404</Text>
        <Text style={s.title}>This corner of Freetopia doesn’t exist.</Text>
        <Text style={s.body}>
          The page may have moved, the link may be outdated, or the destination is still being built.
        </Text>
        <View style={s.actions}>
          <Pressable onPress={() => router.replace('/home')} style={s.primary}>
            <Text style={s.primaryText}>Back to Home</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={s.secondary}>
            <Text style={s.secondaryText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060B12' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: '#182536',
    borderWidth: 1,
    borderColor: '#29415B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { color: '#E9EEF4', fontSize: 25, fontWeight: '900' },
  code: {
    marginTop: 24,
    color: '#4B78A8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    marginTop: 10,
    color: '#E9EEF4',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: 480,
  },
  body: {
    marginTop: 10,
    color: '#7F8D9D',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 430,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  primary: {
    minWidth: 130,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#4B78A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#F4F6F8', fontSize: 11, fontWeight: '800' },
  secondary: {
    minWidth: 110,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30445D',
    backgroundColor: '#0D1722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#C9D4E2', fontSize: 11, fontWeight: '800' },
});
