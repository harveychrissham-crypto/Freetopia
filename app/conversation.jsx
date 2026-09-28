import {useCallback,useEffect,useRef,useState} from 'react';
import AppIcon from '../components/AppIcon';
import * as ImagePicker from 'expo-image-picker';
import {VideoView,useVideoPlayer} from 'expo-video';
import { getImageUrl } from '../lib/imageUrl';
import {Alert,Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {supabase} from '../lib/supabase';
import {useAuth} from '../providers/AuthProvider';

function ChatVideo({uri}){ const player=useVideoPlayer(uri,p=>{p.loop=false}); return <View style={s.videoWrap}><VideoView player={player} style={s.videoPlayer} nativeControls contentFit="contain"/></View>; }

export default function Conversation(){
 const{id}=useLocalSearchParams(),{user}=useAuth(),router=useRouter(),scrollRef=useRef(null),channelRef=useRef(null),[info,setInfo]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(''),[editingId,setEditingId]=useState(null),[replyTo,setReplyTo]=useState(null),[selectedMessage,setSelectedMessage]=useState(null),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[uploading,setUploading]=useState(false),[typing,setTyping]=useState(false),[groupPanel,setGroupPanel]=useState(false),[groupTitle,setGroupTitle]=useState(''),[error,setError]=useState(''),[searchOpen,setSearchOpen]=useState(false),[search,setSearch]=useState(''),[pinned,setPinned]=useState([]),[forwardMessage,setForwardMessage]=useState(null),[forwardTargets,setForwardTargets]=useState([]),[forwardLoading,setForwardLoading]=useState(false),[forwardingId,setForwardingId]=useState(null);

 const load=useCallback(async()=>{
  if(!id||!user?.id)return;
  setLoading(true);
  const{data:c,error:ce}=await supabase.from('conversations').select('id,kind,title,conversation_members(user_id,request_status,profiles:user_id(id,username,display_name,avatar_url))').eq('id',id).maybeSingle();
  if(ce||!c){setError(ce?.message||'Conversation not found');setLoading(false);return}
  const me=(c.conversation_members||[]).find(x=>x.user_id===user.id);
  const other=(c.conversation_members||[]).find(x=>x.user_id!==user.id);
  setInfo({...c,me,other}); setGroupTitle(c.title||'');
  if(me?.request_status==='accepted'){
   const{data:m,error:e}=await supabase.from('messages').select('id,conversation_id,sender_id,content,media_url,media_type,reply_to_id,created_at,edited_at,deleted_at,profiles:sender_id(id,username,display_name,avatar_url),message_reactions(user_id,emoji),message_stars(user_id)').eq('conversation_id',id).order('created_at',{ascending:true}).limit(200);
   if(e)setError(e.message);
   else{
    const {data:hidden}=await supabase.from('message_hidden_for_users').select('message_id').eq('user_id',user.id).in('message_id',(m||[]).map(x=>x.id));
    const hiddenIds=new Set((hidden||[]).map(x=>x.message_id));
    setMessages((m||[]).filter(x=>!hiddenIds.has(x.id)));
    const {data:pins}=await supabase.from('message_pins').select('message_id,pinned_by,pinned_at').eq('conversation_id',id).order('pinned_at',{ascending:false});
    setPinned(pins||[]);
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
  const ch=supabase.channel('conversation-'+id,{config:{broadcast:{self:false}}}); channelRef.current=ch.on('broadcast',{event:'typing'},payload=>{if(payload.payload?.user_id!==user.id){setTyping(!!payload.payload?.typing);if(payload.payload?.typing)setTimeout(()=>setTyping(false),1800);}}).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+id},async payload=>{
   const incoming=payload.new;
   if(!incoming?.id)return;
   const{data:message}=await supabase.from('messages').select('id,conversation_id,sender_id,content,media_url,media_type,reply_to_id,created_at,edited_at,deleted_at,profiles:sender_id(id,username,display_name,avatar_url),message_reactions(user_id,emoji),message_stars(user_id)').eq('id',incoming.id).maybeSingle();
   if(!message)return;
   setMessages(current=>current.some(x=>x.id===message.id)?current:[...current,message].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)));
   if(message.sender_id!==user?.id&&!message.deleted_at&&info?.me?.request_status==='accepted'){await supabase.from('message_reads').upsert({message_id:message.id,user_id:user.id},{onConflict:'message_id,user_id'});}
  })
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:'conversation_id=eq.'+id},async payload=>{
   const incoming=payload.new;
   if(!incoming?.id)return;
   const{data:message}=await supabase.from('messages').select('id,conversation_id,sender_id,content,media_url,media_type,reply_to_id,created_at,edited_at,deleted_at,profiles:sender_id(id,username,display_name,avatar_url),message_reactions(user_id,emoji),message_stars(user_id)').eq('id',incoming.id).maybeSingle();
   if(!message)return;
   setMessages(current=>current.map(x=>x.id===message.id?message:x));
  }).subscribe();
  return()=>{channelRef.current=null;supabase.removeChannel(ch)}
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
   const{error:e}=await supabase.from('messages').insert({conversation_id:id,sender_id:user.id,content:v,reply_to_id:replyTo?.id||null});
   if(e)setError(e.message);else {setText('');setReplyTo(null);} 
  }
  setSending(false);
 };

 const editMessage=(m)=>{
  setEditingId(m.id);
  setText(m.content||'');
  setError('');
 };

 const broadcastTyping=async(value)=>{try{if(channelRef.current)await channelRef.current.send({type:'broadcast',event:'typing',payload:{user_id:user.id,typing:value}});}catch{}};
 const toggleReaction=async(m,emoji)=>{if(!user?.id)return;const mine=(m.message_reactions||[]).some(r=>r.user_id===user.id&&r.emoji===emoji);if(mine){await supabase.from('message_reactions').delete().eq('message_id',m.id).eq('user_id',user.id).eq('emoji',emoji);}else{await supabase.from('message_reactions').insert({message_id:m.id,user_id:user.id,emoji});}load();};
 const toggleStar=async(m)=>{if(!user?.id)return;const starred=(m.message_stars||[]).some(r=>r.user_id===user.id);if(starred){await supabase.from('message_stars').delete().eq('message_id',m.id).eq('user_id',user.id);}else{await supabase.from('message_stars').insert({message_id:m.id,user_id:user.id});}load();};
 const pickMedia=async()=>{if(!user?.id||!info?.me||info.me.request_status!=='accepted'||uploading)return;const perm=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!perm.granted){Alert.alert('Permission needed','Allow photo and video access to attach media.');return;}const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images','videos'],quality:0.85});if(result.canceled||!result.assets?.[0])return;const asset=result.assets[0];setUploading(true);setError('');try{const ext=(asset.fileName||asset.uri.split('/').pop()||'media').split('.').pop().toLowerCase();const path=user.id+'/'+Date.now()+'.'+ext;const res=await fetch(asset.uri);const blob=await res.blob();const up=await supabase.storage.from('message-media').upload(path,blob,{contentType:asset.mimeType||'application/octet-stream',upsert:false});if(up.error)throw up.error;const pub=supabase.storage.from('message-media').getPublicUrl(path).data.publicUrl;const ins=await supabase.from('messages').insert({conversation_id:id,sender_id:user.id,content:null,media_url:pub,media_type:asset.type==='video'?'video':'image',reply_to_id:replyTo?.id||null});if(ins.error)throw ins.error;setReplyTo(null);load();}catch(e){setError(e.message||'Media upload failed');}finally{setUploading(false)}};
 const startReply=(m)=>{setReplyTo(m);setSelectedMessage(null);};
 const openForward=async(m)=>{
  setSelectedMessage(null);setForwardMessage(m);setForwardLoading(true);setError('');
  const{data:members,error:e}=await supabase.from('conversation_members').select('conversation_id,conversations:conversation_id(id,kind,title),request_status').eq('user_id',user.id).eq('request_status','accepted');
  if(e){setError(e.message);setForwardMessage(null);setForwardLoading(false);return;}
  const rows=(members||[]).map(x=>x.conversations).filter(Boolean).filter(x=>x.id!==id);
  setForwardTargets(rows);setForwardLoading(false);
 };
 const forwardTo=async(target)=>{
  if(!forwardMessage||forwardingId)return;
  setForwardingId(target.id);setError('');
  const{error:e}=await supabase.from('messages').insert({
   conversation_id:target.id,
   sender_id:user.id,
   content:forwardMessage.content||null,
   media_url:forwardMessage.media_url||null,
   media_type:forwardMessage.media_type||null,
   reply_to_id:null
  });
  if(e)setError(e.message);else setForwardMessage(null);
  setForwardingId(null);
 };

 const togglePin=async(m)=>{const existing=pinned.find(p=>p.message_id===m.id);if(existing){const{error:e}=await supabase.from('message_pins').delete().eq('message_id',m.id).eq('pinned_by',user.id);if(e)setError(e.message);else setPinned(current=>current.filter(p=>p.message_id!==m.id));}else{const{error:e}=await supabase.from('message_pins').insert({message_id:m.id,conversation_id:id,pinned_by:user.id});if(e)setError(e.message);else setPinned(current=>[{message_id:m.id,pinned_by:user.id,pinned_at:new Date().toISOString()},...current]);}setSelectedMessage(null);};
 const deleteForMe=async(m)=>{const{error:e}=await supabase.from('message_hidden_for_users').insert({message_id:m.id,user_id:user.id});if(e)setError(e.message);else{setMessages(current=>current.filter(x=>x.id!==m.id));setSelectedMessage(null);}};
 const deleteMessage=(m)=>{
  Alert.alert('Delete message','Delete this message for everyone?',[
   {text:'Cancel',style:'cancel'},
   {text:'Delete',style:'destructive',onPress:async()=>{
    const{error:e}=await supabase.from('messages').update({deleted_at:new Date().toISOString()}).eq('id',m.id).eq('sender_id',user.id);
    if(e)setError(e.message);
   }}
  ]);
 };

 const cancelEdit=()=>{
  setEditingId(null);
  setText('');
  setSelectedMessage(null);
 };

 const onInputKeyPress=(e)=>{
  if(Platform.OS==='web' && e?.nativeEvent?.key==='Enter' && !e.nativeEvent.shiftKey){
   e.preventDefault?.();
   if(text.trim())send();
  }
 };

 const visibleMessages=search.trim()?messages.filter(m=>(m.content||'').toLowerCase().includes(search.trim().toLowerCase())):messages;
 const name=info?.kind==='group'?(info?.title||'Group'):(info?.other?.profiles?.display_name||info?.other?.profiles?.username||'Conversation');
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
     {handle&&<Text style={s.handle} numberOfLines={1}>@{handle}</Text>}{typing&&<Text style={s.typing}>typing…</Text>}
    </View>
    <Pressable onPress={()=>setSearchOpen(v=>!v)} hitSlop={10} style={s.info}><AppIcon name="search" size={16}/></Pressable><Pressable onPress={()=>{if(info?.kind==='group')setGroupPanel(true);else if(info?.other?.user_id)router.push({pathname:'/profile',params:{id:info.other.user_id}})}} hitSlop={10} style={s.info}><Text style={s.infoText}>i</Text></Pressable>
   </View>

   {searchOpen&&<View style={s.searchBar}><AppIcon name="search" size={15} color="#7F8D9D"/><TextInput value={search} onChangeText={setSearch} autoFocus placeholder="Search messages" placeholderTextColor="#718092" style={s.searchInput}/><Text style={s.searchCount}>{search.trim()?visibleMessages.length+' match'+(visibleMessages.length===1?'':'es'):''}</Text><Pressable onPress={()=>{setSearch('');setSearchOpen(false)}}><Text style={s.actionMuted}>Close</Text></Pressable></View>}{error&&<Text style={s.err}>{error}</Text>}
   {pinned.length>0&&<View style={s.pinnedBar}><Text style={s.pinnedIcon}>📌</Text><View style={s.pinnedCopy}><Text style={s.pinnedTitle}>Pinned message</Text><Text numberOfLines={1} style={s.pinnedText}>{messages.find(x=>x.id===pinned[0].message_id)?.content||'Media message'}</Text></View><Pressable onPress={()=>{const idx=messages.findIndex(x=>x.id===pinned[0].message_id);if(idx>=0)scrollRef.current?.scrollTo({y:Math.max(0,idx*75),animated:true})}}><Text style={s.action}>View</Text></Pressable></View>}{forwardMessage&&<View style={s.forwardOverlay}>
    <Pressable style={s.forwardBackdrop} onPress={()=>!forwardingId&&setForwardMessage(null)}/>
    <View style={s.forwardSheet}>
     <View style={s.forwardHead}><Text style={s.forwardTitle}>Forward message</Text><Pressable onPress={()=>!forwardingId&&setForwardMessage(null)}><Text style={s.actionMuted}>Close</Text></Pressable></View>
     {forwardMessage.content?<View style={s.forwardPreview}><Text style={s.forwardPreviewLabel}>Message</Text><Text numberOfLines={3} style={s.forwardPreviewText}>{forwardMessage.content}</Text></View>:<View style={s.forwardPreview}><Text style={s.forwardPreviewLabel}>Attachment</Text><Text style={s.forwardPreviewText}>{forwardMessage.media_type==='video'?'Video':'Image'} message</Text></View>}
     {forwardLoading?<Text style={s.muted}>Loading conversations…</Text>:forwardTargets.length===0?<Text style={s.muted}>No other conversations available.</Text>:<ScrollView style={s.forwardList}>{forwardTargets.map(target=><Pressable key={target.id} disabled={!!forwardingId} onPress={()=>forwardTo(target)} style={s.forwardRow}>
       <View style={s.forwardAvatar}><Text style={s.avatarText}>{((target.kind==='group'?target.title:'Conversation')||'?')[0].toUpperCase()}</Text></View>
       <View style={s.forwardCopy}><Text style={s.forwardName} numberOfLines={1}>{target.kind==='group'?(target.title||'Group'):'Conversation'}</Text><Text style={s.forwardMeta}>{target.kind==='group'?'Group chat':'Direct message'}</Text></View>
       <Text style={s.action}>{forwardingId===target.id?'Sending…':'Send'}</Text>
     </Pressable>)}</ScrollView>}
    </View>
   </View>}{groupPanel&&info?.kind==='group'&&<View style={s.groupPanel}>
    <View style={s.groupPanelHead}><Text style={s.groupPanelTitle}>Group info</Text><Pressable onPress={()=>setGroupPanel(false)}><Text style={s.actionMuted}>Close</Text></Pressable></View>
    <TextInput value={groupTitle} onChangeText={setGroupTitle} placeholder="Group name" placeholderTextColor="#718092" style={s.groupInput}/>
    {(info.conversation_members||[]).filter(x=>x.request_status==='accepted').map(member=><View key={member.user_id} style={s.memberRow}><View style={s.memberAvatar}>{member.profiles?.avatar_url?<Image source={{uri:getImageUrl(member.profiles.avatar_url,{width:400,height:400,quality:90})}} style={s.memberAvatarImage}/>:<Text style={s.avatarText}>{(member.profiles?.display_name||member.profiles?.username||'?')[0].toUpperCase()}</Text>}</View><View style={s.memberCopy}><Text style={s.memberName}>{member.profiles?.display_name||member.profiles?.username||'Member'}</Text><Text style={s.memberHandle}>@{member.profiles?.username||'user'}{member.role==='owner'?' · owner':member.role==='admin'?' · admin':''}</Text></View></View>)}
    <View style={s.groupActions}>{(info?.me?.role==='owner'||info?.me?.role==='admin')&&<Pressable onPress={async()=>{try{const{error:e}=await supabase.rpc('update_group_conversation',{group_id:id,new_title:groupTitle.trim()});if(e)throw e;setGroupPanel(false);load();}catch(e){setError(e.message)}}} style={s.groupSave}><Text style={s.wh}>Save changes</Text></Pressable>}<Pressable onPress={()=>Alert.alert('Leave group','You will stop receiving messages from this group.',[{text:'Cancel',style:'cancel'},{text:'Leave',style:'destructive',onPress:async()=>{const{error:e}=await supabase.rpc('leave_group_conversation',{group_id:id});if(e)setError(e.message);else router.back();}}])} style={s.groupLeave}><Text style={s.actionDanger}>Leave group</Text></Pressable></View>
   </View>}

   {loading?<View style={s.center}><Text style={s.muted}>Loading conversation…</Text></View>:
    info?.me?.request_status==='pending'?
     <View style={s.request}><View style={s.requestIcon}><Text style={s.requestIconText}>✦</Text></View><Text style={s.h}>Message request</Text><Text style={s.p}>Accept this request to read and send messages.</Text><Pressable onPress={accept} style={s.accept}><Text style={s.wh}>Accept request</Text></Pressable></View>:
     <><ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled">
      {messages.length===0&&<View style={s.empty}><Text style={s.emptyTitle}>No messages yet</Text><Text style={s.emptyText}>Start the conversation.</Text></View>}
      {visibleMessages.map(m=><View key={m.id} style={[s.row,m.sender_id===user.id?s.rowMine:s.rowTheirs]}>
       {m.sender_id!==user.id&&info?.kind==='group'?<Text style={s.senderName}>{m.profiles?.display_name||m.profiles?.username||'Member'}</Text>:null}{m.sender_id!==user.id&&<View style={s.smallAvatar}>{m.profiles?.avatar_url?<Image source={{uri:getImageUrl(m.profiles.avatar_url,{width:800,height:800,quality:100})}} style={s.smallAvatarImage}/>:<Text style={s.smallAvatarText}>{(m.profiles?.display_name||m.profiles?.username||'?')[0].toUpperCase()}</Text>}</View>}
       <Pressable onLongPress={()=>!m.deleted_at&&setSelectedMessage(m)} onPress={()=>selectedMessage?.id===m.id&&setSelectedMessage(null)} style={[s.bubble,m.sender_id===user.id?s.mine:s.theirs]}>
        {m.reply_to_id?<View style={s.replyQuote}><Text style={s.replyQuoteText}>{m.reply_to_id?(messages.find(x=>x.id===m.reply_to_id)?.profiles?.display_name||'Reply'):'Reply'}</Text><Text style={s.replyPreview}>{m.reply_to_id?(messages.find(x=>x.id===m.reply_to_id)?.content||'Media message'):''}</Text></View>:null}
        {m.media_url&&m.media_type==='image'?<Image source={{uri:m.media_url}} style={s.mediaImage}/>:null}
        {m.media_url&&m.media_type==='video'?<ChatVideo uri={m.media_url}/>:null}
        {m.content?<Text style={[s.bt,m.sender_id===user.id&&s.mbt]}>{m.deleted_at?'Message deleted':m.content}</Text>:null}
        <Text style={[s.time,m.sender_id===user.id&&s.mineTime]}>{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}{m.edited_at&&!m.deleted_at?' · edited':''}{m.message_stars?.some(x=>x.user_id===user.id)?' · ★':''}{pinned.some(x=>x.message_id===m.id)?' · 📌':''}</Text>
        {(m.message_reactions||[]).length>0?<View style={s.reactions}>{Object.entries((m.message_reactions||[]).reduce((a,r)=>(a[r.emoji]=(a[r.emoji]||0)+1,a),{})).map(([emoji,n])=><Pressable key={emoji} onPress={()=>toggleReaction(m,emoji)} style={s.reaction}><Text style={s.reactionText}>{emoji} {n}</Text></Pressable>)}</View>:null}
       </Pressable>
      </View>)}
     </ScrollView>
     {selectedMessage&&<View style={s.actionBar}><Text style={s.actionLabel}>Message</Text><Pressable onPress={()=>toggleReaction(selectedMessage,'❤️')}><Text style={s.action}>❤️</Text></Pressable><Pressable onPress={()=>toggleReaction(selectedMessage,'😂')}><Text style={s.action}>😂</Text></Pressable><Pressable onPress={()=>startReply(selectedMessage)}><Text style={s.action}>Reply</Text></Pressable><Pressable onPress={()=>openForward(selectedMessage)}><Text style={s.action}>Forward</Text></Pressable><Pressable onPress={()=>toggleStar(selectedMessage)}><Text style={s.action}>★</Text></Pressable><Pressable onPress={()=>togglePin(selectedMessage)}><Text style={s.action}>{pinned.some(p=>p.message_id===selectedMessage.id)?'Unpin':'Pin'}</Text></Pressable><Pressable onPress={()=>deleteForMe(selectedMessage)}><Text style={s.actionDanger}>Delete for me</Text></Pressable>{selectedMessage.sender_id===user.id?<><Pressable onPress={()=>{editMessage(selectedMessage);setSelectedMessage(null)}}><Text style={s.action}>Edit</Text></Pressable><Pressable onPress={()=>{deleteMessage(selectedMessage);setSelectedMessage(null)}}><Text style={s.actionDanger}>Delete</Text></Pressable></>:null}<Pressable onPress={()=>setSelectedMessage(null)}><Text style={s.actionMuted}>Close</Text></Pressable></View>}
     {replyTo&&<View style={s.replying}><Text style={s.replyingLabel}>Replying to {replyTo.profiles?.display_name||replyTo.profiles?.username||'message'}{replyTo.content?' · '+replyTo.content.slice(0,70):' · media'}</Text><Pressable onPress={()=>setReplyTo(null)}><Text style={s.actionMuted}>Cancel</Text></Pressable></View>}
     <View style={s.composer}>
      <Pressable onPress={pickMedia} disabled={uploading} style={s.attach}><AppIcon name="photo" size={17} color="#AFC7E1"/></Pressable><TextInput value={text} onChangeText={v=>{setText(v);broadcastTyping(!!v.trim())}} onKeyPress={onInputKeyPress} placeholder={editingId?'Edit message…':'Write a message…'} placeholderTextColor="#718092" style={s.input} multiline maxLength={2000} returnKeyType="send" blurOnSubmit={false}/>
      <Pressable disabled={sending||uploading||!text.trim()} onPress={send} style={[s.send,(!text.trim()||sending)&&s.sendDisabled]}><Text style={s.sendText}>{sending?'…':editingId?'Save':'Send'}</Text></Pressable>
     </View></>}
  </KeyboardAvoidingView>
 </SafeAreaView>
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#060B12'},flex:{flex:1},head:{height:68,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:'#182533',flexDirection:'row',alignItems:'center',gap:11,backgroundColor:'#0A121C'},
 backButton:{width:28,height:40,justifyContent:'center'},back:{fontSize:32,lineHeight:34,color:'#E9EEF4',fontWeight:'300'},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#253447',alignItems:'center',justifyContent:'center',overflow:'hidden'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:'#E9EEF4',fontSize:13,fontWeight:'800'},headCopy:{flex:1},name:{fontSize:14,fontWeight:'800',color:'#E9EEF4'},handle:{marginTop:2,fontSize:10,color:'#7F8D9D'},typing:{fontSize:9,color:'#4B78A8',marginTop:2},groupPanel:{margin:12,padding:14,borderWidth:1,borderColor:'#243447',borderRadius:16,backgroundColor:'#0A121C'},groupPanelHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},groupPanelTitle:{color:'#E9EEF4',fontSize:15,fontWeight:'800'},groupInput:{marginTop:12,height:42,borderWidth:1,borderColor:'#2A3A4B',borderRadius:11,paddingHorizontal:12,color:'#E9EEF4',backgroundColor:'#0E1824'},memberRow:{flexDirection:'row',alignItems:'center',paddingVertical:8,gap:10},memberAvatar:{width:34,height:34,borderRadius:17,backgroundColor:'#253447',alignItems:'center',justifyContent:'center',overflow:'hidden'},memberAvatarImage:{width:'100%',height:'100%'},memberCopy:{flex:1},memberName:{color:'#DCE5ED',fontSize:12,fontWeight:'700'},memberHandle:{color:'#718092',fontSize:9,marginTop:2},groupActions:{flexDirection:'row',gap:8,marginTop:8},groupSave:{flex:1,height:40,borderRadius:11,backgroundColor:'#4B78A8',alignItems:'center',justifyContent:'center'},groupLeave:{height:40,paddingHorizontal:14,borderRadius:11,borderWidth:1,borderColor:'#422731',alignItems:'center',justifyContent:'center'},info:{width:25,height:25,borderWidth:1,borderColor:'#2A3A4B',borderRadius:13,alignItems:'center',justifyContent:'center'},searchBar:{margin:10,height:42,borderRadius:12,borderWidth:1,borderColor:'#2A3A4B',backgroundColor:'#0E1824',flexDirection:'row',alignItems:'center',paddingHorizontal:10,gap:8},searchInput:{flex:1,color:'#E9EEF4',fontSize:12},infoText:{color:'#AAB7C5',fontSize:13,fontWeight:'700'},
 err:{marginHorizontal:16,marginTop:10,padding:10,borderRadius:10,backgroundColor:'#21151B',color:'#D78A98',fontSize:12},center:{flex:1,justifyContent:'center',alignItems:'center'},muted:{color:'#7F8D9D',fontSize:13},
 scroll:{flex:1,backgroundColor:'#0E1824'},messages:{paddingHorizontal:14,paddingVertical:18,gap:9,flexGrow:1,justifyContent:'flex-end'},row:{flexDirection:'row',alignItems:'flex-end',gap:7},rowMine:{justifyContent:'flex-end'},rowTheirs:{justifyContent:'flex-start'},bubble:{maxWidth:'78%',paddingHorizontal:12,paddingVertical:9,borderRadius:17},mine:{backgroundColor:'#243447',borderBottomRightRadius:5},theirs:{backgroundColor:'#182536',borderBottomLeftRadius:5},bt:{fontSize:13,lineHeight:19,color:'#DCE5ED'},mediaImage:{width:210,height:170,borderRadius:12,marginBottom:5},videoWrap:{width:230,height:170,borderRadius:12,overflow:'hidden',backgroundColor:'#05090D',marginBottom:5},videoPlayer:{width:'100%',height:'100%'},videoCard:{height:54,width:180,borderRadius:10,backgroundColor:'#101B28',flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:12},videoText:{color:'#E9EEF4',fontSize:11,fontWeight:'700'},replyQuote:{borderLeftWidth:3,borderLeftColor:'#4B78A8',paddingLeft:8,marginBottom:5},replyQuoteText:{color:'#7F9FBE',fontSize:9,fontWeight:'700'},replyPreview:{color:'#A8B8C8',fontSize:9,marginTop:2,maxWidth:190},searchCount:{color:'#718092',fontSize:9,fontWeight:'700'},reactions:{flexDirection:'row',flexWrap:'wrap',gap:4,marginTop:5},reaction:{borderWidth:1,borderColor:'#33475C',borderRadius:12,paddingHorizontal:6,paddingVertical:2,backgroundColor:'#111D2B'},reactionText:{fontSize:9,color:'#DCE5ED'},mbt:{color:'#F4F6F8'},time:{marginTop:4,fontSize:9,color:'#68798C'},mineTime:{color:'#AAB7C5'},smallAvatar:{width:24,height:24,borderRadius:12,backgroundColor:'#253447',overflow:'hidden',alignItems:'center',justifyContent:'center'},smallAvatarImage:{width:'100%',height:'100%'},smallAvatarText:{color:'#E9EEF4',fontSize:9,fontWeight:'800'},senderName:{position:'absolute',left:31,bottom:34,color:'#6F91B2',fontSize:8,fontWeight:'700'},
 forwardOverlay:{...StyleSheet.absoluteFillObject,justifyContent:'flex-end',zIndex:50},forwardBackdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.58)'},forwardSheet:{maxHeight:'72%',padding:16,borderTopLeftRadius:22,borderTopRightRadius:22,borderWidth:1,borderColor:'#243447',backgroundColor:'#0A121C'},forwardHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},forwardTitle:{color:'#E9EEF4',fontSize:16,fontWeight:'800'},forwardPreview:{padding:11,borderRadius:13,borderWidth:1,borderColor:'#243447',backgroundColor:'#0E1824',marginBottom:10},forwardPreviewLabel:{color:'#6F91B2',fontSize:9,fontWeight:'800',textTransform:'uppercase'},forwardPreviewText:{color:'#DCE5ED',fontSize:11,lineHeight:16,marginTop:4},forwardList:{maxHeight:390},forwardRow:{minHeight:58,borderBottomWidth:1,borderBottomColor:'#182533',flexDirection:'row',alignItems:'center',gap:10},forwardAvatar:{width:38,height:38,borderRadius:19,backgroundColor:'#253447',alignItems:'center',justifyContent:'center'},forwardCopy:{flex:1},forwardName:{color:'#E9EEF4',fontSize:12,fontWeight:'800'},forwardMeta:{color:'#718092',fontSize:9,marginTop:2},actionBar:{paddingHorizontal:12,paddingVertical:8,borderTopWidth:1,borderTopColor:'#182533',backgroundColor:'#0A121C',flexDirection:'row',alignItems:'center',gap:16},actionLabel:{flex:1,color:'#7F8D9D',fontSize:10,fontWeight:'700'},action:{color:'#AFC7E1',fontSize:11,fontWeight:'800'},actionDanger:{color:'#D78A98',fontSize:11,fontWeight:'800'},actionMuted:{color:'#7F8D9D',fontSize:11,fontWeight:'700'},empty:{alignItems:'center',paddingBottom:20},emptyTitle:{fontSize:14,fontWeight:'800',color:'#DCE5ED'},emptyText:{marginTop:4,fontSize:12,color:'#7F8D9D'},request:{margin:20,padding:22,borderWidth:1,borderColor:'#182533',borderRadius:20,backgroundColor:'#0A121C',alignItems:'center'},requestIcon:{width:46,height:46,borderRadius:23,backgroundColor:'#243447',alignItems:'center',justifyContent:'center'},requestIconText:{color:'#E9EEF4',fontSize:18},h:{marginTop:15,fontSize:18,fontWeight:'800',color:'#E9EEF4'},p:{marginTop:7,fontSize:13,lineHeight:19,color:'#7F8D9D',textAlign:'center'},accept:{marginTop:17,height:40,paddingHorizontal:18,borderRadius:11,backgroundColor:'#344A62',justifyContent:'center'},wh:{color:'#F4F6F8',fontSize:11,fontWeight:'800'},
 pinnedBar:{marginHorizontal:10,marginTop:8,paddingHorizontal:11,paddingVertical:8,borderWidth:1,borderColor:'#2A3A4B',borderRadius:12,backgroundColor:'#0A121C',flexDirection:'row',alignItems:'center',gap:8},pinnedIcon:{fontSize:12},pinnedCopy:{flex:1},pinnedTitle:{fontSize:9,fontWeight:'800',color:'#AFC7E1'},pinnedText:{fontSize:10,color:'#7F8D9D',marginTop:2},replying:{paddingHorizontal:12,paddingVertical:7,borderTopWidth:1,borderTopColor:'#182533',backgroundColor:'#0A121C',flexDirection:'row',justifyContent:'space-between'},replyingLabel:{color:'#8FA7BF',fontSize:10,fontWeight:'700'},attach:{width:42,height:42,borderRadius:13,backgroundColor:'#0E1824',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#2A3A4B'},composer:{paddingHorizontal:12,paddingVertical:9,borderTopWidth:1,borderTopColor:'#182533',backgroundColor:'#0A121C',flexDirection:'row',alignItems:'flex-end',gap:8},input:{flex:1,minHeight:42,maxHeight:96,paddingHorizontal:13,paddingVertical:10,borderWidth:1,borderColor:'#2A3A4B',borderRadius:16,color:'#E9EEF4',fontSize:13,backgroundColor:'#0E1824'},send:{minWidth:55,height:42,paddingHorizontal:13,borderRadius:13,backgroundColor:'#4B78A8',alignItems:'center',justifyContent:'center'},sendDisabled:{backgroundColor:'#202B3A'},sendText:{color:'#F4F6F8',fontSize:11,fontWeight:'800'}
});