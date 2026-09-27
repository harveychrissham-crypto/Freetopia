import { useRef } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  ink: '#17171b',
  muted: '#696974',
  line: '#e8e8ec',
  surface: '#f7f7f9',
  accent: '#6546f5',
  blue: '#087cff',
  pink: '#e72bdf',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  header: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  logo: { width: 38, height: 38 },
  wordmark: { fontSize: 19, fontWeight: '750', color: colors.ink, letterSpacing: -0.5 },
  eyebrow: { marginTop: 36, color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { marginTop: 12, color: colors.ink, fontSize: 42, lineHeight: 47, letterSpacing: -1.7, fontWeight: '750' },
  lead: { marginTop: 15, color: colors.muted, fontSize: 17, lineHeight: 26 },
  gradient: { marginTop: 25, height: 5, width: 110, borderRadius: 8, backgroundColor: colors.accent, overflow: 'hidden' },
  gradientInner: { flex: 1, width: '100%', backgroundColor: colors.pink, opacity: 0.78 },
  card: { marginTop: 40, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 22 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#efedff' },
  bubble: { color: colors.accent, fontSize: 23, lineHeight: 28, fontWeight: '700' },
  cardKicker: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  cardTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.4 },
  emptyTitle: { color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: '700' },
  body: { marginTop: 9, color: colors.muted, fontSize: 15, lineHeight: 23 },
  button: { minHeight: 50, marginTop: 20, borderRadius: 14, paddingHorizontal: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '650' },
  section: { marginTop: 46, paddingTop: 26, borderTopWidth: 1, borderTopColor: colors.line },
  sectionTitle: { color: colors.ink, fontSize: 25, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 22 },
  dot: { width: 9, height: 9, marginTop: 7, borderRadius: 10, backgroundColor: colors.blue },
  valueTitle: { color: colors.ink, fontSize: 16, fontWeight: '650' },
  valueBody: { marginTop: 4, color: colors.muted, fontSize: 14, lineHeight: 21 },
  footnote: { marginTop: 34, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});

const values = [
  ['Express yourself', 'A little more room to show up as you are.'],
  ['Find your people', 'Discover meaningful connections at your own pace.'],
  ['Make it yours', 'Shape a social world that feels like it belongs to you.'],
];

export default function HomeScreen() {
  const scrollRef = useRef(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require('../public/brand/freetopia-mark.png')} style={styles.logo} accessibilityLabel="Freetopia logo" />
            <Text style={styles.wordmark}>freetopia</Text>
          </View>

          <Text style={styles.eyebrow}>A social world, taking shape</Text>
          <Text accessibilityRole="header" style={styles.title}>Your world.{ '\n' }Your voice.</Text>
          <Text style={styles.lead}>A place to express yourself, find your people, and feel at home being you.</Text>
          <View style={styles.gradient}><View style={styles.gradientInner} /></View>

          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}><Text style={styles.bubble} accessible={false}>✳</Text></View>
              <View>
                <Text style={styles.cardKicker}>WELCOME TO FREETOPIA</Text>
                <Text style={styles.cardTitle}>A fresh start for social</Text>
              </View>
            </View>
            <Text style={styles.emptyTitle}>The world is still being built.</Text>
            <Text style={styles.body}>Profiles, posts, and conversations will appear here when Freetopia’s account and community services are connected.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Scrolls to learn what Freetopia is being built around"
              onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.82 }]}
            >
              <Text style={styles.buttonText}>Discover the idea</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Built around what matters</Text>
            {values.map(([title, body]) => (
              <View key={title} style={styles.valueRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.valueTitle}>{title}</Text>
                  <Text style={styles.valueBody}>{body}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.footnote}>Freetopia · A place to be more you</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
