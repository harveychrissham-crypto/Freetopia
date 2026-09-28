import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={s.loading}>
        <View style={s.mark}><Text style={s.markText}>F</Text></View>
        <Text style={s.title}>Freetopia</Text>
        <ActivityIndicator size="small" color="#7F8D9D" />
      </View>
    );
  }

  return <Redirect href={session ? '/home' : '/auth'} />;
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#060B12',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#182536',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#29415B',
  },
  markText: { color: '#E9EEF4', fontSize: 20, fontWeight: '900' },
  title: { color: '#C9D4E2', fontSize: 14, fontWeight: '800' },
});
