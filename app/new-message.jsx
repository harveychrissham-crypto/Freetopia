import {useEffect,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {useAuth} from '../providers/AuthProvider';

export default function NewMessage(){
 const{user}=useAuth(),router=useRouter(),{userId}=useLocalSearchParams();
 const[q,setQ]=useState(''),[people,setPeople]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');

 useEffect(()=>{
  let active=true;
  const loadTarget=async()=>{
   if(!userId||Array.isArray(userId)||userId===user?.id)return;
   const{data,error:e}=await supabase.from('profiles').select('id,username,display_name,bio').eq('id',userId).maybeSingle();
   if(!active)return;
   if(e)setError(e.message);
   else if(data)setPeople([data]);
   else setError('That member could not be found.');
  };
  loadTarget();
  return()=>{active=false};
 },[userId,user?.id]);

 const search=async()=>{
  const v=q.trim();
  if(!v)return;
  setError('');
  const{data,error:e}=await supabase.from('profiles')
   .select('id,username,display_name,bio')
   .neq('id',user?.id||'')
   .or('username.ilike.%'+v+'%,display_name.ilike.%'+v+'%')
   .limit(20);
  if(e)setError(e.message);
  else setPeople(data||[]);
 };

 const start=async id=>{
  setBusy(true);
  setError('');
  const{data,error:e}=await supabase.rpc('create_direct_conversation',{target_user_id:id});
  if(e)setError(e.message);
  else router.replace({pathname:'/conversation',params:{id:data}});
  setBusy(false);
 };

 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Back</Text></Pressable>
  <Text style={s.title}>New message</Text>
  <Text style={s.lead}>{userId?'Start a conversation with this Freetopia member.':'Search a Freetopia member to start a conversation.'}</Text>
  <View style={s.search}><TextInput value={q} onChangeText={setQ} onSubmitEditing={search} placeholder="Name or username" placeholderTextColor="#999" style={s.input}/><Pressable onPress={search} style={s.go}><Text style={s.wh}>Search</Text></Pressable></View>
  {error&&<Text style={s.err}>{error}</Text>}
  {people.map(p=><Pressable key={p.id} disabled={busy} onPress={()=>start(p.id)} style={s.person}>
   <View style={s.avatar}><Text style={s.avt}>{(p.display_name||p.username||'?')[0].toUpperCase()}</Text></View>
   <View style={{flex:1}}><Text style={s.name}>{p.display_name||p.username}</Text>{p.username&&<Text style={s.handle}>@{p.username}</Text>}</View>
   <Text style={s.next}>›</Text>
  </Pressable>)}
 </ScrollView></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#fff'},content:{padding:20},back:{color:'#6546f5',fontSize:13,fontWeight:'700'},
 title:{marginTop:22,fontSize:30,fontWeight:'760',color:'#17171b'},lead:{marginTop:8,fontSize:14,lineHeight:21,color:'#696974'},
 search:{marginTop:20,height:48,flexDirection:'row',borderWidth:1,borderColor:'#e8e8ec',borderRadius:13,overflow:'hidden'},
 input:{flex:1,paddingHorizontal:13,color:'#17171b'},go:{paddingHorizontal:15,justifyContent:'center',backgroundColor:'#17171b'},wh:{color:'#fff',fontSize:10,fontWeight:'700'},
 err:{marginTop:14,color:'#9e2f2f',fontSize:12},person:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#e8e8ec'},
 avatar:{width:42,height:42,borderRadius:21,backgroundColor:'#17171b',alignItems:'center',justifyContent:'center'},avt:{color:'#fff',fontWeight:'700'},
 name:{fontSize:13,fontWeight:'700',color:'#17171b'},handle:{fontSize:11,color:'#696974'},next:{fontSize:22,color:'#999'}
});