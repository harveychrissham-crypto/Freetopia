import {useCallback,useEffect,useRef,useState} from 'react';
import AppIcon from '../components/AppIcon';
import { getImageUrl } from '../lib/imageUrl';
import {Alert,Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {useAuth} from '../providers/AuthProvider';

export default function Conversation(){
 const{id}=useLocalSearchParams(),{user}=useAuth(),router=useRouter(),scrollRef=useRef(null),[info,setInfo]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(''),[editingId,setEditingId]=useState(null),[selectedMessage,setSelectedMessage]=useState(null),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState('');

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
  const ch=supabase.channel('conversation-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+id},async payload=>{
   const incoming=payload.new;
   if(!incoming?.id)return;
   const{data:message}=await supabase.from('messages').select('id,conversation_id,sender_id,content,created_at,edited_at,deleted_at,profiles:sender_id(id,username,display_name,avatar_url)').eq('id',incoming.id).maybeSingle();
   if(!message)return;
   setMessages(current=>current.some(x=>x.id===message.id)?current:[...current,message].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)));
   if(message.sender_id!==user?.id&&!message.deleted_at){await supabase.from('message_reads').upsert({message_id:message.id,user_id:user.id},{onConflict:'message_id,user_id'});}
  })
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:'conversation_id=eq.'+id},async payload=>{
   const incoming=payload.new;
   if(!incoming?.id)return;
   const{data:message}=await supabase.from('messages').select('id,conversation_id,sender_id,content,created_at,edited_at,deleted_at,profiles:sender_id(id,username,display_name,avatar_url)').eq('id',incoming.id).maybeSingle();
   if(!message)return;
   setMessages(current=>current.map(x=>x.id===message.id?message:x));
  }).subscribe();
  return()=>{supabase.removeChannel(ch)}
 },[id,load,user?.id]);

 useEffect(()=>{
  if(messages.length)requestAnimationFrame(()=>scrollRef.current?.scrollToEnd({animated:true}));
 },[messages.length]);

 const send=async()=>{
  const v=text.trim();
  if(!v||!info?.me||info.me.request_status!=='accepted'||sending)return;
  setSending(true);setError('');
  if(editingId){
   const{error:e}=await supabase.from('messages').update({content:v,edited_at:new Date().toISOString()}).eq('id',editingId).eq('sender_id',user.id);
   if(e)setError(e.message);else{setText('');setEditingId(null);}
  }else{
   const{error:e}=await supabase.from('messages').insert({conversation_id:id,sender_id:user.id,content:v});
   if(e)setError(e.message);else setText('');
  }
  setSending(false);
 };

 const editMessage=(m)=>{
  setEditingId(m.id);
  setText(m.content||'');
  setError('');
 };

 const deleteMessage=(m)=>{
  Alert.alert('Delete message','Delete this message for everyone?',[
   {text:'Cancel',style:'cancel'},
   {text:'Delete',style:'destructive',onPress:async()=>{
    const{error:e}=await supabase.from('messages').update({deleted_at:new Date().toISOString()}).eq('id',m.id).eq('sender_id',user.id);
    if(e)setError(e.message);
   }}
  ]);
 };

 const name=info?.other?.profiles?.display_name||info?.other?.profiles?.username||'Conversation';
 const handle=info?.other?.profiles?.username;
 const avatar=info?.other?.profiles?.avatar_url;
 const initials=(name||'?').slice(0,1).toUpperCase();

 const accept=async()=>{
  setError('');
  const{error:e}=await supabase.from('conversation_members').update({request_status:'accepted'}).eq('conversation_id',id).eq('user_id',user.id);
  if(e)setError(e.message);else load()
 };

 return <SafeAreaView style={s.safe}>
  <KeyboardAvoidingView style={s.flex} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={8}>
   <View style={s.head}>
    <Pressable onPress={()=>router.back()} hitSlop={10} style={s.backButton}><AppIcon name="arrow-left" size={18}/></Pressable>
    <View style={s.avatar}>
     {avatar?<Image source={{uri:getImageUrl(avatar,{width:800,height:800,quality:100})}} style={s.avatarImage}/>:<Text style={s.avatarText}>{initials}</Text>}
    </View>
    <View style={s.headCopy}>
     <Text style={s.name} numberOfLines={1}>{name}</Text>
     {handle&&<Text style={s.handle} numberOfLines={1}>@{handle}</Text>}
    </View>
    <Pressable onPress={()=>info?.other?.user_id&&router.push({pathname:'/profile',params:{id:info.other.user_id}})} hitSlop={10} style={s.info}><Text style={s.infoText}>i</Text></Pressable>
   </View>

   {error&&<Text style={s.err}>{error}</Text>}

   {loading?<View style={s.center}><Text style={s.muted}>Loading conversation…</Text></View>:
    info?.me?.request_status==='pending'?
     <View style={s.request}><View style={s.requestIcon}><Text style={s.requestIconText}>✦</Text></View><Text style={s.h}>Message request</Text><Text style={s.p}>Accept this request to read and send messages.</Text><Pressable onPress={accept} style={s.accept}><Text style={s.wh}>Accept request</Text></Pressable></View>:
     <><ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled">
      {messages.length===0&&<View style={s.empty}><Text style={s.emptyTitle}>No messages yet</Text><Text style={s.emptyText}>Start the conversation.</Text></View>}
      {messages.map(m=><View key={m.id} style={[s.row,m.sender_id===user.id?s.rowMine:s.rowTheirs]}>
       {m.sender_id!==user.id&&<View style={s.smallAvatar}>{m.profiles?.avatar_url?<Image source={{uri:getImageUrl(m.profiles.avatar_url,{width:800,height:800,quality:100})}} style={s.smallAvatarImage}/>:<Text style={s.smallAvatarText}>{(m.profiles?.display_name||m.profiles?.username||'?')[0].toUpperCase()}</Text>}</View>}
       <Pressable onLongPress={()=>m.sender_id===user.id&&!m.deleted_at&&setSelectedMessage(m)} style={[s.bubble,m.sender_id===user.id?s.mine:s.theirs]}>
        <Text style={[s.bt,m.sender_id===user.id&&s.mbt]}>{m.deleted_at?'Message deleted':m.content}</Text>
        <Text style={[s.time,m.sender_id===user.id&&s.mineTime]}>{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}{m.edited_at&&!m.deleted_at?' · edited':''}</Text>
       </Pressable>
      </View>)}
     </ScrollView>
     {selectedMessage&&<View style={s.actionBar}><Text style={s.actionLabel}>Message options</Text><Pressable onPress={()=>{editMessage(selectedMessage);setSelectedMessage(null)}}><Text style={s.action}>Edit</Text></Pressable><Pressable onPress={()=>{deleteMessage(selectedMessage);setSelectedMessage(null)}}><Text style={s.actionDanger}>Delete</Text></Pressable><Pressable onPress={()=>setSelectedMessage(null)}><Text style={s.actionMuted}>Cancel</Text></Pressable></View>}
     <View style={s.composer}>
      <TextInput value={text} onChangeText={setText} placeholder={editingId?'Edit message…':'Write a message…'} placeholderTextColor="#718092" style={s.input} multiline maxLength={2000}/>
      <Pressable disabled={sending||!text.trim()} onPress={send} style={[s.send,(!text.trim()||sending)&&s.sendDisabled]}><Text style={s.sendText}>{sending?'…':editingId?'Save':'Send'}</Text></Pressable>
     </View></>}
  </KeyboardAvoidingView>
 </SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#060B12'},flex:{flex:1},head:{height:68,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:'#182533',flexDirection:'row',alignItems:'center',gap:11,backgroundColor:'#0A121C'},
 backButton:{width:28,height:40,justifyContent:'center'},back:{fontSize:32,lineHeight:34,color:'#E9EEF4',fontWeight:'300'},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#253447',alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:'#E9EEF4',fontSize:13,fontWeight:'800'},headCopy:{flex:1},name:{fontSize:14,fontWeight:'800',color:'#E9EEF4'},handle:{marginTop:2,fontSize:10,color:'#7F8D9D'},info:{width:25,height:25,borderWidth:1,borderColor:'#2A3A4B',borderRadius:13,alignItems:'center',justifyContent:'center'},infoText:{color:'#AAB7C5',fontSize:13,fontWeight:'700'},
 err:{marginHorizontal:16,marginTop:10,padding:10,borderRadius:10,backgroundColor:'#21151B',color:'#D78A98',fontSize:12},center:{flex:1,justifyContent:'center',alignItems:'center'},muted:{color:'#7F8D9D',fontSize:13},
 scroll:{flex:1,backgroundColor:'#0E1824'},messages:{paddingHorizontal:14,paddingVertical:18,gap:9,flexGrow:1,justifyContent:'flex-end'},row:{flexDirection:'row',alignItems:'flex-end',gap:7},rowMine:{justifyContent:'flex-end'},rowTheirs:{justifyContent:'flex-start'},bubble:{maxWidth:'78%',paddingHorizontal:12,paddingVertical:9,borderRadius:17},mine:{backgroundColor:'#243447',borderBottomRightRadius:5},theirs:{backgroundColor:'#182536',borderBottomLeftRadius:5},bt:{fontSize:13,lineHeight:19,color:'#DCE5ED'},mbt:{color:'#F4F6F8'},time:{marginTop:4,fontSize:9,color:'#68798C'},mineTime:{color:'#AAB7C5'},smallAvatar:{width:24,height:24,borderRadius:12,backgroundColor:'#253447',overflow:'hidden',alignItems:'center',justifyContent:'center'},smallAvatarImage:{width:'100%',height:'100%'},smallAvatarText:{color:'#E9EEF4',fontSize:9,fontWeight:'800'},
 actionBar:{paddingHorizontal:12,paddingVertical:8,borderTopWidth:1,borderTopColor:'#182533',backgroundColor:'#0A121C',flexDirection:'row',alignItems:'center',gap:16},actionLabel:{flex:1,color:'#7F8D9D',fontSize:10,fontWeight:'700'},action:{color:'#AFC7E1',fontSize:11,fontWeight:'800'},actionDanger:{color:'#D78A98',fontSize:11,fontWeight:'800'},actionMuted:{color:'#7F8D9D',fontSize:11,fontWeight:'700'},empty:{alignItems:'center',paddingBottom:20},emptyTitle:{fontSize:14,fontWeight:'800',color:'#DCE5ED'},emptyText:{marginTop:4,fontSize:12,color:'#7F8D9D'},request:{margin:20,padding:22,borderWidth:1,borderColor:'#182533',borderRadius:20,backgroundColor:'#0A121C',alignItems:'center'},requestIcon:{width:46,height:46,borderRadius:23,backgroundColor:'#243447',alignItems:'center',justifyContent:'center'},requestIconText:{color:'#E9EEF4',fontSize:18},h:{marginTop:15,fontSize:18,fontWeight:'800',color:'#E9EEF4'},p:{marginTop:7,fontSize:13,lineHeight:19,color:'#7F8D9D',textAlign:'center'},accept:{marginTop:17,height:40,paddingHorizontal:18,borderRadius:11,backgroundColor:'#344A62',justifyContent:'center'},wh:{color:'#F4F6F8',fontSize:11,fontWeight:'800'},
 composer:{paddingHorizontal:12,paddingVertical:9,borderTopWidth:1,borderTopColor:'#182533',backgroundColor:'#0A121C',flexDirection:'row',alignItems:'flex-end',gap:8},input:{flex:1,minHeight:42,maxHeight:96,paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderColor:'#2A3A4B',borderRadius:16,color:'#E9EEF4',fontSize:13,backgroundColor:'#0E1824'},send:{minWidth:55,height:42,paddingHorizontal:13,borderRadius:13,backgroundColor:'#4B78A8',alignItems:'center',justifyContent:'center'},sendDisabled:{backgroundColor:'#202B3A'},sendText:{color:'#F4F6F8',fontSize:11,fontWeight:'800'}
});