import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function Create() {
  const r = useRouter();
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const content = text.trim();
    if (!content || !user || saving) return;
    setSaving(true);
    setError('');
    const { error: insertError } = await supabase.from('posts').insert({
      author_id: user.id,
      content,
      visibility: 'public',
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    r.replace('/home');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Your profile';
  const handle = profile?.username ? '@' + profile.username : '';

  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={s.header}><Pressable onPress={() => r.back()}><Text style={s.cancel}>Cancel</Text></Pressable><Text style={s.title}>Create a post</Text><Pressable disabled={!text.trim() || saving} onPress={submit}><Text style={[s.post, (!text.trim() || saving) && s.disabled]}>{saving ? 'Posting…' : 'Post'}</Text></Pressable></View>
    <View style={s.identity}><View style={s.avatar}><Text style={s.avatarText}>{displayName.charAt(0).toUpperCase()}</Text></View><View><Text style={s.name}>{displayName}</Text>{!!handle && <Text style={s.handle}>{handle}</Text>}</View></View>
    <TextInput autoFocus multiline maxLength={5000} value={text} onChangeText={setText} placeholder="What’s on your mind?" placeholderTextColor="#9a9aa3" style={s.input}/>
    {!!error && <Text style={s.error}>{error}</Text>}
    <View style={s.tools}><Text style={s.toolDisabled}>Media</Text><Text style={s.toolDisabled}>Poll</Text><Text style={s.toolDisabled}>Link</Text></View>
    <View style={s.visibility}><Text style={s.visLabel}>Visibility</Text><Text style={s.visValue}>Public</Text></View>
  </KeyboardAvoidingView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#fff'},wrap:{flex:1,paddingHorizontal:20},header:{height:60,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#e8e8ec'},cancel:{fontSize:13,color:'#696974'},title:{fontSize:16,fontWeight:'750',color:'#17171b'},post:{fontSize:13,fontWeight:'750',color:'#6546f5'},disabled:{opacity:.35},identity:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:18},avatar:{width:40,height:40,borderRadius:20,backgroundColor:'#17171b',alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'750'},name:{fontSize:13,fontWeight:'700',color:'#17171b'},handle:{marginTop:2,fontSize:11,color:'#8a8a94'},input:{minHeight:180,fontSize:18,lineHeight:27,color:'#17171b',textAlignVertical:'top'},error:{fontSize:12,lineHeight:18,color:'#c93636',marginBottom:8},tools:{flexDirection:'row',gap:20,paddingVertical:13,borderTopWidth:1,borderBottomWidth:1,borderColor:'#e8e8ec'},toolDisabled:{fontSize:12,color:'#a2a2aa'},visibility:{marginTop:15,flexDirection:'row',justifyContent:'space-between',padding:14,borderWidth:1,borderColor:'#e8e8ec',borderRadius:14},visLabel:{fontSize:12,color:'#696974'},visValue:{fontSize:12,fontWeight:'700',color:'#17171b'}});