import {useEffect,useState} from 'react';
import {Image,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {useAuth} from '../providers/AuthProvider';

export default function NewMessage(){
 const{user}=useAuth(),router=useRouter(),{userId}=useLocalSearchParams();
 const[q,setQ]=useState(''),[people,setPeople]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[searched,setSearched]=useState(false);

 useEffect(()=>{
  let active=true;
  const loadTarget=async()=>{
   if(!userId||Array.isArray(userId)||userId===user?.id)return;
   const{data,error:e}=await supabase.from('profiles').select('id,username,display_name,bio,avatar_url').eq('id',userId).maybeSingle();
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
  if(!v){setPeople([]);setSearched(false);return}
  setError('');setSearched(true);
  const{data,error:e}=await supabase.from('profiles').select('id,username,display_name,bio,avatar_url').neq('id',user?.id||'').or('username.ilike.%'+v+'%,display_name.ilike.%'+v+'%').limit(20);
  if(e)setError(e.message);else setPeople(data||[]);
 };

 const start=async id=>{
  setBusy(true);setError('');
  const{data,error:e}=await supabase.rpc('create_direct_conversation',{target_user_id:id});
  if(e)setError(e.message);else router.replace({pathname:'/conversation',params:{id:data}});
  setBusy(false);
 };

 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <Pressable onPress={()=>router.back()} hitSlop={8}><Text style={s.back}>‹  Back</Text></Pressable>
  <View style={s.hero}><View style={s.icon}><Text style={s.iconText}>✦</Text></View><Text style={s.title}>New message</Text><Text style={s.lead}>{userId?'Start a conversation with this Freetopia member.':'Find someone on Freetopia and start a conversation.'}</Text></View>
  <View style={s.search}><TextInput value={q} onChangeText={setQ} onSubmitEditing={search} returnKeyType="search" placeholder="Search by name or username" placeholderTextColor="#999" style={s.input}/><Pressable onPress={search} style={s.go}><Text style={s.wh}>Search</Text></Pressable></View>
  {error&&<Text style={s.err}>{error}</Text>}
  {searched&&!people.length&&!error&&<View style={s.empty}><Text style={s.emptyTitle}>No members found</Text><Text style={s.emptyText}>Try a different name or username.</Text></View>}
  {!!people.length&&<Text style={s.section}>MEMBERS</Text>}
  {people.map(p=><Pressable key={p.id} disabled={busy} onPress={()=>start(p.id)} style={({pressed})=>[s.person,pressed&&s.pressed]}>
   <View style={s.avatar}>{p.avatar_url?<Image source={{uri:p.avatar_url}} style={s.avatarImage}/>:<Text style={s.avt}>{(p.display_name||p.username||'?')[0].toUpperCase()}</Text>}</View>
   <View style={{flex:1}}><Text style={s.name}>{p.display_name||p.username}</Text>{p.username&&<Text style={s.handle}>@{p.username}</Text>}{p.bio&&<Text style={s.bio} numberOfLines={1}>{p.bio}</Text>}</View>
   <Text style={s.next}>›</Text>
  </Pressable>)}
 </ScrollView></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#fff'},content:{padding:20,paddingBottom:40},back:{color:'#6546f5',fontSize:13,fontWeight:'750'},
 hero:{marginTop:24,alignItems:'center'},icon:{width:50,height:50,borderRadius:25,backgroundColor:'#17171b',alignItems:'center',justifyContent:'center'},iconText:{color:'#fff',fontSize:18},title:{marginTop:16,fontSize:30,fontWeight:'800',color:'#17171b'},lead:{marginTop:7,maxWidth:330,textAlign:'center',fontSize:13,lineHeight:20,color:'#696974'},
 search:{marginTop:24,height:48,flexDirection:'row',borderWidth:1,borderColor:'#e4e4e9',borderRadius:14,overflow:'hidden',backgroundColor:'#fafafd'},input:{flex:1,paddingHorizontal:13,color:'#17171b',fontSize:13},go:{paddingHorizontal:16,justifyContent:'center',backgroundColor:'#17171b'},wh:{color:'#fff',fontSize:10,fontWeight:'800'},
 err:{marginTop:14,color:'#9e2f2f',fontSize:12},section:{marginTop:24,marginBottom:4,fontSize:10,fontWeight:'800',letterSpacing:1.2,color:'#92929a'},person:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#e8e8ec'},pressed:{opacity:.65},avatar:{width:44,height:44,borderRadius:22,backgroundColor:'#17171b',alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:'100%',height:'100%'},avt:{color:'#fff',fontWeight:'800',fontSize:13},name:{fontSize:13,fontWeight:'750',color:'#17171b'},handle:{marginTop:2,fontSize:10,color:'#696974'},bio:{marginTop:3,fontSize:10,color:'#9999a1'},next:{fontSize:23,color:'#999'},empty:{marginTop:50,alignItems:'center'},emptyTitle:{fontSize:14,fontWeight:'750',color:'#303038'},emptyText:{marginTop:5,fontSize:12,color:'#8a8a92'}
});