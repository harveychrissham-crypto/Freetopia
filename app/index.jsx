import { Redirect } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

export default function Index() {
  const { session, loading, configError, startupError } = useAuth();

  if (configError) {
    return (
      <View style={s.loading}>
        <View style={s.brand}>
          <Image source={require('../public/brand/freetopia-mark.png')} style={s.logo} resizeMode="contain" />
        </View>
        <Text style={s.title}>Freetopia</Text>
        <Text style={s.subtitle}>Configuration needs attention.</Text>
        <View style={s.configCard}>
          <Text style={s.configTitle}>Freetopia cannot connect yet</Text>
          <Text style={s.configText}>{configError}</Text>
        </View>
      </View>
    );
  }

  if (startupError) {
    return (
      <View style={s.loading}>
        <View style={s.brand}>
          <Image source={require('../public/brand/freetopia-mark.png')} style={s.logo} resizeMode="contain" />
        </View>
        <Text style={s.title}>Freetopia</Text>
        <Text style={s.subtitle}>Your session could not be restored.</Text>
        <View style={s.configCard}>
          <Text style={s.configTitle}>Startup took too long</Text>
          <Text style={s.configText}>{startupError}</Text>
        </View>
        <Text style={s.retryHint}>You can continue to sign in below.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <View style={s.brand}>
          <Image
            source={require('../public/brand/freetopia-mark.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={s.title}>Freetopia</Text>
        <Text style={s.subtitle}>Connect. Create. Belong.</Text>

        <View style={s.loader}>
          <ActivityIndicator size="small" color="#A9B7C8" />
        </View>
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
    paddingHorizontal: 24,
  },
  brand: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#101A27',
    borderWidth: 1,
    borderColor: '#24364B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#7F8D9D',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  configCard: {
    width: '100%',
    maxWidth: 420,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#5A3940',
    backgroundColor: '#160E13',
  },
  configTitle: {
    color: '#F4D7DC',
    fontSize: 13,
    fontWeight: '800',
  },
  retryHint: { color: '#7F8D9D', fontSize: 11, marginTop: 14, textAlign: 'center' },
  configText: {
    color: '#C7AAB0',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
    textAlign: 'center',
  },
  loader: {
    height: 36,
    justifyContent: 'center',
    marginTop: 18,
  },
});
