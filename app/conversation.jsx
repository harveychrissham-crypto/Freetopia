import {useCallback,useEffect,useState} from 'react';
import {Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {useAuth} from '../providers/AuthProvider';

export default function Conversation(){
 const{id}=useLocalSearchParams(),{user}=useAuth(),router=useRouter(),[info,setInfo]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(''),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState('');

 const load=useCallback(async()=>{
  if(!id||!user?.id)return;
  setLoading(true);
  const{data:c,error:ce}=await supabase.from('conversations').select('id,kind,title,conversation_members(user_id,request_status,profiles:user_id(id,username,display_name,avatar_url))').eq('id',id).maybeSingle();
  if(ce||!c){setError(ce?.message||'Conversation not found');setLoading(false);return}
  const me=(c.conversation_members||[]).find(x=>x.user_id===user.id);
  const other=(c.conversation_members||[]).find(x=>x.user_id!==user.id);
  setInfo({...c,me,other});
  if(me?.request_status==='accepted'){
   const{data:m,error:e}=await supabase.from('messages').select('id,conversation_id,sender_id,content,created_at,edited_at,deleted_at,profiles:sender_id(id,username,display_name,avatar_url)').eq('conversation_id',id).order('created_at',{ascending:true}).limit(200);
   if(e)setError(e.message);
   else{
    setMessages(m||[]);
    const unread=(m||[]).filter(x=>x.sender_id!==user.id&&!x.deleted_at);
    if(unread.length){
     const{data:reads}=await supabase.from('message_reads').select('message_id').eq('user_id',user.id).in('message_id',unread.map(x=>x.id));
     const seen=new Set((reads||[]).map(x=>x.message_id));
     const missing=unread.filter(x=>!seen.has(x.id)).map(x=>({message_id:x.id,user_id:user.id}));
     if(missing.length)await supabase.from('message_reads').insert(missing);
    }
   }
  }
  setLoading(false)
 },[id,user?.id]);

 useEffect(()=>{
  load();
  if(!id)return;
  const ch=supabase.channel('conversation-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+id},()=>load()).subscribe();
  return()=>{supabase.removeChannel(ch)}
 },[id,load]);

 const send=async()=>{
  const v=text.trim();
  if(!v||!info?.me||info.me.request_status!=='accepted'||sending)return;
  setSending(true);setError('');
  const{error:e}=await supabase.from('messages').insert({conversation_id:id,sender_id:user.id,content:v});
  if(e)setError(e.message);else setText('');
  setSending(false);
  if(!e)load()
 };

 const name=info?.other?.profiles?.display_name||info?.other?.profiles?.username||'Conversation';
 const handle=info?.other?.profiles?.username;
 const avatar=info?.other?.profiles?.avatar_url;
 const initials=(name||'?').slice(0,1).toUpperCase();

 const accept=async()=>{
  const{error:e}=await supabase.from('conversation_members').update({request_status:'accepted'}).eq('conversation_id',id).eq('user_id',user.id);
  if(e)setError(e.message);else load()
 };

 return <SafeAreaView style={s.safe}>
  <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={8}>
   <View style={s.head}>
    <Pressable onPress={()=>router.back()} hitSlop={10} style={s.backButton}><Text style={s.back}>‹</Text></Pressable>
    <View style={s.avatar}>
     {avatar?<Image source={{uri:avatar}} style={s.avatarImage}/>:<Text style={s.avatarText}>{initials}</Text>}
    </View>
    <View style={s.headCopy}>
     <Text style={s.name} numberOfLines={1}>{name}</Text>
     {handle&&<Text style={s.handle} numberOfLines={1}>@{handle}</Text>}
    </View>
    <Pressable onPress={()=>info?.other?.user_id&&router.push({pathname:'/profile',params:{id:info.other.user_id}})} hitSlop={10}><Text style={s.info}>i</Text></Pressable>
   </View>

   {error&&<Text style={s.err}>{error}</Text>}

   {loading?<View style={s.center}><Text style={s.muted}>Loading conversation…</Text></View>:
    info?.me?.request_status==='pending'?
     <View style={s.request}><View style={s.requestIcon}><Text style={s.requestIconText}>✦</Text></View><Text style={s.h}>Message request</Text><Text style={s.p}>Accept this request to read and send messages.</Text><Pressable onPress={accept} style={s.accept}><Text style={s.wh}>Accept request</Text></Pressable></View>:
     <><ScrollView style={s.scroll} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled">
      {messages.length===0&&<View style={s.empty}><Text style={s.emptyTitle}>No messages yet</Text><Text style={s.emptyText}>Start the conversation.</Text></View>}
      {messages.map(m=><View key={m.id} style={[s.row,m.sender_id===user.id?s.rowMine:s.rowTheirs]}>
       {m.sender_id!==user.id&&<View style={s.smallAvatar}>{m.profiles?.avatar_url?<Image source={{uri:m.profiles.avatar_url}} style={s.smallAvatarImage}/>:<Text style={s.smallAvatarText}>{(m.profiles?.display_name||m.profiles?.username||'?')[0].toUpperCase()}</Text>}</View>}
       <View style={[s.bubble,m.sender_id===user.id?s.mine:s.theirs]}>
        <Text style={[s.bt,m.sender_id===user.id&&s.mbt]}>{m.deleted_at?'Message deleted':m.content}</Text>
        <Text style={[s.time,m.sender_id===user.id&&s.mineTime]}>{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text>
       </View>
      </View>)}
     </ScrollView>
     <View style={s.composer}>
      <TextInput value={text} onChangeText={setText} placeholder="Write a message…" placeholderTextColor="#9b9ba3" style={s.input} multiline maxLength={2000}/>
      <Pressable disabled={sending||!text.trim()} onPress={send} style={[s.send,(!text.trim()||sending)&&s.sendDisabled]}><Text style={s.sendText}>{sending?'…':'Send'}</Text></Pressable>
     </View></>}
  </KeyboardAvoidingView>
 </SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#fff'},flex:{flex:1},head:{height:68,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:'#e9e9ee',flexDirection:'row',alignItems:'center',gap:11,backgroundColor:'#fff'},
 backButton:{width:28,height:40,justifyContent:'center'},back:{fontSize:32,lineHeight:34,color:'#17171b',fontWeight:'300'},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#17171b',alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:'#fff',fontSize:13,fontWeight:'800'},headCopy:{flex:1},name:{fontSize:14,fontWeight:'800',color:'#17171b'},handle:{marginTop:2,fontSize:10,color:'#777780'},info:{width:25,height:25,borderWidth:1,borderColor:'#d9d9df',borderRadius:13,textAlign:'center',lineHeight:23,color:'#696974',fontSize:13,fontWeight:'700'},
err:{paddingHorizontal:16,paddingVertical:10,color:'#9e2f2f',fontSize:12},center:{flex:1,justifyContent:'center',alignItems:'center'},muted:{color:'#777780',fontSize:13},
scroll:{flex:1,backgroundColor:'#fafafd'},messages:{paddingHorizontal:14,paddingVertical:18,gap:9,flexGrow:1,justifyContent:'flex-end'},row:{flexDirection:'row',alignItems:'flex-end',gap:7},rowMine:{justifyContent:'flex-end'},rowTheirs:{justifyContent:'flex-start'},bubble:{maxWidth:'78%',paddingHorizontal:12,paddingVertical:9,borderRadius:17},mine:{backgroundColor:'#17171b',borderBottomRightRadius:5},theirs:{backgroundColor:'#ececf1',borderBottomLeftRadius:5},bt:{fontSize:13,lineHeight:19,color:'#17171b'},mbt:{color:'#fff'},time:{marginTop:4,fontSize:9,color:'#8b8b93'},mineTime:{color:'#c7c7cc'},smallAvatar:{width:24,height:24,borderRadius:12,backgroundColor:'#17171b',overflow:'hidden',alignItems:'center',justifyContent:'center'},smallAvatarImage:{width:'100%',height:'100%'},smallAvatarText:{color:'#fff',fontSize:9,fontWeight:'800'},
empty:{alignItems:'center',paddingBottom:20},emptyTitle:{fontSize:14,fontWeight:'750',color:'#303038'},emptyText:{marginTop:4,fontSize:12,color:'#8a8a92'},request:{margin:20,padding:22,borderWidth:1,borderColor:'#e7e7ec',borderRadius:20,backgroundColor:'#f8f8fa',alignItems:'center'},requestIcon:{width:46,height:46,borderRadius:23,backgroundColor:'#17171b',alignItems:'center',justifyContent:'center'},requestIconText:{color:'#fff',fontSize:18},h:{marginTop:15,fontSize:18,fontWeight:'800',color:'#17171b'},p:{marginTop:7,fontSize:13,lineHeight:19,color:'#696974',textAlign:'center'},accept:{marginTop:17,height:40,paddingHorizontal:18,borderRadius:11,backgroundColor:'#6546f5',justifyContent:'center'},wh:{color:'#fff',fontSize:11,fontWeight:'800'},
composer:{paddingHorizontal:12,paddingVertical:9,borderTopWidth:1,borderTopColor:'#e9e9ee',backgroundColor:'#fff',flexDirection:'row',alignItems:'flex-end',gap:8},input:{flex:1,minHeight:42,maxHeight:96,paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderColor:'#dedee5',borderRadius:16,color:'#17171b',fontSize:13,backgroundColor:'#fafafd'},send:{minWidth:55,height:42,paddingHorizontal:13,borderRadius:13,backgroundColor:'#6546f5',alignItems:'center',justifyContent:'center'},sendDisabled:{backgroundColor:'#d7d7dc'},sendText:{color:'#fff',fontSize:11,fontWeight:'800'}
});