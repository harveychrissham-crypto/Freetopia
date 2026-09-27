import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function EditProfile() {
  const r = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUsername(profile?.username || '');
    setName(profile?.display_name || '');
    setBio(profile?.bio || '');
  }, [profile]);

  const save = async () => {
    if (!user || saving) return;
    setSaving(true); setError('');
    const { error: updateError } = await supabase.from('profiles').update({
      username: username.trim() || null,
      display_name: name.trim() || null,
      bio: bio.trim() || null,
    }).eq('id', user.id);
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    await refreshProfile();
    r.back();
  };

  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView contentContainerStyle={s.content}>
    <View style={s.header}><Pressable onPress={()=>r.back()}><Text style={s.cancel}>Cancel</Text></Pressable><Text style={s.title}>Edit profile</Text><Pressable onPress={save} disabled={saving}><Text style={[s.save,saving&&s.disabled]}>{saving?'Saving…':'Save'}</Text></Pressable></View>
    <View style={s.avatar}><Text style={s.avatarText}>{(name || user?.email || '?').charAt(0).toUpperCase()}</Text></View>
    <Text style={s.label}>Username</Text><TextInput style={s.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="username" placeholderTextColor="#8a8a94"/>
    <Text style={s.label}>Display name</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#8a8a94"/>
    <Text style={s.label}>Bio</Text><TextInput style={[s.input,s.bio]} value={bio} onChangeText={setBio} multiline placeholder="A little about you" placeholderTextColor="#8a8a94"/>
    {!!error && <Text style={s.error}>{error}</Text>}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#fff'},content:{padding:20},header:{height:55,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#e8e8ec',marginBottom:24},title:{fontSize:16,fontWeight:'750',color:'#17171b'},cancel:{fontSize:13,color:'#696974'},save:{fontSize:13,fontWeight:'750',color:'#6546f5'},disabled:{opacity:.35},avatar:{width:76,height:76,borderRadius:38,backgroundColor:'#17171b',alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:28},avatarText:{color:'#fff',fontSize:25,fontWeight:'750'},label:{fontSize:11,fontWeight:'700',color:'#696974',marginBottom:7,marginTop:13},input:{height:48,paddingHorizontal:13,borderWidth:1,borderColor:'#e8e8ec',borderRadius:13,fontSize:14,color:'#17171b',backgroundColor:'#f7f7f9'},bio:{height:120,textAlignVertical:'top',paddingTop:13},error:{marginTop:15,fontSize:12,lineHeight:18,color:'#c93636'}});