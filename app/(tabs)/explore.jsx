import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const c={ink:'#17171b',muted:'#696974',line:'#e8e8ec',surface:'#f7f7f9',accent:'#6546f5'};

export default function Explore(){
 const r=useRouter();
 const {user}=useAuth(); const [q,setQ]=useState(''); const [t,setT]=useState('People'); const [results,setResults]=useState([]); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
 const search=useCallback(async()=>{
  const value=q.trim();
  if(!value){setResults([]);setError('');return;}
  setLoading(true);setError('');
  const {data,error:queryError}=await supabase.from('profiles').select('id,username,display_name,bio').or('username.ilike.%'+value+'%,display_name.ilike.%'+value+'%').neq('id',user?.id||'').limit(20);
  if(queryError)setError(queryError.message);else{
   const ids=(data||[]).map(x=>x.id);
   let followed=new Set();
   if(user&&ids.length){const {data:follows}=await supabase.from('follows').select('following_id').eq('follower_id',user.id).eq('status','accepted').in('following_id',ids);followed=new Set((follows||[]).map(x=>x.following_id));}
   setResults((data||[]).map(person=>({...person,followed:followed.has(person.id)})));
  }
  setLoading(false);
 },[q,user?.id]);
 useFocusEffect(useCallback(()=>{if(!q.trim())setResults([]);},[q]));
 const toggleFollow=async person=>{
  if(!user)return;
  const was=person.followed;
  setResults(current=>current.map(x=>x.id===person.id?{...x,followed:!was}:x));
  const query=was
   ?supabase.from('follows').delete().eq('follower_id',user.id).eq('following_id',person.id)
   :supabase.from('follows').insert({follower_id:user.id,following_id:person.id,status:'accepted'});
  const {error:mutationError}=await query;
  if(mutationError)setResults(current=>current.map(x=>x.id===person.id?{...x,followed:was}:x));
 };
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <Text style={s.eyebrow}>DISCOVER</Text><Text style={s.title}>Look around.</Text><Text style={s.lead}>Find people, conversations, topics, and communities.</Text>
  <View style={s.search}><Text style={s.icon}>⌕</Text><TextInput value={q} onChangeText={setQ} onSubmitEditing={search} returnKeyType="search" placeholder="Search people" placeholderTextColor="#8a8a94" style={s.input}/><Pressable onPress={search} style={s.searchButton}><Text style={s.searchButtonText}>Search</Text></Pressable></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{['All','People','Posts','Communities'].map(x=><Pressable key={x} onPress={()=>setT(x)} style={[s.tab,t===x&&s.active]}><Text style={[s.tabText,t===x&&s.activeText]}>{x}</Text></Pressable>)}</ScrollView>
  {t==='People'&&<View>{loading&&<Text style={s.muted}>Searching…</Text>}{!!error&&<View style={s.error}><Text style={s.errorText}>{error}</Text></View>}{!loading&&q.trim()&&!results.length&&!error&&<View style={s.card}><Text style={s.cardTitle}>No people found</Text><Text style={s.body}>Try a different name or username.</Text></View>}{results.map(person=><View key={person.id} style={s.person}><View style={s.avatar}><Text style={s.avatarText}>{(person.display_name||person.username||'?').charAt(0).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={s.personName}>{person.display_name||person.username||'Freetopia member'}</Text>{person.username&&<Text style={s.handle}>@{person.username}</Text>}{person.bio&&<Text numberOfLines={1} style={s.bio}>{person.bio}</Text>}</View><View style={s.actions}><Pressable onPress={()=>toggleFollow(person)} style={[s.follow,person.followed&&s.following]}><Text style={[s.followText,person.followed&&s.followingText]}>{person.followed?'Following':'Follow'}</Text></Pressable><Pressable onPress={()=>r.push({pathname:'/new-message',params:{userId:person.id}})} style={s.message}><Text style={s.messageText}>Message</Text></Pressable></View></View>)}</View>}
  {t!=='People'&&<View style={s.card}><View style={s.iconBox}><Text>✦</Text></View><Text style={s.cardTitle}>{q.trim()?'Search for people first':'Discover real Freetopia content.'}</Text><Text style={s.body}>This section stays truthful until the corresponding posts and communities search queries are wired.</Text></View>}
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#fff'},content:{padding:20,paddingBottom:30},eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1.5,color:c.accent},title:{marginTop:8,fontSize:31,fontWeight:'760',letterSpacing:-1.1,color:c.ink},lead:{marginTop:8,fontSize:14,lineHeight:21,color:c.muted},search:{height:48,marginTop:22,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:13,borderWidth:1,borderColor:c.line,borderRadius:14,backgroundColor:c.surface},icon:{fontSize:23,color:c.muted},input:{flex:1,fontSize:14,color:c.ink},searchButton:{height:34,paddingHorizontal:12,borderRadius:10,backgroundColor:c.ink,justifyContent:'center'},searchButtonText:{fontSize:11,fontWeight:'700',color:'#fff'},tabs:{gap:7,paddingVertical:17},tab:{paddingHorizontal:14,height:34,borderRadius:17,justifyContent:'center',borderWidth:1,borderColor:c.line},active:{backgroundColor:c.ink,borderColor:c.ink},tabText:{fontSize:11,fontWeight:'650',color:c.muted},activeText:{color:'#fff'},card:{padding:22,borderWidth:1,borderColor:c.line,borderRadius:18,backgroundColor:c.surface},iconBox:{width:42,height:42,borderRadius:14,backgroundColor:'#efedff',alignItems:'center',justifyContent:'center'},cardTitle:{marginTop:14,fontSize:18,fontWeight:'700',color:c.ink},body:{marginTop:7,fontSize:13,lineHeight:20,color:c.muted},muted:{fontSize:12,color:c.muted},error:{padding:12,borderRadius:12,backgroundColor:'#fff7f7'},errorText:{fontSize:12,color:'#9e2f2f'},person:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:13,borderBottomWidth:1,borderBottomColor:c.line},avatar:{width:42,height:42,borderRadius:21,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'750'},personName:{fontSize:13,fontWeight:'750',color:c.ink},handle:{marginTop:2,fontSize:11,color:c.muted},bio:{marginTop:4,fontSize:11,color:c.muted},follow:{height:34,minWidth:78,paddingHorizontal:12,borderRadius:10,backgroundColor:c.ink,alignItems:'center',justifyContent:'center'},following:{backgroundColor:'#fff',borderWidth:1,borderColor:c.line},actions:{alignItems:'flex-end',gap:5},message:{height:28,paddingHorizontal:10,borderRadius:8,borderWidth:1,borderColor:c.line,justifyContent:'center'},messageText:{fontSize:9,fontWeight:'700',color:c.ink},followText:{fontSize:11,fontWeight:'700',color:'#fff'},followingText:{color:c.ink}});
