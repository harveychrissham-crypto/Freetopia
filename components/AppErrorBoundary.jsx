import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppearance } from '../providers/AppearanceProvider';

class ErrorBoundaryInner extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (__DEV__) console.error('Freetopia render error:', error, info?.componentStack);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    const { colors } = this.props;
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={[s.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <View style={[s.icon, { backgroundColor: colors.panel2 }]}><Text style={[s.iconText, { color: colors.text }]}>!</Text></View>
          <Text style={[s.title, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[s.body, { color: colors.muted }]}>
            Freetopia hit an unexpected screen error. Your account and data are still safe.
          </Text>
          <Pressable onPress={this.retry} style={({ pressed }) => [s.button, { backgroundColor: colors.accent }, pressed && s.pressed]}>
            <Text style={s.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

export default function AppErrorBoundary({ children }) {
  const { colors } = useAppearance();
  return <ErrorBoundaryInner colors={colors}>{children}</ErrorBoundaryInner>;
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  card: { width: '100%', maxWidth: 420, borderWidth: 1, borderRadius: 18, padding: 22, alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22, fontWeight: '900' },
  title: { fontSize: 20, fontWeight: '800', marginTop: 14 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  button: { marginTop: 18, minHeight: 42, paddingHorizontal: 18, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#F4F6F8', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
