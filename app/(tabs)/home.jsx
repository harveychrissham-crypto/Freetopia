import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: '#060B12', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: '#F4F6F8', fontSize: 26, fontWeight: '700' }}>
        Freetopia is open
      </Text>
      <Text style={{ color: '#8A99AA', fontSize: 14, marginTop: 10 }}>
        Signed in as {user?.email || 'authenticated user'}
      </Text>
      <Pressable
        onPress={() => router.push('/create')}
        style={{ marginTop: 24, height: 48, borderRadius: 12, backgroundColor: '#4B78A8', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Create a post</Text>
      </Pressable>
    </View>
  );
}
