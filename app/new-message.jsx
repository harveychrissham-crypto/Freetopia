import {useEffect,useRef,useState} from 'react';
import AppIcon from '../components/AppIcon';
import { getImageUrl } from '../lib/imageUrl';
import {Image,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {useAuth} from '../providers/AuthProvider';

export default function NewMessage(){
 const mountedRef=useRef(true); const searchSeq=useRef(0); const{user}=useAuth(),router=useRouter(),{userId}=useLocalSearchParams();
 const[q,setQ]=useState(''),[people,setPeople]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[searched,setSearched]=useState(false),[groupMode,setGroupMode]=useState(false),[groupName,setGroupName]=useState(''),[selected,setSelected]=useState([]);

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
 useEffect(()=>()=>{mountedRef.current=false;searchSeq.current+=1},[]);

 const search=async()=>{
  const v=q.replace(/[,()%_*\\]/g,' ').trim();
  if(!v){setPeople([]);setSearched(false);return}
  const seq=++searchSeq.current;
  setError('');setSearched(true);
  try{
   const{data,error:e}=await supabase.from('profiles').select('id,username,display_name,bio,avatar_url').neq('id',user?.id||'').or('username.ilike.%'+v+'%,display_name.ilike.%'+v+'%').limit(20);
   if(!mountedRef.current||seq!==searchSeq.current)return;
   if(e)throw e;
   setPeople(data||[]);
  }catch(e){if(mountedRef.current&&seq===searchSeq.current)setError(e?.message||'Unable to search members. Please try again.');}
 };

 const toggle= id=>setSelected(cur=>cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]);
 const createGroup=async()=>{
  if(busy||!groupName.trim()||!selected.length||!mountedRef.current)return;
  setBusy(true);setError('');
  try{
   const{data,error:e}=await supabase.rpc('create_group_conversation',{group_title:groupName.trim(),member_ids:selected});
   if(e)throw e;
   if(!data)throw new Error('The group conversation could not be created.');
   if(mountedRef.current)router.replace({pathname:'/conversation',params:{id:data}});
  }catch(e){if(mountedRef.current)setError(e?.message||'Unable to create the group. Please try again.');}
  finally{if(mountedRef.current)setBusy(false);}
 };
 const start=async id=>{
  if(busy||!id||!mountedRef.current)return;
  setBusy(true);setError('');
  try{
   const{data,error:e}=await supabase.rpc('create_message_request',{target_user_id:id});
   if(e)throw e;
   if(!data)throw new Error('The conversation could not be created.');
   if(mountedRef.current)router.replace({pathname:'/conversation',params:{id:data}});
  }catch(e){if(mountedRef.current)setError(e?.message||'Unable to start the conversation. Please try again.');}
  finally{if(mountedRef.current)setBusy(false);}
 };

 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <View style={s.top}><Pressable onPress={()=>router.back()} hitSlop={8} style={s.backButton}><AppIcon name="arrow-left" size={18}/></Pressable><Text style={s.topTitle}>New message</Text><View style={s.topSpacer}/></View>
  <View style={s.hero}><View style={s.icon}><AppIcon name="message" size={20} color="#E9EEF4"/></View><Text style={s.title}>{groupMode?'Create a group':'Start a conversation'}</Text><Text style={s.lead}>{groupMode?'Choose people and create a group chat.':userId?'Message this Freetopia member directly.':'Find someone on Freetopia and start a conversation.'}</Text></View><Pressable onPress={()=>{setGroupMode(!groupMode);setSelected([])}} style={s.modeSwitch}><Text style={s.modeSwitchText}>{groupMode?'Start a direct message':'Create a group chat'}</Text></Pressable>{groupMode&&<View style={s.groupNameBox}><TextInput value={groupName} onChangeText={setGroupName} placeholder="Group name" placeholderTextColor="#718092" style={s.input}/><Pressable onPress={createGroup} disabled={!groupName.trim()||!selected.length||busy} style={[s.go,(!groupName.trim()||!selected.length||busy)&&s.goDisabled]}><Text style={s.wh}>Create</Text></Pressable></View>}
  <View style={s.search}><TextInput value={q} onChangeText={setQ} onSubmitEditing={search} returnKeyType="search" placeholder="Search by name or username" placeholderTextColor="#718092" style={s.input}/><Pressable onPress={search} disabled={!q.trim()||busy} style={[s.go,(!q.trim()||busy)&&s.goDisabled]}><Text style={s.wh}>Search</Text></Pressable></View>
  {error&&<Text style={s.err}>{error}</Text>}
  {searched&&!people.length&&!error&&<View style={s.empty}><Text style={s.emptyTitle}>No members found</Text><Text style={s.emptyText}>Try a different name or username.</Text></View>}
  {!!people.length&&<Text style={s.section}>MEMBERS</Text>}
  {people.map(p=><Pressable key={p.id} disabled={busy} onPress={()=>groupMode?toggle(p.id):start(p.id)} style={({pressed})=>[s.person,pressed&&s.pressed]}>
   <View style={s.avatar}>{p.avatar_url?<Image source={{uri:getImageUrl(p.avatar_url,{width:800,height:800,quality:100})}} style={s.avatarImage}/>:<Text style={s.avt}>{(p.display_name||p.username||'?')[0].toUpperCase()}</Text>}</View>
   <View style={{flex:1}}><Text style={s.name}>{p.display_name||p.username}</Text>{p.username&&<Text style={s.handle}>@{p.username}</Text>}{p.bio&&<Text style={s.bio} numberOfLines={1}>{p.bio}</Text>}</View>
   {groupMode?<View style={[s.checkCircle,selected.includes(p.id)&&s.checked]}>{selected.includes(p.id)?<AppIcon name="check" size={13} color="#E9EEF4"/>:null}</View>:<AppIcon name="chevron-right" size={18} color="#9DB5D1"/>}
  </Pressable>)}
 </ScrollView></SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#060B12'},content:{padding:20,paddingBottom:40},top:{height:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},backButton:{width:32,height:36,justifyContent:'center'},back:{fontSize:30,lineHeight:32,color:'#E9EEF4',fontWeight:'300'},topTitle:{fontSize:15,fontWeight:'800',color:'#E9EEF4'},topSpacer:{width:32},
 modeSwitch:{marginTop:16,height:38,borderRadius:11,borderWidth:1,borderColor:'#263B52',alignItems:'center',justifyContent:'center',backgroundColor:'#0E1824'},modeSwitchText:{color:'#AFC7E1',fontSize:10,fontWeight:'800'},groupNameBox:{marginTop:12,height:48,flexDirection:'row',borderWidth:1,borderColor:'#182533',borderRadius:14,overflow:'hidden',backgroundColor:'#0A121C'},checkCircle:{width:24,height:24,borderRadius:12,borderWidth:1,borderColor:'#39516B',alignItems:'center',justifyContent:'center'},checked:{backgroundColor:'#4B78A8',borderColor:'#4B78A8'},checkText:{color:'#F4F6F8',fontSize:12,fontWeight:'800'},hero:{marginTop:24,alignItems:'center'},icon:{width:50,height:50,borderRadius:25,backgroundColor:'#253447',alignItems:'center',justifyContent:'center'},iconText:{color:'#F4F6F8',fontSize:18},title:{marginTop:16,fontSize:30,fontWeight:'800',color:'#E9EEF4'},lead:{marginTop:7,maxWidth:330,textAlign:'center',fontSize:13,lineHeight:20,color:'#7F8D9D'},
 search:{marginTop:24,height:48,flexDirection:'row',borderWidth:1,borderColor:'#182533',borderRadius:14,overflow:'hidden',backgroundColor:'#0A121C'},input:{flex:1,paddingHorizontal:13,color:'#E9EEF4',fontSize:13},go:{paddingHorizontal:16,justifyContent:'center',backgroundColor:'#4B78A8'},goDisabled:{backgroundColor:'#202B3A'},wh:{color:'#F4F6F8',fontSize:10,fontWeight:'800'},
 err:{marginTop:14,padding:10,borderRadius:10,backgroundColor:'#21151B',color:'#D78A98',fontSize:12},section:{marginTop:24,marginBottom:4,fontSize:10,fontWeight:'800',letterSpacing:1.2,color:'#68798C'},person:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#182533'},pressed:{opacity:.65},avatar:{width:44,height:44,borderRadius:22,backgroundColor:'#253447',alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:'100%',height:'100%'},avt:{color:'#E9EEF4',fontWeight:'800',fontSize:13},name:{fontSize:13,fontWeight:'700',color:'#E9EEF4'},handle:{marginTop:2,fontSize:10,color:'#7F8D9D'},bio:{marginTop:3,fontSize:10,color:'#8B98A7'},next:{fontSize:23,color:'#68798C'},empty:{marginTop:50,alignItems:'center'},emptyTitle:{fontSize:14,fontWeight:'800',color:'#DCE5ED'},emptyText:{marginTop:5,fontSize:12,color:'#7F8D9D'}
});